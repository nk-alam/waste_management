import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// @desc    Get daily waste generation data
// @route   GET /api/analytics/waste-generation/daily
// @access  Private (Admin, ULB Admin)
router.get('/waste-generation/daily', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, area, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  // Get households
  const households = await FirestoreService.customQuery('households', conditions);
  
  // Get bulk generators
  const bulkGenerators = await FirestoreService.customQuery('bulk_generators', conditions);

  // Get pickup records from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const pickupRecords = await FirestoreService.customQuery('pickup_records', [
    { type: 'where', field: 'collectedAt', operator: '>=', value: startDate }
  ]);

  // Calculate daily waste generation
  const dailyData = {};
  const wasteTypes = ['wet', 'dry', 'hazardous', 'mixed'];

  for (let i = 0; i < parseInt(days); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    dailyData[dateStr] = {
      date: dateStr,
      wetWaste: 0,
      dryWaste: 0,
      hazardousWaste: 0,
      mixedWaste: 0,
      totalWaste: 0,
      totalPickups: 0
    };

    // Add pickup data for this date
    const dayPickups = pickupRecords.filter(pickup => {
      const pickupDate = pickup.collectedAt.toDate();
      return pickupDate.toISOString().split('T')[0] === dateStr;
    });

    dayPickups.forEach(pickup => {
      dailyData[dateStr].totalPickups++;
      dailyData[dateStr][`${pickup.wasteType}Waste`] += pickup.quantity || 0;
      dailyData[dateStr].totalWaste += pickup.quantity || 0;
    });
  }

  // Convert to array and sort by date
  const dailyArray = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate summary statistics
  const totalWaste = dailyArray.reduce((sum, day) => sum + day.totalWaste, 0);
  const averageDailyWaste = totalWaste / dailyArray.length;
  const peakWasteDay = dailyArray.reduce((max, day) => day.totalWaste > max.totalWaste ? day : max, dailyArray[0]);

  res.json({
    success: true,
    data: {
      dailyData: dailyArray,
      summary: {
        totalWaste: Math.round(totalWaste * 100) / 100,
        averageDailyWaste: Math.round(averageDailyWaste * 100) / 100,
        peakWasteDay,
        totalDays: dailyArray.length,
        totalPickups: dailyArray.reduce((sum, day) => sum + day.totalPickups, 0)
      },
      wasteDistribution: {
        wetWaste: Math.round(dailyArray.reduce((sum, day) => sum + day.wetWaste, 0) * 100) / 100,
        dryWaste: Math.round(dailyArray.reduce((sum, day) => sum + day.dryWaste, 0) * 100) / 100,
        hazardousWaste: Math.round(dailyArray.reduce((sum, day) => sum + day.hazardousWaste, 0) * 100) / 100,
        mixedWaste: Math.round(dailyArray.reduce((sum, day) => sum + day.mixedWaste, 0) * 100) / 100
      }
    }
  });
}));

// @desc    Get waste treatment efficiency metrics
// @route   GET /api/analytics/waste-treatment/efficiency
// @access  Private (Admin, ULB Admin)
router.get('/waste-treatment/efficiency', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, facilityType, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  if (facilityType) {
    conditions.push({ type: 'where', field: 'type', operator: '==', value: facilityType });
  }

  // Get facilities
  const facilities = await FirestoreService.customQuery('waste_facilities', conditions);

  // Get process logs from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const processLogs = await FirestoreService.customQuery('facility_process_logs', [
    { type: 'where', field: 'processedAt', operator: '>=', value: startDate }
  ]);

  // Calculate efficiency metrics for each facility
  const facilityEfficiency = facilities.map(facility => {
    const facilityLogs = processLogs.filter(log => log.facilityId === facility.id);
    
    const totalInput = facilityLogs.reduce((sum, log) => sum + log.inputQuantity, 0);
    const totalOutput = facilityLogs.reduce((sum, log) => sum + log.outputQuantity, 0);
    const averageEfficiency = facilityLogs.length > 0 ? 
      facilityLogs.reduce((sum, log) => sum + log.efficiency, 0) / facilityLogs.length : 0;

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      facilityType: facility.type,
      capacity: facility.capacity,
      currentLoad: facility.currentLoad,
      utilizationRate: facility.capacity > 0 ? (facility.currentLoad / facility.capacity) * 100 : 0,
      totalInput: Math.round(totalInput * 100) / 100,
      totalOutput: Math.round(totalOutput * 100) / 100,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      processCount: facilityLogs.length,
      lastProcessed: facilityLogs[0]?.processedAt || null
    };
  });

  // Calculate overall efficiency
  const totalInput = facilityEfficiency.reduce((sum, f) => sum + f.totalInput, 0);
  const totalOutput = facilityEfficiency.reduce((sum, f) => sum + f.totalOutput, 0);
  const overallEfficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

  res.json({
    success: true,
    data: {
      facilities: facilityEfficiency,
      overallEfficiency: Math.round(overallEfficiency * 100) / 100,
      totalInput: Math.round(totalInput * 100) / 100,
      totalOutput: Math.round(totalOutput * 100) / 100,
      summary: {
        totalFacilities: facilities.length,
        activeFacilities: facilities.filter(f => f.status === 'active').length,
        averageEfficiency: facilityEfficiency.length > 0 ? 
          Math.round(facilityEfficiency.reduce((sum, f) => sum + f.averageEfficiency, 0) / facilityEfficiency.length * 100) / 100 : 0
      }
    }
  });
}));

// @desc    Get citizen training completion rates
// @route   GET /api/analytics/citizen-training/completion
// @access  Private (Admin, ULB Admin)
router.get('/citizen-training/completion', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, area, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  if (area) {
    conditions.push({ type: 'where', field: 'address.ward', operator: '==', value: area });
  }

  // Get citizens
  const citizens = await FirestoreService.customQuery('citizens', conditions);

  // Get training enrollments from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const enrollments = await FirestoreService.customQuery('training_enrollments', [
    { type: 'where', field: 'enrolledAt', operator: '>=', value: startDate }
  ]);

  // Calculate training metrics
  const totalCitizens = citizens.length;
  const trainedCitizens = citizens.filter(c => c.trainingStatus?.completed).length;
  const completionRate = totalCitizens > 0 ? (trainedCitizens / totalCitizens) * 100 : 0;

  // Training by module
  const moduleStats = {
    basic: 0,
    advanced: 0,
    certification: 0
  };

  citizens.forEach(citizen => {
    if (citizen.trainingStatus?.completedModules) {
      citizen.trainingStatus.completedModules.forEach(module => {
        if (moduleStats.hasOwnProperty(module)) {
          moduleStats[module]++;
        }
      });
    }
  });

  // Recent enrollments
  const recentEnrollments = enrollments.slice(0, 10);

  res.json({
    success: true,
    data: {
      summary: {
        totalCitizens,
        trainedCitizens,
        completionRate: Math.round(completionRate * 100) / 100,
        untrainedCitizens: totalCitizens - trainedCitizens
      },
      moduleStats,
      recentEnrollments,
      trends: {
        dailyEnrollments: getDailyEnrollments(enrollments, parseInt(days)),
        completionTrend: getCompletionTrend(citizens, parseInt(days))
      }
    }
  });
}));

// @desc    Get source segregation compliance data
// @route   GET /api/analytics/segregation/compliance
// @access  Private (Admin, ULB Admin)
router.get('/segregation/compliance', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, area, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  if (area) {
    conditions.push({ type: 'where', field: 'address.ward', operator: '==', value: area });
  }

  // Get households
  const households = await FirestoreService.customQuery('households', conditions);
  
  // Get bulk generators
  const bulkGenerators = await FirestoreService.customQuery('bulk_generators', conditions);

  // Get violations from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const violations = await FirestoreService.customQuery('segregation_violations', [
    { type: 'where', field: 'reportedAt', operator: '>=', value: startDate }
  ]);

  // Calculate compliance metrics
  const totalHouseholds = households.length;
  const compliantHouseholds = households.filter(h => h.segregationStatus?.isCompliant).length;
  const householdComplianceRate = totalHouseholds > 0 ? (compliantHouseholds / totalHouseholds) * 100 : 0;

  const totalBulkGenerators = bulkGenerators.length;
  const compliantBulkGenerators = bulkGenerators.filter(b => b.complianceStatus?.isCompliant).length;
  const bulkGeneratorComplianceRate = totalBulkGenerators > 0 ? (compliantBulkGenerators / totalBulkGenerators) * 100 : 0;

  // Violations by type
  const violationsByType = violations.reduce((acc, violation) => {
    acc[violation.violationType] = (acc[violation.violationType] || 0) + 1;
    return acc;
  }, {});

  // Compliance by area
  const complianceByArea = {};
  households.forEach(household => {
    const area = household.address.ward || household.address.city;
    if (!complianceByArea[area]) {
      complianceByArea[area] = { total: 0, compliant: 0 };
    }
    complianceByArea[area].total++;
    if (household.segregationStatus?.isCompliant) {
      complianceByArea[area].compliant++;
    }
  });

  // Calculate compliance rates by area
  Object.keys(complianceByArea).forEach(area => {
    const data = complianceByArea[area];
    data.complianceRate = data.total > 0 ? (data.compliant / data.total) * 100 : 0;
  });

  res.json({
    success: true,
    data: {
      summary: {
        householdComplianceRate: Math.round(householdComplianceRate * 100) / 100,
        bulkGeneratorComplianceRate: Math.round(bulkGeneratorComplianceRate * 100) / 100,
        overallComplianceRate: Math.round(((householdComplianceRate + bulkGeneratorComplianceRate) / 2) * 100) / 100,
        totalViolations: violations.length
      },
      households: {
        total: totalHouseholds,
        compliant: compliantHouseholds,
        nonCompliant: totalHouseholds - compliantHouseholds
      },
      bulkGenerators: {
        total: totalBulkGenerators,
        compliant: compliantBulkGenerators,
        nonCompliant: totalBulkGenerators - compliantBulkGenerators
      },
      violationsByType,
      complianceByArea: Object.entries(complianceByArea).map(([area, data]) => ({
        area,
        total: data.total,
        compliant: data.compliant,
        complianceRate: Math.round(data.complianceRate * 100) / 100
      }))
    }
  });
}));

// @desc    Get collection efficiency metrics
// @route   GET /api/analytics/collection/efficiency
// @access  Private (Admin, ULB Admin)
router.get('/collection/efficiency', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
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

  const pickupRecords = await FirestoreService.customQuery('pickup_records', [
    { type: 'where', field: 'collectedAt', operator: '>=', value: startDate }
  ]);

  const rejections = await FirestoreService.customQuery('pickup_rejections', [
    { type: 'where', field: 'rejectedAt', operator: '>=', value: startDate }
  ]);

  const complaints = await FirestoreService.customQuery('collection_complaints', [
    { type: 'where', field: 'reportedAt', operator: '>=', value: startDate }
  ]);

  // Calculate efficiency metrics
  const totalPickups = pickupRecords.length;
  const totalRejections = rejections.length;
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  const totalWasteCollected = pickupRecords.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const averageQuality = pickupRecords.length > 0 ? 
    pickupRecords.reduce((sum, p) => {
      const qualityScore = { excellent: 4, good: 3, fair: 2, poor: 1 }[p.quality] || 0;
      return sum + qualityScore;
    }, 0) / pickupRecords.length : 0;

  const rejectionRate = totalPickups > 0 ? (totalRejections / (totalPickups + totalRejections)) * 100 : 0;
  const complaintResolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0;

  // Vehicle performance
  const vehiclePerformance = vehicles.map(vehicle => {
    const vehiclePickups = pickupRecords.filter(p => p.vehicleId === vehicle.id);
    const vehicleRejections = rejections.filter(r => r.vehicleId === vehicle.id);
    
    return {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      totalPickups: vehiclePickups.length,
      totalRejections: vehicleRejections.length,
      totalWasteCollected: vehiclePickups.reduce((sum, p) => sum + (p.quantity || 0), 0),
      efficiency: vehiclePickups.length > 0 ? 
        Math.round((vehiclePickups.length / (vehiclePickups.length + vehicleRejections.length)) * 100) : 0
    };
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalPickups,
        totalRejections,
        totalComplaints,
        resolvedComplaints,
        totalWasteCollected: Math.round(totalWasteCollected * 100) / 100,
        averageQuality: Math.round(averageQuality * 100) / 100,
        rejectionRate: Math.round(rejectionRate * 100) / 100,
        complaintResolutionRate: Math.round(complaintResolutionRate * 100) / 100
      },
      vehiclePerformance,
      trends: {
        dailyPickups: getDailyPickups(pickupRecords, parseInt(days)),
        qualityTrend: getQualityTrend(pickupRecords, parseInt(days))
      }
    }
  });
}));

// @desc    Get facility utilization reports
// @route   GET /api/analytics/facilities/utilization
// @access  Private (Admin, ULB Admin)
router.get('/facilities/utilization', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, facilityType, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }

  if (facilityType) {
    conditions.push({ type: 'where', field: 'type', operator: '==', value: facilityType });
  }

  // Get facilities
  const facilities = await FirestoreService.customQuery('waste_facilities', conditions);

  // Get intake records from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const intakeRecords = await FirestoreService.customQuery('waste_intake', [
    { type: 'where', field: 'receivedAt', operator: '>=', value: startDate }
  ]);

  // Calculate utilization for each facility
  const facilityUtilization = facilities.map(facility => {
    const facilityIntakes = intakeRecords.filter(intake => intake.facilityId === facility.id);
    const totalIntake = facilityIntakes.reduce((sum, intake) => sum + intake.quantity, 0);
    
    return {
      facilityId: facility.id,
      facilityName: facility.name,
      facilityType: facility.type,
      capacity: facility.capacity,
      currentLoad: facility.currentLoad,
      totalIntake: Math.round(totalIntake * 100) / 100,
      utilizationRate: facility.capacity > 0 ? (facility.currentLoad / facility.capacity) * 100 : 0,
      intakeRate: facility.capacity > 0 ? (totalIntake / facility.capacity) * 100 : 0,
      status: facility.status,
      lastIntake: facilityIntakes[0]?.receivedAt || null
    };
  });

  // Calculate overall utilization
  const totalCapacity = facilities.reduce((sum, f) => sum + f.capacity, 0);
  const totalCurrentLoad = facilities.reduce((sum, f) => sum + f.currentLoad, 0);
  const totalIntake = intakeRecords.reduce((sum, i) => sum + i.quantity, 0);
  const overallUtilization = totalCapacity > 0 ? (totalCurrentLoad / totalCapacity) * 100 : 0;

  res.json({
    success: true,
    data: {
      facilities: facilityUtilization,
      overall: {
        totalCapacity,
        totalCurrentLoad: Math.round(totalCurrentLoad * 100) / 100,
        totalIntake: Math.round(totalIntake * 100) / 100,
        overallUtilization: Math.round(overallUtilization * 100) / 100
      },
      summary: {
        totalFacilities: facilities.length,
        activeFacilities: facilities.filter(f => f.status === 'active').length,
        averageUtilization: facilityUtilization.length > 0 ? 
          Math.round(facilityUtilization.reduce((sum, f) => sum + f.utilizationRate, 0) / facilityUtilization.length * 100) / 100 : 0
      }
    }
  });
}));

// @desc    Get penalty collection revenue
// @route   GET /api/analytics/penalties/revenue
// @access  Private (Admin, ULB Admin)
router.get('/penalties/revenue', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, days = 30 } = req.query;

  // Get penalties from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const penalties = await FirestoreService.customQuery('penalties', [
    { type: 'where', field: 'imposedAt', operator: '>=', value: startDate }
  ]);

  // Calculate revenue metrics
  const totalPenalties = penalties.length;
  const paidPenalties = penalties.filter(p => p.status === 'paid');
  const pendingPenalties = penalties.filter(p => p.status === 'pending');

  const totalAmount = penalties.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = paidPenalties.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPenalties.reduce((sum, p) => sum + p.amount, 0);

  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Penalties by type
  const penaltiesByType = penalties.reduce((acc, penalty) => {
    acc[penalty.violationType] = (acc[penalty.violationType] || 0) + 1;
    return acc;
  }, {});

  // Revenue by type
  const revenueByType = penalties.reduce((acc, penalty) => {
    if (!acc[penalty.violationType]) {
      acc[penalty.violationType] = { count: 0, amount: 0, paidAmount: 0 };
    }
    acc[penalty.violationType].count++;
    acc[penalty.violationType].amount += penalty.amount;
    if (penalty.status === 'paid') {
      acc[penalty.violationType].paidAmount += penalty.amount;
    }
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      summary: {
        totalPenalties,
        paidPenalties: paidPenalties.length,
        pendingPenalties: pendingPenalties.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        collectionRate: Math.round(collectionRate * 100) / 100
      },
      penaltiesByType,
      revenueByType: Object.entries(revenueByType).map(([type, data]) => ({
        type,
        count: data.count,
        totalAmount: Math.round(data.amount * 100) / 100,
        paidAmount: Math.round(data.paidAmount * 100) / 100,
        collectionRate: data.amount > 0 ? Math.round((data.paidAmount / data.amount) * 100) / 100 : 0
      }))
    }
  });
}));

// @desc    Get incentive distribution stats
// @route   GET /api/analytics/incentives/distribution
// @access  Private (Admin, ULB Admin)
router.get('/incentives/distribution', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, days = 30 } = req.query;

  // Get incentives from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const incentives = await FirestoreService.customQuery('incentive_rewards', [
    { type: 'where', field: 'awardedAt', operator: '>=', value: startDate }
  ]);

  const redemptions = await FirestoreService.customQuery('point_redemptions', [
    { type: 'where', field: 'redeemedAt', operator: '>=', value: startDate }
  ]);

  // Calculate incentive metrics
  const totalIncentives = incentives.length;
  const totalPointsAwarded = incentives.reduce((sum, i) => sum + i.points, 0);
  const totalRedemptions = redemptions.length;
  const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.pointsUsed, 0);

  // Incentives by type
  const incentivesByType = incentives.reduce((acc, incentive) => {
    acc[incentive.rewardType] = (acc[incentive.rewardType] || 0) + 1;
    return acc;
  }, {});

  // Points by type
  const pointsByType = incentives.reduce((acc, incentive) => {
    if (!acc[incentive.rewardType]) {
      acc[incentive.rewardType] = { count: 0, points: 0 };
    }
    acc[incentive.rewardType].count++;
    acc[incentive.rewardType].points += incentive.points;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      summary: {
        totalIncentives,
        totalPointsAwarded,
        totalRedemptions,
        totalPointsRedeemed,
        redemptionRate: totalPointsAwarded > 0 ? (totalPointsRedeemed / totalPointsAwarded) * 100 : 0
      },
      incentivesByType,
      pointsByType: Object.entries(pointsByType).map(([type, data]) => ({
        type,
        count: data.count,
        points: data.points,
        averagePoints: data.count > 0 ? Math.round(data.points / data.count) : 0
      }))
    }
  });
}));

// Helper functions
function getDailyEnrollments(enrollments, days) {
  const dailyData = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
  }

  enrollments.forEach(enrollment => {
    const dateStr = enrollment.enrolledAt.toDate().toISOString().split('T')[0];
    if (dailyData.hasOwnProperty(dateStr)) {
      dailyData[dateStr]++;
    }
  });

  return Object.entries(dailyData).map(([date, count]) => ({ date, count }));
}

function getCompletionTrend(citizens, days) {
  // This is a simplified version - in reality, you'd track completion over time
  const totalCitizens = citizens.length;
  const completedCitizens = citizens.filter(c => c.trainingStatus?.completed).length;
  
  return {
    total: totalCitizens,
    completed: completedCitizens,
    completionRate: totalCitizens > 0 ? (completedCitizens / totalCitizens) * 100 : 0
  };
}

function getDailyPickups(pickups, days) {
  const dailyData = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
  }

  pickups.forEach(pickup => {
    const dateStr = pickup.collectedAt.toDate().toISOString().split('T')[0];
    if (dailyData.hasOwnProperty(dateStr)) {
      dailyData[dateStr]++;
    }
  });

  return Object.entries(dailyData).map(([date, count]) => ({ date, count }));
}

function getQualityTrend(pickups, days) {
  const qualityData = { excellent: 0, good: 0, fair: 0, poor: 0 };
  
  pickups.forEach(pickup => {
    if (qualityData.hasOwnProperty(pickup.quality)) {
      qualityData[pickup.quality]++;
    }
  });

  return qualityData;
}

export default router;