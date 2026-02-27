// ─── AI Service — All Vertex AI / Gemini powered features ────────────────────
const { geminiGenerate, geminiGenerateJSON } = require('../config/vertex');

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTO-TAG USER PROFILE
//    Given a user's free-text description (bio, skills, interests),
//    returns suggested tag IDs from the Tags collection.
// ─────────────────────────────────────────────────────────────────────────────
async function autoTagUser(userText, existingTags) {
  const tagList = existingTags.map(t => `ID:${t.id} Name:"${t.name}" Cat:${t.category_id}`).join('\n');
  const prompt = `You are the AI engine for "Teh Ais", a university student collaboration platform.

Given this student's self-description:
"""
${userText}
"""

And the following tag dictionary (ID, Name, Category — 0=Major, 1=Course, 2=Skill, 3=Dev Area):
${tagList}

Return a JSON object with:
{
  "skill_tags": [{ "tag_id": <number>, "confidence": <0-1> }],
  "dev_tags": [<tag_id numbers>],
  "courses_id": [<tag_id numbers>],
  "major_id": <tag_id number or null>,
  "reasoning": "<brief explanation>"
}

Only include tags that are clearly relevant. Be precise. Return ONLY valid JSON.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTO-TAG A PROJECT / POST
//    Given a post title + description, returns recommended requirement tag IDs.
// ─────────────────────────────────────────────────────────────────────────────
async function autoTagPost(title, description, postType, existingTags) {
  const tagList = existingTags.map(t => `ID:${t.id} Name:"${t.name}" Cat:${t.category_id}`).join('\n');
  const prompt = `You are the AI tagging engine for "Teh Ais", a university collaboration platform.

A student just created a recruitment post:
Title: "${title}"
Type: "${postType}"
Description: """
${description}
"""

Tag dictionary (ID, Name, Category — 0=Major, 1=Course, 2=Skill, 3=Dev Area):
${tagList}

Return a JSON object with:
{
  "requirements": [<tag_id numbers that this post needs>],
  "suggested_type": "<Coursework|Startup|Competition|Research|Other>",
  "reasoning": "<brief explanation>"
}

Pick the most relevant tags. Return ONLY valid JSON.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MATCH CANDIDATES TO A POST (Team Finding)
//    Given a post's requirements and a list of candidate users,
//    returns ranked candidates with match scores and reasons.
// ─────────────────────────────────────────────────────────────────────────────
async function matchCandidatesToPost(post, candidates, tags) {
  const tagMap = {};
  tags.forEach(t => { tagMap[t.id] = t.name; });

  const reqNames = (post.requirements || []).map(id => tagMap[id] || `Tag#${id}`);

  const candidateSummaries = candidates.map(c => {
    const skills = (c.skill_tags || []).map(s => tagMap[s.tag_id] || `Tag#${s.tag_id}`);
    const devs = (c.dev_tags || []).map(id => tagMap[id] || `Tag#${id}`);
    return `UID:${c.uid} Name:"${c.name}" Skills:[${skills.join(',')}] DevAreas:[${devs.join(',')}] Major:${tagMap[c.major_id] || 'Unknown'}`;
  }).join('\n');

  const prompt = `You are the AI matching engine for "Teh Ais", a university team-finding platform.

A post needs teammates with these skills: [${reqNames.join(', ')}]
Post title: "${post.title}"
Post type: "${post.type}"
Post description: "${post.description}"

Candidate pool:
${candidateSummaries}

Rank the TOP candidates (max 10) by how well they match the post requirements.

Return a JSON array:
[
  {
    "candidate_id": "<uid>",
    "score": <0.0 to 1.0>,
    "reason": "<one-sentence human-friendly explanation>"
  }
]

Score 1.0 = perfect match. Be fair and detailed in reasoning. Return ONLY valid JSON array.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MATCH USERS TO EVENTS
//    Given a user profile and a list of events, rank which events suit them.
// ─────────────────────────────────────────────────────────────────────────────
async function matchUserToEvents(user, events, tags) {
  const tagMap = {};
  tags.forEach(t => { tagMap[t.id] = t.name; });

  const userSkills = (user.skill_tags || []).map(s => tagMap[s.tag_id] || `Tag#${s.tag_id}`);
  const userDevs = (user.dev_tags || []).map(id => tagMap[id] || `Tag#${id}`);

  const eventSummaries = events.map(e => {
    const eTags = (e.related_tags || []).map(id => tagMap[id] || `Tag#${id}`);
    return `EventID:${e.event_id} Title:"${e.title}" Type:${e.type} Tags:[${eTags.join(',')}] Organizer:"${e.organizer}"`;
  }).join('\n');

  const prompt = `You are the AI recommendation engine for "Teh Ais", a university event platform.

Student profile:
- Name: ${user.name}
- Major: ${tagMap[user.major_id] || 'Unknown'}
- Skills: [${userSkills.join(', ')}]
- Dev Areas: [${userDevs.join(', ')}]

Available events:
${eventSummaries}

Rank the TOP events (max 8) that best match this student's profile and interests.

Return a JSON array:
[
  {
    "event_id": "<id>",
    "score": <0.0 to 1.0>,
    "reason": "<one-sentence personalized invitation copy>"
  }
]

Be creative with the reason — make it feel like a personal AI invitation. Return ONLY valid JSON array.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SMART SEARCH (NLP Candidate Search for Enterprise)
//    Given a natural language query like "Python developer with finance background",
//    find matching students.
// ─────────────────────────────────────────────────────────────────────────────
async function smartSearchCandidates(query, candidates, tags) {
  const tagMap = {};
  (tags || []).forEach(t => { tagMap[t.id] = t.name; });

  const candidateSummaries = (candidates || []).map(c => {
    const skills = (c.skill_tags || []).map(s => {
      const tagId = typeof s === 'object' ? s.tag_id : s;
      return tagMap[tagId] || `Tag#${tagId}`;
    });
    const devs = (c.dev_tags || []).map(id => tagMap[id] || `Tag#${id}`);
    const courses = (c.courses_id || []).map(id => tagMap[id] || `Tag#${id}`);
    return `UID:${c.uid || 'unknown'} Name:"${c.name || 'Unknown'}" Skills:[${skills.join(',')}] DevAreas:[${devs.join(',')}] Courses:[${courses.join(',')}] Major:${tagMap[c.major_id] || 'Unknown'}`;
  }).join('\n');

  const prompt = `You are the AI search engine for "Teh Ais", a university talent matching platform.

An enterprise recruiter searched:
"${query}"

Student pool:
${candidateSummaries}

Find the students that BEST match the search query. Consider skills, dev areas, courses, and major.

Return a JSON array (max 15):
[
  {
    "candidate_id": "<uid>",
    "score": <0.0 to 1.0>,
    "reason": "<why this student matches>"
  }
]

Return ONLY valid JSON array.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CREATE TEAM BY DESCRIPTION (Auto-find + Auto-tag)
//    User describes what team they need in plain text,
//    AI creates a post with tags and finds matching teammates.
// ─────────────────────────────────────────────────────────────────────────────
async function createTeamFromDescription(description, existingTags) {
  const tagList = existingTags.map(t => `ID:${t.id} Name:"${t.name}" Cat:${t.category_id}`).join('\n');

  const prompt = `You are the AI team builder for "Teh Ais", a university collaboration platform.

A student wants to form a team and described their needs:
"""
${description}
"""

Tag dictionary (ID, Name, Category — 0=Major, 1=Course, 2=Skill, 3=Dev Area):
${tagList}

Generate:
1. A catchy post title
2. A professional post description
3. The best post type
4. Required tag IDs from the dictionary

Return a JSON object:
{
  "title": "<generated title>",
  "description": "<generated description, 2-3 paragraphs>",
  "type": "<Coursework|Startup|Competition|Research|Other>",
  "requirements": [<tag_id numbers>],
  "reasoning": "<brief explanation of tag choices>"
}

Return ONLY valid JSON.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. AI DASHBOARD INSIGHTS
//    Generate personalized insights/notifications for a student.
// ─────────────────────────────────────────────────────────────────────────────
async function generateInsights(user, recentMatches, recentEvents, tags, openPosts) {
  const tagMap = {};
  tags.forEach(t => { tagMap[t.id] = t.name; });

  const userSkills = (user.skill_tags || []).map(s => tagMap[s.tag_id] || `Tag#${s.tag_id}`);
  const userDevs  = (user.dev_tags || []).map(id => tagMap[id] || `Tag#${id}`);

  const matchInfo = recentMatches.slice(0, 5).map(m =>
    `MatchID:${m.match_id || m.id} PostID:${m.post_id} Status:${m.match_status} Score:${m.score}`
  ).join('\n');

  const eventInfo = recentEvents.slice(0, 10).map(e =>
    `EventID:${e.event_id} Title:"${e.title}" Type:${e.type} Date:${e.event_date || 'TBD'}`
  ).join('\n');

  const postInfo = (openPosts || []).slice(0, 10).map(p => {
    const skills = (p.required_skills || []).join(', ');
    return `PostID:${p.post_id} Title:"${p.title}" Skills:[${skills}] Owner:${p.owner_id}`;
  }).join('\n');

  const prompt = `You are JARVIS — the AI agent engine for "Teh Ais", a university collaboration platform.
You are generating ACTIONABLE insight cards for the student dashboard. Each insight MUST include one executable action the student can take with a single button click.

Student: ${user.name} (UID: ${user.uid})
Faculty: ${user.faculty || 'Not set'}
Skills: [${userSkills.join(', ')}]
Dev Areas: [${userDevs.join(', ')}]

Recent match activity:
${matchInfo || 'No recent matches'}

Available events (with IDs):
${eventInfo || 'No events'}

Open team posts looking for members (with IDs):
${postInfo || 'No open posts'}

Available tag IDs in the system (subset):
${tags.slice(0, 50).map(t => `${t.id}:"${t.name}"`).join(', ')}

Generate 3-4 personalized, actionable AI insight cards. EACH card MUST have an action_type and action_data so the frontend can execute it with one click.

Available action_types:
- "join_event" — Register user for an event. action_data: { "event_id": "<real event ID from above>" }
- "apply_to_post" — Apply to a team post. action_data: { "post_id": "<real post ID from above>", "message": "<short application msg>" }
- "add_tags" — Add skills/dev tags to profile. action_data: { "skill_tags": [{"tag_id": <int>, "confidence": 0.9}], "dev_tags": [<int>] }
- "navigate" — Direct user to a page. action_data: { "path": "/student/profile|/student/event|/student/team|/student/chat" }
- "accept_match" — Accept a pending match. action_data: { "match_id": "<real match ID from above>" }

Return a JSON array:
[
  {
    "title": "<short catchy title, 3-6 words>",
    "content": "<1-2 sentence personalized insight explaining WHY>",
    "type": "team_request|event_alert|enterprise_match|skill_tip|connection",
    "priority": "high|medium|low",
    "action_text": "<verb button label e.g. 'Join Now', 'Apply', 'Add Skills', 'View'>",
    "action_type": "<one of the action_types above>",
    "action_data": { ... }
  }
]

IMPORTANT:
- Use REAL event_id / post_id / match_id values from the data above — never make up IDs.
- action_text should be a short verb phrase (2-3 words max).
- Be specific and personalized based on the student's skills and activity.
- Return ONLY valid JSON array.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. EVENT SEARCH BY PROMPT
//    User types a natural language query to find events.
// ─────────────────────────────────────────────────────────────────────────────
async function searchEventsByPrompt(query, user, events, tags) {
  const tagMap = {};
  tags.forEach(t => { tagMap[t.id] = t.name; });

  const userSkills = (user.skill_tags || []).map(s => tagMap[s.tag_id] || `Tag#${s.tag_id}`);

  const eventSummaries = events.map(e => {
    const eTags = (e.related_tags || []).map(id => tagMap[id] || `Tag#${id}`);
    return `EventID:${e.event_id} Title:"${e.title}" Type:${e.type} Tags:[${eTags.join(',')}] Desc:"${(e.description || '').substring(0, 100)}" Organizer:"${e.organizer}"`;
  }).join('\n');

  const prompt = `You are the AI event search for "Teh Ais", a university event platform.

Student searched: "${query}"
Student skills: [${userSkills.join(', ')}]

All events:
${eventSummaries}

Find events matching the search query. Consider relevance to both the query text AND the student's skills.

Return a JSON array (max 10):
[
  {
    "event_id": "<id>",
    "score": <0.0 to 1.0>,
    "reason": "<personalized search result explanation>"
  }
]

Return ONLY valid JSON array.`;

  return geminiGenerateJSON(prompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. AUTO-PAIR TEAM (Decentralized grouping)
//    Given a set of users who want to be paired, form optimal teams.
// ─────────────────────────────────────────────────────────────────────────────
async function autoPairTeams(users, teamSize, context, tags) {
  const tagMap = {};
  tags.forEach(t => { tagMap[t.id] = t.name; });

  const userSummaries = users.map(u => {
    const skills = (u.skill_tags || []).map(s => tagMap[s.tag_id] || `Tag#${s.tag_id}`);
    const devs = (u.dev_tags || []).map(id => tagMap[id] || `Tag#${id}`);
    return `UID:${u.uid} Name:"${u.name}" Skills:[${skills.join(',')}] DevAreas:[${devs.join(',')}] Major:${tagMap[u.major_id] || 'Unknown'}`;
  }).join('\n');

  const prompt = `You are the AI team formation engine for "Teh Ais", a university collaboration platform.

Context: "${context || 'General hackathon team formation'}"
Desired team size: ${teamSize || 4}

Students wanting to be grouped:
${userSummaries}

Form balanced, complementary teams. Each team should have diverse skills that cover different aspects (frontend, backend, design, data, etc.).

Return a JSON object:
{
  "teams": [
    {
      "team_name": "<creative team name>",
      "members": ["<uid1>", "<uid2>", ...],
      "strength": "<what this team excels at>",
      "balance_score": <0.0 to 1.0>
    }
  ],
  "unmatched": ["<uids that couldn't fit>"],
  "reasoning": "<overall strategy explanation>"
}

Return ONLY valid JSON.`;

  return geminiGenerateJSON(prompt);
}

module.exports = {
  autoTagUser,
  autoTagPost,
  matchCandidatesToPost,
  matchUserToEvents,
  smartSearchCandidates,
  createTeamFromDescription,
  generateInsights,
  searchEventsByPrompt,
  autoPairTeams,
};
