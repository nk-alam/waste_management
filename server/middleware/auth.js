import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler } from './errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verify user still exists and is active
      const user = await FirestoreService.getById('users', decoded.id);
      if (!user || !user.isActive) {
        res.status(401);
        throw new Error('User not found or inactive');
      }
      
      req.user = { ...decoded, ...user };
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied, required roles: ${roles.join(', ')}`);
    }

    next();
  };
};

// Admin only
export const admin = authorize('admin');

// ULB admin only
export const ulbAdmin = authorize('admin', 'ulb_admin');

// Supervisor and above
export const supervisor = authorize('admin', 'ulb_admin', 'supervisor');

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};