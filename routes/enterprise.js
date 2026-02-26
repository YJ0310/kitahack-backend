const router = require('express').Router();
const { resolveSkillTags } = require('../utils/tags');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ─── Enterprise Dashboard ──────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    // Get matches
    const matchesSnap = await db.collection('Matches').limit(20).get();
    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Get posts
    const postsSnap = await db.collection('Posts').limit(10).get();
    const posts = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Count students
    const studentsSnap = await db.collection('Users').where('role', '==', 'Student').get();

    const studentCount = studentsSnap.size;
    // Get events
    const eventsSnap = await db.collection('Events').limit(10).get();
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.render('enterprise/dashboard', {
      title: 'Dashboard — Enterprise Portal',
      user,
      matches,
      posts,
      studentCount,
      events,
      shell: 'enterprise',
    });
  } catch (err) {
    console.error('Enterprise dashboard error:', err);
    res.render('enterprise/dashboard', {
      title: 'Dashboard — Enterprise Portal',
      user,
      matches: [],
      posts: [],
      studentCount: 0,
      events: [],
      shell: 'enterprise',
    });
  }
});

// ─── Candidate Search ──────────────────────────────────
router.get('/candidates', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;
  const query = req.query.q || '';

  try {
    const studentsSnap = await db.collection('Users').where('role', '==', 'Student').get();
    let students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filter by query if provided (name or email)
    if (query) {
      const q = query.toLowerCase();
      students = students.filter((s) => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const emailMatch = (s.email || '').toLowerCase().includes(q);
        const matricMatch = (s.matric_no || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || matricMatch;
      });
    }

    // Resolve skill_tags for display
    const candidates = await Promise.all(
      students.slice(0, 50).map(async (s) => ({
        ...s,
        skillTags: await resolveSkillTags(db, s.skill_tags || []),
      }))
    );

    res.render('enterprise/candidates', {
      title: 'Candidate Search — Enterprise Portal',
      user,
      candidates,
      query,
      shell: 'enterprise',
    });
  } catch (err) {
    console.error('Candidate search error:', err);
    res.render('enterprise/candidates', {
      title: 'Candidate Search — Enterprise Portal',
      user,
      candidates: [],
      query,
      shell: 'enterprise',
    });
  }
});

module.exports = router;
