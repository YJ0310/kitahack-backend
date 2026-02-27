// ─── Insights Routes — AI-powered dashboard insights ─────────────────────────
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const usersService = require('../services/users.service');
const matchesService = require('../services/matches.service');
const eventsService = require('../services/events.service');
const eventMatchesService = require('../services/eventMatches.service');
const postsService = require('../services/posts.service');
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

    // Fetch events and posts for full Jarvis context
    const [allEvents, openPosts] = await Promise.all([
      eventsService.getAllEvents(),
      postsService.getOpenPosts(),
    ]);
    const eventList = allEvents.slice(0, 20).map(e => `ID:${e.event_id} Title:"${e.title}" Type:${e.type} Date:${e.event_date || 'TBD'}`).join('\n');
    const postList = openPosts.slice(0, 15).map(p => `ID:${p.post_id} Title:"${p.title}" Skills:[${(p.required_skills || []).join(',')}]`).join('\n');

    const aiPrompt = `You are JARVIS — the AI assistant for "Teh Ais", a university collaboration platform.
You have FULL permissions to take ANY action on behalf of the user. Be proactive, helpful, and decisive.

Current user: ${user.name} (UID: ${user.uid})
Faculty: ${user.faculty || 'Not set'}
University: ${user.university || 'Not set'}
Current skills: [${userSkills.join(', ')}]
Current dev areas: [${userDevs.join(', ')}]

Available tags in the system:
${tagList}

Available events:
${eventList}

Open team posts (looking for members):
${postList}

User's command: "${prompt}"

Determine what action(s) to take. Available actions:
1. "add_tags" — Add skill/dev/course tags to the user's profile
2. "update_profile" — Update user profile fields (name, bio, faculty, phone_number, university)
3. "join_event" — Register user for an event
4. "apply_to_post" — Apply/match user to a team post
5. "find_teammates" — Search for potential teammates matching criteria
6. "navigate" — Guide user to a specific page in the app
7. "suggest" — Provide a suggestion/answer without taking action

Return a JSON object:
{
  "action": "<action_name>",
  "description": "<human-friendly description of what you're doing>",
  "data": {
    // For add_tags: { "skill_tags": [{"tag_id": <id>, "confidence": 0.9}], "dev_tags": [<id>], "courses_id": [<id>] }
    // For update_profile: { "field": "value", ... }
    // For join_event: { "event_id": "<id>", "reason": "<why this event>" }
    // For apply_to_post: { "post_id": "<id>", "message": "<application message>" }
    // For find_teammates: { "query": "<skills/criteria>", "results_summary": "<what you found>" }
    // For navigate: { "path": "<app path>", "message": "<explanation>" }
    // For suggest: { "message": "<your suggestion>" }
  }
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

    // Join event — create an EventMatch record
    if (plan && plan.action === 'join_event' && plan.data && plan.data.event_id) {
      try {
        const match = await eventMatchesService.createEventMatch({
          event_id: plan.data.event_id,
          user_id: req.uid,
          match_type: 'AI_Jarvis',
          score: 95,
          status: 'Joined',
          ai_reason: plan.data.reason || plan.description || 'Joined via AI assistant',
        });
        return res.json({
          action: 'join_event',
          description: plan.description || `Registered you for the event`,
          executed: true,
          data: match,
        });
      } catch (e) {
        return res.json({
          action: 'join_event',
          description: `Could not join event: ${e.message}`,
          executed: false,
        });
      }
    }

    // Apply to a team post — create a Match record
    if (plan && plan.action === 'apply_to_post' && plan.data && plan.data.post_id) {
      try {
        const match = await matchesService.createMatch({
          post_id: plan.data.post_id,
          candidate_id: req.uid,
          match_type: 'AI_Jarvis',
          score: 90,
          status: 'Pending',
          ai_reason: plan.data.message || plan.description || 'Applied via AI assistant',
        });
        return res.json({
          action: 'apply_to_post',
          description: plan.description || `Applied to the team post`,
          executed: true,
          data: match,
        });
      } catch (e) {
        return res.json({
          action: 'apply_to_post',
          description: `Could not apply: ${e.message}`,
          executed: false,
        });
      }
    }

    // Find teammates — use smart search logic
    if (plan && plan.action === 'find_teammates' && plan.data) {
      try {
        const allUsers = await usersService.getAllUsers();
        const query = (plan.data.query || '').toLowerCase();
        const matched = allUsers
          .filter(u => u.uid !== req.uid)
          .filter(u => {
            const skills = (u.skill_tags || []).map(s => tagMap[s.tag_id] || '').join(' ').toLowerCase();
            const name = (u.name || '').toLowerCase();
            const faculty = (u.faculty || '').toLowerCase();
            return skills.includes(query) || name.includes(query) || faculty.includes(query);
          })
          .slice(0, 5)
          .map(u => ({ name: u.name, faculty: u.faculty, uid: u.uid }));
        return res.json({
          action: 'find_teammates',
          description: plan.description || `Found ${matched.length} potential teammates`,
          executed: true,
          data: { teammates: matched },
        });
      } catch (e) {
        return res.json({
          action: 'find_teammates',
          description: plan.data.results_summary || 'Search completed',
          executed: false,
          data: plan.data,
        });
      }
    }

    // Navigate — return path info for the frontend
    if (plan && plan.action === 'navigate' && plan.data) {
      return res.json({
        action: 'navigate',
        description: plan.description || plan.data.message || 'Navigate',
        executed: true,
        data: { path: plan.data.path || '/student' },
      });
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
