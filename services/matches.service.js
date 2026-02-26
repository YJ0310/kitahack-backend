// ─── Matches Service — Firestore CRUD for Matches collection ─────────────────
const { db, admin } = require('../config/firebase');

const COLLECTION = 'Matches';

/**
 * Get all matches for a specific post.
 */
async function getMatchesByPost(postId) {
  const snap = await db.collection(COLLECTION)
    .where('post_id', '==', postId)
    .get();
  const docs = snap.docs.map(doc => ({ match_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.created_at?._seconds || 0) - (a.created_at?._seconds || 0));
}

/**
 * Get all matches for a specific candidate/user.
 */
async function getMatchesByCandidate(candidateId) {
  const snap = await db.collection(COLLECTION)
    .where('candidate_id', '==', candidateId)
    .get();
  const docs = snap.docs.map(doc => ({ match_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.created_at?._seconds || 0) - (a.created_at?._seconds || 0));
}

/**
 * Get a single match by ID.
 */
async function getMatchById(matchId) {
  const doc = await db.collection(COLLECTION).doc(matchId).get();
  return doc.exists ? { match_id: doc.id, ...doc.data() } : null;
}

/**
 * Create a match (AI Recommendation or Organic Application).
 */
async function createMatch(data) {
  const ref = db.collection(COLLECTION).doc();
  const match = {
    match_id: ref.id,
    post_id: data.post_id,
    candidate_id: data.candidate_id,
    match_type: data.match_type || 'AI_Recommendation',
    score: data.score ?? null,
    match_status: data.match_status || 'Recommended',
    reason: data.reason || '',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(match);
  return match;
}

/**
 * Update match status (Accept / Reject / Pending).
 */
async function updateMatchStatus(matchId, status) {
  await db.collection(COLLECTION).doc(matchId).update({ match_status: status });
  return getMatchById(matchId);
}

/**
 * Batch create multiple matches (for AI recommendations).
 */
async function batchCreateMatches(matchesData) {
  const batch = db.batch();
  const results = [];

  for (const data of matchesData) {
    const ref = db.collection(COLLECTION).doc();
    const match = {
      match_id: ref.id,
      post_id: data.post_id,
      candidate_id: data.candidate_id,
      match_type: data.match_type || 'AI_Recommendation',
      score: data.score ?? null,
      match_status: data.match_status || 'Recommended',
      reason: data.reason || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(ref, match);
    results.push(match);
  }

  await batch.commit();
  return results;
}

module.exports = { getMatchesByPost, getMatchesByCandidate, getMatchById, createMatch, updateMatchStatus, batchCreateMatches };
