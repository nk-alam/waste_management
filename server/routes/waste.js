import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const householdRegistrationSchema = Joi.object({
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required(),
    ward: Joi.string().optional()
  }).required(),
  residentCount: Joi.number().min(1).max(20).required(),
  contactInfo: Joi.object({
    primaryContact: Joi.string().pattern(/^[0-9]{10}$/).required(),
    alternateContact: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional()
  }).required(),
  ulbId: Joi.string().required(),
  wasteGeneration: Joi.object({
    dailyWetWaste: Joi.number().min(0).optional(),
    dailyDryWaste: Joi.number().min(0).optional(),
    dailyHazardousWaste: Joi.number().min(0).optional()
  }).optional()
});

const bulkGeneratorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('restaurant', 'hotel', 'mall', 'hospital', 'school', 'office', 'factory', 'other').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required()
  }).required(),
  contactInfo: Joi.object({
    primaryContact: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    managerName: Joi.string().optional()
  }).required(),
  ulbId: Joi.string().required(),
  wasteGeneration: Joi.object({
    dailyWetWaste: Joi.number().min(0).required(),
    dailyDryWaste: Joi.number().min(0).required(),
    dailyHazardousWaste: Joi.number().min(0).required()
  }).required()
});

const segregationStatusSchema = Joi.object({
  householdId: Joi.string().required(),
  wetWaste: Joi.object({
    segregated: Joi.boolean().required(),
    quantity: Joi.number().min(0).optional(),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional()
  }).required(),
  dryWaste: Joi.object({
    segregated: Joi.boolean().required(),
    quantity: Joi.number().min(0).optional(),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional()
  }).required(),
  hazardousWaste: Joi.object({
    segregated: Joi.boolean().required(),
    quantity: Joi.number().min(0).optional(),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional()
  }).required(),
  assessmentDate: Joi.date().default(() => new Date())
});

const violationReportSchema = Joi.object({
  householdId: Joi.string().required(),
  violationType: Joi.string().valid('non_segregation', 'illegal_dumping', 'missed_collection', 'other').required(),
  description: Joi.string().required(),
  evidence: Joi.array().items(Joi.string()).optional(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required(),
  reportedBy: Joi.string().required()
});

// @desc    Register household for waste collection
// @route   POST /api/waste/household/register
// @access  Public
router.post('/household/register', asyncHandler(async (req, res) => {
  const { error, value } = householdRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { address, residentCount, contactInfo, ulbId, wasteGeneration } = value;

  // Create household record
  const householdData = {
    address,
    residentCount,
    contactInfo,
    ulbId,
    wasteGeneration: wasteGeneration || {
      dailyWetWaste: 0,
      dailyDryWaste: 0,
      dailyHazardousWaste: 0
    },
    segregationStatus: {
      isCompliant: false,
      lastAssessment: null,
      complianceScore: 0,
      violations: []
    },
    collectionSchedule: {
      wetWaste: 'daily',
      dryWaste: 'weekly',
      hazardousWaste: 'monthly'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const household = await FirestoreService.create('households', householdData);

  res.status(201).json({
    success: true,
    message: 'Household registered successfully',
    household: {
      id: household.id,
      address: household.address,
      residentCount: household.residentCount,
      collectionSchedule: household.collectionSchedule
    }
  });
}));

// @desc    Register bulk waste generator
// @route   POST /api/waste/bulk-generator/register
// @access  Private (Admin, ULB Admin)
router.post('/bulk-generator/register', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = bulkGeneratorSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { name, type, address, contactInfo, ulbId, wasteGeneration } = value;

  // Create bulk generator record
  const generatorData = {
    name,
    type,
    address,
    contactInfo,
    ulbId,
    wasteGeneration,
    complianceStatus: {
      isCompliant: false,
      lastInspection: null,
      complianceScore: 0,
      violations: []
    },
    collectionSchedule: {
      wetWaste: 'daily',
      dryWaste: 'daily',
      hazardousWaste: 'weekly'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const generator = await FirestoreService.create('bulk_generators', generatorData);

  res.status(201).json({
    success: true,
    message: 'Bulk generator registered successfully',
    generator: {
      id: generator.id,
      name: generator.name,
      type: generator.type,
      address: generator.address
    }
  });
}));

// @desc    Update segregation compliance status
// @route   PUT /api/waste/household/segregation-status
// @access  Private
router.put('/household/segregation-status', protect, asyncHandler(async (req, res) => {
  const { error, value } = segregationStatusSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { householdId, wetWaste, dryWaste, hazardousWaste, assessmentDate } = value;

  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Calculate compliance score
  const complianceScore = calculateComplianceScore(wetWaste, dryWaste, hazardousWaste);
  const isCompliant = complianceScore >= 70;

  // Update segregation status
  const updatedHousehold = await FirestoreService.update('households', householdId, {
    segregationStatus: {
      isCompliant,
      lastAssessment: new Date(assessmentDate),
      complianceScore,
      violations: isCompliant ? household.segregationStatus.violations : [
        ...household.segregationStatus.violations,
        {
          type: 'non_segregation',
          date: new Date(assessmentDate),
          score: complianceScore
        }
      ],
      wasteTypes: {
        wetWaste,
        dryWaste,
        hazardousWaste
      }
    }
  });

  res.json({
    success: true,
    message: 'Segregation status updated successfully',
    data: {
      householdId,
      complianceScore,
      isCompliant,
      assessmentDate: new Date(assessmentDate)
    }
  });
}));

// @desc    Get collection schedule
// @route   GET /api/waste/household/collection-schedule/:householdId
// @access  Private
router.get('/household/collection-schedule/:householdId', protect, asyncHandler(async (req, res) => {
  const { householdId } = req.params;

  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Get collection schedule for the area
  const schedules = await FirestoreService.customQuery('collection_schedules', [
    { type: 'where', field: 'area', operator: '==', value: household.address.ward || household.address.city },
    { type: 'where', field: 'ulbId', operator: '==', value: household.ulbId }
  ]);

  res.json({
    success: true,
    data: {
      household: {
        id: household.id,
        address: household.address,
        residentCount: household.residentCount
      },
      schedule: household.collectionSchedule,
      areaSchedule: schedules[0] || null
    }
  });
}));

// @desc    Update bulk generator compliance
// @route   PUT /api/waste/bulk-generator/compliance
// @access  Private (Admin, ULB Admin, Supervisor)
router.put('/bulk-generator/compliance', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { generatorId, complianceData } = req.body;

  if (!generatorId || !complianceData) {
    res.status(400);
    throw new Error('Generator ID and compliance data are required');
  }

  const generator = await FirestoreService.getById('bulk_generators', generatorId);
  if (!generator) {
    res.status(404);
    throw new Error('Bulk generator not found');
  }

  // Calculate compliance score
  const complianceScore = calculateBulkGeneratorCompliance(complianceData);
  const isCompliant = complianceScore >= 80;

  // Update compliance status
  const updatedGenerator = await FirestoreService.update('bulk_generators', generatorId, {
    complianceStatus: {
      isCompliant,
      lastInspection: new Date(),
      complianceScore,
      violations: isCompliant ? generator.complianceStatus.violations : [
        ...generator.complianceStatus.violations,
        {
          type: 'compliance_failure',
          date: new Date(),
          score: complianceScore,
          details: complianceData
        }
      ],
      inspectionData: complianceData
    }
  });

  res.json({
    success: true,
    message: 'Compliance status updated successfully',
    data: {
      generatorId,
      complianceScore,
      isCompliant
    }
  });
}));

// @desc    Get segregation guidelines
// @route   GET /api/waste/segregation/guidelines
// @access  Public
router.get('/segregation/guidelines', asyncHandler(async (req, res) => {
  const guidelines = await FirestoreService.getById('waste_guidelines', 'segregation');
  
  if (!guidelines) {
    res.status(404);
    throw new Error('Segregation guidelines not found');
  }

  res.json({
    success: true,
    data: guidelines
  });
}));

// @desc    Report segregation violation
// @route   POST /api/waste/segregation/violation
// @access  Private
router.post('/segregation/violation', protect, asyncHandler(async (req, res) => {
  const { error, value } = violationReportSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { householdId, violationType, description, evidence, location, reportedBy } = value;

  // Verify household exists
  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Create violation report
  const violationData = {
    householdId,
    violationType,
    description,
    evidence: evidence || [],
    location,
    reportedBy,
    status: 'reported',
    reportedAt: new Date(),
    penaltyAmount: getViolationPenalty(violationType),
    resolvedAt: null
  };

  const violation = await FirestoreService.create('segregation_violations', violationData);

  // Update household violation history
  const updatedViolations = [...household.segregationStatus.violations, violation.id];
  await FirestoreService.update('households', householdId, {
    segregationStatus: {
      ...household.segregationStatus,
      violations: updatedViolations,
      complianceScore: Math.max(0, household.segregationStatus.complianceScore - 10)
    }
  });

  res.status(201).json({
    success: true,
    message: 'Violation reported successfully',
    data: {
      violationId: violation.id,
      householdId,
      violationType,
      penaltyAmount: violation.penaltyAmount
    }
  });
}));

// @desc    Get waste generation statistics
// @route   GET /api/waste/generation/stats
// @access  Private (Admin, ULB Admin)
router.get('/generation/stats', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, area, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  // Get households
  const households = await FirestoreService.customQuery('households', conditions);
  
  // Get bulk generators
  const bulkGenerators = await FirestoreService.customQuery('bulk_generators', conditions);

  // Calculate statistics
  const totalHouseholds = households.length;
  const totalBulkGenerators = bulkGenerators.length;
  
  const totalWetWaste = households.reduce((sum, h) => sum + (h.wasteGeneration?.dailyWetWaste || 0), 0) +
                       bulkGenerators.reduce((sum, b) => sum + (b.wasteGeneration?.dailyWetWaste || 0), 0);
  
  const totalDryWaste = households.reduce((sum, h) => sum + (h.wasteGeneration?.dailyDryWaste || 0), 0) +
                       bulkGenerators.reduce((sum, b) => sum + (b.wasteGeneration?.dailyDryWaste || 0), 0);
  
  const totalHazardousWaste = households.reduce((sum, h) => sum + (h.wasteGeneration?.dailyHazardousWaste || 0), 0) +
                             bulkGenerators.reduce((sum, b) => sum + (b.wasteGeneration?.dailyHazardousWaste || 0), 0);

  const compliantHouseholds = households.filter(h => h.segregationStatus?.isCompliant).length;
  const compliantBulkGenerators = bulkGenerators.filter(b => b.complianceStatus?.isCompliant).length;

  const stats = {
    summary: {
      totalHouseholds,
      totalBulkGenerators,
      totalWetWaste: Math.round(totalWetWaste * 100) / 100,
      totalDryWaste: Math.round(totalDryWaste * 100) / 100,
      totalHazardousWaste: Math.round(totalHazardousWaste * 100) / 100,
      totalWaste: Math.round((totalWetWaste + totalDryWaste + totalHazardousWaste) * 100) / 100
    },
    compliance: {
      householdComplianceRate: totalHouseholds > 0 ? Math.round((compliantHouseholds / totalHouseholds) * 100) : 0,
      bulkGeneratorComplianceRate: totalBulkGenerators > 0 ? Math.round((compliantBulkGenerators / totalBulkGenerators) * 100) : 0
    },
    wasteDistribution: {
      wetWastePercentage: totalWetWaste > 0 ? Math.round((totalWetWaste / (totalWetWaste + totalDryWaste + totalHazardousWaste)) * 100) : 0,
      dryWastePercentage: totalDryWaste > 0 ? Math.round((totalDryWaste / (totalWetWaste + totalDryWaste + totalHazardousWaste)) * 100) : 0,
      hazardousWastePercentage: totalHazardousWaste > 0 ? Math.round((totalHazardousWaste / (totalWetWaste + totalDryWaste + totalHazardousWaste)) * 100) : 0
    }
  };

  res.json({
    success: true,
    data: stats
  });
}));

// Helper functions
function calculateComplianceScore(wetWaste, dryWaste, hazardousWaste) {
  let score = 0;
  
  if (wetWaste.segregated) score += 40;
  if (dryWaste.segregated) score += 30;
  if (hazardousWaste.segregated) score += 30;
  
  // Add quality bonus
  if (wetWaste.quality === 'excellent') score += 10;
  else if (wetWaste.quality === 'good') score += 5;
  
  if (dryWaste.quality === 'excellent') score += 10;
  else if (dryWaste.quality === 'good') score += 5;
  
  if (hazardousWaste.quality === 'excellent') score += 10;
  else if (hazardousWaste.quality === 'good') score += 5;
  
  return Math.min(100, score);
}

function calculateBulkGeneratorCompliance(complianceData) {
  let score = 0;
  
  // Segregation compliance (40 points)
  if (complianceData.wetWasteSegregated) score += 15;
  if (complianceData.dryWasteSegregated) score += 15;
  if (complianceData.hazardousWasteSegregated) score += 10;
  
  // Storage compliance (30 points)
  if (complianceData.properStorage) score += 15;
  if (complianceData.labeledContainers) score += 15;
  
  // Documentation compliance (20 points)
  if (complianceData.wasteManifest) score += 10;
  if (complianceData.trainingRecords) score += 10;
  
  // Collection compliance (10 points)
  if (complianceData.timelyCollection) score += 10;
  
  return Math.min(100, score);
}

function getViolationPenalty(violationType) {
  const penalties = {
    non_segregation: 200,
    illegal_dumping: 500,
    missed_collection: 100,
    other: 150
  };
  
  return penalties[violationType] || 150;
}

export default router;