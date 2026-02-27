// ─── Insights Routes — AI-powered dashboard insights ─────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const usersService = require('../services/users.service');
const matchesService = require('../services/matches.service');
const eventsService = require('../services/events.service');
const tagsService = require('../services/tags.service');
const aiService = require('../services/ai.service');
const { geminiGenerateJSON } = require('../config/vertex');

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

// POST /api/insights/ai-command — Execute a high-permission AI command on behalf of the user
router.post('/ai-command', authMiddleware, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const user = await usersService.getUserByUid(req.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const allTags = await tagsService.getAllTags();
    const tagMap = {};
    allTags.forEach(t => { tagMap[t.id] = t.name; });

    const userSkills = (user.skill_tags || []).map(s => tagMap[s.tag_id] || `Tag#${s.tag_id}`);
    const userDevs = (user.dev_tags || []).map(id => tagMap[id] || `Tag#${id}`);
    const tagList = allTags.map(t => `ID:${t.id} Name:"${t.name}" Cat:${t.category_id}`).join('\n');

    const aiPrompt = `You are the AI assistant for "Teh Ais", a university collaboration platform.
You have HIGH-LEVEL permissions to take actions on behalf of the user.

Current user: ${user.name} (UID: ${user.uid})
Current skills: [${userSkills.join(', ')}]
Current dev areas: [${userDevs.join(', ')}]

Available tags in the system:
${tagList}

User's command: "${prompt}"

Determine what action(s) to take. Available actions:
1. "add_tags" — Add skill/dev/course tags to the user's profile
2. "update_profile" — Update user profile fields (name, bio, faculty, etc.)
3. "suggest" — Just provide a suggestion/answer without taking action

Return a JSON object:
{
  "action": "<add_tags|update_profile|suggest>",
  "description": "<human-friendly description of what you're doing>",
  "data": {
    // For add_tags: { "skill_tags": [{"tag_id": <id>, "confidence": 0.9}], "dev_tags": [<id>], "courses_id": [<id>] }
    // For update_profile: { "field": "value", ... }
    // For suggest: { "message": "<your suggestion>" }
  },
  "confirmation_text": "<ask user to confirm, e.g. 'I will add Flutter, Firebase to your skills. Confirm?'>"
}

Return ONLY valid JSON.`;

    const plan = await geminiGenerateJSON(aiPrompt);

    // If action is add_tags or update_profile, execute it
    if (plan && plan.action === 'add_tags' && plan.data) {
      const fields = {};
      if (plan.data.skill_tags) {
        // Merge with existing skill_tags
        const existing = user.skill_tags || [];
        const existingIds = new Set(existing.map(s => s.tag_id));
        const newTags = plan.data.skill_tags.filter(s => !existingIds.has(s.tag_id));
        fields.skill_tags = [...existing, ...newTags];
      }
      if (plan.data.dev_tags) {
        const existing = user.dev_tags || [];
        const merged = [...new Set([...existing, ...plan.data.dev_tags])];
        fields.dev_tags = merged;
      }
      if (plan.data.courses_id) {
        const existing = user.courses_id || [];
        const merged = [...new Set([...existing, ...plan.data.courses_id])];
        fields.courses_id = merged;
      }
      const updated = await usersService.updateUserFields(req.uid, fields);
      return res.json({
        action: plan.action,
        description: plan.description || plan.confirmation_text || 'Tags updated',
        executed: true,
        user: updated,
      });
    }

    if (plan && plan.action === 'update_profile' && plan.data) {
      // Filter out sensitive fields
      const allowed = ['name', 'bio', 'faculty', 'phone_number', 'university'];
      const fields = {};
      for (const [k, v] of Object.entries(plan.data)) {
        if (allowed.includes(k)) fields[k] = v;
      }
      if (Object.keys(fields).length > 0) {
        const updated = await usersService.updateUserFields(req.uid, fields);
        return res.json({
          action: plan.action,
          description: plan.description || 'Profile updated',
          executed: true,
          user: updated,
        });
      }
    }

    // Suggest or fallback
    res.json({
      action: plan?.action || 'suggest',
      description: plan?.description || plan?.confirmation_text || 'No action needed',
      executed: false,
      data: plan?.data || {},
    });
  } catch (err) { next(err); }
});

module.exports = router;
