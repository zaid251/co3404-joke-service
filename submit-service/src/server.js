// src/server.js — Submit Microservice Entry Point
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const producer    = require('./messaging/producer');

const app  = express();
const PORT = process.env.PORT || 3002;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── OpenAPI Docs ──────────────────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  customSiteTitle: 'Submit Service API Docs'
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'healthy',
    service:   'submit-service',
    queue:     producer.getStatus() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', require('./routes/submit'));

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
  // Connect to RabbitMQ in background — service starts even if queue is down
  producer.connectWithRetry().catch(err => {
    console.warn('[Submit Service] RabbitMQ unavailable at startup:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`[Submit Service] Running on port ${PORT}`);
    console.log(`[Submit Service] Docs: http://localhost:${PORT}/docs`);
    console.log(`[Submit Service] Joke Service: ${process.env.JOKE_SERVICE_URL}`);
  });
}

start();
