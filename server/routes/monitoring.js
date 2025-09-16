import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const photoUploadSchema = Joi.object({
  area: Joi.string().required(),
  issueType: Joi.string().valid('dumping', 'segregation_violation', 'collection_delay', 'facility_issue', 'other').required(),
  description: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required(),
  photos: Joi.array().items(Joi.string()).min(1).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const wasteMovementReportSchema = Joi.object({
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required(),
  description: Joi.string().required(),
  photos: Joi.array().items(Joi.string()).min(1).required(),
  wasteType: Joi.string().valid('wet', 'dry', 'hazardous', 'mixed').optional(),
  estimatedQuantity: Joi.number().min(0).optional()
});

const cleanlinessScoreSchema = Joi.object({
  area: Joi.string().required(),
  score: Joi.number().min(0).max(100).required(),
  criteria: Joi.object({
    wasteCollection: Joi.number().min(0).max(25).required(),
    segregation: Joi.number().min(0).max(25).required(),
    cleanliness: Joi.number().min(0).max(25).required(),
    infrastructure: Joi.number().min(0).max(25).required()
  }).required(),
  photos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional()
});

// @desc    Upload geo-tagged dumping site photos
// @route   POST /api/monitoring/photo-upload
// @access  Private
router.post('/photo-upload', protect, asyncHandler(async (req, res) => {
  const { error, value } = photoUploadSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { area, issueType, description, location, photos, priority } = value;

  // Create monitoring report
  const reportData = {
    reporterId: req.user.id,
    reporterType: req.user.role,
    area,
    issueType,
    description,
    location,
    photos,
    priority,
    status: 'reported',
    reportedAt: new Date(),
    resolvedAt: null,
    assignedTo: null
  };

  const report = await FirestoreService.create('monitoring_reports', reportData);

  res.status(201).json({
    success: true,
    message: 'Photo uploaded and report created successfully',
    data: {
      reportId: report.id,
      area,
      issueType,
      priority,
      status: 'reported'
    }
  });
}));

// @desc    Get reported dumping sites
// @route   GET /api/monitoring/dumping-sites
// @access  Private
router.get('/dumping-sites', protect, asyncHandler(async (req, res) => {
  const { area, status, priority, days = 30 } = req.query;

  let conditions = [
    { type: 'where', field: 'issueType', operator: '==', value: 'dumping' }
  ];

  if (area) {
    conditions.push({ type: 'where', field: 'area', operator: '==', value: area });
  }

  if (status) {
    conditions.push({ type: 'where', field: 'status', operator: '==', value: status });
  }

  if (priority) {
    conditions.push({ type: 'where', field: 'priority', operator: '==', value: priority });
  }

  // Filter by date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  conditions.push({ type: 'where', field: 'reportedAt', operator: '>=', value: startDate });

  const reports = await FirestoreService.customQuery('monitoring_reports', [
    ...conditions,
    { type: 'orderBy', field: 'reportedAt', direction: 'desc' }
  ]);

  res.json({
    success: true,
    data: {
      reports,
      total: reports.length,
      summary: {
        total: reports.length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        pending: reports.filter(r => r.status === 'reported').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length
      }
    }
  });
}));

// @desc    Mark cleanup completion
// @route   PUT /api/monitoring/dumping-sites/cleanup
// @access  Private (Admin, ULB Admin, Supervisor)
router.put('/dumping-sites/cleanup', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { reportId, cleanupPhotos, notes } = req.body;

  if (!reportId) {
    res.status(400);
    throw new Error('Report ID is required');
  }

  const report = await FirestoreService.getById('monitoring_reports', reportId);
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  if (report.status === 'resolved') {
    res.status(400);
    throw new Error('Report already resolved');
  }

  // Update report status
  const updatedReport = await FirestoreService.update('monitoring_reports', reportId, {
    status: 'resolved',
    resolvedAt: new Date(),
    resolvedBy: req.user.id,
    cleanupPhotos: cleanupPhotos || [],
    resolutionNotes: notes
  });

  res.json({
    success: true,
    message: 'Cleanup marked as completed',
    data: updatedReport
  });
}));

// @desc    Report waste movement
// @route   POST /api/monitoring/waste-movement/report
// @access  Private
router.post('/waste-movement/report', protect, asyncHandler(async (req, res) => {
  const { error, value } = wasteMovementReportSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { location, description, photos, wasteType, estimatedQuantity } = value;

  // Create waste movement report
  const reportData = {
    reporterId: req.user.id,
    reporterType: req.user.role,
    location,
    description,
    photos,
    wasteType: wasteType || 'mixed',
    estimatedQuantity: estimatedQuantity || 0,
    status: 'reported',
    reportedAt: new Date(),
    resolvedAt: null
  };

  const report = await FirestoreService.create('waste_movement_reports', reportData);

  res.status(201).json({
    success: true,
    message: 'Waste movement reported successfully',
    data: {
      reportId: report.id,
      location,
      wasteType: report.wasteType,
      status: 'reported'
    }
  });
}));

// @desc    Get community reported issues
// @route   GET /api/monitoring/community-reports
// @access  Private
router.get('/community-reports', protect, asyncHandler(async (req, res) => {
  const { area, status, priority, days = 30 } = req.query;

  let conditions = [];

  if (area) {
    conditions.push({ type: 'where', field: 'area', operator: '==', value: area });
  }

  if (status) {
    conditions.push({ type: 'where', field: 'status', operator: '==', value: status });
  }

  if (priority) {
    conditions.push({ type: 'where', field: 'priority', operator: '==', value: priority });
  }

  // Filter by date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  conditions.push({ type: 'where', field: 'reportedAt', operator: '>=', value: startDate });

  const reports = await FirestoreService.customQuery('monitoring_reports', [
    ...conditions,
    { type: 'orderBy', field: 'reportedAt', direction: 'desc' }
  ]);

  // Get waste movement reports
  const wasteMovementReports = await FirestoreService.customQuery('waste_movement_reports', [
    { type: 'where', field: 'reportedAt', operator: '>=', value: startDate },
    { type: 'orderBy', field: 'reportedAt', direction: 'desc' }
  ]);

  res.json({
    success: true,
    data: {
      monitoringReports: reports,
      wasteMovementReports,
      summary: {
        totalReports: reports.length,
        totalWasteMovement: wasteMovementReports.length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        pending: reports.filter(r => r.status === 'reported').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length
      }
    }
  });
}));

// @desc    Submit area cleanliness score
// @route   POST /api/monitoring/area-cleanliness/score
// @access  Private
router.post('/area-cleanliness/score', protect, asyncHandler(async (req, res) => {
  const { error, value } = cleanlinessScoreSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { area, score, criteria, photos, notes } = value;

  // Create cleanliness assessment
  const assessmentData = {
    area,
    score,
    criteria,
    photos: photos || [],
    notes,
    assessedBy: req.user.id,
    assessedAt: new Date(),
    status: 'completed'
  };

  const assessment = await FirestoreService.create('cleanliness_assessments', assessmentData);

  // Update area cleanliness record
  const existingArea = await FirestoreService.customQuery('area_cleanliness', [
    { type: 'where', field: 'area', operator: '==', value: area }
  ]);

  if (existingArea.length > 0) {
    // Update existing record
    const areaRecord = existingArea[0];
    const totalAssessments = areaRecord.totalAssessments + 1;
    const averageScore = ((areaRecord.averageScore * areaRecord.totalAssessments) + score) / totalAssessments;

    await FirestoreService.update('area_cleanliness', areaRecord.id, {
      averageScore: Math.round(averageScore * 100) / 100,
      totalAssessments,
      lastAssessment: new Date(),
      lastScore: score
    });
  } else {
    // Create new area record
    await FirestoreService.create('area_cleanliness', {
      area,
      averageScore: score,
      totalAssessments: 1,
      lastAssessment: new Date(),
      lastScore: score,
      createdAt: new Date()
    });
  }

  res.status(201).json({
    success: true,
    message: 'Cleanliness score submitted successfully',
    data: {
      assessmentId: assessment.id,
      area,
      score,
      criteria
    }
  });
}));

// @desc    Get monitoring dashboard
// @route   GET /api/monitoring/dashboard
// @access  Private
router.get('/dashboard', protect, asyncHandler(async (req, res) => {
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

  const wasteMovementReports = await FirestoreService.customQuery('waste_movement_reports', [
    { type: 'where', field: 'reportedAt', operator: '>=', value: startDate },
    { type: 'orderBy', field: 'reportedAt', direction: 'desc' }
  ]);

  const cleanlinessAssessments = await FirestoreService.customQuery('cleanliness_assessments', [
    { type: 'where', field: 'assessedAt', operator: '>=', value: startDate },
    { type: 'orderBy', field: 'assessedAt', direction: 'desc' }
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

  const averageCleanlinessScore = cleanlinessAssessments.length > 0 ? 
    cleanlinessAssessments.reduce((sum, assessment) => sum + assessment.score, 0) / cleanlinessAssessments.length : 0;

  const dashboard = {
    summary: {
      totalReports,
      resolvedReports,
      pendingReports,
      inProgressReports,
      wasteMovementReports: wasteMovementReports.length,
      cleanlinessAssessments: cleanlinessAssessments.length,
      resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
    },
    reportsByType,
    reportsByPriority,
    cleanliness: {
      averageScore: Math.round(averageCleanlinessScore * 100) / 100,
      totalAssessments: cleanlinessAssessments.length
    },
    recentActivity: {
      reports: reports.slice(0, 10),
      wasteMovement: wasteMovementReports.slice(0, 10),
      cleanliness: cleanlinessAssessments.slice(0, 10)
    }
  };

  res.json({
    success: true,
    data: dashboard
  });
}));

// @desc    Get area cleanliness rankings
// @route   GET /api/monitoring/area-cleanliness/rankings
// @access  Private
router.get('/area-cleanliness/rankings', protect, asyncHandler(async (req, res) => {
  const { ulbId, limit = 10 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  const areaCleanliness = await FirestoreService.customQuery('area_cleanliness', [
    ...conditions,
    { type: 'orderBy', field: 'averageScore', direction: 'desc' },
    { type: 'limit', value: parseInt(limit) }
  ]);

  res.json({
    success: true,
    data: {
      rankings: areaCleanliness,
      total: areaCleanliness.length
    }
  });
}));

export default router;