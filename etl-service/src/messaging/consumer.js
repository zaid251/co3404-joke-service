// src/messaging/consumer.js
// ─── ETL Consumer ─────────────────────────────────────────────────────────────
// 1. Reads jokes from the 'moderated' queue (put there by moderate service)
// 2. Writes joke + type to database
// 3. If new type was added, publishes a type_update event (ECST pattern)
//    so ALL subscribers (submit, moderate) update their caches automatically

const amqp = require('amqplib');

const RABBITMQ_URL    = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const MODERATED_QUEUE = 'moderated';   // ETL reads from here
const SUBMIT_QUEUE    = 'submit';      // ETL also reads from submit directly (fallback)
const TYPE_EXCHANGE   = 'type_update_exchange'; // fanout exchange for type_update events

let channel;
let conn;

async function connectWithRetry(retries = 15, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      conn    = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();

      // ── Declare all queues and exchanges ──────────────────────────────────
      // submit queue (producer: submit service)
      await channel.assertQueue(SUBMIT_QUEUE, { durable: true });

      // moderated queue (producer: moderate service)
      await channel.assertQueue(MODERATED_QUEUE, { durable: true });

      // type_update fanout exchange (publisher: ETL)
      await channel.assertExchange(TYPE_EXCHANGE, 'fanout', { durable: true });

      // Process one message at a time
      channel.prefetch(1);

      console.log('[ETL RabbitMQ] Connected successfully');

      conn.on('error', (err) => {
        console.error('[ETL RabbitMQ] Connection error:', err.message);
      });
      conn.on('close', () => {
        console.warn('[ETL RabbitMQ] Connection closed — retrying in 5s...');
        setTimeout(() => connectWithRetry(), 5000);
      });

      return;
    } catch (err) {
      console.warn(`[ETL RabbitMQ] Attempt ${i + 1}/${retries} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('[ETL RabbitMQ] Could not connect after retries');
}

// ── Start consuming from moderated queue only ─────────────────────────────────
async function startConsuming(db) {
  // ONLY consume from 'moderated' queue (jokes approved by moderator)
  // Submit queue is consumed by moderate service only
  channel.consume(MODERATED_QUEUE, async (msg) => {
    if (!msg) return;
    await processJoke(msg, db, 'moderated');
  }, { noAck: false });

  console.log('[ETL] Consuming from moderated queue only');
  console.log('[ETL] Flow: Submit → Moderate → ETL → Database');
}

// ── Process a single joke message ─────────────────────────────────────────────
async function processJoke(msg, db, source) {
  let joke;
  try {
    joke = JSON.parse(msg.content.toString());
    console.log(`[ETL] Processing joke from [${source}]:`, joke);

    const { setup, punchline, type } = joke;

    if (!setup || !punchline || !type) {
      console.error('[ETL] Invalid joke payload — missing fields:', joke);
      channel.nack(msg, false, false); // discard bad message
      return;
    }

    // Check if this is a NEW type before inserting
    const isNewType = !(await db.typeExists(type));

    // ── Write to database ─────────────────────────────────────────────────
    await db.insertJoke(setup.trim(), punchline.trim(), type.trim().toLowerCase());

    // ── Acknowledge message (removes from queue) ──────────────────────────
    channel.ack(msg);
    console.log(`[ETL] ✅ Joke saved to DB successfully`);

    // ── Publish type_update event if new type was added (ECST pattern) ────
    if (isNewType) {
      await publishTypeUpdateEvent(type.trim().toLowerCase());
    }

  } catch (err) {
    console.error('[ETL] Error processing joke:', err.message);
    // nack and requeue once, then discard to avoid infinite loop
    channel.nack(msg, false, false);
  }
}

// ── Publish type_update event to all subscribers ──────────────────────────────
async function publishTypeUpdateEvent(newType) {
  try {
    const event = JSON.stringify({
      event:     'type_update',
      newType,
      timestamp: new Date().toISOString()
    });

    channel.publish(TYPE_EXCHANGE, '', Buffer.from(event), { persistent: true });
    console.log(`[ETL] 📡 type_update event published for new type: "${newType}"`);
  } catch (err) {
    console.error('[ETL] Failed to publish type_update event:', err.message);
  }
}

function getChannel() { return channel; }

module.exports = { connectWithRetry, startConsuming, getChannel };
