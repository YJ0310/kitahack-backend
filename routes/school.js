const router = require('express').Router();
const { resolveSkillTags, getTagMap } = require('../utils/tags');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ─── School Dashboard ──────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    // Get students
    const studentsSnap = await db.collection('Users').where('role', '==', 'Student').get();
    const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const studentCount = students.length;

    // Get enterprise count (no enterprise users in DB, fallback to 0)
    const enterpriseCount = 0;

    // Get events
    const eventsSnap = await db.collection('Events').limit(10).get();
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Build tag stats from student skill_tags (resolve IDs to names)
    const tagMap = await getTagMap(db);
    const tagCounts = {};
    students.forEach((s) => {
      (s.skill_tags || []).forEach((st) => {
        const name = tagMap[String(st.tag_id)] || `Tag #${st.tag_id}`;
        tagCounts[name] = (tagCounts[name] || 0) + 1;
      });
    });
    const tagStats = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    // Resolve skillTags for top 10 students shown in table
    const studentsWithTags = await Promise.all(
      students.slice(0, 10).map(async (s) => ({
        ...s,
        skillTags: await resolveSkillTags(db, s.skill_tags || []),
      }))
    );

    // Get posts
    const postsSnap = await db.collection('Posts').limit(10).get();
    const posts = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.render('school/dashboard', {
      title: 'Dashboard — School Portal',
      user,
      studentCount,
      enterpriseCount,
      students: studentsWithTags,
      events,
      tagStats,
      posts,
      shell: 'school',
    });
  } catch (err) {
    console.error('School dashboard error:', err);
    res.render('school/dashboard', {
      title: 'Dashboard — School Portal',
      user,
      studentCount: 0,
      enterpriseCount: 0,
      students: [],
      events: [],
      tagStats: [],
      posts: [],
      shell: 'school',
    });
  }
});

// ─── Publish Content ───────────────────────────────────
router.get('/publish', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    const eventsSnap = await db.collection('Events').get();
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.render('school/publish', {
      title: 'Publish Content — School Portal',
      user,
      events,
      shell: 'school',
    });
  } catch (err) {
    console.error('Publish error:', err);
    res.render('school/publish', {
      title: 'Publish Content — School Portal',
      user,
      events: [],
      shell: 'school',
    });
  }
});

// ─── Enterprise Network ────────────────────────────────
router.get('/enterprise_network', requireAuth, async (req, res) => {
  const db = req.db;
  const user = req.session.user;

  try {
    const enterprisesSnap = await db
      .collection('Users')
      .where('role', '==', 'enterprise')
      .get();
    const enterprises = enterprisesSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.render('school/enterprise_network', {
      title: 'Enterprise Network — School Portal',
      user,
      enterprises,
      shell: 'school',
    });
  } catch (err) {
    console.error('Enterprise network error:', err);
    res.render('school/enterprise_network', {
      title: 'Enterprise Network — School Portal',
      user,
      enterprises: [],
      shell: 'school',
    });
  }
});

module.exports = router;
