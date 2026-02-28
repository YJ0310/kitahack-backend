// ─── Users Routes ─────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const usersService = require('../services/users.service');
const tagsService = require('../services/tags.service');
const aiService = require('../services/ai.service');

// GET /api/users/profile — Get current user's profile
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await usersService.getUserByUid(req.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Resolve tag names for enriched response
    const allTagIds = [
      ...(user.courses_id || []),
      ...(user.dev_tags || []),
      ...(user.skill_tags || []).map(s => s.tag_id),
      ...(user.major_id ? [user.major_id] : []),
    ];
    const tagNames = await tagsService.resolveTagNames(allTagIds);

    res.json({ user, tagNames });
  } catch (err) { next(err); }
});

// GET /api/users/:uid — Get any user's profile by UID
router.get('/:uid', authMiddleware, async (req, res, next) => {
  try {
    const user = await usersService.getUserByUid(req.params.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

// PUT /api/users/profile — Update current user's profile
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const updated = await usersService.upsertUser(req.uid, req.body);
    res.json({ user: updated });
  } catch (err) { next(err); }
});

// PATCH /api/users/profile — Partial update of profile fields
router.patch('/profile', authMiddleware, async (req, res, next) => {
  try {
    const updated = await usersService.updateUserFields(req.uid, req.body);
    res.json({ user: updated });
  } catch (err) { next(err); }
});

// POST /api/users/auto-tag — AI auto-tag user based on text description
router.post('/auto-tag', authMiddleware, async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });

    const allTags = await tagsService.getAllTags();
    const suggestions = await aiService.autoTagUser(description, allTags);

    res.json({ suggestions });
  } catch (err) { next(err); }
});

// POST /api/users/apply-tags — Apply AI-suggested tags to user profile
router.post('/apply-tags', authMiddleware, async (req, res, next) => {
  try {
    const { skill_tags, dev_tags, courses_id, major_id } = req.body;
    const fields = {};
    if (skill_tags) fields.skill_tags = skill_tags;
    if (dev_tags) fields.dev_tags = dev_tags;
    if (courses_id) fields.courses_id = courses_id;
    if (major_id !== undefined) fields.major_id = major_id;

    const updated = await usersService.updateUserFields(req.uid, fields);
    res.json({ user: updated });
  } catch (err) { next(err); }
});

// POST /api/users/generate-resume — AI-generated resume from profile data
router.post('/generate-resume', authMiddleware, async (req, res, next) => {
  try {
    const user = await usersService.getUserByUid(req.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Resolve tag names for richer context
    const allTagIds = [
      ...(user.courses_id || []),
      ...(user.dev_tags || []),
      ...(user.skill_tags || []).map(s => s.tag_id),
      ...(user.major_id ? [user.major_id] : []),
    ];
    const tagNames = await tagsService.resolveTagNames(allTagIds);

    const resume = await aiService.generateResume(user, tagNames);
    res.json({ resume });
  } catch (err) { next(err); }
});

module.exports = router;
