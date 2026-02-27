// ─── Matches Routes — AI Matching + Applications ─────────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const matchesService = require('../services/matches.service');
const postsService = require('../services/posts.service');
const usersService = require('../services/users.service');
const tagsService = require('../services/tags.service');
const chatsService = require('../services/chats.service');
const aiService = require('../services/ai.service');

// GET /api/matches/mine — Get all matches for the current user
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const matches = await matchesService.getMatchesByCandidate(req.uid);
    res.json({ matches });
  } catch (err) { next(err); }
});

// GET /api/matches/post/:postId — Get all matches for a specific post
router.get('/post/:postId', authMiddleware, async (req, res, next) => {
  try {
    const post = await postsService.getPostById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const matches = await matchesService.getMatchesByPost(req.params.postId);
    res.json({ matches });
  } catch (err) { next(err); }
});

// POST /api/matches/find-candidates — AI find matching candidates for a post
router.post('/find-candidates', authMiddleware, async (req, res, next) => {
  try {
    const post_id = req.body.post_id || req.body.postId;
    if (!post_id) return res.status(400).json({ error: 'post_id is required' });

    const post = await postsService.getPostById(post_id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const allUsers = await usersService.getAllUsers();
    const allTags = await tagsService.getAllTags();

    // Filter out the post creator from candidates
    const candidates = allUsers.filter(u => u.uid !== post.creator_id);

    const aiResults = await aiService.matchCandidatesToPost(post, candidates, allTags);

    // An array of ranked candidates with scores
    const ranked = Array.isArray(aiResults) ? aiResults : (aiResults.candidates || []);

    // Auto-create match records for top candidates
    const matchRecords = ranked.slice(0, 10).map(r => ({
      post_id,
      candidate_id: r.candidate_id,
      match_type: 'AI_Recommendation',
      score: r.score,
      match_status: 'Recommended',
      reason: r.reason,
    }));

    const created = await matchesService.batchCreateMatches(matchRecords);

    res.json({ candidates: ranked, matches_created: created });
  } catch (err) { next(err); }
});

// POST /api/matches/apply — Organic application to a post
router.post('/apply', authMiddleware, async (req, res, next) => {
  try {
    const post_id = req.body.post_id || req.body.postId;
    const message = req.body.message;
    if (!post_id) return res.status(400).json({ error: 'post_id is required' });

    const match = await matchesService.createMatch({
      post_id,
      candidate_id: req.uid,
      match_type: 'Organic_Application',
      score: null,
      match_status: 'Pending',
      reason: message || 'Applied organically',
    });

    res.status(201).json({ match });
  } catch (err) { next(err); }
});

// POST /api/matches/:matchId/accept — Accept a match (creates temp chat)
router.post('/:matchId/accept', authMiddleware, async (req, res, next) => {
  try {
    const match = await matchesService.getMatchById(req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const post = await postsService.getPostById(match.post_id);
    if (!post) return res.status(404).json({ error: 'Associated post not found' });
    if (post.creator_id !== req.uid) return res.status(403).json({ error: 'Only post creator can accept' });

    const updated = await matchesService.updateMatchStatus(req.params.matchId, 'Accepted');

    // Auto-create a temp chat room
    const chat = await chatsService.createChat({
      members: [post.creator_id, match.candidate_id],
      source_type: 'Post',
      source_id: match.post_id,
      match_id: match.match_id,
      chat_title: `Project: ${post.title}`,
    });

    res.json({ match: updated, chat });
  } catch (err) { next(err); }
});

// POST /api/matches/:matchId/reject — Reject a match
router.post('/:matchId/reject', authMiddleware, async (req, res, next) => {
  try {
    const updated = await matchesService.updateMatchStatus(req.params.matchId, 'Rejected');
    res.json({ match: updated });
  } catch (err) { next(err); }
});

// POST /api/matches/auto-pair — Decentralized auto-pairing for teams
router.post('/auto-pair', authMiddleware, async (req, res, next) => {
  try {
    const { user_ids, team_size, context } = req.body;
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length < 2) {
      return res.status(400).json({ error: 'user_ids array with at least 2 UIDs is required' });
    }

    const users = await usersService.getUsersByUids(user_ids);
    const allTags = await tagsService.getAllTags();

    const result = await aiService.autoPairTeams(users, team_size || 4, context || '', allTags);

    res.json({ result });
  } catch (err) { next(err); }
});

// POST /api/matches/smart-search — Enterprise NLP candidate search
router.post('/smart-search', authMiddleware, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const allUsers = await usersService.getAllUsers();
    const allTags = await tagsService.getAllTags();

    let results = [];
    try {
      const aiResults = await aiService.smartSearchCandidates(query, allUsers, allTags);
      results = Array.isArray(aiResults) ? aiResults : (aiResults.candidates || []);
    } catch (aiErr) {
      console.error('[smart-search] AI service error:', aiErr.message);
      // Return empty results instead of crashing
    }

    res.json({ results });
  } catch (err) { next(err); }
});

module.exports = router;
