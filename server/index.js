import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { attachUser } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

// CORS — allow Vite dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'posthub-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
}));

// Attach user context
app.use(attachUser);

// ─────────────────────────────────────────────
// Static Files — Uploads
// ─────────────────────────────────────────────

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 500MB.',
    });
  }

  // Multer file type error
  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(415).json({
      success: false,
      error: err.message,
    });
  }

  // Generic error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────

function start() {
  // Initialize database
  try {
    initDatabase();
    console.log('[Server] Database initialized');
  } catch (error) {
    console.error('[Server] Failed to initialize database:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║                                          ║');
    console.log('  ║   🚀 PostHub Server is running!          ║');
    console.log(`  ║   → http://localhost:${PORT}               ║`);
    console.log('  ║   → API: /api/health                     ║');
    console.log('  ║                                          ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
  });
}

start();

export default app;
