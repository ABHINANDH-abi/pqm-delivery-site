import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import https from 'https';
import http from 'http';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Module routers — each module is self-contained
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import categoryRoutes from './modules/categories/categories.routes';
import productRoutes from './modules/products/products.routes';
import orderRoutes from './modules/orders/orders.routes';
import addressRoutes from './modules/addresses/addresses.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import paymentRoutes from './modules/payments/payments.routes';
import adminRoutes from './modules/admin/admin.routes';
import notificationRoutes from './modules/notifications/notifications.routes';

const app = express();

// Trust reverse proxies (Vercel, Render, localtunnel, Cloudflare)
app.set('trust proxy', true);

// ─── Security middleware ──────────────────────────────────────────────────────

// Set standard security HTTP headers
app.use(helmet());

// CORS — allow mobile apps (no origin) and configured web origins
app.use(
  cors({
    origin: (_origin, callback) => {
      return callback(null, true); // Fully permissive for mobile apps & web dashboards
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Global rate limiter — skip rate limiting for localhost / dev
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.includes('127.0.0.1') ||
      req.hostname === 'localhost' ||
      req.hostname === '127.0.0.1'
    );
  },
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});
app.use(globalRateLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🔥 Qureshi Mandi Coimbatore Backend API v1.0.0 is Running!',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────

const API_PREFIX = '/api/v1';

app.get(API_PREFIX, (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Qureshi Mandi API v1 Endpoints Active',
    endpoints: [
      '/api/v1/auth/login',
      '/api/v1/products',
      '/api/v1/categories',
      '/api/v1/orders',
    ],
  });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/addresses`, addressRoutes);
app.use(`${API_PREFIX}/delivery`, deliveryRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested route does not exist.',
    },
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
// Must be registered last

app.use(errorHandler);

// ─── Keep-Alive Self Ping (Prevents Render Free Tier Hibernation) ─────────────

const RENDER_EXTERNAL_URL = process.env['RENDER_EXTERNAL_URL'] || 'https://qureshi-mandi-backend.onrender.com';

function startKeepAliveHeartbeat() {
  const TEN_MINUTES = 10 * 60 * 1000;
  setInterval(() => {
    const healthUrl = `${RENDER_EXTERNAL_URL}/health`;
    const protocol = healthUrl.startsWith('https') ? https : http;
    protocol
      .get(healthUrl, (res) => {
        console.log(`[KeepAlive] Heartbeat ping to ${healthUrl} status: ${res.statusCode}`);
      })
      .on('error', (err) => {
        console.warn(`[KeepAlive] Heartbeat ping error: ${err.message}`);
      });
  }, TEN_MINUTES);
}

// ─── Start server ─────────────────────────────────────────────────────────────

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`\n🚀 Server running in ${env.nodeEnv} mode`);
  console.log(`📡 Listening on http://0.0.0.0:${env.port} (all network interfaces)`);
  console.log(`🔍 Health check: http://localhost:${env.port}/health`);
  console.log(`📦 API base: http://localhost:${env.port}/api/v1\n`);

  startKeepAliveHeartbeat();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
