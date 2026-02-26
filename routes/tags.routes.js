// ─── Tags Routes ──────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const tagsService = require('../services/tags.service');

// GET /api/tags — Get all tags (public)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category } = req.query;
    let tags;
    if (category !== undefined) {
      tags = await tagsService.getTagsByCategory(category);
    } else {
      tags = await tagsService.getAllTags();
    }
    res.json({ tags });
  } catch (err) { next(err); }
});

// GET /api/tags/:id — Get a single tag
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const tag = await tagsService.getTagById(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json({ tag });
  } catch (err) { next(err); }
});

// POST /api/tags — Create a new tag
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { name, category_id } = req.body;
    if (!name || category_id === undefined) {
      return res.status(400).json({ error: 'name and category_id are required' });
    }
    const tag = await tagsService.createTag({ name, category_id });
    res.status(201).json({ tag });
  } catch (err) { next(err); }
});

module.exports = router;
