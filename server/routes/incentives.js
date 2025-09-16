import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const bulkGeneratorRewardSchema = Joi.object({
  generatorId: Joi.string().required(),
  rewardType: Joi.string().valid('segregation_compliance', 'waste_reduction', 'innovation', 'participation').required(),
  points: Joi.number().min(1).max(1000).required(),
  description: Joi.string().required(),
  period: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly').required()
});

const citizenPointsSchema = Joi.object({
  citizenId: Joi.string().required(),
  points: Joi.number().min(1).max(500).required(),
  reason: Joi.string().required(),
  category: Joi.string().valid('training', 'segregation', 'participation', 'innovation', 'referral').required()
});

const redemptionSchema = Joi.object({
  citizenId: Joi.string().required(),
  rewardId: Joi.string().required(),
  quantity: Joi.number().min(1).required()
});

const penaltyImpositionSchema = Joi.object({
  citizenId: Joi.string().required(),
  violationType: Joi.string().valid('non_segregation', 'illegal_dumping', 'missed_collection', 'other').required(),
  amount: Joi.number().min(0).required(),
  description: Joi.string().required(),
  evidence: Joi.array().items(Joi.string()).optional()
});

const penaltyPaymentSchema = Joi.object({
  penaltyId: Joi.string().required(),
  paymentMethod: Joi.string().valid('cash', 'online', 'upi', 'card').required(),
  transactionId: Joi.string().optional(),
  amount: Joi.number().min(0).required()
});

// @desc    Process segregation rewards for bulk generators
// @route   POST /api/incentives/bulk-generator/reward
// @access  Private (Admin, ULB Admin, Supervisor)
router.post('/bulk-generator/reward', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { error, value } = bulkGeneratorRewardSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { generatorId, rewardType, points, description, period } = value;

  // Verify bulk generator exists
  const generator = await FirestoreService.getById('bulk_generators', generatorId);
  if (!generator) {
    res.status(404);
    throw new Error('Bulk generator not found');
  }

  // Create reward record
  const rewardData = {
    generatorId,
    rewardType,
    points,
    description,
    period,
    awardedBy: req.user.id,
    awardedAt: new Date(),
    status: 'awarded'
  };

  const reward = await FirestoreService.create('incentive_rewards', rewardData);

  // Update generator's reward points
  const currentPoints = generator.rewardPoints || 0;
  await FirestoreService.update('bulk_generators', generatorId, {
    rewardPoints: currentPoints + points,
    lastReward: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Reward processed successfully',
    data: {
      rewardId: reward.id,
      generatorId,
      points,
      totalPoints: currentPoints + points
    }
  });
}));

// @desc    Get citizen reward points
// @route   GET /api/incentives/citizen/points/:citizenId
// @access  Private
router.get('/citizen/points/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

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

  // Get reward history
  const rewards = await FirestoreService.customQuery('incentive_rewards', [
    { type: 'where', field: 'citizenId', operator: '==', value: citizenId },
    { type: 'orderBy', field: 'awardedAt', direction: 'desc' }
  ]);

  // Get redemption history
  const redemptions = await FirestoreService.customQuery('point_redemptions', [
    { type: 'where', field: 'citizenId', operator: '==', value: citizenId },
    { type: 'orderBy', field: 'redeemedAt', direction: 'desc' }
  ]);

  const totalEarned = rewards.reduce((sum, reward) => sum + reward.points, 0);
  const totalRedeemed = redemptions.reduce((sum, redemption) => sum + redemption.pointsUsed, 0);
  const availablePoints = totalEarned - totalRedeemed;

  res.json({
    success: true,
    data: {
      citizenId,
      availablePoints,
      totalEarned,
      totalRedeemed,
      rewards: rewards.slice(0, 10),
      redemptions: redemptions.slice(0, 10)
    }
  });
}));

// @desc    Award points to citizen
// @route   POST /api/incentives/citizen/award
// @access  Private (Admin, ULB Admin, Supervisor)
router.post('/citizen/award', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { error, value } = citizenPointsSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { citizenId, points, reason, category } = value;

  // Verify citizen exists
  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Create reward record
  const rewardData = {
    citizenId,
    rewardType: 'citizen_reward',
    points,
    description: reason,
    category,
    awardedBy: req.user.id,
    awardedAt: new Date(),
    status: 'awarded'
  };

  const reward = await FirestoreService.create('incentive_rewards', rewardData);

  // Update citizen's reward points
  const currentPoints = citizen.rewardPoints || 0;
  await FirestoreService.update('citizens', citizenId, {
    rewardPoints: currentPoints + points,
    lastReward: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Points awarded successfully',
    data: {
      rewardId: reward.id,
      citizenId,
      points,
      totalPoints: currentPoints + points
    }
  });
}));

// @desc    Redeem reward points
// @route   POST /api/incentives/redeem
// @access  Private
router.post('/redeem', protect, asyncHandler(async (req, res) => {
  const { error, value } = redemptionSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { citizenId, rewardId, quantity } = value;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Verify citizen exists
  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Get available rewards
  const rewards = await FirestoreService.getById('available_rewards', rewardId);
  if (!rewards) {
    res.status(404);
    throw new Error('Reward not found');
  }

  const totalPointsRequired = rewards.pointsRequired * quantity;
  const availablePoints = citizen.rewardPoints || 0;

  if (availablePoints < totalPointsRequired) {
    res.status(400);
    throw new Error('Insufficient points for redemption');
  }

  if (rewards.stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock for this reward');
  }

  // Create redemption record
  const redemptionData = {
    citizenId,
    rewardId,
    rewardName: rewards.name,
    quantity,
    pointsUsed: totalPointsRequired,
    redeemedAt: new Date(),
    status: 'pending'
  };

  const redemption = await FirestoreService.create('point_redemptions', redemptionData);

  // Update citizen's points
  await FirestoreService.update('citizens', citizenId, {
    rewardPoints: availablePoints - totalPointsRequired
  });

  // Update reward stock
  await FirestoreService.update('available_rewards', rewardId, {
    stock: rewards.stock - quantity
  });

  res.status(201).json({
    success: true,
    message: 'Redemption successful',
    data: {
      redemptionId: redemption.id,
      citizenId,
      rewardName: rewards.name,
      quantity,
      pointsUsed: totalPointsRequired,
      remainingPoints: availablePoints - totalPointsRequired
    }
  });
}));

// @desc    Get available rewards
// @route   GET /api/incentives/rewards
// @access  Public
router.get('/rewards', asyncHandler(async (req, res) => {
  const { category, minPoints, maxPoints } = req.query;

  let conditions = [
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ];

  if (category) {
    conditions.push({ type: 'where', field: 'category', operator: '==', value: category });
  }

  if (minPoints) {
    conditions.push({ type: 'where', field: 'pointsRequired', operator: '>=', value: parseInt(minPoints) });
  }

  if (maxPoints) {
    conditions.push({ type: 'where', field: 'pointsRequired', operator: '<=', value: parseInt(maxPoints) });
  }

  const rewards = await FirestoreService.customQuery('available_rewards', [
    ...conditions,
    { type: 'orderBy', field: 'pointsRequired', direction: 'asc' }
  ]);

  res.json({
    success: true,
    data: rewards
  });
}));

// @desc    Impose penalty
// @route   POST /api/penalties/impose
// @access  Private (Admin, ULB Admin, Supervisor)
router.post('/penalties/impose', protect, authorize('admin', 'ulb_admin', 'supervisor'), asyncHandler(async (req, res) => {
  const { error, value } = penaltyImpositionSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { citizenId, violationType, amount, description, evidence } = value;

  // Verify citizen exists
  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    res.status(404);
    throw new Error('Citizen not found');
  }

  // Create penalty record
  const penaltyData = {
    citizenId,
    violationType,
    amount,
    description,
    evidence: evidence || [],
    imposedBy: req.user.id,
    imposedAt: new Date(),
    status: 'pending',
    paidAt: null
  };

  const penalty = await FirestoreService.create('penalties', penaltyData);

  // Update citizen's penalty history
  const updatedPenalties = [...(citizen.penaltyHistory || []), penalty.id];
  await FirestoreService.update('citizens', citizenId, {
    penaltyHistory: updatedPenalties
  });

  res.status(201).json({
    success: true,
    message: 'Penalty imposed successfully',
    data: {
      penaltyId: penalty.id,
      citizenId,
      violationType,
      amount,
      status: 'pending'
    }
  });
}));

// @desc    Get citizen penalty history
// @route   GET /api/penalties/citizen/:citizenId
// @access  Private
router.get('/penalties/citizen/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  const penalties = await FirestoreService.customQuery('penalties', [
    { type: 'where', field: 'citizenId', operator: '==', value: citizenId },
    { type: 'orderBy', field: 'imposedAt', direction: 'desc' }
  ]);

  const totalPenalties = penalties.length;
  const paidPenalties = penalties.filter(p => p.status === 'paid').length;
  const pendingPenalties = penalties.filter(p => p.status === 'pending').length;
  const totalAmount = penalties.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = penalties.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    data: {
      citizenId,
      penalties,
      summary: {
        totalPenalties,
        paidPenalties,
        pendingPenalties,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount
      }
    }
  });
}));

// @desc    Process penalty payment
// @route   PUT /api/penalties/payment
// @access  Private
router.put('/penalties/payment', protect, asyncHandler(async (req, res) => {
  const { error, value } = penaltyPaymentSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { penaltyId, paymentMethod, transactionId, amount } = value;

  const penalty = await FirestoreService.getById('penalties', penaltyId);
  if (!penalty) {
    res.status(404);
    throw new Error('Penalty not found');
  }

  if (penalty.status === 'paid') {
    res.status(400);
    throw new Error('Penalty already paid');
  }

  if (amount !== penalty.amount) {
    res.status(400);
    throw new Error('Payment amount does not match penalty amount');
  }

  // Update penalty status
  const updatedPenalty = await FirestoreService.update('penalties', penaltyId, {
    status: 'paid',
    paidAt: new Date(),
    paymentMethod,
    transactionId,
    paidBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Penalty payment processed successfully',
    data: updatedPenalty
  });
}));

// @desc    Suspend collection for violations
// @route   POST /api/penalties/waste-collection/suspend
// @access  Private (Admin, ULB Admin)
router.post('/penalties/waste-collection/suspend', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { householdId, reason, duration, penaltyAmount } = req.body;

  if (!householdId || !reason) {
    res.status(400);
    throw new Error('Household ID and reason are required');
  }

  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Create suspension record
  const suspensionData = {
    householdId,
    reason,
    duration: duration || 7, // days
    penaltyAmount: penaltyAmount || 0,
    suspendedBy: req.user.id,
    suspendedAt: new Date(),
    status: 'active',
    expiresAt: new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000)
  };

  const suspension = await FirestoreService.create('collection_suspensions', suspensionData);

  // Update household status
  await FirestoreService.update('households', householdId, {
    collectionSuspended: true,
    suspensionReason: reason,
    suspensionExpiresAt: suspensionData.expiresAt
  });

  res.status(201).json({
    success: true,
    message: 'Collection suspended successfully',
    data: {
      suspensionId: suspension.id,
      householdId,
      reason,
      duration: duration || 7,
      expiresAt: suspensionData.expiresAt
    }
  });
}));

// @desc    Get incentive statistics
// @route   GET /api/incentives/stats
// @access  Private (Admin, ULB Admin)
router.get('/stats', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  // Get rewards from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const rewards = await FirestoreService.customQuery('incentive_rewards', [
    { type: 'where', field: 'awardedAt', operator: '>=', value: startDate }
  ]);

  const penalties = await FirestoreService.customQuery('penalties', [
    { type: 'where', field: 'imposedAt', operator: '>=', value: startDate }
  ]);

  const redemptions = await FirestoreService.customQuery('point_redemptions', [
    { type: 'where', field: 'redeemedAt', operator: '>=', value: startDate }
  ]);

  // Calculate statistics
  const totalRewards = rewards.length;
  const totalPenalties = penalties.length;
  const totalRedemptions = redemptions.length;
  const totalPointsAwarded = rewards.reduce((sum, r) => sum + r.points, 0);
  const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.pointsUsed, 0);
  const totalPenaltyAmount = penalties.reduce((sum, p) => sum + p.amount, 0);
  const paidPenaltyAmount = penalties.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const stats = {
    summary: {
      totalRewards,
      totalPenalties,
      totalRedemptions,
      totalPointsAwarded,
      totalPointsRedeemed,
      totalPenaltyAmount,
      paidPenaltyAmount,
      pendingPenaltyAmount: totalPenaltyAmount - paidPenaltyAmount
    },
    rewardsByType: rewards.reduce((acc, reward) => {
      acc[reward.rewardType] = (acc[reward.rewardType] || 0) + 1;
      return acc;
    }, {}),
    penaltiesByType: penalties.reduce((acc, penalty) => {
      acc[penalty.violationType] = (acc[penalty.violationType] || 0) + 1;
      return acc;
    }, {}),
    recentActivity: {
      rewards: rewards.slice(0, 10),
      penalties: penalties.slice(0, 10),
      redemptions: redemptions.slice(0, 10)
    }
  };

  res.json({
    success: true,
    data: stats
  });
}));

export default router;