import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateToken, generateRefreshToken, hashPassword, comparePassword, protect } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'ulb_admin', 'supervisor', 'citizen', 'worker', 'champion').required(),
  personalInfo: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
      state: Joi.string().optional()
    }).optional()
  }).optional()
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { email, password } = value;

  // Find user by email
  const users = await FirestoreService.customQuery('users', [
    { type: 'where', field: 'email', operator: '==', value: email }
  ]);

  if (users.length === 0) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const user = users[0];

  // Check if user is active
  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is deactivated');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Update last login
  await FirestoreService.update('users', user.id, {
    lastLogin: new Date()
  });

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    },
    token,
    refreshToken
  });
}));

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { name, email, password, role, personalInfo } = value;

  // Check if user already exists
  const existingUsers = await FirestoreService.customQuery('users', [
    { type: 'where', field: 'email', operator: '==', value: email }
  ]);

  if (existingUsers.length > 0) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const userData = {
    name,
    email,
    password: hashedPassword,
    role,
    personalInfo: personalInfo || {},
    isActive: true,
    permissions: getDefaultPermissions(role),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const user = await FirestoreService.create('users', userData);

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  res.status(201).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    token,
    refreshToken
  });
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token required');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Verify user still exists
    const user = await FirestoreService.getById('users', decoded.id);
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions || []
    }
  });
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, asyncHandler(async (req, res) => {
  // In a more sophisticated system, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
  const permissions = {
    admin: ['all'],
    ulb_admin: ['citizens', 'workers', 'facilities', 'collection', 'monitoring', 'analytics'],
    supervisor: ['citizens', 'workers', 'monitoring'],
    citizen: ['profile', 'training', 'reports'],
    worker: ['profile', 'schedule', 'attendance'],
    champion: ['monitoring', 'reports', 'citizens']
  };

  return permissions[role] || [];
}

export default router;