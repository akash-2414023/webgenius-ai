import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config, isApiKeyConfigured, isMongoConfigured } from './config/env.js';
import { connectToDatabase, isDatabaseConnected } from './db/connection.js';
import apiRoutes from './routes/api.js';

const app = express();

// Trust reverse proxy (critical on Render, Vercel, Heroku for secure HTTPS cookies and rate limiting)
app.set('trust proxy', 1);

// Security Headers (CSP disabled to allow sandboxed iframe execution & CDN preview styles)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Cookie Parser for HTTP-only authentication tokens
app.use(cookieParser());

// CORS configuration supporting credentials (cookies & auth headers)
const allowedOrigins = [
  config.clientOrigin,
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// High payload limit for code transfers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal Server Error' : err.message || 'Internal Server Error',
  });
});

// Initialize MongoDB connection pool in background without blocking server startup
if (isMongoConfigured()) {
  connectToDatabase().catch((err) => {
    console.warn('Initial MongoDB Atlas connection attempt failed:', err.message);
  });
} else {
  console.log('ℹ️ MONGODB_URI not configured. Database will connect once configured in server/.env or setup UI.');
}

const PORT = Number(process.env.PORT) || config.port || 5000;
const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log('--------------------------------------------------');
    console.log(`🚀 WebGenius AI Server running on http://${HOST}:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Gemini Key Configured: ${isApiKeyConfigured() ? '✅ YES' : '⚠️ NO (Configure in server/.env or setup UI)'}`);
    console.log(`🍃 MongoDB Atlas Status: ${isDatabaseConnected() ? '✅ Connected' : isMongoConfigured() ? '⏳ Connecting...' : '⚠️ Unconfigured'}`);
    console.log(`🤖 Target Model: ${config.geminiModel}`);
    console.log('--------------------------------------------------');
  });
}

export default app;
