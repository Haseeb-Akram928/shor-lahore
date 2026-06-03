import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/report.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import districtRoutes from './routes/district.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// ============ GLOBAL MIDDLEWARE ============
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Prevent huge payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiting (disabled in testing environment)
if (env.NODE_ENV !== 'test') {
  app.use('/api', globalLimiter);
}

// ============ ROUTES ============
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ShorLahore API is running 🗺️', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/users', userRoutes);

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ============ GLOBAL ERROR HANDLER ============
app.use(errorHandler);

export default app;
