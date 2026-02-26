// ─── Chats Routes ─────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const chatsService = require('../services/chats.service');

// GET /api/chats — Get all active chats for the current user
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const chats = await chatsService.getChatsByUser(req.uid);
    res.json({ chats });
  } catch (err) { next(err); }
});

// GET /api/chats/:chatId — Get a specific chat
router.get('/:chatId', authMiddleware, async (req, res, next) => {
  try {
    const chat = await chatsService.getChatById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.members.includes(req.uid)) return res.status(403).json({ error: 'Not a member of this chat' });
    res.json({ chat });
  } catch (err) { next(err); }
});

// GET /api/chats/:chatId/messages — Get messages for a chat
router.get('/:chatId/messages', authMiddleware, async (req, res, next) => {
  try {
    const chat = await chatsService.getChatById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.members.includes(req.uid)) return res.status(403).json({ error: 'Not a member' });

    const limit = parseInt(req.query.limit) || 50;
    const messages = await chatsService.getMessages(req.params.chatId, limit);
    res.json({ messages });
  } catch (err) { next(err); }
});

// POST /api/chats/:chatId/messages — Send a message
router.post('/:chatId/messages', authMiddleware, async (req, res, next) => {
  try {
    const chat = await chatsService.getChatById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.members.includes(req.uid)) return res.status(403).json({ error: 'Not a member' });
    if (chat.status !== 'Active') return res.status(400).json({ error: 'Chat is no longer active' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const message = await chatsService.sendMessage(req.params.chatId, req.uid, text);
    res.status(201).json({ message });
  } catch (err) { next(err); }
});

// POST /api/chats/:chatId/read — Mark messages as read
router.post('/:chatId/read', authMiddleware, async (req, res, next) => {
  try {
    const result = await chatsService.markMessagesRead(req.params.chatId, req.uid);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/chats/expire — Expire old chats (can be called by a cron job)
router.post('/expire', async (req, res, next) => {
  try {
    const result = await chatsService.expireOldChats();
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
