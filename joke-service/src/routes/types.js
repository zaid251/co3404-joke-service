// src/routes/types.js
const express = require('express');
const router  = express.Router();
const { saveCache } = require('../messaging/consumer');

module.exports = (db) => {

  /**
   * @swagger
   * /types:
   *   get:
   *     summary: Get all available joke types
   *     tags: [Types]
   *     responses:
   *       200:
   *         description: List of joke types
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: string
   *               example: ["dad", "general", "programming"]
   *       500:
   *         description: Server error
   */
  router.get('/', async (req, res) => {
    try {
      const types = await db.getTypes();
      // Refresh cache on every /types call to keep in sync
      saveCache(types);
      res.json(types);
    } catch (err) {
      console.error('[/types] Error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve types' });
    }
  });

  return router;
};
