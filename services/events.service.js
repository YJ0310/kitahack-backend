// ─── Events Service — Firestore CRUD for Events collection ───────────────────
const { db, admin } = require('../config/firebase');

const COLLECTION = 'Events';

/**
 * Get all events.
 */
async function getAllEvents() {
  const snap = await db.collection(COLLECTION)
    .orderBy('event_date', 'asc')
    .get();
  return snap.docs.map(doc => ({ event_id: doc.id, ...doc.data() }));
}

/**
 * Get upcoming events only (event_date in the future).
 */
async function getUpcomingEvents() {
  const snap = await db.collection(COLLECTION)
    .where('event_date', '>=', admin.firestore.Timestamp.now())
    .orderBy('event_date', 'asc')
    .get();
  return snap.docs.map(doc => ({ event_id: doc.id, ...doc.data() }));
}

/**
 * Get a single event by ID.
 */
async function getEventById(eventId) {
  const doc = await db.collection(COLLECTION).doc(eventId).get();
  return doc.exists ? { event_id: doc.id, ...doc.data() } : null;
}

/**
 * Get events by type (Competition, Workshop, Talk, Other).
 */
async function getEventsByType(type) {
  const snap = await db.collection(COLLECTION)
    .where('type', '==', type)
    .get();
  const docs = snap.docs.map(doc => ({ event_id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (a.event_date?._seconds || 0) - (b.event_date?._seconds || 0));
}

/**
 * Create a new event.
 */
async function createEvent(data) {
  const ref = db.collection(COLLECTION).doc();
  const event = {
    event_id: ref.id,
    title: data.title,
    organizer: data.organizer || '',
    type: data.type || 'Other',
    is_official: data.is_official ?? false,
    is_all_majors: data.is_all_majors ?? true,
    target_majors: data.target_majors || [],
    location: data.location || '',
    description: data.description || '',
    event_date: data.event_date ? admin.firestore.Timestamp.fromDate(new Date(data.event_date)) : admin.firestore.Timestamp.now(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    related_tags: data.related_tags || [],
    action_links: data.action_links || {},
  };
  await ref.set(event);
  return event;
}

/**
 * Update an event.
 */
async function updateEvent(eventId, fields) {
  await db.collection(COLLECTION).doc(eventId).update(fields);
  return getEventById(eventId);
}

module.exports = { getAllEvents, getUpcomingEvents, getEventById, getEventsByType, createEvent, updateEvent };
