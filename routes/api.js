const router = require('express').Router();

// ─── Tags Search ───────────────────────────────────────
router.get('/tags/search', async (req, res) => {
  const db = req.db;
  const q = (req.query.q || '').toLowerCase();
  const type = req.query.type || null;

  try {
    let query = db.collection('Tags');
    if (type) query = query.where('type', '==', type);

    const snap = await query.limit(50).get();
    let tags = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (q) {
      tags = tags.filter((t) => (t.name || '').toLowerCase().includes(q));
    }

    res.json({ tags });
  } catch (err) {
    console.error('Tag search error:', err);
    res.status(500).json({ error: 'Failed to search tags' });
  }
});

// ─── Create Tag ────────────────────────────────────────
router.post('/tags', async (req, res) => {
  const db = req.db;
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Missing name or type' });
  }

  try {
    // Check if exists
    const existing = await db
      .collection('Tags')
      .where('name', '==', name.toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      const current = existing.docs[0].data();
      await docRef.update({ useCount: (current.useCount || 0) + 1 });
      return res.json({ id: existing.docs[0].id, ...current, useCount: (current.useCount || 0) + 1 });
    }

    const newTag = {
      name: name.toLowerCase(),
      displayName: name,
      type,
      useCount: 1,
    };
    const docRef = await db.collection('Tags').add(newTag);
    res.json({ id: docRef.id, ...newTag });
  } catch (err) {
    console.error('Tag create error:', err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// ─── User Profile ──────────────────────────────────────
router.get('/profile/:uid', async (req, res) => {
  const db = req.db;
  try {
    const doc = await db.collection('Users').doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ uid: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── Update Student Tags ──────────────────────────────
router.put('/profile/student/tags', async (req, res) => {
  const db = req.db;
  const { uid, tags } = req.body;

  if (!uid || !tags) return res.status(400).json({ error: 'Missing uid or tags' });

  try {
    await db.collection('Users').doc(uid).update({ tags });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// ─── Events ────────────────────────────────────────────
router.get('/events', async (req, res) => {
  const db = req.db;
  try {
    const snap = await db.collection('Events').get();
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events/publish', async (req, res) => {
  const db = req.db;
  const { title, type, tags, location, date } = req.body;

  if (!title) return res.status(400).json({ error: 'Missing title' });

  try {
    const newEvent = {
      event_title: title,
      type: type || 'general',
      tags: tags || [],
      location: location || '',
      date: date ? new Date(date) : new Date(),
      is_official: true,
      is_all_majors: true,
      target_major: [],
    };
    const docRef = await db.collection('Events').add(newEvent);
    res.json({ id: docRef.id, ...newEvent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish event' });
  }
});

// ─── Match Candidates ──────────────────────────────────
router.get('/match/candidates', async (req, res) => {
  const db = req.db;
  const query = (req.query.query || '').toLowerCase();
  const tags = req.query.tags ? req.query.tags.split(',') : [];

  try {
    const snap = await db.collection('Users').where('role', '==', 'student').get();
    let students = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    // Score by tag overlap
    students = students.map((s) => {
      const sTags = (s.tags || []).map((t) => t.toLowerCase());
      let score = 0;
      let reasons = [];

      if (tags.length > 0) {
        const overlap = tags.filter((t) => sTags.includes(t.toLowerCase()));
        score = overlap.length / tags.length;
        reasons = overlap.map((t) => `Matched on "${t}"`);
      }

      if (query) {
        if ((s.name || '').toLowerCase().includes(query)) {
          score += 0.2;
          reasons.push('Name match');
        }
        if (sTags.some((t) => t.includes(query))) {
          score += 0.3;
          reasons.push('Skill match');
        }
      }

      return { ...s, matchScore: Math.min(score, 1), matchReason: reasons.join(', ') };
    });

    students.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ candidates: students.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to match candidates' });
  }
});

// ─── Posts ─────────────────────────────────────────────
router.get('/posts', async (req, res) => {
  const db = req.db;
  try {
    const snap = await db.collection('Posts').get();
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ─── Matches ───────────────────────────────────────────
router.get('/matches', async (req, res) => {
  const db = req.db;
  const candidateId = req.query.candidate_id;

  try {
    let query = db.collection('Matches');
    if (candidateId) query = query.where('candidate_id', '==', candidateId);

    const snap = await query.limit(50).get();
    const matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// ─── Users list ────────────────────────────────────────
router.get('/users', async (req, res) => {
  const db = req.db;
  const role = req.query.role;

  try {
    let query = db.collection('Users');
    if (role) query = query.where('role', '==', role);

    const snap = await query.limit(50).get();
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
