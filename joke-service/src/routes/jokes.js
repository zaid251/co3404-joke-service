// src/routes/jokes.js
const express = require('express');
const router  = express.Router();

module.exports = (db) => {

  /**
   * @swagger
   * /joke/{type}:
   *   get:
   *     summary: Get random joke(s) by type
   *     tags: [Jokes]
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *         description: Joke type (e.g. general, dad, programming) or "any"
   *       - in: query
   *         name: count
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Number of jokes to return
   *     responses:
   *       200:
   *         description: Array of jokes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Joke'
   *       404:
   *         description: No jokes found for this type
   *       500:
   *         description: Server error
   */
  router.get('/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const count    = Math.min(parseInt(req.query.count) || 1, 50); // cap at 50
      const jokes    = await db.getJokes(type.toLowerCase(), count);

      if (!jokes || jokes.length === 0) {
        return res.status(404).json({ error: `No jokes found for type: ${type}` });
      }
      res.json(jokes);
    } catch (err) {
      console.error('[/joke] Error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve jokes' });
    }
  });

  return router;
};
