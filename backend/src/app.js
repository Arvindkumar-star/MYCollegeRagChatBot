require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(u => u.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Check exact match or Vercel preview pattern
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/my-college-rag-chat-bot.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/chat'));   // /chat, /conversations, /messages, /suggested-questions
app.use('/admin/documents', require('./routes/admin/documents'));
app.use('/admin/collections', require('./routes/admin/collections'));
app.use('/admin/analytics', require('./routes/admin/analytics'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    db: stateMap[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  if (err.code === 11000) return res.status(400).json({ error: 'Duplicate entry' });
  if (err.message?.includes('Only PDF')) return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
