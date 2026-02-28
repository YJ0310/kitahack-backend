// ─── AI Database Manager ─────────────────────────────────────────────────────
// Intelligent query layer that sits between routes and raw Firestore.
// Instead of fetching ALL 10K users / 1K tags for every AI call, this service:
//   1. Caches tags in memory (5-minute TTL) — tags rarely change
//   2. Pre-filters users by skill/tag overlap in Firestore BEFORE sending to AI
//   3. Provides purpose-built query methods for each AI scenario
//
// This reduces Firestore reads from 11K → ~50-200 per AI call.
// ─────────────────────────────────────────────────────────────────────────────

const { db, admin } = require('../config/firebase');

// ═══════════════════════════════════════════════════════════════════════════════
//  TAG CACHE — in-memory with 5-minute TTL
// ═══════════════════════════════════════════════════════════════════════════════
let _tagCache = null;           // { allTags: [...], tagMap: {id→name}, byCategory: {0→[...], ...} }
let _tagCacheTime = 0;
const TAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTagsCached() {
  const now = Date.now();
  if (_tagCache && (now - _tagCacheTime) < TAG_CACHE_TTL) {
    return _tagCache;
  }

  console.log('[AIDBManager] Refreshing tag cache...');
  const snap = await db.collection('Tags').get();
  const allTags = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const tagMap = {};
  const byCategory = { 0: [], 1: [], 2: [], 3: [] }; // Major, Course, Skill, DevArea

  allTags.forEach(t => {
    tagMap[t.id] = t.name;
    const cat = t.category_id ?? -1;
    if (byCategory[cat]) byCategory[cat].push(t);
  });

  _tagCache = { allTags, tagMap, byCategory };
  _tagCacheTime = now;
  console.log(`[AIDBManager] Tag cache loaded: ${allTags.length} tags`);
  return _tagCache;
}

/** Force-refresh the tag cache (call after tag creation/update). */
function invalidateTagCache() {
  _tagCache = null;
  _tagCacheTime = 0;
}

/** Resolve an array of tag IDs to their names using cache. */
async function resolveTagNamesCached(tagIds) {
  if (!tagIds || tagIds.length === 0) return {};
  const { tagMap } = await getTagsCached();
  const resolved = {};
  tagIds.forEach(id => { resolved[id] = tagMap[String(id)] || `Unknown(${id})`; });
  return resolved;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SMART USER QUERIES — Pre-filter in Firestore before AI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find users whose skill_tags overlap with the given tag IDs.
 * Uses Firestore array-contains queries + in-memory scoring.
 *
 * Firestore limitation: array-contains only matches one value at a time.
 * Strategy: query for EACH required tag (parallel), union results, rank by overlap count.
 *
 * @param {number[]} requiredTagIds - Skill/dev tag IDs to match against
 * @param {string} excludeUid - UID to exclude (e.g., the post creator)
 * @param {number} limit - Max candidates to return (default 50)
 * @returns {Promise<Array>} Ranked array of user objects with _overlapCount
 */
async function findUsersBySkillOverlap(requiredTagIds, excludeUid, limit = 50) {
  if (!requiredTagIds || requiredTagIds.length === 0) {
    // Fallback: return a random sample
    return sampleUsers(limit, excludeUid);
  }

  // Firestore doesn't support array-contains on nested objects well,
  // so we do a broader fetch with skill_tags array membership.
  // Strategy: fetch users who have AT LEAST ONE matching skill tag.
  //
  // For skill_tags (array of {tag_id, is_confirmed}), we can't query
  // by tag_id inside the object. Instead, we'll use dev_tags (flat array)
  // for efficient querying, plus a broader approach.

  const userMap = new Map(); // uid → { user, overlapCount }

  // 1. Query by dev_tags (flat int array — Firestore array-contains works)
  const devTagIds = requiredTagIds.filter(id => id >= 400); // Dev areas are 400+
  const skillTagIds = requiredTagIds.filter(id => id < 400); // Skills are < 400

  const queryPromises = [];

  // Firestore array-contains supports only 1 value per query, but we can
  // run up to 10 queries in parallel for the top required tags
  const topDevTags = devTagIds.slice(0, 5);
  const topSkillTags = skillTagIds.slice(0, 5);

  for (const devId of topDevTags) {
    queryPromises.push(
      db.collection('Users')
        .where('dev_tags', 'array-contains', devId)
        .limit(100)
        .get()
        .then(snap => snap.docs)
        .catch(() => [])
    );
  }

  // For skill_tags, we can't use array-contains on nested objects.
  // Instead, we'll use a composite approach with major_id and courses_id as signals.
  const majorIds = requiredTagIds.filter(id => id >= 100 && id < 200);
  for (const majorId of majorIds.slice(0, 3)) {
    queryPromises.push(
      db.collection('Users')
        .where('major_id', '==', majorId)
        .limit(100)
        .get()
        .then(snap => snap.docs)
        .catch(() => [])
    );
  }

  // Run all queries in parallel
  const queryResults = await Promise.all(queryPromises);

  // Merge all results into a map
  for (const docs of queryResults) {
    for (const doc of docs) {
      if (doc.id === excludeUid) continue;
      if (!userMap.has(doc.id)) {
        userMap.set(doc.id, {
          user: { uid: doc.id, ...doc.data() },
          overlapCount: 0,
        });
      }
      userMap.get(doc.id).overlapCount++;
    }
  }

  // 2. Score all candidates in-memory by FULL skill overlap
  for (const [uid, entry] of userMap) {
    const user = entry.user;
    const userSkillIds = (user.skill_tags || []).map(s => s.tag_id);
    const userDevIds = user.dev_tags || [];
    const userAllTagIds = [...userSkillIds, ...userDevIds];

    // Count overlap with required tags
    let overlap = 0;
    for (const reqId of requiredTagIds) {
      if (userAllTagIds.includes(reqId)) overlap++;
    }
    entry.overlapCount = overlap;
  }

  // 3. Sort by overlap count (descending), take top N
  const ranked = Array.from(userMap.values())
    .filter(e => e.overlapCount > 0)
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, limit)
    .map(e => ({ ...e.user, _overlapCount: e.overlapCount }));

  // 4. If we got too few from targeted queries, supplement with sampling
  if (ranked.length < Math.min(limit, 20)) {
    const existingUids = new Set(ranked.map(u => u.uid));
    const supplement = await sampleUsers(20, excludeUid, existingUids);
    ranked.push(...supplement);
  }

  return ranked.slice(0, limit);
}

/**
 * Get a random sample of users (for fallback / diversity).
 * Uses Firestore's orderBy + startAfter with a random doc ID for efficient sampling.
 * @param {number} limit
 * @param {string} excludeUid
 * @param {Set<string>} excludeSet - UIDs already selected
 * @returns {Promise<Array>}
 */
async function sampleUsers(limit = 20, excludeUid = '', excludeSet = new Set()) {
  // Random document ID for pseudo-random sampling
  const randomId = db.collection('Users').doc().id;

  const snap1 = await db.collection('Users')
    .orderBy(admin.firestore.FieldPath.documentId())
    .startAfter(randomId)
    .limit(limit + 5)
    .get();

  let docs = snap1.docs;

  // If we didn't get enough (hit the end), wrap around
  if (docs.length < limit) {
    const snap2 = await db.collection('Users')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(limit - docs.length + 5)
      .get();
    docs = [...docs, ...snap2.docs];
  }

  return docs
    .filter(d => d.id !== excludeUid && !excludeSet.has(d.id))
    .slice(0, limit)
    .map(d => ({ uid: d.id, ...d.data() }));
}

/**
 * Find candidate users for a specific post.
 * Intelligently queries by the post's requirement tags.
 * @param {object} post - The post document
 * @param {string} excludeUid - UID to exclude (usually post creator)
 * @param {number} limit - Max candidates
 * @returns {Promise<Array>}
 */
async function findCandidatesForPost(post, excludeUid, limit = 50) {
  return findUsersBySkillOverlap(post.requirements || [], excludeUid || post.creator_id, limit);
}

/**
 * Smart search: find users matching a natural language query.
 * Phase 1: Use AI to extract relevant tag IDs from the query.
 * Phase 2: Use those tag IDs to pre-filter users in Firestore.
 * Phase 3: Send only the pre-filtered users to AI for NLP ranking.
 *
 * @param {string} query - Natural language search query
 * @param {string} excludeUid - UID to exclude
 * @param {number} limit - Max results
 * @returns {Promise<{candidates: Array, tags: Array}>}
 */
async function smartQueryUsers(query, excludeUid, limit = 50) {
  const { allTags, tagMap } = await getTagsCached();

  // Phase 1: Simple keyword matching to extract relevant tag IDs
  const queryLower = query.toLowerCase();
  const matchedTagIds = [];

  for (const tag of allTags) {
    const nameLower = (tag.name || '').toLowerCase();
    // Check if any word in the tag name appears in the query
    if (queryLower.includes(nameLower) || nameLower.includes(queryLower)) {
      matchedTagIds.push(Number(tag.id));
    }
    // Also check individual words
    const queryWords = queryLower.split(/\s+/);
    const tagWords = nameLower.split(/\s+/);
    for (const tw of tagWords) {
      if (tw.length > 2 && queryWords.some(qw => qw.includes(tw) || tw.includes(qw))) {
        if (!matchedTagIds.includes(Number(tag.id))) {
          matchedTagIds.push(Number(tag.id));
        }
        break;
      }
    }
  }

  // Phase 2: Pre-filter users by matched tags
  let candidates;
  if (matchedTagIds.length > 0) {
    candidates = await findUsersBySkillOverlap(matchedTagIds, excludeUid, limit);
  } else {
    candidates = await sampleUsers(limit, excludeUid);
  }

  return { candidates, allTags };
}

/**
 * Find users to invite to a specific event.
 * Queries by event's related_tags for fast pre-filtering.
 * @param {object} event - The event document
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function findUsersForEvent(event, limit = 30) {
  return findUsersBySkillOverlap(event.related_tags || [], '', limit);
}

/**
 * Get lightweight context for AI insights (dashboard).
 * Instead of loading ALL data, loads only what's relevant to the user.
 * @param {string} uid
 * @returns {Promise<object>} { user, matches, events, tags, openPosts }
 */
async function getInsightContext(uid) {
  const { allTags } = await getTagsCached();

  // Run targeted queries in parallel
  const [user, matches, events, openPosts] = await Promise.all([
    db.collection('Users').doc(uid).get().then(d => d.exists ? { uid: d.id, ...d.data() } : null),
    db.collection('Matches').where('candidate_id', '==', uid).orderBy('created_at', 'desc').limit(20).get()
      .then(s => s.docs.map(d => ({ match_id: d.id, ...d.data() })))
      .catch(() => []),
    db.collection('Events').orderBy('event_date', 'desc').limit(15).get()
      .then(s => s.docs.map(d => ({ event_id: d.id, ...d.data() })))
      .catch(() => db.collection('Events').limit(15).get()
        .then(s => s.docs.map(d => ({ event_id: d.id, ...d.data() })))),
    db.collection('Posts').where('status', '==', 'Open').orderBy('created_at', 'desc').limit(15).get()
      .then(s => s.docs.map(d => ({ post_id: d.id, ...d.data() })))
      .catch(() => db.collection('Posts').where('status', '==', 'Open').limit(15).get()
        .then(s => s.docs.map(d => ({ post_id: d.id, ...d.data() })))),
  ]);

  return { user, matches, events, tags: allTags, openPosts };
}

/**
 * Get users by an array of UIDs (batched, max 30 per query).
 * @param {string[]} uids
 * @returns {Promise<Array>}
 */
async function getUsersByUids(uids) {
  if (!uids || uids.length === 0) return [];
  const results = [];
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const snap = await db.collection('Users')
      .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
      .get();
    snap.docs.forEach(doc => results.push({ uid: doc.id, ...doc.data() }));
  }
  return results;
}

module.exports = {
  // Tag cache
  getTagsCached,
  invalidateTagCache,
  resolveTagNamesCached,
  // Smart user queries
  findUsersBySkillOverlap,
  findCandidatesForPost,
  smartQueryUsers,
  findUsersForEvent,
  sampleUsers,
  // Context builders
  getInsightContext,
  getUsersByUids,
};
