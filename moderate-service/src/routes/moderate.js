// src/routes/moderate.js
const express = require('express');
const router  = express.Router();
const mq      = require('../messaging/rabbitmq');

// ── Auth middleware — protects all moderate routes ────────────────────────────
function requireAuth(req, res, next) {
  if (!req.oidc || !req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorised — please log in' });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /moderate:
 *   get:
 *     summary: Get next joke from submit queue for moderation
 *     tags: [Moderate]
 *     security:
 *       - oidc: []
 *     responses:
 *       200:
 *         description: Next joke to moderate, or null if queue empty
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/PendingJoke'
 *                 - type: object
 *                   properties:
 *                     joke: { type: 'null' }
 *                     message: { type: string }
 *       401:
 *         description: Unauthorised
 */
router.get('/moderate', requireAuth, async (req, res) => {
  try {
    const joke = await mq.getNextJoke();
    if (!joke) {
      return res.json({ joke: null, message: 'No jokes in queue — polling...' });
    }
    res.json({ joke });
  } catch (err) {
    console.error('[GET /moderate] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch joke from queue' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /moderated:
 *   post:
 *     summary: Submit a moderated joke to the moderated queue
 *     tags: [Moderate]
 *     security:
 *       - oidc: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PendingJoke'
 *     responses:
 *       200:
 *         description: Joke approved and forwarded to ETL
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorised
 */
router.post('/moderated', requireAuth, async (req, res) => {
  const { setup, punchline, type } = req.body;

  if (!setup || !punchline || !type) {
    return res.status(400).json({ error: 'All fields required: setup, punchline, type' });
  }

  try {
    await mq.approveJoke({
      setup:     setup.trim(),
      punchline: punchline.trim(),
      type:      type.trim().toLowerCase()
    });
    res.json({ message: 'Joke approved and forwarded to ETL for database insertion' });
  } catch (err) {
    console.error('[POST /moderated] Error:', err.message);
    res.status(500).json({ error: 'Failed to forward joke' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /reject:
 *   post:
 *     summary: Reject current joke (removes from queue without saving)
 *     tags: [Moderate]
 *     security:
 *       - oidc: []
 *     responses:
 *       200:
 *         description: Joke rejected
 *       401:
 *         description: Unauthorised
 */
router.post('/reject', requireAuth, async (req, res) => {
  try {
    await mq.rejectJoke();
    res.json({ message: 'Joke rejected and removed from queue' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject joke' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /types:
 *   get:
 *     summary: Get joke types from cache (updated via type_update events)
 *     tags: [Types]
 *     responses:
 *       200:
 *         description: List of joke types
 */
router.get('/types', requireAuth, (req, res) => {
  const types = mq.loadTypesCache();
  res.json({ types });
});

module.exports = router;
