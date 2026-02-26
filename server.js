require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const admin = require('firebase-admin');

// ─── Firebase Admin Init ────────────────────────────────
const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ─── Express App ────────────────────────────────────────
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'tehais-secret',
    resave: false,
    saveUninitialized: true,
  })
);

// Make db and session available to routes
app.use((req, res, next) => {
  req.db = db;
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  res.locals.theme = req.session.theme || 'dark';
  next();
});

// ─── Routes ─────────────────────────────────────────────
app.use('/', require('./routes/public'));
app.use('/api', require('./routes/api'));
app.use('/student', require('./routes/student'));
app.use('/school', require('./routes/school'));
app.use('/enterprise', require('./routes/enterprise'));

// Theme toggle API
app.post('/api/toggle-theme', (req, res) => {
  req.session.theme = req.session.theme === 'dark' ? 'light' : 'dark';
  res.json({ theme: req.session.theme });
});

// ─── Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// ─── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍵 Teh Ais server running at http://localhost:${PORT}`);
});
