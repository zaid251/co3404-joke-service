// src/messaging/producer.js
// Publishes new jokes to the RabbitMQ submit queue
const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const SUBMIT_QUEUE = 'submit';

let channel     = null;
let isConnected = false;

async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();

      // Make queue durable so it survives RabbitMQ restarts
      await channel.assertQueue(SUBMIT_QUEUE, { durable: true });

      // Also set up the type_update fanout exchange (for ECST pattern)
      await channel.assertExchange('type_update_exchange', 'fanout', { durable: true });

      isConnected = true;
      console.log('[RabbitMQ] Submit producer connected');

      // Handle connection errors gracefully
      conn.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
        isConnected = false;
      });
      conn.on('close', () => {
        console.warn('[RabbitMQ] Connection closed');
        isConnected = false;
      });

      return;
    } catch (err) {
      console.warn(`[RabbitMQ] Attempt ${i + 1}/${retries} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('[RabbitMQ] Could not connect — jokes will be queued locally');
}

async function publishJoke(joke) {
  if (!isConnected || !channel) {
    throw new Error('RabbitMQ not connected');
  }

  const message = Buffer.from(JSON.stringify(joke));

  // persistent: true ensures message survives broker restart
  channel.sendToQueue(SUBMIT_QUEUE, message, { persistent: true });
  console.log('[RabbitMQ] Joke published to submit queue:', joke);
}

function getStatus() {
  return isConnected;
}

module.exports = { connectWithRetry, publishJoke, getStatus };
