// src/server.js — Joke Microservice Entry Point
require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./swagger');
const db             = require('./db');
const { startConsumer } = require('./messaging/consumer');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── OpenAPI Docs ──────────────────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  customSiteTitle: 'Joke Service API Docs'
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'joke-service',
    db_mode: process.env.DB_MODE || 'MYSQL',
    timestamp: new Date().toISOString()
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/joke',  require('./routes/jokes')(db));
app.use('/types', require('./routes/types')(db));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    await db.connect();
    await startConsumer(db);
    app.listen(PORT, () => {
      console.log(`[Joke Service] Running on port ${PORT}`);
      console.log(`[Joke Service] DB Mode: ${process.env.DB_MODE || 'MYSQL'}`);
      console.log(`[Joke Service] Docs: http://localhost:${PORT}/docs`);
    });
  } catch (err) {
    console.error('[Joke Service] Fatal startup error:', err.message);
    process.exit(1);
  }
}

start();
