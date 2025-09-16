import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const ulbRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(),
  state: Joi.string().required(),
  district: Joi.string().required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required()
  }).required(),
  contact: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().optional()
  }).required(),
  wasteManagementStatus: Joi.object({
    totalWard: Joi.number().min(1).required(),
    activeWards: Joi.number().min(1).required(),
    totalPopulation: Joi.number().min(1).required(),
    wasteGeneratedPerDay: Joi.number().min(0).required(),
    segregationCompliance: Joi.number().min(0).max(100).required()
  }).required(),
  policies: Joi.object({
    segregationMandatory: Joi.boolean().required(),
    penaltyAmount: Joi.number().min(0).required(),
    incentiveAmount: Joi.number().min(0).required(),
    trainingRequired: Joi.boolean().required()
  }).required()
});

const policyUpdateSchema = Joi.object({
  ulbId: Joi.string().required(),
  policyType: Joi.string().valid('segregation', 'penalty', 'incentive', 'training', 'collection').required(),
  newValue: Joi.any().required(),
  effectiveDate: Joi.date().min('now').required(),
  reason: Joi.string().required()
});

const wasteManagementStatusSchema = Joi.object({
  ulbId: Joi.string().required(),
  totalWard: Joi.number().min(1).optional(),
  activeWards: Joi.number().min(1).optional(),
  totalPopulation: Joi.number().min(1).optional(),
  wasteGeneratedPerDay: Joi.number().min(0).optional(),
  segregationCompliance: Joi.number().min(0).max(100).optional(),
  treatmentCapacity: Joi.number().min(0).optional(),
  collectionEfficiency: Joi.number().min(0).max(100).optional(),
  lastUpdated: Joi.date().default(() => new Date())
});

// @desc    Register ULB
// @route   POST /api/ulb/register
// @access  Private (Admin)
router.post('/register', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { error, value } = ulbRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { name, code, state, district, address, contact, wasteManagementStatus, policies } = value;

  // Check if ULB already exists with this code
  const existingULBs = await FirestoreService.customQuery('ulbs', [
    { type: 'where', field: 'code', operator: '==', value: code }
  ]);

  if (existingULBs.length > 0) {
    res.status(400);
    throw new Error('ULB already registered with this code');
  }

  // Create ULB record
  const ulbData = {
    name,
    code,
    state,
    district,
    address,
    contact,
    wasteManagementStatus: {
      ...wasteManagementStatus,
      lastUpdated: new Date()
    },
    policies,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const ulb = await FirestoreService.create('ulbs', ulbData);

  res.status(201).json({
    success: true,
    message: 'ULB registered successfully',
    ulb: {
      id: ulb.id,
      name: ulb.name,
      code: ulb.code,
      state: ulb.state,
      district: ulb.district
    }
  });
}));

// @desc    Get all facilities in ULB
// @route   GET /api/ulb/:ulbId/facilities
// @access  Private
router.get('/:ulbId/facilities', protect, asyncHandler(async (req, res) => {
  const { ulbId } = req.params;
  const { type, status } = req.query;

  let conditions = [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ];

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
    data: {
      ulbId,
      facilities,
      total: facilities.length,
      summary: {
        biomethanization: facilities.filter(f => f.type === 'biomethanization').length,
        wte: facilities.filter(f => f.type === 'wte').length,
        recycling: facilities.filter(f => f.type === 'recycling').length,
        composting: facilities.filter(f => f.type === 'composting').length,
        landfill: facilities.filter(f => f.type === 'landfill').length
      }
    }
  });
}));

// @desc    Update waste management status
// @route   PUT /api/ulb/waste-management/status
// @access  Private (Admin, ULB Admin)
router.put('/waste-management/status', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = wasteManagementStatusSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { ulbId, ...updateData } = value;

  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    res.status(404);
    throw new Error('ULB not found');
  }

  // Update waste management status
  const updatedULB = await FirestoreService.update('ulbs', ulbId, {
    wasteManagementStatus: {
      ...ulb.wasteManagementStatus,
      ...updateData,
      lastUpdated: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Waste management status updated successfully',
    data: updatedULB.wasteManagementStatus
  });
}));

// @desc    Get ULB performance dashboard
// @route   GET /api/ulb/performance/dashboard/:ulbId
// @access  Private
router.get('/performance/dashboard/:ulbId', protect, asyncHandler(async (req, res) => {
  const { ulbId } = req.params;
  const { days = 30 } = req.query;

  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    res.status(404);
    throw new Error('ULB not found');
  }

  // Get data from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get citizens
  const citizens = await FirestoreService.customQuery('citizens', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  // Get households
  const households = await FirestoreService.customQuery('households', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  // Get bulk generators
  const bulkGenerators = await FirestoreService.customQuery('bulk_generators', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  // Get facilities
  const facilities = await FirestoreService.customQuery('waste_facilities', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  // Get collection vehicles
  const vehicles = await FirestoreService.customQuery('collection_vehicles', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  // Get monitoring reports
  const reports = await FirestoreService.customQuery('monitoring_reports', [
    { type: 'where', field: 'reportedAt', operator: '>=', value: startDate }
  ]);

  // Get training enrollments
  const trainingEnrollments = await FirestoreService.customQuery('training_enrollments', [
    { type: 'where', field: 'enrolledAt', operator: '>=', value: startDate }
  ]);

  // Calculate performance metrics
  const totalCitizens = citizens.length;
  const totalHouseholds = households.length;
  const totalBulkGenerators = bulkGenerators.length;
  const totalFacilities = facilities.length;
  const totalVehicles = vehicles.length;

  const compliantHouseholds = households.filter(h => h.segregationStatus?.isCompliant).length;
  const compliantBulkGenerators = bulkGenerators.filter(b => b.complianceStatus?.isCompliant).length;
  const trainedCitizens = citizens.filter(c => c.trainingStatus?.completed).length;

  const totalWasteGenerated = households.reduce((sum, h) => {
    const waste = h.wasteGeneration || {};
    return sum + (waste.dailyWetWaste || 0) + (waste.dailyDryWaste || 0) + (waste.dailyHazardousWaste || 0);
  }, 0) + bulkGenerators.reduce((sum, b) => {
    const waste = b.wasteGeneration || {};
    return sum + (waste.dailyWetWaste || 0) + (waste.dailyDryWaste || 0) + (waste.dailyHazardousWaste || 0);
  }, 0);

  const totalFacilityCapacity = facilities.reduce((sum, f) => sum + f.capacity, 0);
  const totalFacilityLoad = facilities.reduce((sum, f) => sum + f.currentLoad, 0);
  const facilityUtilization = totalFacilityCapacity > 0 ? (totalFacilityLoad / totalFacilityCapacity) * 100 : 0;

  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const resolutionRate = reports.length > 0 ? (resolvedReports / reports.length) * 100 : 0;

  const dashboard = {
    ulb: {
      id: ulb.id,
      name: ulb.name,
      code: ulb.code,
      state: ulb.state,
      district: ulb.district
    },
    overview: {
      totalCitizens,
      totalHouseholds,
      totalBulkGenerators,
      totalFacilities,
      totalVehicles,
      totalWasteGenerated: Math.round(totalWasteGenerated * 100) / 100
    },
    compliance: {
      householdComplianceRate: totalHouseholds > 0 ? Math.round((compliantHouseholds / totalHouseholds) * 100) : 0,
      bulkGeneratorComplianceRate: totalBulkGenerators > 0 ? Math.round((compliantBulkGenerators / totalBulkGenerators) * 100) : 0,
      trainingCompletionRate: totalCitizens > 0 ? Math.round((trainedCitizens / totalCitizens) * 100) : 0
    },
    facilities: {
      totalCapacity: totalFacilityCapacity,
      currentLoad: totalFacilityLoad,
      utilizationRate: Math.round(facilityUtilization * 100) / 100,
      facilityTypes: facilities.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {})
    },
    monitoring: {
      totalReports: reports.length,
      resolvedReports,
      resolutionRate: Math.round(resolutionRate * 100) / 100,
      reportsByType: reports.reduce((acc, r) => {
        acc[r.issueType] = (acc[r.issueType] || 0) + 1;
        return acc;
      }, {})
    },
    training: {
      totalEnrollments: trainingEnrollments.length,
      completedTrainings: trainingEnrollments.filter(t => t.status === 'completed').length,
      completionRate: trainingEnrollments.length > 0 ? 
        Math.round((trainingEnrollments.filter(t => t.status === 'completed').length / trainingEnrollments.length) * 100) : 0
    }
  };

  res.json({
    success: true,
    data: dashboard
  });
}));

// @desc    Update waste management policies
// @route   POST /api/ulb/policy/update
// @access  Private (Admin, ULB Admin)
router.post('/policy/update', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = policyUpdateSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { ulbId, policyType, newValue, effectiveDate, reason } = value;

  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    res.status(404);
    throw new Error('ULB not found');
  }

  // Create policy update record
  const policyUpdateData = {
    ulbId,
    policyType,
    oldValue: ulb.policies[policyType],
    newValue,
    effectiveDate: new Date(effectiveDate),
    reason,
    updatedBy: req.user.id,
    updatedAt: new Date(),
    status: 'pending'
  };

  const policyUpdate = await FirestoreService.create('ulb_policy_updates', policyUpdateData);

  // Update ULB policies
  const updatedPolicies = {
    ...ulb.policies,
    [policyType]: newValue
  };

  await FirestoreService.update('ulbs', ulbId, {
    policies: updatedPolicies
  });

  res.status(201).json({
    success: true,
    message: 'Policy updated successfully',
    data: {
      policyUpdateId: policyUpdate.id,
      ulbId,
      policyType,
      newValue,
      effectiveDate: policyUpdate.effectiveDate
    }
  });
}));

// @desc    Generate compliance report
// @route   GET /api/ulb/compliance/report/:ulbId
// @access  Private
router.get('/compliance/report/:ulbId', protect, asyncHandler(async (req, res) => {
  const { ulbId } = req.params;
  const { format = 'json', period = 'monthly' } = req.query;

  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    res.status(404);
    throw new Error('ULB not found');
  }

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'weekly':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarterly':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'yearly':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 1);
  }

  // Get compliance data
  const households = await FirestoreService.customQuery('households', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  const bulkGenerators = await FirestoreService.customQuery('bulk_generators', [
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  const violations = await FirestoreService.customQuery('segregation_violations', [
    { type: 'where', field: 'reportedAt', operator: '>=', value: startDate }
  ]);

  const penalties = await FirestoreService.customQuery('penalties', [
    { type: 'where', field: 'imposedAt', operator: '>=', value: startDate }
  ]);

  // Calculate compliance metrics
  const totalHouseholds = households.length;
  const compliantHouseholds = households.filter(h => h.segregationStatus?.isCompliant).length;
  const householdComplianceRate = totalHouseholds > 0 ? (compliantHouseholds / totalHouseholds) * 100 : 0;

  const totalBulkGenerators = bulkGenerators.length;
  const compliantBulkGenerators = bulkGenerators.filter(b => b.complianceStatus?.isCompliant).length;
  const bulkGeneratorComplianceRate = totalBulkGenerators > 0 ? (compliantBulkGenerators / totalBulkGenerators) * 100 : 0;

  const totalViolations = violations.length;
  const totalPenalties = penalties.length;
  const paidPenalties = penalties.filter(p => p.status === 'paid').length;
  const penaltyCollectionRate = totalPenalties > 0 ? (paidPenalties / totalPenalties) * 100 : 0;

  const complianceReport = {
    ulb: {
      id: ulb.id,
      name: ulb.name,
      code: ulb.code,
      state: ulb.state,
      district: ulb.district
    },
    period: {
      startDate,
      endDate,
      type: period
    },
    compliance: {
      householdComplianceRate: Math.round(householdComplianceRate * 100) / 100,
      bulkGeneratorComplianceRate: Math.round(bulkGeneratorComplianceRate * 100) / 100,
      overallComplianceRate: Math.round(((householdComplianceRate + bulkGeneratorComplianceRate) / 2) * 100) / 100
    },
    violations: {
      totalViolations,
      violationsByType: violations.reduce((acc, v) => {
        acc[v.violationType] = (acc[v.violationType] || 0) + 1;
        return acc;
      }, {}),
      totalPenalties,
      paidPenalties,
      penaltyCollectionRate: Math.round(penaltyCollectionRate * 100) / 100
    },
    recommendations: generateComplianceRecommendations(householdComplianceRate, bulkGeneratorComplianceRate, totalViolations)
  };

  if (format === 'pdf') {
    // In a real implementation, you would generate a PDF here
    res.json({
      success: true,
      message: 'PDF generation not implemented in this demo',
      data: complianceReport
    });
  } else {
    res.json({
      success: true,
      data: complianceReport
    });
  }
}));

// @desc    Get all ULBs
// @route   GET /api/ulb
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { state, district, status } = req.query;

  let conditions = [];

  if (state) {
    conditions.push({ type: 'where', field: 'state', operator: '==', value: state });
  }

  if (district) {
    conditions.push({ type: 'where', field: 'district', operator: '==', value: district });
  }

  if (status) {
    conditions.push({ type: 'where', field: 'isActive', operator: '==', value: status === 'active' });
  }

  const ulbs = await FirestoreService.customQuery('ulbs', [
    ...conditions,
    { type: 'orderBy', field: 'createdAt', direction: 'desc' }
  ]);

  res.json({
    success: true,
    data: ulbs
  });
}));

// Helper function to generate compliance recommendations
function generateComplianceRecommendations(householdRate, bulkGeneratorRate, totalViolations) {
  const recommendations = [];

  if (householdRate < 70) {
    recommendations.push({
      type: 'household_compliance',
      priority: 'high',
      message: 'Household compliance rate is below 70%. Consider increasing training programs and awareness campaigns.'
    });
  }

  if (bulkGeneratorRate < 80) {
    recommendations.push({
      type: 'bulk_generator_compliance',
      priority: 'high',
      message: 'Bulk generator compliance rate is below 80%. Consider stricter monitoring and penalties.'
    });
  }

  if (totalViolations > 100) {
    recommendations.push({
      type: 'violation_management',
      priority: 'medium',
      message: 'High number of violations detected. Consider increasing monitoring frequency and enforcement.'
    });
  }

  if (householdRate > 90 && bulkGeneratorRate > 90) {
    recommendations.push({
      type: 'maintenance',
      priority: 'low',
      message: 'Excellent compliance rates. Focus on maintaining current standards and continuous improvement.'
    });
  }

  return recommendations;
}

export default router;