import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const workerRegistrationSchema = Joi.object({
  personalInfo: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    emergencyContact: Joi.string().pattern(/^[0-9]{10}$/).required()
  }).required(),
  employeeId: Joi.string().required(),
  area: Joi.string().required(),
  role: Joi.string().valid('collector', 'supervisor', 'driver', 'facility_operator').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required()
  }).required(),
  ulbId: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  personalInfo: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    emergencyContact: Joi.string().pattern(/^[0-9]{10}$/).optional()
  }).optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    state: Joi.string().optional()
  }).optional()
});

const trainingPhaseSchema = Joi.object({
  phase: Joi.string().valid('phase1', 'phase2', 'phase3').required(),
  workerId: Joi.string().required()
});

const attendanceSchema = Joi.object({
  workerId: Joi.string().required(),
  date: Joi.date().required(),
  checkIn: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  checkOut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  status: Joi.string().valid('present', 'absent', 'half_day', 'late').required(),
  notes: Joi.string().optional()
});

// @desc    Register new waste worker
// @route   POST /api/workers/register
// @access  Private (Admin, ULB Admin)
router.post('/register', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = workerRegistrationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { personalInfo, employeeId, area, role, address, ulbId } = value;

  // Check if worker already exists with this employee ID
  const existingWorkers = await FirestoreService.customQuery('waste_workers', [
    { type: 'where', field: 'employeeId', operator: '==', value: employeeId }
  ]);

  if (existingWorkers.length > 0) {
    res.status(400);
    throw new Error('Worker already registered with this employee ID');
  }

  // Create worker record
  const workerData = {
    personalInfo,
    employeeId,
    area,
    role,
    address,
    ulbId,
    trainingPhases: {
      phase1: null,
      phase2: null,
      phase3: null
    },
    safetyGear: {
      helmet: false,
      gloves: false,
      uniform: false,
      boots: false,
      mask: false
    },
    attendance: [],
    performanceRating: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const worker = await FirestoreService.create('waste_workers', workerData);

  res.status(201).json({
    success: true,
    message: 'Waste worker registered successfully',
    worker: {
      id: worker.id,
      personalInfo: worker.personalInfo,
      employeeId: worker.employeeId,
      area: worker.area,
      role: worker.role
    }
  });
}));

// @desc    Get all workers
// @route   GET /api/workers/list
// @access  Private (Admin, ULB Admin, Supervisor)
router.get('/list', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, area, role, ulbId } = req.query;
  
  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }
  
  if (area) {
    conditions.push({ type: 'where', field: 'area', operator: '==', value: area });
  }
  
  if (role) {
    conditions.push({ type: 'where', field: 'role', operator: '==', value: role });
  }

  const workers = await FirestoreService.customQuery('waste_workers', [
    ...conditions,
    { type: 'orderBy', field: 'createdAt', direction: 'desc' },
    { type: 'limit', value: parseInt(limit) }
  ]);

  res.json({
    success: true,
    data: {
      workers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: workers.length
      }
    }
  });
}));

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const worker = await FirestoreService.getById('waste_workers', req.params.id);
  
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && worker.id !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json({
    success: true,
    data: worker
  });
}));

// @desc    Update worker profile
// @route   PUT /api/workers/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { error, value } = profileUpdateSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const workerId = req.user.role === 'worker' ? req.user.id : req.body.workerId;
  
  if (!workerId) {
    res.status(400);
    throw new Error('Worker ID required');
  }

  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && workerId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  const updatedWorker = await FirestoreService.update('waste_workers', workerId, value);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedWorker
  });
}));

// @desc    Enroll worker in training phase
// @route   POST /api/workers/training/phase/:phase
// @access  Private (Admin, ULB Admin, Supervisor)
router.post('/training/phase/:phase', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { phase } = req.params;
  const { workerId } = req.body;

  if (!['phase1', 'phase2', 'phase3'].includes(phase)) {
    res.status(400);
    throw new Error('Invalid training phase');
  }

  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Check if already enrolled in this phase
  if (worker.trainingPhases[phase]) {
    res.status(400);
    throw new Error(`Already enrolled in ${phase}`);
  }

  // Update training phase
  const updatedWorker = await FirestoreService.update('waste_workers', workerId, {
    trainingPhases: {
      ...worker.trainingPhases,
      [phase]: new Date()
    }
  });

  res.json({
    success: true,
    message: `Successfully enrolled in ${phase}`,
    data: updatedWorker.trainingPhases
  });
}));

// @desc    Complete training phase
// @route   PUT /api/workers/training/complete
// @access  Private (Admin, ULB Admin, Supervisor)
router.put('/training/complete', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { workerId, phase, score } = req.body;

  if (!['phase1', 'phase2', 'phase3'].includes(phase)) {
    res.status(400);
    throw new Error('Invalid training phase');
  }

  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  if (!worker.trainingPhases[phase]) {
    res.status(400);
    throw new Error(`Not enrolled in ${phase}`);
  }

  // Mark phase as completed
  const completedPhases = worker.completedPhases || [];
  if (!completedPhases.includes(phase)) {
    completedPhases.push(phase);
  }

  const updatedWorker = await FirestoreService.update('waste_workers', workerId, {
    completedPhases,
    trainingScores: {
      ...worker.trainingScores,
      [phase]: score || 0
    }
  });

  res.json({
    success: true,
    message: `${phase} completed successfully`,
    data: {
      completedPhases,
      score: score || 0
    }
  });
}));

// @desc    Get safety gear status
// @route   GET /api/workers/safety-gear/status/:workerId
// @access  Private
router.get('/safety-gear/status/:workerId', protect, asyncHandler(async (req, res) => {
  const workerId = req.params.workerId;
  
  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && workerId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json({
    success: true,
    data: worker.safetyGear
  });
}));

// @desc    Request safety equipment
// @route   POST /api/workers/safety-gear/request
// @access  Private
router.post('/safety-gear/request', protect, asyncHandler(async (req, res) => {
  const { workerId, equipment } = req.body;
  const targetWorkerId = req.user.role === 'worker' ? req.user.id : workerId;

  if (!equipment || !Array.isArray(equipment)) {
    res.status(400);
    throw new Error('Equipment list required');
  }

  const worker = await FirestoreService.getById('waste_workers', targetWorkerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Create safety gear request
  const gearRequest = await FirestoreService.create('safety_gear_requests', {
    workerId: targetWorkerId,
    equipment,
    status: 'pending',
    requestedAt: new Date(),
    ulbId: worker.ulbId
  });

  res.json({
    success: true,
    message: 'Safety gear request submitted successfully',
    data: {
      requestId: gearRequest.id,
      equipment,
      status: 'pending'
    }
  });
}));

// @desc    Get work schedule
// @route   GET /api/workers/schedule/:workerId
// @access  Private
router.get('/schedule/:workerId', protect, asyncHandler(async (req, res) => {
  const workerId = req.params.workerId;
  
  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && workerId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Get work schedule for the worker
  const schedules = await FirestoreService.customQuery('work_schedules', [
    { type: 'where', field: 'workerId', operator: '==', value: workerId },
    { type: 'orderBy', field: 'date', direction: 'asc' }
  ]);

  res.json({
    success: true,
    data: {
      worker: {
        id: worker.id,
        name: worker.personalInfo.name,
        area: worker.area,
        role: worker.role
      },
      schedules
    }
  });
}));

// @desc    Mark attendance
// @route   PUT /api/workers/attendance
// @access  Private
router.put('/attendance', protect, asyncHandler(async (req, res) => {
  const { error, value } = attendanceSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { workerId, date, checkIn, checkOut, status, notes } = value;
  const targetWorkerId = req.user.role === 'worker' ? req.user.id : workerId;

  const worker = await FirestoreService.getById('waste_workers', targetWorkerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Check if attendance already marked for this date
  const existingAttendance = worker.attendance.find(att => 
    att.date.toDate().toDateString() === new Date(date).toDateString()
  );

  if (existingAttendance) {
    res.status(400);
    throw new Error('Attendance already marked for this date');
  }

  // Add attendance record
  const attendanceRecord = {
    date: new Date(date),
    checkIn,
    checkOut,
    status,
    notes,
    markedAt: new Date()
  };

  const updatedAttendance = [...worker.attendance, attendanceRecord];
  
  const updatedWorker = await FirestoreService.update('waste_workers', targetWorkerId, {
    attendance: updatedAttendance
  });

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    data: attendanceRecord
  });
}));

// @desc    Get worker performance
// @route   GET /api/workers/performance/:workerId
// @access  Private (Admin, ULB Admin, Supervisor)
router.get('/performance/:workerId', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const workerId = req.params.workerId;
  
  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }

  // Calculate performance metrics
  const totalDays = worker.attendance.length;
  const presentDays = worker.attendance.filter(att => att.status === 'present').length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  const performance = {
    workerId: worker.id,
    name: worker.personalInfo.name,
    area: worker.area,
    role: worker.role,
    attendanceRate: Math.round(attendanceRate),
    performanceRating: worker.performanceRating,
    trainingProgress: {
      phase1: !!worker.trainingPhases.phase1,
      phase2: !!worker.trainingPhases.phase2,
      phase3: !!worker.trainingPhases.phase3
    },
    safetyGearStatus: worker.safetyGear,
    totalDaysWorked: presentDays,
    lastAttendance: worker.attendance[worker.attendance.length - 1]
  };

  res.json({
    success: true,
    data: performance
  });
}));

export default router;