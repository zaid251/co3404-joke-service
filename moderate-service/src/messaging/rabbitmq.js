// src/messaging/rabbitmq.js
// ─── Moderate Service RabbitMQ Handler ───────────────────────────────────────
// Consumer: reads jokes from 'submit' queue
// Producer: sends approved jokes to 'moderated' queue
// Subscriber: listens for 'type_update' events to keep types cache in sync

const amqp = require('amqplib');
const fs   = require('fs');
const path = require('path');

const RABBITMQ_URL    = process.env.RABBITMQ_URL    || 'amqp://guest:guest@localhost:5672';
const SUBMIT_QUEUE    = process.env.SUBMIT_QUEUE    || 'submit';
const MODERATED_QUEUE = process.env.MODERATED_QUEUE || 'moderated';
const TYPE_EXCHANGE   = 'type_update_exchange';
const CACHE_PATH      = './cache/types.json';

let channel;
let pendingJoke = null; // holds the current joke being moderated + its msg ref

async function connectWithRetry(retries = 15, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel    = await conn.createChannel();

      // Declare queues
      await channel.assertQueue(SUBMIT_QUEUE,    { durable: true });
      await channel.assertQueue(MODERATED_QUEUE, { durable: true });

      // Set up type_update fanout subscriber
      await channel.assertExchange(TYPE_EXCHANGE, 'fanout', { durable: true });
      const { queue: typeQ } = await channel.assertQueue('mod_type_update', { durable: true });
      await channel.bindQueue(typeQ, TYPE_EXCHANGE, '');

      // Listen for type_update events → refresh cache
      channel.consume(typeQ, (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          console.log('[Moderate] type_update event received:', event);
          channel.ack(msg);
          // Signal that cache needs refresh — will be fetched fresh on next /types call
          global.typesCacheStale = true;
        } catch (err) {
          channel.nack(msg, false, false);
        }
      });

      // Process one joke at a time
      channel.prefetch(1);

      conn.on('error', err => console.error('[Moderate RabbitMQ] Error:', err.message));
      conn.on('close', () => {
        console.warn('[Moderate RabbitMQ] Closed — retrying...');
        setTimeout(() => connectWithRetry(), 5000);
      });

      console.log('[Moderate RabbitMQ] Connected successfully');
      return;
    } catch (err) {
      console.warn(`[Moderate RabbitMQ] Attempt ${i + 1}/${retries} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('[Moderate RabbitMQ] Could not connect after retries');
}

// ── Get next joke from submit queue ──────────────────────────────────────────
async function getNextJoke() {
  if (!channel) return null;

  // If there's already a pending joke being moderated, return it
  if (pendingJoke) return pendingJoke.data;

  try {
    const msg = await channel.get(SUBMIT_QUEUE, { noAck: false });
    if (!msg) return null;

    const joke = JSON.parse(msg.content.toString());
    pendingJoke = { msg, data: joke };
    console.log('[Moderate] Joke fetched from queue:', joke);
    return joke;
  } catch (err) {
    console.error('[Moderate] Error fetching joke:', err.message);
    return null;
  }
}

// ── Approve and forward joke to moderated queue ───────────────────────────────
async function approveJoke(joke) {
  if (!channel) throw new Error('RabbitMQ not connected');

  const message = Buffer.from(JSON.stringify({
    ...joke,
    moderatedAt: new Date().toISOString()
  }));

  channel.sendToQueue(MODERATED_QUEUE, message, { persistent: true });
  console.log('[Moderate] ✅ Joke approved and sent to moderated queue:', joke);

  // Acknowledge the original submit message
  if (pendingJoke) {
    channel.ack(pendingJoke.msg);
    pendingJoke = null;
  }
}

// ── Reject joke (nack without requeue) ────────────────────────────────────────
async function rejectJoke() {
  if (pendingJoke) {
    channel.nack(pendingJoke.msg, false, false); // discard
    console.log('[Moderate] ❌ Joke rejected and discarded');
    pendingJoke = null;
  }
}

// ── Load types from cache file ────────────────────────────────────────────────
function loadTypesCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[Moderate Cache] Failed to load:', err.message);
  }
  return [];
}

// ── Save types to cache file ──────────────────────────────────────────────────
function saveTypesCache(types) {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(types, null, 2));
  } catch (err) {
    console.error('[Moderate Cache] Failed to save:', err.message);
  }
}

function getStatus() { return !!channel; }

module.exports = {
  connectWithRetry,
  getNextJoke,
  approveJoke,
  rejectJoke,
  loadTypesCache,
  saveTypesCache,
  getStatus
};
