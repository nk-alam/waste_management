import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const facilityRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('biomethanization', 'wte', 'recycling', 'composting', 'landfill').required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().required()
  }).required(),
  capacity: Joi.number().min(0).required(),
  manager: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required()
  }).required(),
  ulbId: Joi.string().required(),
  operatingHours: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    workingDays: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')).required()
  }).required()
});

const wasteIntakeSchema = Joi.object({
  facilityId: Joi.string().required(),
  wasteType: Joi.string().valid('wet', 'dry', 'hazardous', 'mixed').required(),
  quantity: Joi.number().min(0).required(),
  source: Joi.string().required(),
  quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').required(),
  photos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional()
});

const processLogSchema = Joi.object({
  facilityId: Joi.string().required(),
  processType: Joi.string().valid('biomethanization', 'wte', 'recycling', 'composting').required(),
  inputQuantity: Joi.number().min(0).required(),
  outputQuantity: Joi.number().min(0).required(),
  efficiency: Joi.number().min(0).max(100).required(),
  parameters: Joi.object().optional(),
  notes: Joi.string().optional()
});

// @desc    Register waste treatment facility
// @route   POST /api/facilities/register
// @access  Private (Admin, ULB Admin)
router.post('/register', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = facilityRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { name, type, location, capacity, manager, ulbId, operatingHours } = value;

  // Create facility record
  const facilityData = {
    name,
    type,
    location,
    capacity,
    currentLoad: 0,
    efficiency: 0,
    manager,
    ulbId,
    operatingHours,
    status: 'active',
    totalIntake: 0,
    totalOutput: 0,
    processLogs: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const facility = await FirestoreService.create('waste_facilities', facilityData);

  res.status(201).json({
    success: true,
    message: 'Waste treatment facility registered successfully',
    facility: {
      id: facility.id,
      name: facility.name,
      type: facility.type,
      location: facility.location,
      capacity: facility.capacity
    }
  });
}));

// @desc    Get facility capacity
// @route   GET /api/facilities/capacity/:facilityId
// @access  Private
router.get('/capacity/:facilityId', protect, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  const capacityInfo = {
    facilityId: facility.id,
    name: facility.name,
    type: facility.type,
    capacity: facility.capacity,
    currentLoad: facility.currentLoad,
    availableCapacity: facility.capacity - facility.currentLoad,
    utilizationRate: facility.capacity > 0 ? Math.round((facility.currentLoad / facility.capacity) * 100) : 0,
    status: facility.status,
    lastUpdated: facility.updatedAt
  };

  res.json({
    success: true,
    data: capacityInfo
  });
}));

// @desc    Log waste intake
// @route   PUT /api/facilities/intake
// @access  Private
router.put('/intake', protect, asyncHandler(async (req, res) => {
  const { error, value } = wasteIntakeSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { facilityId, wasteType, quantity, source, quality, photos, notes } = value;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  // Check if facility has capacity
  if (facility.currentLoad + quantity > facility.capacity) {
    res.status(400);
    throw new Error('Facility capacity exceeded');
  }

  // Create intake record
  const intakeData = {
    facilityId,
    wasteType,
    quantity,
    source,
    quality,
    photos: photos || [],
    notes,
    receivedBy: req.user.id,
    receivedAt: new Date(),
    status: 'received'
  };

  const intake = await FirestoreService.create('waste_intake', intakeData);

  // Update facility capacity
  const newLoad = facility.currentLoad + quantity;
  const utilizationRate = facility.capacity > 0 ? Math.round((newLoad / facility.capacity) * 100) : 0;

  await FirestoreService.update('waste_facilities', facilityId, {
    currentLoad: newLoad,
    totalIntake: facility.totalIntake + quantity,
    utilizationRate,
    lastIntake: new Date()
  });

  res.json({
    success: true,
    message: 'Waste intake logged successfully',
    data: {
      intakeId: intake.id,
      facilityId,
      wasteType,
      quantity,
      newLoad,
      utilizationRate
    }
  });
}));

// @desc    Get processing status
// @route   GET /api/facilities/processing-status/:facilityId
// @access  Private
router.get('/processing-status/:facilityId', protect, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  // Get recent process logs
  const processLogs = await FirestoreService.customQuery('facility_process_logs', [
    { type: 'where', field: 'facilityId', operator: '==', value: facilityId },
    { type: 'orderBy', field: 'createdAt', direction: 'desc' },
    { type: 'limit', value: 10 }
  ]);

  const status = {
    facilityId: facility.id,
    name: facility.name,
    type: facility.type,
    currentLoad: facility.currentLoad,
    capacity: facility.capacity,
    efficiency: facility.efficiency,
    status: facility.status,
    recentProcesses: processLogs,
    lastProcessed: processLogs[0]?.createdAt || null
  };

  res.json({
    success: true,
    data: status
  });
}));

// @desc    Log biomethanization process
// @route   POST /api/facilities/biomethanization/log
// @access  Private
router.post('/biomethanization/log', protect, asyncHandler(async (req, res) => {
  const { error, value } = processLogSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { facilityId, processType, inputQuantity, outputQuantity, efficiency, parameters, notes } = value;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  if (facility.type !== 'biomethanization') {
    res.status(400);
    throw new Error('Facility is not a biomethanization plant');
  }

  // Create process log
  const processData = {
    facilityId,
    processType,
    inputQuantity,
    outputQuantity,
    efficiency,
    parameters: parameters || {},
    notes,
    processedBy: req.user.id,
    processedAt: new Date(),
    status: 'completed'
  };

  const processLog = await FirestoreService.create('facility_process_logs', processData);

  // Update facility efficiency
  const newEfficiency = calculateEfficiency(facility.efficiency, efficiency, facility.totalOutput, outputQuantity);
  await FirestoreService.update('waste_facilities', facilityId, {
    efficiency: newEfficiency,
    totalOutput: facility.totalOutput + outputQuantity,
    currentLoad: Math.max(0, facility.currentLoad - inputQuantity),
    lastProcessed: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Biomethanization process logged successfully',
    data: {
      processId: processLog.id,
      facilityId,
      inputQuantity,
      outputQuantity,
      efficiency,
      newFacilityEfficiency: newEfficiency
    }
  });
}));

// @desc    Log Waste-to-Energy processing
// @route   POST /api/facilities/wte/log
// @access  Private
router.post('/wte/log', protect, asyncHandler(async (req, res) => {
  const { error, value } = processLogSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { facilityId, processType, inputQuantity, outputQuantity, efficiency, parameters, notes } = value;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  if (facility.type !== 'wte') {
    res.status(400);
    throw new Error('Facility is not a Waste-to-Energy plant');
  }

  // Create process log
  const processData = {
    facilityId,
    processType,
    inputQuantity,
    outputQuantity,
    efficiency,
    parameters: parameters || {},
    notes,
    processedBy: req.user.id,
    processedAt: new Date(),
    status: 'completed'
  };

  const processLog = await FirestoreService.create('facility_process_logs', processData);

  // Update facility efficiency
  const newEfficiency = calculateEfficiency(facility.efficiency, efficiency, facility.totalOutput, outputQuantity);
  await FirestoreService.update('waste_facilities', facilityId, {
    efficiency: newEfficiency,
    totalOutput: facility.totalOutput + outputQuantity,
    currentLoad: Math.max(0, facility.currentLoad - inputQuantity),
    lastProcessed: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Waste-to-Energy process logged successfully',
    data: {
      processId: processLog.id,
      facilityId,
      inputQuantity,
      outputQuantity,
      efficiency,
      newFacilityEfficiency: newEfficiency
    }
  });
}));

// @desc    Log recycling activities
// @route   POST /api/facilities/recycling/log
// @access  Private
router.post('/recycling/log', protect, asyncHandler(async (req, res) => {
  const { error, value } = processLogSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { facilityId, processType, inputQuantity, outputQuantity, efficiency, parameters, notes } = value;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  if (facility.type !== 'recycling') {
    res.status(400);
    throw new Error('Facility is not a recycling center');
  }

  // Create process log
  const processData = {
    facilityId,
    processType,
    inputQuantity,
    outputQuantity,
    efficiency,
    parameters: parameters || {},
    notes,
    processedBy: req.user.id,
    processedAt: new Date(),
    status: 'completed'
  };

  const processLog = await FirestoreService.create('facility_process_logs', processData);

  // Update facility efficiency
  const newEfficiency = calculateEfficiency(facility.efficiency, efficiency, facility.totalOutput, outputQuantity);
  await FirestoreService.update('waste_facilities', facilityId, {
    efficiency: newEfficiency,
    totalOutput: facility.totalOutput + outputQuantity,
    currentLoad: Math.max(0, facility.currentLoad - inputQuantity),
    lastProcessed: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Recycling process logged successfully',
    data: {
      processId: processLog.id,
      facilityId,
      inputQuantity,
      outputQuantity,
      efficiency,
      newFacilityEfficiency: newEfficiency
    }
  });
}));

// @desc    Get facility efficiency metrics
// @route   GET /api/facilities/efficiency/:facilityId
// @access  Private
router.get('/efficiency/:facilityId', protect, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const { days = 30 } = req.query;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  // Get process logs from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const processLogs = await FirestoreService.customQuery('facility_process_logs', [
    { type: 'where', field: 'facilityId', operator: '==', value: facilityId },
    { type: 'where', field: 'processedAt', operator: '>=', value: startDate },
    { type: 'orderBy', field: 'processedAt', direction: 'desc' }
  ]);

  // Calculate efficiency metrics
  const totalInput = processLogs.reduce((sum, log) => sum + log.inputQuantity, 0);
  const totalOutput = processLogs.reduce((sum, log) => sum + log.outputQuantity, 0);
  const averageEfficiency = processLogs.length > 0 ? 
    processLogs.reduce((sum, log) => sum + log.efficiency, 0) / processLogs.length : 0;

  const efficiency = {
    facilityId: facility.id,
    name: facility.name,
    type: facility.type,
    currentEfficiency: facility.efficiency,
    averageEfficiency: Math.round(averageEfficiency * 100) / 100,
    totalInput: Math.round(totalInput * 100) / 100,
    totalOutput: Math.round(totalOutput * 100) / 100,
    overallEfficiency: totalInput > 0 ? Math.round((totalOutput / totalInput) * 100) : 0,
    processCount: processLogs.length,
    period: `${days} days`,
    recentProcesses: processLogs.slice(0, 10)
  };

  res.json({
    success: true,
    data: efficiency
  });
}));

// @desc    Get all facilities
// @route   GET /api/facilities
// @access  Private (Admin, ULB Admin)
router.get('/', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, type, status } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }
  
  if (type) {
    conditions.push({ type: 'where', field: 'type', operator: '==', value: type });
  }
  
  if (status) {
    conditions.push({ type: 'where', field: 'status', operator: '==', value: status });
  }

  const facilities = await FirestoreService.customQuery('waste_facilities', [
    ...conditions,
    { type: 'orderBy', field: 'createdAt', direction: 'desc' }
  ]);

  res.json({
    success: true,
    data: facilities
  });
}));

// @desc    Update facility status
// @route   PUT /api/facilities/:facilityId/status
// @access  Private (Admin, ULB Admin)
router.put('/:facilityId/status', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'inactive', 'maintenance', 'breakdown'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }

  const updatedFacility = await FirestoreService.update('waste_facilities', facilityId, {
    status,
    statusReason: reason,
    statusUpdatedAt: new Date()
  });

  res.json({
    success: true,
    message: 'Facility status updated successfully',
    data: updatedFacility
  });
}));

// Helper function to calculate efficiency
function calculateEfficiency(currentEfficiency, newEfficiency, totalOutput, newOutput) {
  const totalProcesses = totalOutput > 0 ? Math.ceil(totalOutput / 100) : 1; // Assume 100 units per process
  const weightedEfficiency = (currentEfficiency * (totalProcesses - 1) + newEfficiency) / totalProcesses;
  return Math.round(weightedEfficiency * 100) / 100;
}

export default router;