// src/messaging/consumer.js
// Listens for type_update events from ETL and caches them locally
const amqp = require('amqplib');
const fs   = require('fs');
const path = require('path');

const CACHE_PATH    = process.env.TYPES_CACHE_PATH || '/app/cache/types.json';
const RABBITMQ_URL  = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const MODERATED_Q   = 'moderated';       // jokes moderated → ETL writes to DB
const TYPE_UPDATE_Q = 'joke_type_update'; // type_update events from ETL

let channel;

async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      console.log('[RabbitMQ] Joke service consumer connected');
      return conn;
    } catch (err) {
      console.warn(`[RabbitMQ] Attempt ${i + 1}/${retries} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('[RabbitMQ] Could not connect after retries');
}

async function startConsumer(db) {
  try {
    await connectWithRetry();

    // ── Listen for type_update events (pub/sub fanout) ──────────────────────
    await channel.assertExchange('type_update_exchange', 'fanout', { durable: true });
    const { queue } = await channel.assertQueue(TYPE_UPDATE_Q, { durable: true });
    await channel.bindQueue(queue, 'type_update_exchange', '');

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        console.log('[RabbitMQ] type_update event received:', data);
        // Refresh types cache from DB
        const types = await db.getTypes();
        saveCache(types);
        channel.ack(msg);
      } catch (err) {
        console.error('[RabbitMQ] Error processing type_update:', err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log('[RabbitMQ] Listening for type_update events');
  } catch (err) {
    console.error('[RabbitMQ] Consumer failed to start:', err.message);
    // Non-fatal — service still works without real-time type updates
  }
}

function saveCache(types) {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(types));
    console.log('[Cache] Types cache updated:', types);
  } catch (err) {
    console.error('[Cache] Failed to save cache:', err.message);
  }
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[Cache] Failed to load cache:', err.message);
  }
  return null;
}

module.exports = { startConsumer, saveCache, loadCache };
