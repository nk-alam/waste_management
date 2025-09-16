import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const compostKitOrderSchema = Joi.object({
  citizenId: Joi.string().required(),
  kitType: Joi.string().valid('basic', 'premium', 'deluxe').required(),
  quantity: Joi.number().min(1).max(10).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('cash', 'online', 'upi', 'card').required()
});

const dustbinOrderSchema = Joi.object({
  citizenId: Joi.string().required(),
  dustbinType: Joi.string().valid('3_bin_set', 'wet_waste', 'dry_waste', 'hazardous_waste').required(),
  quantity: Joi.number().min(1).max(5).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    state: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('cash', 'online', 'upi', 'card').required()
});

const scrapSellSchema = Joi.object({
  sellerId: Joi.string().required(),
  itemType: Joi.string().valid('paper', 'plastic', 'metal', 'glass', 'electronics', 'other').required(),
  description: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().valid('kg', 'pieces', 'liters').required(),
  pricePerUnit: Joi.number().min(0).required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional()
  }).required(),
  photos: Joi.array().items(Joi.string()).optional(),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor').required()
});

// @desc    Get available compost kits
// @route   GET /api/shop/compost-kits
// @access  Public
router.get('/compost-kits', asyncHandler(async (req, res) => {
  const { type, minPrice, maxPrice } = req.query;

  let conditions = [
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ];

  if (type) {
    conditions.push({ type: 'where', field: 'type', operator: '==', value: type });
  }

  if (minPrice) {
    conditions.push({ type: 'where', field: 'price', operator: '>=', value: parseInt(minPrice) });
  }

  if (maxPrice) {
    conditions.push({ type: 'where', field: 'price', operator: '<=', value: parseInt(maxPrice) });
  }

  const kits = await FirestoreService.customQuery('compost_kits', [
    ...conditions,
    { type: 'orderBy', field: 'price', direction: 'asc' }
  ]);

  res.json({
    success: true,
    data: kits
  });
}));

// @desc    Order compost kit
// @route   POST /api/shop/compost-kits/order
// @access  Private
router.post('/compost-kits/order', protect, asyncHandler(async (req, res) => {
  const { error, value } = compostKitOrderSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { citizenId, kitType, quantity, deliveryAddress, paymentMethod } = value;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Get kit details
  const kit = await FirestoreService.customQuery('compost_kits', [
    { type: 'where', field: 'type', operator: '==', value: kitType },
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ]);

  if (kit.length === 0) {
    res.status(404);
    throw new Error('Compost kit not found');
  }

  const selectedKit = kit[0];

  // Check stock availability
  if (selectedKit.stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  // Create order
  const orderData = {
    citizenId,
    productType: 'compost_kit',
    productId: selectedKit.id,
    productName: selectedKit.name,
    kitType,
    quantity,
    unitPrice: selectedKit.price,
    totalPrice: selectedKit.price * quantity,
    deliveryAddress,
    paymentMethod,
    status: 'pending',
    orderedAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
  };

  const order = await FirestoreService.create('kit_orders', orderData);

  // Update stock
  await FirestoreService.update('compost_kits', selectedKit.id, {
    stock: selectedKit.stock - quantity
  });

  res.status(201).json({
    success: true,
    message: 'Compost kit order placed successfully',
    data: {
      orderId: order.id,
      productName: selectedKit.name,
      quantity,
      totalPrice: order.totalPrice,
      estimatedDelivery: order.estimatedDelivery,
      status: 'pending'
    }
  });
}));

// @desc    Get available dustbin types
// @route   GET /api/shop/dustbins
// @access  Public
router.get('/dustbins', asyncHandler(async (req, res) => {
  const { type, minPrice, maxPrice } = req.query;

  let conditions = [
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ];

  if (type) {
    conditions.push({ type: 'where', field: 'type', operator: '==', value: type });
  }

  if (minPrice) {
    conditions.push({ type: 'where', field: 'price', operator: '>=', value: parseInt(minPrice) });
  }

  if (maxPrice) {
    conditions.push({ type: 'where', field: 'price', operator: '<=', value: parseInt(maxPrice) });
  }

  const dustbins = await FirestoreService.customQuery('dustbins', [
    ...conditions,
    { type: 'orderBy', field: 'price', direction: 'asc' }
  ]);

  res.json({
    success: true,
    data: dustbins
  });
}));

// @desc    Order dustbin set
// @route   POST /api/shop/dustbins/order
// @access  Private
router.post('/dustbins/order', protect, asyncHandler(async (req, res) => {
  const { error, value } = dustbinOrderSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { citizenId, dustbinType, quantity, deliveryAddress, paymentMethod } = value;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Get dustbin details
  const dustbin = await FirestoreService.customQuery('dustbins', [
    { type: 'where', field: 'type', operator: '==', value: dustbinType },
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ]);

  if (dustbin.length === 0) {
    res.status(404);
    throw new Error('Dustbin type not found');
  }

  const selectedDustbin = dustbin[0];

  // Check stock availability
  if (selectedDustbin.stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  // Create order
  const orderData = {
    citizenId,
    productType: 'dustbin',
    productId: selectedDustbin.id,
    productName: selectedDustbin.name,
    dustbinType,
    quantity,
    unitPrice: selectedDustbin.price,
    totalPrice: selectedDustbin.price * quantity,
    deliveryAddress,
    paymentMethod,
    status: 'pending',
    orderedAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  };

  const order = await FirestoreService.create('kit_orders', orderData);

  // Update stock
  await FirestoreService.update('dustbins', selectedDustbin.id, {
    stock: selectedDustbin.stock - quantity
  });

  res.status(201).json({
    success: true,
    message: 'Dustbin order placed successfully',
    data: {
      orderId: order.id,
      productName: selectedDustbin.name,
      quantity,
      totalPrice: order.totalPrice,
      estimatedDelivery: order.estimatedDelivery,
      status: 'pending'
    }
  });
}));

// @desc    Get nearby recycling centers
// @route   GET /api/shop/recycling-centers
// @access  Public
router.get('/recycling-centers', asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, type } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  let conditions = [
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ];

  if (type) {
    conditions.push({ type: 'where', field: 'acceptedTypes', operator: 'array-contains', value: type });
  }

  const centers = await FirestoreService.customQuery('recycling_centers', conditions);

  // Filter by radius (simple distance calculation)
  const nearbyCenters = centers.filter(center => {
    const distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      center.location.lat,
      center.location.lng
    );
    return distance <= parseFloat(radius);
  });

  // Sort by distance
  nearbyCenters.sort((a, b) => {
    const distanceA = calculateDistance(parseFloat(lat), parseFloat(lng), a.location.lat, a.location.lng);
    const distanceB = calculateDistance(parseFloat(lat), parseFloat(lng), b.location.lat, b.location.lng);
    return distanceA - distanceB;
  });

  res.json({
    success: true,
    data: {
      centers: nearbyCenters,
      total: nearbyCenters.length,
      searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseFloat(radius)
    }
  });
}));

// @desc    Post scrap for selling
// @route   POST /api/shop/scrap/sell
// @access  Private
router.post('/scrap/sell', protect, asyncHandler(async (req, res) => {
  const { error, value } = scrapSellSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { sellerId, itemType, description, quantity, unit, pricePerUnit, location, photos, condition } = value;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && sellerId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Create scrap listing
  const scrapData = {
    sellerId,
    itemType,
    description,
    quantity,
    unit,
    pricePerUnit,
    totalPrice: pricePerUnit * quantity,
    location,
    photos: photos || [],
    condition,
    status: 'available',
    listedAt: new Date(),
    soldAt: null,
    buyerId: null
  };

  const scrap = await FirestoreService.create('scrap_listings', scrapData);

  res.status(201).json({
    success: true,
    message: 'Scrap item listed successfully',
    data: {
      listingId: scrap.id,
      itemType,
      quantity,
      unit,
      totalPrice: scrap.totalPrice,
      status: 'available'
    }
  });
}));

// @desc    Get scrap buyers nearby
// @route   GET /api/shop/scrap/buyers
// @access  Public
router.get('/scrap/buyers', asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, itemType } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  let conditions = [
    { type: 'where', field: 'isActive', operator: '==', value: true }
  ];

  if (itemType) {
    conditions.push({ type: 'where', field: 'acceptedTypes', operator: 'array-contains', value: itemType });
  }

  const buyers = await FirestoreService.customQuery('scrap_buyers', conditions);

  // Filter by radius
  const nearbyBuyers = buyers.filter(buyer => {
    const distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      buyer.location.lat,
      buyer.location.lng
    );
    return distance <= parseFloat(radius);
  });

  // Sort by distance
  nearbyBuyers.sort((a, b) => {
    const distanceA = calculateDistance(parseFloat(lat), parseFloat(lng), a.location.lat, a.location.lng);
    const distanceB = calculateDistance(parseFloat(lat), parseFloat(lng), b.location.lat, b.location.lng);
    return distanceA - distanceB;
  });

  res.json({
    success: true,
    data: {
      buyers: nearbyBuyers,
      total: nearbyBuyers.length,
      searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseFloat(radius)
    }
  });
}));

// @desc    Get available scrap listings
// @route   GET /api/shop/scrap/listings
// @access  Public
router.get('/scrap/listings', asyncHandler(async (req, res) => {
  const { itemType, minPrice, maxPrice, condition, lat, lng, radius = 10 } = req.query;

  let conditions = [
    { type: 'where', field: 'status', operator: '==', value: 'available' }
  ];

  if (itemType) {
    conditions.push({ type: 'where', field: 'itemType', operator: '==', value: itemType });
  }

  if (condition) {
    conditions.push({ type: 'where', field: 'condition', operator: '==', value: condition });
  }

  if (minPrice) {
    conditions.push({ type: 'where', field: 'totalPrice', operator: '>=', value: parseFloat(minPrice) });
  }

  if (maxPrice) {
    conditions.push({ type: 'where', field: 'totalPrice', operator: '<=', value: parseFloat(maxPrice) });
  }

  const listings = await FirestoreService.customQuery('scrap_listings', [
    ...conditions,
    { type: 'orderBy', field: 'listedAt', direction: 'desc' }
  ]);

  let filteredListings = listings;

  // Filter by radius if location provided
  if (lat && lng) {
    filteredListings = listings.filter(listing => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        listing.location.lat,
        listing.location.lng
      );
      return distance <= parseFloat(radius);
    });
  }

  res.json({
    success: true,
    data: {
      listings: filteredListings,
      total: filteredListings.length,
      filters: {
        itemType,
        minPrice,
        maxPrice,
        condition,
        radius: lat && lng ? parseFloat(radius) : null
      }
    }
  });
}));

// @desc    Get user orders
// @route   GET /api/shop/orders/:citizenId
// @access  Private
router.get('/orders/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;
  const { status } = req.query;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'ulb_admin' && citizenId !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }

  let conditions = [
    { type: 'where', field: 'citizenId', operator: '==', value: citizenId }
  ];

  if (status) {
    conditions.push({ type: 'where', field: 'status', operator: '==', value: status });
  }

  const orders = await FirestoreService.customQuery('kit_orders', [
    ...conditions,
    { type: 'orderBy', field: 'orderedAt', direction: 'desc' }
  ]);

  res.json({
    success: true,
    data: {
      orders,
      total: orders.length,
      summary: {
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      }
    }
  });
}));

// @desc    Update order status
// @route   PUT /api/shop/orders/:orderId/status
// @access  Private (Admin, ULB Admin)
router.put('/orders/:orderId/status', protect, authorize('admin', 'ulb_admin'), asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;

  if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const order = await FirestoreService.getById('kit_orders', orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const updatedOrder = await FirestoreService.update('kit_orders', orderId, {
    status,
    statusUpdatedAt: new Date(),
    statusUpdatedBy: req.user.id,
    statusNotes: notes
  });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: updatedOrder
  });
}));

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router;