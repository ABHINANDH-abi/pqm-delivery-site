import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '4000'), 10),
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  cors: {
    origins: optionalEnv('CORS_ORIGINS', 'http://localhost:5173').split(',').map((o) => o.trim()),
  },

  // Future integrations — will throw if not set when those stages are implemented
  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
    apiKey: process.env['CLOUDINARY_API_KEY'],
    apiSecret: process.env['CLOUDINARY_API_SECRET'],
  },

  razorpay: {
    keyId: process.env['RAZORPAY_KEY_ID'],
    keySecret: process.env['RAZORPAY_KEY_SECRET'],
    webhookSecret: process.env['RAZORPAY_WEBHOOK_SECRET'],
  },

  firebase: {
    projectId: process.env['FIREBASE_PROJECT_ID'],
    privateKey: process.env['FIREBASE_PRIVATE_KEY'],
    clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
  },

  googleMaps: {
    apiKey: process.env['GOOGLE_MAPS_API_KEY'],
  },
} as const;
