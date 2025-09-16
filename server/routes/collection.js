import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const vehicleRegistrationSchema = Joi.object({
  vehicleNumber: Joi.string().required(),
  type: Joi.string().valid('truck', 'van', 'tractor', 'compactor', 'other').required(),
  capacity: Joi.number().min(0).required(),
  driver: Joi.object({
    name: Joi.string().required(),
    license: Joi.string().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required()
  }).required(),
  ulbId: Joi.string().required(),
  area: Joi.string().required()
});

const vehicleStatusSchema = Joi.object({
  vehicleId: Joi.string().required(),
  status: Joi.string().valid('active', 'inactive', 'maintenance', 'breakdown').required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).optional(),
  fuelLevel: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().optional()
});

const pickupCompleteSchema = Joi.object({
  vehicleId: Joi.string().required(),
  householdId: Joi.string().required(),
  wasteType: Joi.string().valid('wet', 'dry', 'hazardous', 'mixed').required(),
  quantity: Joi.number().min(0).required(),
  quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').required(),
  photos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional()
});

const pickupRejectSchema = Joi.object({
  vehicleId: Joi.string().required(),
  householdId: Joi.string().required(),
  reason: Joi.string().required(),
  photos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional()
});

const complaintSchema = Joi.object({
  householdId: Joi.string().required(),
  complaintType: Joi.string().valid('missed_collection', 'late_collection', 'damaged_bin', 'vehicle_issue', 'other').required(),
  description: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required(),
  photos: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

// @desc    Register waste collection vehicle
// @route   POST /api/collection/vehicles/register
// @access  Private (Admin, ULB Admin)
router.post('/vehicles/register', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = vehicleRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { vehicleNumber, type, capacity, driver, ulbId, area } = value;

  // Check if vehicle already exists
  const existingVehicles = await FirestoreService.customQuery('collection_vehicles', [
    { type: 'where', field: 'vehicleNumber', operator: '==', value: vehicleNumber }
  ]);

  if (existingVehicles.length > 0) {
    res.status(400);
    throw new Error('Vehicle already registered with this number');
  }

  // Create vehicle record
  const vehicleData = {
    vehicleNumber,
    type,
    capacity,
    driver,
    ulbId,
    area,
    status: 'active',
    location: {
      lat: 0,
      lng: 0,
      address: '',
      lastUpdated: new Date()
    },
    fuelEfficiency: 0,
    totalDistance: 0,
    totalCollections: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const vehicle = await FirestoreService.create('collection_vehicles', vehicleData);

  res.status(201).json({
    success: true,
    message: 'Collection vehicle registered successfully',
    vehicle: {
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      capacity: vehicle.capacity,
      driver: vehicle.driver
    }
  });
}));

// @desc    Get vehicle location
// @route   GET /api/collection/vehicles/location/:vehicleId
// @access  Private
router.get('/vehicles/location/:vehicleId', protect, asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const vehicle = await FirestoreService.getById('collection_vehicles', vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  res.json({
    success: true,
    data: {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      location: vehicle.location,
      status: vehicle.status,
      lastUpdated: vehicle.location.lastUpdated
    }
  });
}));

// @desc    Update vehicle status
// @route   PUT /api/collection/vehicles/status
// @access  Private
router.put('/vehicles/status', protect, asyncHandler(async (req, res) => {
  const { error, value } = vehicleStatusSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { vehicleId, status, location, fuelLevel, notes } = value;

  const vehicle = await FirestoreService.getById('collection_vehicles', vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Update vehicle status
  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (location) {
    updateData.location = {
      ...location,
      lastUpdated: new Date()
    };
  }

  if (fuelLevel !== undefined) {
    updateData.fuelLevel = fuelLevel;
  }

  if (notes) {
    updateData.notes = notes;
  }

  const updatedVehicle = await FirestoreService.update('collection_vehicles', vehicleId, updateData);

  res.json({
    success: true,
    message: 'Vehicle status updated successfully',
    data: updatedVehicle
  });
}));

// @desc    Generate optimized collection routes
// @route   GET /api/collection/routes/optimize
// @access  Private (Admin, ULB Admin, Supervisor)
router.get('/routes/optimize', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { area, vehicleType, date } = req.query;

  if (!area) {
    res.status(400);
    throw new Error('Area is required for route optimization');
  }

  // Get households in the area
  const households = await FirestoreService.customQuery('households', [
    { type: 'where', field: 'address.ward', operator: '==', value: area }
  ]);

  // Get available vehicles
  let vehicleConditions = [
    { type: 'where', field: 'area', operator: '==', value: area },
    { type: 'where', field: 'status', operator: '==', value: 'active' }
  ];

  if (vehicleType) {
    vehicleConditions.push({ type: 'where', field: 'type', operator: '==', value: vehicleType });
  }

  const vehicles = await FirestoreService.customQuery('collection_vehicles', vehicleConditions);

  if (vehicles.length === 0) {
    res.status(404);
    throw new Error('No available vehicles for this area');
  }

  // Simple route optimization (in production, use more sophisticated algorithms)
  const routes = optimizeRoutes(households, vehicles);

  res.json({
    success: true,
    data: {
      area,
      date: date || new Date().toISOString().split('T')[0],
      totalHouseholds: households.length,
      availableVehicles: vehicles.length,
      routes
    }
  });
}));

// @desc    Mark pickup completion
// @route   POST /api/collection/pickup/complete
// @access  Private
router.post('/pickup/complete', protect, asyncHandler(async (req, res) => {
  const { error, value } = pickupCompleteSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { vehicleId, householdId, wasteType, quantity, quality, photos, notes } = value;

  // Verify vehicle exists
  const vehicle = await FirestoreService.getById('collection_vehicles', vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Verify household exists
  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Create pickup record
  const pickupData = {
    vehicleId,
    householdId,
    wasteType,
    quantity,
    quality,
    photos: photos || [],
    notes,
    collectedBy: req.user.id,
    collectedAt: new Date(),
    status: 'completed'
  };

  const pickup = await FirestoreService.create('pickup_records', pickupData);

  // Update vehicle statistics
  await FirestoreService.update('collection_vehicles', vehicleId, {
    totalCollections: vehicle.totalCollections + 1,
    lastCollection: new Date()
  });

  // Update household collection status
  await FirestoreService.update('households', householdId, {
    lastCollection: {
      date: new Date(),
      wasteType,
      quantity,
      quality
    }
  });

  res.status(201).json({
    success: true,
    message: 'Pickup completed successfully',
    data: {
      pickupId: pickup.id,
      vehicleId,
      householdId,
      wasteType,
      quantity,
      quality
    }
  });
}));

// @desc    Reject non-segregated waste
// @route   PUT /api/collection/pickup/reject
// @access  Private
router.put('/pickup/reject', protect, asyncHandler(async (req, res) => {
  const { error, value } = pickupRejectSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { vehicleId, householdId, reason, photos, notes } = value;

  // Verify vehicle exists
  const vehicle = await FirestoreService.getById('collection_vehicles', vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Verify household exists
  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Create rejection record
  const rejectionData = {
    vehicleId,
    householdId,
    reason,
    photos: photos || [],
    notes,
    rejectedBy: req.user.id,
    rejectedAt: new Date(),
    status: 'rejected'
  };

  const rejection = await FirestoreService.create('pickup_rejections', rejectionData);

  // Update household compliance score
  const newScore = Math.max(0, (household.segregationStatus?.complianceScore || 0) - 20);
  await FirestoreService.update('households', householdId, {
    segregationStatus: {
      ...household.segregationStatus,
      complianceScore: newScore,
      violations: [
        ...(household.segregationStatus?.violations || []),
        {
          type: 'collection_rejection',
          reason,
          date: new Date(),
          rejectedBy: req.user.id
        }
      ]
    }
  });

  res.json({
    success: true,
    message: 'Waste collection rejected',
    data: {
      rejectionId: rejection.id,
      householdId,
      reason,
      newComplianceScore: newScore
    }
  });
}));

// @desc    Get collection schedule for area
// @route   GET /api/collection/schedule/:areaId
// @access  Private
router.get('/schedule/:areaId', protect, asyncHandler(async (req, res) => {
  const { areaId } = req.params;
  const { date } = req.query;

  // Get collection schedule for the area
  const schedules = await FirestoreService.customQuery('collection_schedules', [
    { type: 'where', field: 'area', operator: '==', value: areaId }
  ]);

  // Get scheduled pickups for the date
  const targetDate = date || new Date().toISOString().split('T')[0];
  const pickups = await FirestoreService.customQuery('pickup_records', [
    { type: 'where', field: 'collectedAt', operator: '>=', value: new Date(targetDate) },
    { type: 'where', field: 'collectedAt', operator: '<', value: new Date(new Date(targetDate).getTime() + 24 * 60 * 60 * 1000) }
  ]);

  res.json({
    success: true,
    data: {
      area: areaId,
      date: targetDate,
      schedule: schedules[0] || null,
      scheduledPickups: pickups.length,
      completedPickups: pickups.filter(p => p.status === 'completed').length,
      pendingPickups: pickups.filter(p => p.status === 'pending').length
    }
  });
}));

// @desc    Log collection complaints
// @route   POST /api/collection/complaints
// @access  Private
router.post('/complaints', protect, asyncHandler(async (req, res) => {
  const { error, value } = complaintSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { householdId, complaintType, description, location, photos, priority } = value;

  // Verify household exists
  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Create complaint record
  const complaintData = {
    householdId,
    complaintType,
    description,
    location,
    photos: photos || [],
    priority,
    reportedBy: req.user.id,
    reportedAt: new Date(),
    status: 'open',
    resolvedAt: null
  };

  const complaint = await FirestoreService.create('collection_complaints', complaintData);

  res.status(201).json({
    success: true,
    message: 'Complaint logged successfully',
    data: {
      complaintId: complaint.id,
      householdId,
      complaintType,
      priority,
      status: 'open'
    }
  });
}));

// @desc    Get collection statistics
// @route   GET /api/collection/stats
// @access  Private (Admin, ULB Admin)
router.get('/stats', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, area, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  // Get vehicles
  const vehicles = await FirestoreService.customQuery('collection_vehicles', conditions);
  
  // Get pickup records from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  const pickupConditions = [
    { type: 'where', field: 'collectedAt', operator: '>=', value: startDate }
  ];

  const pickups = await FirestoreService.customQuery('pickup_records', pickupConditions);
  const rejections = await FirestoreService.customQuery('pickup_rejections', pickupConditions);
  const complaints = await FirestoreService.customQuery('collection_complaints', pickupConditions);

  // Calculate statistics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalPickups = pickups.length;
  const totalRejections = rejections.length;
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  const totalWasteCollected = pickups.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const averageQuality = pickups.length > 0 ? 
    pickups.reduce((sum, p) => {
      const qualityScore = { excellent: 4, good: 3, fair: 2, poor: 1 }[p.quality] || 0;
      return sum + qualityScore;
    }, 0) / pickups.length : 0;

  const stats = {
    summary: {
      totalVehicles,
      activeVehicles,
      totalPickups,
      totalRejections,
      totalComplaints,
      resolvedComplaints
    },
    performance: {
      totalWasteCollected: Math.round(totalWasteCollected * 100) / 100,
      averageQuality: Math.round(averageQuality * 100) / 100,
      rejectionRate: totalPickups > 0 ? Math.round((totalRejections / (totalPickups + totalRejections)) * 100) : 0,
      complaintResolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0
    },
    vehicles: vehicles.map(v => ({
      id: v.id,
      vehicleNumber: v.vehicleNumber,
      type: v.type,
      status: v.status,
      totalCollections: v.totalCollections
    }))
  };

  res.json({
    success: true,
    data: stats
  });
}));

// Helper function for route optimization
function optimizeRoutes(households, vehicles) {
  const routes = [];
  
  // Simple clustering by proximity (in production, use more sophisticated algorithms)
  const householdsPerVehicle = Math.ceil(households.length / vehicles.length);
  
  for (let i = 0; i < vehicles.length; i++) {
    const startIndex = i * householdsPerVehicle;
    const endIndex = Math.min(startIndex + householdsPerVehicle, households.length);
    const vehicleHouseholds = households.slice(startIndex, endIndex);
    
    routes.push({
      vehicleId: vehicles[i].id,
      vehicleNumber: vehicles[i].vehicleNumber,
      driver: vehicles[i].driver,
      households: vehicleHouseholds.map(h => ({
        id: h.id,
        address: h.address,
        wasteGeneration: h.wasteGeneration
      })),
      estimatedDuration: vehicleHouseholds.length * 15, // 15 minutes per household
      totalCapacity: vehicles[i].capacity
    });
  }
  
  return routes;
}

export default router;