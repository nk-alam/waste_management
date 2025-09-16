// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Determine HTTP status
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

  // Derive error code
  let code = 'INTERNAL_ERROR';
  if (statusCode === 400) code = 'VALIDATION_ERROR';
  if (statusCode === 401) code = 'UNAUTHORIZED';
  if (statusCode === 403) code = 'FORBIDDEN';
  if (statusCode === 404) code = 'NOT_FOUND';
  if (statusCode === 429) code = 'RATE_LIMITED';

  // Special cases
  if (err.name === 'JsonWebTokenError') code = 'UNAUTHORIZED';
  if (err.name === 'TokenExpiredError') code = 'UNAUTHORIZED';

  // Build details when available
  const details = err.details || (err.errors ? Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message || v])) : undefined);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Server Error',
      details
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};