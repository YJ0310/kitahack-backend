// ─── Events Routes ────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const eventsService = require('../services/events.service');
const eventMatchesService = require('../services/eventMatches.service');
const usersService = require('../services/users.service');
const tagsService = require('../services/tags.service');
const aiService = require('../services/ai.service');
const aidb = require('../services/aidb.service');

// GET /api/events — Get all events (public)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { type, upcoming } = req.query;
    let events;
    if (type) {
      events = await eventsService.getEventsByType(type);
    } else if (upcoming === 'true') {
      events = await eventsService.getUpcomingEvents();
    } else {
      events = await eventsService.getAllEvents();
    }
    res.json({ events });
  } catch (err) { next(err); }
});

// GET /api/events/:id — Get a single event
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const tagNames = await aidb.resolveTagNamesCached(event.related_tags || []);
    res.json({ event, tagNames });
  } catch (err) { next(err); }
});

// POST /api/events — Create a new event
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body);
    res.status(201).json({ event });
  } catch (err) { next(err); }
});

// PUT /api/events/:id — Update an event
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const updated = await eventsService.updateEvent(req.params.id, req.body);
    res.json({ event: updated });
  } catch (err) { next(err); }
});

// ─── AI-Powered Event Endpoints ──────────────────────────────────────────────

// POST /api/events/recommend — AI recommend events for current user
router.post('/recommend', authMiddleware, async (req, res, next) => {
  try {
    const user = await usersService.getUserByUid(req.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const events = await eventsService.getAllEvents();
    const { allTags } = await aidb.getTagsCached();

    const recommendations = await aiService.matchUserToEvents(user, events, allTags);

    // Create EventMatch records for AI recommendations
    const aiMatches = (Array.isArray(recommendations) ? recommendations : []).map(r => ({
      event_id: r.event_id,
      user_id: req.uid,
      match_type: 'Organizer_AI_Invite',
      score: r.score,
      status: 'Recommended',
      ai_reason: r.reason,
    }));

    if (aiMatches.length > 0) {
      await eventMatchesService.batchCreateEventMatches(aiMatches);
    }

    res.json({ recommendations: Array.isArray(recommendations) ? recommendations : [] });
  } catch (err) { next(err); }
});

// POST /api/events/search — AI search events by natural language prompt
router.post('/search', authMiddleware, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const user = await usersService.getUserByUid(req.uid);
    const events = await eventsService.getAllEvents();
    const { allTags } = await aidb.getTagsCached();

    const results = await aiService.searchEventsByPrompt(query, user, events, allTags);

    // Create EventMatch records for search results
    const searchMatches = (Array.isArray(results) ? results : []).map(r => ({
      event_id: r.event_id,
      user_id: req.uid,
      match_type: 'User_Prompt_Search',
      score: r.score,
      status: 'Recommended',
      ai_reason: r.reason,
    }));

    if (searchMatches.length > 0) {
      await eventMatchesService.batchCreateEventMatches(searchMatches);
    }

    res.json({ results: Array.isArray(results) ? results : [] });
  } catch (err) { next(err); }
});

// POST /api/events/:id/join — Join an event organically
router.post('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const match = await eventMatchesService.createEventMatch({
      event_id: req.params.id,
      user_id: req.uid,
      match_type: 'Organic_Browse',
      score: null,
      status: 'Joined',
      ai_reason: `User clicked to join the ${event.type} directly without AI assistance.`,
    });

    res.status(201).json({ event_match: match });
  } catch (err) { next(err); }
});

// GET /api/events/:id/participants — Get participants for an event
router.get('/:id/participants', authMiddleware, async (req, res, next) => {
  try {
    const matches = await eventMatchesService.getEventMatchesByEvent(req.params.id);
    res.json({ participants: matches });
  } catch (err) { next(err); }
});

// POST /api/events/:id/ai-invite — AI invite users to an event
router.post('/:id/ai-invite', authMiddleware, async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Smart pre-filter: only fetch users with relevant skill overlap (not all 10K)
    const candidates = await aidb.findUsersForEvent(event, 30);
    const { tagMap } = await aidb.getTagsCached();

    const eventTags = (event.related_tags || []).map(id => tagMap[id] || `Tag#${id}`);

    // Find users whose skills match event tags (already pre-filtered by AIDB)
    // No need to filter again — candidates are already relevant

    // Create AI invite records
    const invites = candidates.slice(0, 20).map(c => ({
      event_id: event.event_id,
      user_id: c.uid,
      match_type: 'Organizer_AI_Invite',
      score: 0.85 + Math.random() * 0.15, // placeholder
      status: 'Recommended',
      ai_reason: `The organizers of '${event.title}' are looking for students with your exact skill tags. You've been invited!`,
    }));

    const created = await eventMatchesService.batchCreateEventMatches(invites);

    res.json({ invites_sent: created.length, invites: created });
  } catch (err) { next(err); }
});

module.exports = router;
