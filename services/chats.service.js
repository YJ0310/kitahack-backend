// ─── TempChats Service — Firestore CRUD for TempChats + Messages ─────────────
const { db, admin } = require('../config/firebase');

const COLLECTION = 'TempChats';
const MESSAGES_SUB = 'Messages';

/**
 * Get all chats for a user (where user is in members array).
 */
async function getChatsByUser(uid) {
  const snap = await db.collection(COLLECTION)
    .where('members', 'array-contains', uid)
    .get();
  const docs = snap.docs.map(doc => ({ chat_id: doc.id, ...doc.data() }));
  // Filter active chats and sort in JS to avoid composite index requirements
  return docs
    .filter(d => d.status === 'Active')
    .sort((a, b) => (b.last_updated_at?._seconds || 0) - (a.last_updated_at?._seconds || 0));
}

/**
 * Get a single chat by ID.
 */
async function getChatById(chatId) {
  const doc = await db.collection(COLLECTION).doc(chatId).get();
  return doc.exists ? { chat_id: doc.id, ...doc.data() } : null;
}

/**
 * Create a temp chat room (after an accepted match).
 */
async function createChat(data) {
  const ref = db.collection(COLLECTION).doc();
  const now = admin.firestore.Timestamp.now();
  const expireAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000); // +48 hrs

  const chat = {
    chat_id: ref.id,
    members: data.members, // [creator_id, candidate_id]
    source_type: data.source_type || 'Post',
    source_id: data.source_id || '',
    match_id: data.match_id || '',
    chat_title: data.chat_title || 'Temporary Chat',
    last_message: '',
    last_updated_at: admin.firestore.FieldValue.serverTimestamp(),
    is_notified: false,
    status: 'Active',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    expire_at: expireAt,
  };
  await ref.set(chat);
  return chat;
}

/**
 * Send a message in a chat.
 */
async function sendMessage(chatId, senderId, text) {
  const msgRef = db.collection(COLLECTION).doc(chatId).collection(MESSAGES_SUB).doc();
  const message = {
    message_id: msgRef.id,
    sender_id: senderId,
    text,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    is_read: false,
  };
  await msgRef.set(message);

  // Update parent chat's last_message
  await db.collection(COLLECTION).doc(chatId).update({
    last_message: text,
    last_updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return message;
}

/**
 * Get messages for a chat (ordered by timestamp).
 */
async function getMessages(chatId, limit = 50) {
  const snap = await db.collection(COLLECTION).doc(chatId)
    .collection(MESSAGES_SUB)
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();
  return snap.docs.map(doc => ({ message_id: doc.id, ...doc.data() }));
}

/**
 * Mark messages as read.
 */
async function markMessagesRead(chatId, userId) {
  const snap = await db.collection(COLLECTION).doc(chatId)
    .collection(MESSAGES_SUB)
    .where('is_read', '==', false)
    .get();

  const batch = db.batch();
  snap.docs
    .filter(doc => doc.data().sender_id !== userId)
    .forEach(doc => batch.update(doc.ref, { is_read: true }));
  await batch.commit();

  return { marked: snap.docs.length };
}

/**
 * Expire old chats that passed their expire_at time.
 */
async function expireOldChats() {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection(COLLECTION)
    .where('status', '==', 'Active')
    .where('expire_at', '<=', now)
    .get();

  const batch = db.batch();
  snap.docs.forEach(doc => batch.update(doc.ref, { status: 'Expired' }));
  await batch.commit();

  return { expired: snap.docs.length };
}

module.exports = { getChatsByUser, getChatById, createChat, sendMessage, getMessages, markMessagesRead, expireOldChats };
