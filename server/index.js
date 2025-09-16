import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import citizenRoutes from './routes/citizens.js';
import workerRoutes from './routes/workers.js';
import championRoutes from './routes/green-champions.js';
import wasteRoutes from './routes/waste.js';
import collectionRoutes from './routes/collection.js';
import facilityRoutes from './routes/facilities.js';
import monitoringRoutes from './routes/monitoring.js';
import incentiveRoutes from './routes/incentives.js';
import communityRoutes from './routes/community.js';
import ulbRoutes from './routes/ulb.js';
import shopRoutes from './routes/shop.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';

// Error handling middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Database schema initialization
import { DatabaseSchema } from './utils/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS: support multiple origins via FRONTEND_URLS (comma-separated) or single FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/green-champions', championRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/ulb', ulbRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from the React app build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Initialize database schema on startup
DatabaseSchema.initializeSchema().catch(console.error);

// In serverless (Vercel), export the Express app without starting a server
// Locally or in traditional servers, start listening
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Admin Panel: http://localhost:5173`);
  });
}

export default app;