// ─── EventMatches Service — Firestore CRUD for EventMatches ──────────────────
const { db, admin } = require('../config/firebase');

const COLLECTION = 'EventMatches';

/**
 * Get event matches for a specific user.
 */
async function getEventMatchesByUser(userId) {
  const snap = await db.collection(COLLECTION)
    .where('user_id', '==', userId)
    .get();
  const docs = snap.docs.map(doc => ({ event_match_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.created_at?._seconds || 0) - (a.created_at?._seconds || 0));
}

/**
 * Get event matches for a specific event.
 */
async function getEventMatchesByEvent(eventId) {
  const snap = await db.collection(COLLECTION)
    .where('event_id', '==', eventId)
    .get();
  const docs = snap.docs.map(doc => ({ event_match_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.created_at?._seconds || 0) - (a.created_at?._seconds || 0));
}

/**
 * Create an event match record.
 */
async function createEventMatch(data) {
  const ref = db.collection(COLLECTION).doc();
  const match = {
    event_match_id: ref.id,
    event_id: data.event_id,
    user_id: data.user_id,
    match_type: data.match_type || 'Organic_Browse',
    score: data.score ?? null,
    status: data.status || 'Recommended',
    ai_reason: data.ai_reason || '',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(match);
  return match;
}

/**
 * Update event match status (Joined / Ignored).
 */
async function updateEventMatchStatus(matchId, status) {
  await db.collection(COLLECTION).doc(matchId).update({ status });
  const doc = await db.collection(COLLECTION).doc(matchId).get();
  return doc.exists ? { event_match_id: doc.id, ...doc.data() } : null;
}

/**
 * Batch create event matches (for AI invites).
 */
async function batchCreateEventMatches(matchesData) {
  const batch = db.batch();
  const results = [];

  for (const data of matchesData) {
    const ref = db.collection(COLLECTION).doc();
    const match = {
      event_match_id: ref.id,
      event_id: data.event_id,
      user_id: data.user_id,
      match_type: data.match_type || 'Organizer_AI_Invite',
      score: data.score ?? null,
      status: data.status || 'Recommended',
      ai_reason: data.ai_reason || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(ref, match);
    results.push(match);
  }

  await batch.commit();
  return results;
}

module.exports = { getEventMatchesByUser, getEventMatchesByEvent, createEventMatch, updateEventMatchStatus, batchCreateEventMatches };
