const router = require('express').Router();
const { resolveSkillTags, resolveTagIds, formatTimestamp } = require('../utils/tags');

// ─── Authentication Middleware ──────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Add formatted date to an event object
function enrichEvent(e) {
  return { ...e, formattedDate: formatTimestamp(e.event_date) };
}

// ─── Student Dashboard ─────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    const [eventsSnap, matchesSnap, postsSnap] = await Promise.all([
      db.collection('Events').orderBy('event_date', 'desc').limit(9).get(),
      db.collection('Matches').where('candidate_id', '==', user.uid).limit(10).get(),
      db.collection('Posts').limit(6).get(),
    ]);

    const events = eventsSnap.docs.map((d) => enrichEvent({ id: d.id, ...d.data() }));
    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const posts = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const [skillTags, devTags] = await Promise.all([
      resolveSkillTags(db, user.skill_tags || []),
      resolveTagIds(db, user.dev_tags || []),
    ]);

    res.render('student/dashboard', {
      title: 'Dashboard — Student Portal',
      user: { ...user, skillTags, devTags },
      events,
      matches,
      posts,
      shell: 'student',
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.render('student/dashboard', {
      title: 'Dashboard — Student Portal',
      user: { ...user, skillTags: [], devTags: [] },
      events: [],
      matches: [],
      posts: [],
      shell: 'student',
    });
  }
});

// ─── Events ────────────────────────────────────────────
router.get('/event', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    const eventsSnap = await db.collection('Events').orderBy('event_date', 'desc').get();
    const events = eventsSnap.docs.map((d) => enrichEvent({ id: d.id, ...d.data() }));

    res.render('student/events', {
      title: 'Events — Student Portal',
      user,
      events,
      shell: 'student',
    });
  } catch (err) {
    console.error('Events error:', err);
    res.render('student/events', {
      title: 'Events — Student Portal',
      user,
      events: [],
      shell: 'student',
    });
  }
});

// ─── Teams & Pairing ───────────────────────────────────
router.get('/team', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    const [postsSnap, matchesSnap] = await Promise.all([
      db.collection('Posts').where('status', '==', 'Open').limit(20).get(),
      db.collection('Matches').where('candidate_id', '==', user.uid).get(),
    ]);

    // Resolve requirements tag IDs for each post
    const posts = await Promise.all(
      postsSnap.docs.map(async (d) => {
        const data = { id: d.id, ...d.data() };
        data.resolvedRequirements = await resolveTagIds(db, data.requirements || []);
        return data;
      })
    );

    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.render('student/team', {
      title: 'Teams & Pairing — Student Portal',
      user,
      posts,
      matches,
      shell: 'student',
    });
  } catch (err) {
    console.error('Team error:', err);
    res.render('student/team', {
      title: 'Teams & Pairing — Student Portal',
      user,
      posts: [],
      matches: [],
      shell: 'student',
    });
  }
});

// ─── Chat ──────────────────────────────────────────────
router.get('/chat', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    const chatsSnap = await db.collection('TempChats').limit(20).get();
    const chats = chatsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.render('student/chat', {
      title: 'Chat — Student Portal',
      user,
      chats,
      shell: 'student',
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.render('student/chat', {
      title: 'Chat — Student Portal',
      user,
      chats: [],
      shell: 'student',
    });
  }
});

// ─── Profile & Tags ────────────────────────────────────
router.get('/profile', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    // Get fresh user data from Firestore
    const userDoc = await db.collection('Users').doc(user.uid).get();
    const userData = userDoc.exists ? { uid: user.uid, ...userDoc.data() } : { ...user };

    const [skillTags, devTags, courseTags, matchesSnap, eventsSnap] = await Promise.all([
      resolveSkillTags(db, userData.skill_tags || []),
      resolveTagIds(db, userData.dev_tags || []),
      resolveTagIds(db, userData.courses_id || []),
      db.collection('Matches').where('candidate_id', '==', user.uid).get(),
      db.collection('Events').limit(1).get(),
    ]);

    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // count all events
    const eventCountSnap = await db.collection('Events').get();

    res.render('student/profile', {
      title: 'Profile — Student Portal',
      user: { ...userData, skillTags, devTags, courseTags },
      matches,
      matchCount: matches.length,
      eventCount: eventCountSnap.size,
      shell: 'student',
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.render('student/profile', {
      title: 'Profile — Student Portal',
      user: { ...user, skillTags: [], devTags: [], courseTags: [] },
      matches: [],
      matchCount: 0,
      eventCount: 0,
      shell: 'student',
    });
  }
});

module.exports = router;
