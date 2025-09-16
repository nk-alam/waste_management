import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const cleaningDayScheduleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  date: Joi.date().min('now').required(),
  area: Joi.string().required(),
  description: Joi.string().optional(),
  maxParticipants: Joi.number().min(1).max(500).default(100),
  organizer: Joi.string().required(),
  contactInfo: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().optional()
  }).required(),
  requirements: Joi.array().items(Joi.string()).optional(),
  ulbId: Joi.string().required()
});

const eventAttendanceSchema = Joi.object({
  eventId: Joi.string().required(),
  participantId: Joi.string().required(),
  attendanceType: Joi.string().valid('present', 'absent', 'late').required(),
  checkInTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  checkOutTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  notes: Joi.string().optional()
});

const governmentParticipationSchema = Joi.object({
  eventId: Joi.string().required(),
  employeeId: Joi.string().required(),
  department: Joi.string().required(),
  designation: Joi.string().required(),
  participationHours: Joi.number().min(0).max(24).required(),
  contribution: Joi.string().optional()
});

const awarenessCampaignSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().required(),
  targetAudience: Joi.string().valid('citizens', 'students', 'workers', 'all').required(),
  area: Joi.string().required(),
  startDate: Joi.date().min('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  organizer: Joi.string().required(),
  budget: Joi.number().min(0).optional(),
  materials: Joi.array().items(Joi.string()).optional(),
  ulbId: Joi.string().required()
});

// @desc    Schedule community cleaning day
// @route   POST /api/community/cleaning-day/schedule
// @access  Private
router.post('/cleaning-day/schedule', protect, asyncHandler(async (req, res) => {
  const { error, value } = cleaningDayScheduleSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { name, date, area, description, maxParticipants, organizer, contactInfo, requirements, ulbId } = value;

  // Create cleaning event
  const eventData = {
    name,
    type: 'cleaning',
    date: new Date(date),
    area,
    description,
    maxParticipants,
    organizer,
    contactInfo,
    requirements: requirements || [],
    ulbId,
    status: 'scheduled',
    participants: [],
    totalParticipants: 0,
    createdAt: new Date(),
    createdBy: req.user.id
  };

  const event = await FirestoreService.create('cleaning_events', eventData);

  res.status(201).json({
    success: true,
    message: 'Community cleaning day scheduled successfully',
    data: {
      eventId: event.id,
      name,
      date: event.date,
      area,
      maxParticipants,
      status: 'scheduled'
    }
  });
}));

// @desc    Get participants list
// @route   GET /api/community/cleaning-day/participants/:eventId
// @access  Private
router.get('/cleaning-day/participants/:eventId', protect, asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Get participant details
  const participants = [];
  for (const participantId of event.participants) {
    const participant = await FirestoreService.getById('citizens', participantId);
    if (participant) {
      participants.push({
        id: participant.id,
        name: participant.personalInfo.name,
        phone: participant.personalInfo.phone,
        address: participant.address
      });
    }
  }

  res.json({
    success: true,
    data: {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        area: event.area,
        maxParticipants: event.maxParticipants
      },
      participants,
      totalParticipants: participants.length,
      availableSlots: event.maxParticipants - participants.length
    }
  });
}));

// @desc    Mark participation attendance
// @route   PUT /api/community/cleaning-day/attendance
// @access  Private
router.put('/cleaning-day/attendance', protect, asyncHandler(async (req, res) => {
  const { error, value } = eventAttendanceSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { eventId, participantId, attendanceType, checkInTime, checkOutTime, notes } = value;

  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Create attendance record
  const attendanceData = {
    eventId,
    participantId,
    attendanceType,
    checkInTime,
    checkOutTime,
    notes,
    markedBy: req.user.id,
    markedAt: new Date()
  };

  const attendance = await FirestoreService.create('event_attendance', attendanceData);

  // Update event participant count if present
  if (attendanceType === 'present' && !event.participants.includes(participantId)) {
    await FirestoreService.update('cleaning_events', eventId, {
      participants: [...event.participants, participantId],
      totalParticipants: event.totalParticipants + 1
    });
  }

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    data: attendance
  });
}));

// @desc    Log government employee participation
// @route   POST /api/community/government/participation
// @access  Private (Admin, ULB Admin)
router.post('/government/participation', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = governmentParticipationSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { eventId, employeeId, department, designation, participationHours, contribution } = value;

  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Create government participation record
  const participationData = {
    eventId,
    employeeId,
    department,
    designation,
    participationHours,
    contribution,
    loggedBy: req.user.id,
    loggedAt: new Date(),
    status: 'verified'
  };

  const participation = await FirestoreService.create('government_participation', participationData);

  res.status(201).json({
    success: true,
    message: 'Government participation logged successfully',
    data: participation
  });
}));

// @desc    Get community participation statistics
// @route   GET /api/community/participation/stats
// @access  Private (Admin, ULB Admin)
router.get('/participation/stats', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { ulbId, area, days = 30 } = req.query;

  let conditions = [];
  
  if (ulbId) {
    conditions.push({ type: 'where', field: 'ulbId', operator: '==', value: ulbId });
  }
  
  if (area) {
    conditions.push({ type: 'where', field: 'area', operator: '==', value: area });
  }

  // Get events from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const events = await FirestoreService.customQuery('cleaning_events', [
    ...conditions,
    { type: 'where', field: 'date', operator: '>=', value: startDate }
  ]);

  const attendanceRecords = await FirestoreService.customQuery('event_attendance', [
    { type: 'where', field: 'markedAt', operator: '>=', value: startDate }
  ]);

  const governmentParticipation = await FirestoreService.customQuery('government_participation', [
    { type: 'where', field: 'loggedAt', operator: '>=', value: startDate }
  ]);

  // Calculate statistics
  const totalEvents = events.length;
  const totalParticipants = events.reduce((sum, event) => sum + event.totalParticipants, 0);
  const totalAttendance = attendanceRecords.length;
  const presentAttendance = attendanceRecords.filter(a => a.attendanceType === 'present').length;
  const totalGovernmentHours = governmentParticipation.reduce((sum, p) => sum + p.participationHours, 0);

  const stats = {
    summary: {
      totalEvents,
      totalParticipants,
      totalAttendance,
      presentAttendance,
      attendanceRate: totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0,
      totalGovernmentHours,
      governmentParticipants: governmentParticipation.length
    },
    eventsByArea: events.reduce((acc, event) => {
      acc[event.area] = (acc[event.area] || 0) + 1;
      return acc;
    }, {}),
    recentEvents: events.slice(0, 10),
    topParticipants: getTopParticipants(attendanceRecords)
  };

  res.json({
    success: true,
    data: stats
  });
}));

// @desc    Create awareness campaign
// @route   POST /api/community/awareness/campaign
// @access  Private (Admin, ULB Admin)
router.post('/awareness/campaign', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { error, value } = awarenessCampaignSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { title, description, targetAudience, area, startDate, endDate, organizer, budget, materials, ulbId } = value;

  // Create awareness campaign
  const campaignData = {
    title,
    description,
    targetAudience,
    area,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    organizer,
    budget: budget || 0,
    materials: materials || [],
    ulbId,
    status: 'planned',
    participants: [],
    totalParticipants: 0,
    createdAt: new Date(),
    createdBy: req.user.id
  };

  const campaign = await FirestoreService.create('awareness_campaigns', campaignData);

  res.status(201).json({
    success: true,
    message: 'Awareness campaign created successfully',
    data: {
      campaignId: campaign.id,
      title,
      targetAudience,
      area,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: 'planned'
    }
  });
}));

// @desc    Get community events
// @route   GET /api/community/events
// @access  Private
router.get('/events', protect, asyncHandler(async (req, res) => {
  const { type, area, status, days = 30 } = req.query;

  let conditions = [];

  if (type) {
    conditions.push({ type: 'where', field: 'type', operator: '==', value: type });
  }

  if (area) {
    conditions.push({ type: 'where', field: 'area', operator: '==', value: area });
  }

  if (status) {
    conditions.push({ type: 'where', field: 'status', operator: '==', value: status });
  }

  // Filter by date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const events = await FirestoreService.customQuery('cleaning_events', [
    ...conditions,
    { type: 'where', field: 'date', operator: '>=', value: startDate },
    { type: 'orderBy', field: 'date', direction: 'desc' }
  ]);

  const campaigns = await FirestoreService.customQuery('awareness_campaigns', [
    { type: 'where', field: 'startDate', operator: '>=', value: startDate },
    { type: 'orderBy', field: 'startDate', direction: 'desc' }
  ]);

  res.json({
    success: true,
    data: {
      cleaningEvents: events,
      awarenessCampaigns: campaigns,
      total: events.length + campaigns.length
    }
  });
}));

// @desc    Register for event
// @route   POST /api/community/events/:eventId/register
// @access  Private
router.post('/events/:eventId/register', protect, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { participantId } = req.body;

  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (event.status !== 'scheduled') {
    res.status(400);
    throw new Error('Event is not open for registration');
  }

  if (event.participants.length >= event.maxParticipants) {
    res.status(400);
    throw new Error('Event is full');
  }

  const targetParticipantId = participantId || req.user.id;

  if (event.participants.includes(targetParticipantId)) {
    res.status(400);
    throw new Error('Already registered for this event');
  }

  // Add participant to event
  await FirestoreService.update('cleaning_events', eventId, {
    participants: [...event.participants, targetParticipantId],
    totalParticipants: event.totalParticipants + 1
  });

  res.json({
    success: true,
    message: 'Successfully registered for event',
    data: {
      eventId,
      participantId: targetParticipantId,
      totalParticipants: event.totalParticipants + 1
    }
  });
}));

// @desc    Get event details
// @route   GET /api/community/events/:eventId
// @access  Private
router.get('/events/:eventId', protect, asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Get attendance records for this event
  const attendance = await FirestoreService.customQuery('event_attendance', [
    { type: 'where', field: 'eventId', operator: '==', value: eventId }
  ]);

  res.json({
    success: true,
    data: {
      event,
      attendance: {
        total: attendance.length,
        present: attendance.filter(a => a.attendanceType === 'present').length,
        absent: attendance.filter(a => a.attendanceType === 'absent').length,
        late: attendance.filter(a => a.attendanceType === 'late').length
      }
    }
  });
}));

// Helper function to get top participants
function getTopParticipants(attendanceRecords) {
  const participantCount = {};
  
  attendanceRecords.forEach(record => {
    if (record.attendanceType === 'present') {
      participantCount[record.participantId] = (participantCount[record.participantId] || 0) + 1;
    }
  });

  return Object.entries(participantCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([participantId, count]) => ({ participantId, eventCount: count }));
}

export default router;