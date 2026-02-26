const router = require('express').Router();

// Landing page
router.get('/', (req, res) => {
  res.render('public/landing', { title: 'Teh Ais — Talent Platform' });
});

// Login page
router.get('/login', (req, res) => {
  res.render('public/login', { title: 'Login — Teh Ais' });
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, role } = req.body;
  const db = req.db;

  try {
    // Find user by email (case-insensitive search not built into Firestore,
    // so we try exact match)
    const usersSnap = await db.collection('Users').where('email', '==', email.trim()).limit(1).get();

    if (usersSnap.empty) {
      return res.render('public/login', {
        title: 'Login — Teh Ais',
        error: 'User not found. Please check your email.',
      });
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();

    req.session.user = {
      uid: userDoc.id,
      ...userData,
    };

    // Redirect based on role (normalize to lowercase)
    const userRole = (userData.role || role || 'student').toLowerCase();
    req.session.user.role = userRole;
    switch (userRole) {
      case 'enterprise':
        return res.redirect('/enterprise');
      case 'school':
        return res.redirect('/school');
      default:
        return res.redirect('/student');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('public/login', {
      title: 'Login — Teh Ais',
      error: 'Login failed. Please try again.',
    });
  }
});

// Quick login (for demo — pick any user)
router.get('/demo-login/:role', async (req, res) => {
  const db = req.db;
  const role = req.params.role;

  // Map to the capitalized role stored in Firestore
  const roleMap = {
    student: 'Student',
    school: 'School',
    enterprise: 'Enterprise',
  };
  const dbRole = roleMap[role] || role;

  try {
    // Try exact role match first
    let usersSnap = await db
      .collection('Users')
      .where('role', '==', dbRole)
      .limit(1)
      .get();

    // If no users found for school/enterprise, fallback: grab any student
    // and override the session role so the portal still works for demo
    if (usersSnap.empty) {
      usersSnap = await db
        .collection('Users')
        .where('role', '==', 'Student')
        .limit(1)
        .get();

      if (usersSnap.empty) {
        return res.redirect('/login');
      }

      const userDoc = usersSnap.docs[0];
      req.session.user = {
        uid: userDoc.id,
        ...userDoc.data(),
        role: role,                    // Override role for demo
        _demoRole: true,
      };
    } else {
      const userDoc = usersSnap.docs[0];
      req.session.user = {
        uid: userDoc.id,
        ...userDoc.data(),
        role: role,                    // Normalize to lowercase
      };
    }

    switch (role) {
      case 'enterprise':
        return res.redirect('/enterprise');
      case 'school':
        return res.redirect('/school');
      default:
        return res.redirect('/student');
    }
  } catch (err) {
    console.error('Demo login error:', err);
    res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
