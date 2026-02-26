// ─── Users Service — Firestore CRUD for Users collection ─────────────────────
const { db, admin } = require('../config/firebase');

const COLLECTION = 'Users';

/**
 * Get a user by UID (document ID).
 */
async function getUserByUid(uid) {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  return doc.exists ? { uid: doc.id, ...doc.data() } : null;
}

/**
 * Create or update a user profile.
 */
async function upsertUser(uid, data) {
  const ref = db.collection(COLLECTION).doc(uid);
  const existing = await ref.get();

  const userData = {
    uid,
    name: data.name || '',
    role: data.role || 'Student',
    major_id: data.major_id ?? null,
    courses_id: data.courses_id || [],
    skill_tags: data.skill_tags || [],
    dev_tags: data.dev_tags || [],
    matric_no: data.matric_no || '',
    email: data.email || '',
    whatsapp_num: data.whatsapp_num || '',
    portfolio_url: data.portfolio_url || '',
  };

  if (existing.exists) {
    await ref.update(userData);
  } else {
    await ref.set(userData);
  }

  return userData;
}

/**
 * Update specific fields on a user.
 */
async function updateUserFields(uid, fields) {
  await db.collection(COLLECTION).doc(uid).update(fields);
  return getUserByUid(uid);
}

/**
 * Get all users (for AI matching pool).
 */
async function getAllUsers() {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

/**
 * Get users by an array of UIDs.
 */
async function getUsersByUids(uids) {
  if (!uids || uids.length === 0) return [];
  // Firestore 'in' supports max 30 values at a time
  const results = [];
  const chunks = [];
  for (let i = 0; i < uids.length; i += 30) {
    chunks.push(uids.slice(i, i + 30));
  }
  for (const chunk of chunks) {
    const snap = await db.collection(COLLECTION)
      .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
      .get();
    snap.docs.forEach(doc => results.push({ uid: doc.id, ...doc.data() }));
  }
  return results;
}

module.exports = { getUserByUid, upsertUser, updateUserFields, getAllUsers, getUsersByUids };
