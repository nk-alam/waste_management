import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const championRegistrationSchema = Joi.object({
  personalInfo: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required()
  }).required(),
  areaAssigned: Joi.string().required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required()
  }).required(),
  ulbId: Joi.string().required()
});

const monitoringReportSchema = Joi.object({
  area: Joi.string().required(),
  issueType: Joi.string().valid('dumping', 'segregation_violation', 'collection_delay', 'facility_issue', 'other').required(),
  description: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required(),
  photos: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const violationReportSchema = Joi.object({
  citizenId: Joi.string().required(),
  violationType: Joi.string().valid('non_segregation', 'illegal_dumping', 'missed_collection', 'other').required(),
  description: Joi.string().required(),
  evidence: Joi.array().items(Joi.string()).optional(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required()
});

// @desc    Register green champion
// @route   POST /api/green-champions/register
// @access  Private (Admin, ULB Admin)
router.post('/register', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = championRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { personalInfo, areaAssigned, address, ulbId } = value;

  // Check if champion already exists for this area
  const existingChampions = await FirestoreService.customQuery('green_champions', [
    { type: 'where', field: 'areaAssigned', operator: '==', value: areaAssigned },
    { type: 'where', field: 'ulbId', operator: '==', value: ulbId }
  ]);

  if (existingChampions.length > 0) {
    res.status(400);
    throw new Error('Green champion already assigned to this area');
  }

  // Create champion record
  const championData = {
    personalInfo,
    areaAssigned,
    address,
    ulbId,
    citizensUnderSupervision: [],
    trainingsConducted: [],
    violationsReported: [],
    performanceMetrics: {
      totalReports: 0,
      resolvedReports: 0,
      citizensTrained: 0,
      violationsReported: 0
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const champion = await FirestoreService.create('green_champions', championData);

  res.status(201).json({
    success: true,
    message: 'Green champion registered successfully',
    champion: {
      id: champion.id,
      personalInfo: champion.personalInfo,
      areaAssigned: champion.areaAssigned
    }
  });
}));

// @desc    Get champions by area
// @route   GET /api/green-champions/area/:areaId
// @access  Private
router.get('/area/:areaId', protect, asyncHandler(async (req, res) => {
  const { areaId } = req.params;
  const { ulbId } = req.query;

  let conditions = [
    { type: 'where', field: 'areaAssigned', operator: '==', value: areaId }
  ];

  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  const champions = await FirestoreService.customQuery('green_champions', conditions);

  res.json({
    success: true,
    data: champions
  });
}));

// @desc    Submit monitoring report
// @route   POST /api/green-champions/monitoring/report
// @access  Private
router.post('/monitoring/report', protect, asyncHandler(async (req, res) => {
  const { error, value } = monitoringReportSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { area, issueType, description, location, photos, priority } = value;

  // Create monitoring report
  const reportData = {
    reporterId: req.user.id,
    reporterType: 'green_champion',
    area,
    issueType,
    description,
    location,
    photos: photos || [],
    priority,
    status: 'reported',
    reportedAt: new Date(),
    resolvedAt: null
  };

  const report = await FirestoreService.create('monitoring_reports', reportData);

  // Update champion performance metrics
  const champion = await FirestoreService.getById('green_champions', req.user.id);
  if (champion) {
    await FirestoreService.update('green_champions', req.user.id, {
      performanceMetrics: {
        ...champion.performanceMetrics,
        totalReports: champion.performanceMetrics.totalReports + 1
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Monitoring report submitted successfully',
    data: {
      reportId: report.id,
      status: 'reported',
      priority
    }
  });
}));

// @desc    Get monitoring dashboard
// @route   GET /api/green-champions/monitoring/dashboard
// @access  Private
router.get('/monitoring/dashboard', protect, asyncHandler(async (req, res) => {
  const { area, ulbId, days = 30 } = req.query;
  
  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }
  
  if (area) {
    conditions.push({ type: 'where', field: 'area', operator: '==', value: area });
  }

  // Get reports from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  conditions.push({ 
    type: 'where', 
    field: 'reportedAt', 
    operator: '>=', 
    value: startDate 
  });

  const reports = await FirestoreService.customQuery('monitoring_reports', [
    ...conditions,
    { type: 'orderBy', field: 'reportedAt', direction: 'desc' }
  ]);

  // Calculate dashboard metrics
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const pendingReports = reports.filter(r => r.status === 'reported').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;

  const reportsByType = reports.reduce((acc, report) => {
    acc[report.issueType] = (acc[report.issueType] || 0) + 1;
    return acc;
  }, {});

  const reportsByPriority = reports.reduce((acc, report) => {
    acc[report.priority] = (acc[report.priority] || 0) + 1;
    return acc;
  }, {});

  const dashboard = {
    summary: {
      totalReports,
      resolvedReports,
      pendingReports,
      inProgressReports,
      resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
    },
    reportsByType,
    reportsByPriority,
    recentReports: reports.slice(0, 10)
  };

  res.json({
    success: true,
    data: dashboard
  });
}));

// @desc    Schedule citizen training
// @route   POST /api/green-champions/training/schedule
// @access  Private
router.post('/training/schedule', protect, asyncHandler(async (req, res) => {
  const { area, trainingType, scheduledDate, description, maxParticipants } = req.body;

  if (!area || !trainingType || !scheduledDate) {
    res.status(400);
    throw new Error('Area, training type, and scheduled date are required');
  }

  // Create training session
  const trainingData = {
    organizerId: req.user.id,
    organizerType: 'green_champion',
    area,
    trainingType,
    scheduledDate: new Date(scheduledDate),
    description,
    maxParticipants: maxParticipants || 50,
    status: 'scheduled',
    participants: [],
    createdAt: new Date()
  };

  const training = await FirestoreService.create('training_sessions', trainingData);

  res.status(201).json({
    success: true,
    message: 'Training session scheduled successfully',
    data: {
      trainingId: training.id,
      area,
      trainingType,
      scheduledDate: training.scheduledDate,
      status: 'scheduled'
    }
  });
}));

// @desc    Report waste segregation violation
// @route   PUT /api/green-champions/violations/report
// @access  Private
router.put('/violations/report', protect, asyncHandler(async (req, res) => {
  const { error, value } = violationReportSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { citizenId, violationType, description, evidence, location } = value;

  // Verify citizen exists
  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Create violation report
  const violationData = {
    citizenId,
    reportedBy: req.user.id,
    reporterType: 'green_champion',
    violationType,
    description,
    evidence: evidence || [],
    location,
    status: 'reported',
    reportedAt: new Date(),
    penaltyAmount: getPenaltyAmount(violationType),
    paidAt: null
  };

  const violation = await FirestoreService.create('segregation_violations', violationData);

  // Update citizen's violation history
  const updatedViolations = [...citizen.penaltyHistory, violation.id];
  await FirestoreService.update('citizens', citizenId, {
    penaltyHistory: updatedViolations,
    segregationCompliance: {
      ...citizen.segregationCompliance,
      violations: [...citizen.segregationCompliance.violations, {
        violationId: violation.id,
        type: violationType,
        reportedAt: new Date(),
        amount: violation.penaltyAmount
      }]
    }
  });

  // Update champion performance metrics
  const champion = await FirestoreService.getById('green_champions', req.user.id);
  if (champion) {
    await FirestoreService.update('green_champions', req.user.id, {
      performanceMetrics: {
        ...champion.performanceMetrics,
        violationsReported: champion.performanceMetrics.violationsReported + 1
      },
      violationsReported: [...champion.violationsReported, violation.id]
    });
  }

  res.status(201).json({
    success: true,
    message: 'Violation reported successfully',
    data: {
      violationId: violation.id,
      citizenId,
      violationType,
      penaltyAmount: violation.penaltyAmount
    }
  });
}));

// @desc    Get area performance metrics
// @route   GET /api/green-champions/performance/:championId
// @access  Private
router.get('/performance/:championId', protect, asyncHandler(async (req, res) => {
  const { championId } = req.params;
  
  const champion = await FirestoreService.getById('green_champions', championId);
  if (!champion) {
    res.status(404);
    throw new Error('Green champion not found');
  }

  // Get detailed performance data
  const reports = await FirestoreService.customQuery('monitoring_reports', [
    { type: 'where', field: 'reporterId', operator: '==', value: championId }
  ]);

  const violations = await FirestoreService.customQuery('segregation_violations', [
    { type: 'where', field: 'reportedBy', operator: '==', value: championId }
  ]);

  const trainings = await FirestoreService.customQuery('training_sessions', [
    { type: 'where', field: 'organizerId', operator: '==', value: championId }
  ]);

  const performance = {
    championId: champion.id,
    name: champion.personalInfo.name,
    areaAssigned: champion.areaAssigned,
    metrics: champion.performanceMetrics,
    detailedStats: {
      totalReports: reports.length,
      resolvedReports: reports.filter(r => r.status === 'resolved').length,
      violationsReported: violations.length,
      trainingsConducted: trainings.length,
      totalParticipants: trainings.reduce((sum, t) => sum + (t.participants?.length || 0), 0)
    },
    recentActivity: {
      reports: reports.slice(0, 5),
      violations: violations.slice(0, 5),
      trainings: trainings.slice(0, 5)
    }
  };

  res.json({
    success: true,
    data: performance
  });
}));

// Helper function to get penalty amount based on violation type
function getPenaltyAmount(violationType) {
  const penalties = {
    non_segregation: 200,
    illegal_dumping: 500,
    missed_collection: 100,
    other: 150
  };
  
  return penalties[violationType] || 150;
}

export default router;