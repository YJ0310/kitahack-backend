// ─── Posts Service — Firestore CRUD for Posts collection ──────────────────────
const { db, admin } = require('../config/firebase');

const COLLECTION = 'Posts';

/**
 * Get all open posts.
 */
async function getOpenPosts() {
  const snap = await db.collection(COLLECTION)
    .where('status', '==', 'Open')
    .get();
  const docs = snap.docs.map(doc => ({ post_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.created_at?._seconds || 0) - (a.created_at?._seconds || 0));
}

/**
 * Get all posts (any status).
 */
async function getAllPosts() {
  const snap = await db.collection(COLLECTION)
    .orderBy('created_at', 'desc')
    .get();
  return snap.docs.map(doc => ({ post_id: doc.id, ...doc.data() }));
}

/**
 * Get a single post by ID.
 */
async function getPostById(postId) {
  const doc = await db.collection(COLLECTION).doc(postId).get();
  return doc.exists ? { post_id: doc.id, ...doc.data() } : null;
}

/**
 * Get posts created by a specific user.
 */
async function getPostsByCreator(creatorId) {
  const snap = await db.collection(COLLECTION)
    .where('creator_id', '==', creatorId)
    .get();
  const docs = snap.docs.map(doc => ({ post_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.created_at?._seconds || 0) - (a.created_at?._seconds || 0));
}

/**
 * Create a new post.
 */
async function createPost(data) {
  const ref = db.collection(COLLECTION).doc();
  const post = {
    post_id: ref.id,
    creator_id: data.creator_id,
    type: data.type || 'Other',
    title: data.title,
    description: data.description || '',
    status: 'Open',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    requirements: data.requirements || [],
  };
  await ref.set(post);
  return post;
}

/**
 * Update a post.
 */
async function updatePost(postId, fields) {
  await db.collection(COLLECTION).doc(postId).update(fields);
  return getPostById(postId);
}

/**
 * Close a post.
 */
async function closePost(postId) {
  await db.collection(COLLECTION).doc(postId).update({ status: 'Closed' });
  return getPostById(postId);
}

module.exports = { getOpenPosts, getAllPosts, getPostById, getPostsByCreator, createPost, updatePost, closePost };
