// ─── Insights Routes — AI-powered dashboard insights ─────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const usersService = require('../services/users.service');
const matchesService = require('../services/matches.service');
const eventsService = require('../services/events.service');
const tagsService = require('../services/tags.service');
const aiService = require('../services/ai.service');

// GET /api/insights — Generate AI insights for the current user's dashboard
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const user = await usersService.getUserByUid(req.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recentMatches = await matchesService.getMatchesByCandidate(req.uid);
    const events = await eventsService.getAllEvents();
    const allTags = await tagsService.getAllTags();

    const insights = await aiService.generateInsights(user, recentMatches, events, allTags);

    res.json({ insights: Array.isArray(insights) ? insights : [] });
  } catch (err) { next(err); }
});

module.exports = router;
