// src/server.js — ETL Microservice Entry Point
require('dotenv').config();

const express  = require('express');
const db       = require('./db');
const consumer = require('./messaging/consumer');

const app  = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// ── Health / alive endpoint ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'healthy',
    service:   'etl-service',
    db_mode:   process.env.DB_MODE || 'MYSQL',
    timestamp: new Date().toISOString()
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Connect to database
    await db.connect();

    // Connect to RabbitMQ and start consuming
    await consumer.connectWithRetry();
    await consumer.startConsuming(db);

    // Start HTTP server (just for health checks)
    app.listen(PORT, () => {
      console.log(`[ETL Service] Running on port ${PORT}`);
      console.log(`[ETL Service] DB Mode: ${process.env.DB_MODE || 'MYSQL'}`);
      console.log(`[ETL Service] Waiting for jokes on the moderated queue...`);
    });

  } catch (err) {
    console.error('[ETL Service] Fatal startup error:', err.message);
    process.exit(1);
  }
}

start();
