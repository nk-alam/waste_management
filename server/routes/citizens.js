import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const citizenRegistrationSchema = Joi.object({
  personalInfo: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required()
  }).required(),
  aadhaar: Joi.string().pattern(/^[0-9]{12}$/).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required(),
    ward: Joi.string().optional()
  }).required(),
  ulbId: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  personalInfo: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional()
  }).optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    state: Joi.string().optional(),
    ward: Joi.string().optional()
  }).optional()
});

const trainingEnrollmentSchema = Joi.object({
  module: Joi.string().valid('basic', 'advanced', 'certification').required(),
  citizenId: Joi.string().required()
});

// @desc    Register new citizen
// @route   POST /api/citizens/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = citizenRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { personalInfo, aadhaar, address, ulbId } = value;

  // Check if citizen already exists with this Aadhaar
  const existingCitizens = await FirestoreService.customQuery('citizens', [
    { type: 'where', field: 'aadhaar', operator: '==', value: aadhaar }
  ]);

  if (existingCitizens.length > 0) {
    res.status(400);
    throw new Error('Citizen already registered with this Aadhaar number');
  }

  // Create citizen record
  const citizenData = {
    personalInfo,
    aadhaar,
    address,
    ulbId,
    trainingStatus: {
      completed: false,
      modules: [],
      certificate: null,
      enrolledAt: null,
      completedAt: null
    },
    kitsReceived: {
      dustbins: null,
      compostKit: null
    },
    segregationCompliance: {
      score: 0,
      violations: [],
      lastAssessment: null
    },
    rewardPoints: 0,
    penaltyHistory: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const citizen = await FirestoreService.create('citizens', citizenData);

  res.status(201).json({
    success: true,
    message: 'Citizen registered successfully',
    citizen: {
      id: citizen.id,
      personalInfo: citizen.personalInfo,
      aadhaar: citizen.aadhaar,
      address: citizen.address,
      trainingStatus: citizen.trainingStatus
    }
  });
}));

// @desc    Get all citizens
// @route   GET /api/citizens
// @access  Private (Admin, ULB Admin, Supervisor)
router.get('/', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, ulbId, ward, search } = req.query;
  
  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }
  
  if (ward) {
    conditions.push({ type: 'where', field: 'address.ward', operator: '==', value: ward });
  }

  const citizens = await FirestoreService.customQuery('citizens', [
    ...conditions,
    { type: 'orderBy', field: 'createdAt', direction: 'desc' },
    { type: 'limit', value: parseInt(limit) }
  ]);

  // Simple search filter (in production, use Algolia or similar)
  let filteredCitizens = citizens;
  if (search) {
    filteredCitizens = citizens.filter(citizen => 
      citizen.personalInfo.name.toLowerCase().includes(search.toLowerCase()) ||
      citizen.aadhaar.includes(search) ||
      citizen.address.city.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json({
    success: true,
    data: {
      citizens: filteredCitizens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredCitizens.length
      }
    }
  });
}));

// @desc    Get citizen by ID
// @route   GET /api/citizens/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const citizen = await FirestoreService.getById('citizens', req.params.id);
  
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Check if user has permission to view this citizen
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizen.id !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json({
    success: true,
    data: citizen
  });
}));

// @desc    Update citizen profile
// @route   PUT /api/citizens/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { error, value } = profileUpdateSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const citizenId = req.user.role === 'citizen' ? req.user.id : req.body.citizenId;
  
  if (!citizenId) {
    res.status(400);
    throw new Error('Citizen ID required');
  }

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  const updatedCitizen = await FirestoreService.update('citizens', citizenId, value);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedCitizen
  });
}));

// @desc    Enroll citizen in training
// @route   POST /api/citizens/training/enroll
// @access  Private
router.post('/training/enroll', protect, asyncHandler(async (req, res) => {
  const { error, value } = trainingEnrollmentSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { module, citizenId } = value;
  const targetCitizenId = req.user.role === 'citizen' ? req.user.id : citizenId;

  const citizen = await FirestoreService.getById('citizens', targetCitizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Check if already enrolled in this module
  if (citizen.trainingStatus.modules.includes(module)) {
    res.status(400);
    throw new Error('Already enrolled in this training module');
  }

  // Update training status
  const updatedModules = [...citizen.trainingStatus.modules, module];
  const updatedCitizen = await FirestoreService.update('citizens', targetCitizenId, {
    trainingStatus: {
      ...citizen.trainingStatus,
      modules: updatedModules,
      enrolledAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Successfully enrolled in training',
    data: updatedCitizen.trainingStatus
  });
}));

// @desc    Mark training module completion
// @route   PUT /api/citizens/training/complete
// @access  Private
router.put('/training/complete', protect, asyncHandler(async (req, res) => {
  const { module, citizenId, score } = req.body;
  const targetCitizenId = req.user.role === 'citizen' ? req.user.id : citizenId;

  if (!module) {
    res.status(400);
    throw new Error('Training module required');
  }

  const citizen = await FirestoreService.getById('citizens', targetCitizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Check if enrolled in this module
  if (!citizen.trainingStatus.modules.includes(module)) {
    res.status(400);
    throw new Error('Not enrolled in this training module');
  }

  // Mark as completed
  const completedModules = citizen.trainingStatus.completedModules || [];
  if (!completedModules.includes(module)) {
    completedModules.push(module);
  }

  const isAllModulesCompleted = ['basic', 'advanced', 'certification'].every(m => completedModules.includes(m));
  
  const updatedCitizen = await FirestoreService.update('citizens', targetCitizenId, {
    trainingStatus: {
      ...citizen.trainingStatus,
      completed: isAllModulesCompleted,
      completedModules,
      completedAt: isAllModulesCompleted ? new Date() : citizen.trainingStatus.completedAt,
      score: score || citizen.trainingStatus.score
    }
  });

  // Award points for completion
  if (isAllModulesCompleted) {
    await FirestoreService.update('citizens', targetCitizenId, {
      rewardPoints: citizen.rewardPoints + 100
    });
  }

  res.json({
    success: true,
    message: 'Training module completed successfully',
    data: updatedCitizen.trainingStatus
  });
}));

// @desc    Get training status
// @route   GET /api/citizens/training/status/:citizenId
// @access  Private
router.get('/training/status/:citizenId', protect, asyncHandler(async (req, res) => {
  const citizenId = req.params.citizenId;
  
  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  res.json({
    success: true,
    data: citizen.trainingStatus
  });
}));

// @desc    Generate training certificate
// @route   POST /api/citizens/training/certificate
// @access  Private
router.post('/training/certificate', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.body;
  const targetCitizenId = req.user.role === 'citizen' ? req.user.id : citizenId;

  const citizen = await FirestoreService.getById('citizens', targetCitizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  if (!citizen.trainingStatus.completed) {
    res.status(400);
    throw new Error('Training not completed');
  }

  // Generate certificate ID
  const certificateId = `CERT-${citizen.aadhaar}-${Date.now()}`;
  
  const updatedCitizen = await FirestoreService.update('citizens', targetCitizenId, {
    trainingStatus: {
      ...citizen.trainingStatus,
      certificate: certificateId
    }
  });

  res.json({
    success: true,
    message: 'Certificate generated successfully',
    data: {
      certificateId,
      citizenName: citizen.personalInfo.name,
      completedAt: citizen.trainingStatus.completedAt,
      certificateUrl: `/api/citizens/certificate/${certificateId}`
    }
  });
}));

// @desc    Check dustbin kit eligibility
// @route   GET /api/citizens/dustbin-kit/eligibility/:citizenId
// @access  Private
router.get('/dustbin-kit/eligibility/:citizenId', protect, asyncHandler(async (req, res) => {
  const citizenId = req.params.citizenId;
  
  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  const eligibility = {
    isEligible: citizen.trainingStatus.completed && !citizen.kitsReceived.dustbins,
    reason: citizen.trainingStatus.completed 
      ? (citizen.kitsReceived.dustbins ? 'Already received' : 'Eligible')
      : 'Training not completed',
    trainingCompleted: citizen.trainingStatus.completed,
    alreadyReceived: !!citizen.kitsReceived.dustbins
  };

  res.json({
    success: true,
    data: eligibility
  });
}));

// @desc    Request dustbin kit
// @route   POST /api/citizens/dustbin-kit/request
// @access  Private
router.post('/dustbin-kit/request', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.body;
  const targetCitizenId = req.user.role === 'citizen' ? req.user.id : citizenId;

  const citizen = await FirestoreService.getById('citizens', targetCitizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  if (!citizen.trainingStatus.completed) {
    res.status(400);
    throw new Error('Training must be completed before requesting dustbin kit');
  }

  if (citizen.kitsReceived.dustbins) {
    res.status(400);
    throw new Error('Dustbin kit already received');
  }

  // Create kit request
  const kitRequest = await FirestoreService.create('kit_requests', {
    citizenId: targetCitizenId,
    kitType: 'dustbin',
    status: 'pending',
    requestedAt: new Date(),
    ulbId: citizen.ulbId
  });

  res.json({
    success: true,
    message: 'Dustbin kit request submitted successfully',
    data: {
      requestId: kitRequest.id,
      status: 'pending',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
}));

// @desc    Request compost kit
// @route   POST /api/citizens/compost-kit/request
// @access  Private
router.post('/compost-kit/request', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.body;
  const targetCitizenId = req.user.role === 'citizen' ? req.user.id : citizenId;

  const citizen = await FirestoreService.getById('citizens', targetCitizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  if (citizen.kitsReceived.compostKit) {
    res.status(400);
    throw new Error('Compost kit already received');
  }

  // Create kit request
  const kitRequest = await FirestoreService.create('kit_requests', {
    citizenId: targetCitizenId,
    kitType: 'compost',
    status: 'pending',
    requestedAt: new Date(),
    ulbId: citizen.ulbId
  });

  res.json({
    success: true,
    message: 'Compost kit request submitted successfully',
    data: {
      requestId: kitRequest.id,
      status: 'pending',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    }
  });
}));

export default router;