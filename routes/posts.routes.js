// ─── Posts Routes ─────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const postsService = require('../services/posts.service');
const tagsService = require('../services/tags.service');
const aiService = require('../services/ai.service');

// GET /api/posts — Get all open posts
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const posts = await postsService.getOpenPosts();
    res.json({ posts });
  } catch (err) { next(err); }
});

// GET /api/posts/mine — Get current user's posts
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const posts = await postsService.getPostsByCreator(req.uid);
    res.json({ posts });
  } catch (err) { next(err); }
});

// GET /api/posts/:id — Get a single post
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await postsService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const tagNames = await tagsService.resolveTagNames(post.requirements || []);
    res.json({ post, tagNames });
  } catch (err) { next(err); }
});

// POST /api/posts — Create a new post (manual)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, type, requirements } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const post = await postsService.createPost({
      creator_id: req.uid,
      title,
      description,
      type,
      requirements: requirements || [],
    });
    res.status(201).json({ post });
  } catch (err) { next(err); }
});

// POST /api/posts/auto-tag — AI auto-tag a post before creating it
router.post('/auto-tag', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, type } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const allTags = await tagsService.getAllTags();
    const suggestions = await aiService.autoTagPost(title, description, type || 'Other', allTags);

    res.json({ suggestions });
  } catch (err) { next(err); }
});

// POST /api/posts/create-from-description — AI generates post from plain text
router.post('/create-from-description', authMiddleware, async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });

    const allTags = await tagsService.getAllTags();
    const generated = await aiService.createTeamFromDescription(description, allTags);

    // Auto-create the post if AI returned valid data
    if (generated.title && generated.requirements) {
      const post = await postsService.createPost({
        creator_id: req.uid,
        title: generated.title,
        description: generated.description || description,
        type: generated.type || 'Other',
        requirements: generated.requirements,
      });
      res.status(201).json({ post, ai_metadata: generated });
    } else {
      res.json({ generated, note: 'AI generated content but could not auto-create. Review and post manually.' });
    }
  } catch (err) { next(err); }
});

// PUT /api/posts/:id — Update a post
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await postsService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.creator_id !== req.uid) return res.status(403).json({ error: 'Not your post' });

    const updated = await postsService.updatePost(req.params.id, req.body);
    res.json({ post: updated });
  } catch (err) { next(err); }
});

// POST /api/posts/:id/close — Close a post
router.post('/:id/close', authMiddleware, async (req, res, next) => {
  try {
    const post = await postsService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.creator_id !== req.uid) return res.status(403).json({ error: 'Not your post' });

    const closed = await postsService.closePost(req.params.id);
    res.json({ post: closed });
  } catch (err) { next(err); }
});

module.exports = router;
