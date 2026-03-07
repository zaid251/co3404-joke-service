// src/routes/submit.js
const express  = require('express');
const axios    = require('axios');
const router   = express.Router();
const cache    = require('../cache');
const producer = require('../messaging/producer');

const JOKE_SERVICE_URL = process.env.JOKE_SERVICE_URL || 'http://localhost:3001';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /types:
 *   get:
 *     summary: Get all joke types (from joke service or file cache)
 *     tags: [Types]
 *     responses:
 *       200:
 *         description: List of joke types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 types:
 *                   type: array
 *                   items:
 *                     type: string
 *                 source:
 *                   type: string
 *                   example: live
 *       503:
 *         description: Joke service down and no cache available
 */
router.get('/types', async (req, res) => {
  try {
    // Try to fetch fresh types from joke service
    const response = await axios.get(`${JOKE_SERVICE_URL}/types`, { timeout: 3000 });
    const types    = response.data;

    // Always refresh cache when we get a live response
    cache.saveTypes(types);

    return res.json({ types, source: 'live' });
  } catch (err) {
    console.warn('[/types] Joke service unreachable, trying cache...');

    // Fall back to file cache
    const cached = cache.loadTypes();
    if (cached) {
      return res.json({ types: cached, source: 'cache' });
    }

    return res.status(503).json({
      error: 'Joke service is unavailable and no cache exists yet.',
      types: []
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /submit:
 *   post:
 *     summary: Submit a new joke to the queue
 *     tags: [Submit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewJoke'
 *     responses:
 *       202:
 *         description: Joke accepted and queued for moderation
 *       400:
 *         description: Missing required fields
 *       503:
 *         description: Message queue unavailable
 */
router.post('/submit', async (req, res) => {
  const { setup, punchline, type } = req.body;

  // Validate all fields present
  if (!setup || !punchline || !type) {
    return res.status(400).json({
      error: 'All fields are required: setup, punchline, type'
    });
  }

  if (setup.trim().length < 5) {
    return res.status(400).json({ error: 'Setup must be at least 5 characters' });
  }
  if (punchline.trim().length < 3) {
    return res.status(400).json({ error: 'Punchline must be at least 3 characters' });
  }

  const joke = {
    setup:     setup.trim(),
    punchline: punchline.trim(),
    type:      type.trim().toLowerCase(),
    submittedAt: new Date().toISOString()
  };

  try {
    await producer.publishJoke(joke);
    return res.status(202).json({
      message: 'Joke submitted successfully! It will appear after moderation.',
      joke
    });
  } catch (err) {
    console.error('[/submit] Queue error:', err.message);
    return res.status(503).json({
      error: 'Message queue unavailable. Please try again later.'
    });
  }
});

module.exports = router;
