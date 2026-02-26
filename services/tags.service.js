// ─── Tags Service — Firestore CRUD for Tags collection ───────────────────────
const { db } = require('../config/firebase');

const COLLECTION = 'Tags';

/**
 * Get ALL tags (the global dictionary).
 */
async function getAllTags() {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get tags filtered by category_id (0=Major, 1=Course, 2=Skill, 3=Dev Area).
 */
async function getTagsByCategory(categoryId) {
  const snap = await db.collection(COLLECTION)
    .where('category_id', '==', Number(categoryId))
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single tag by document ID.
 */
async function getTagById(tagId) {
  const doc = await db.collection(COLLECTION).doc(String(tagId)).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/**
 * Create a new tag.
 */
async function createTag(data) {
  const ref = db.collection(COLLECTION).doc();
  const tag = {
    name: data.name,
    category_id: Number(data.category_id),
  };
  await ref.set(tag);
  return { id: ref.id, ...tag };
}

/**
 * Resolve an array of tag IDs to their names.
 */
async function resolveTagNames(tagIds) {
  if (!tagIds || tagIds.length === 0) return {};
  const allTags = await getAllTags();
  const map = {};
  allTags.forEach(t => { map[t.id] = t.name; });
  const resolved = {};
  tagIds.forEach(id => { resolved[id] = map[String(id)] || `Unknown(${id})`; });
  return resolved;
}

module.exports = { getAllTags, getTagsByCategory, getTagById, createTag, resolveTagNames };
