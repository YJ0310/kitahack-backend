// ─────────────────────────────────────────────────────────────────────────────
// Teh Ais Backend — Main Server Entry Point
// Vertex AI (Gemini) + Firestore powered university collaboration platform
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');

// ─── Route imports ───────────────────────────────────────────────────────────
const usersRoutes    = require('./routes/users.routes');
const tagsRoutes     = require('./routes/tags.routes');
const postsRoutes    = require('./routes/posts.routes');
const matchesRoutes  = require('./routes/matches.routes');
const eventsRoutes   = require('./routes/events.routes');
const chatsRoutes    = require('./routes/chats.routes');
const insightsRoutes = require('./routes/insights.routes');
const storageRoutes  = require('./routes/storage.routes');

// ─── App Setup ───────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy — required for Cloud Run / Firebase App Hosting behind load balancer
// Fixes express-rate-limit X-Forwarded-For validation error
app.set('trust proxy', true);

// ─── Global Middleware ───────────────────────────────────────────────────────
// Disable CSP entirely — Flutter Web (WASM) + Google Fonts + Firebase Auth
// all require very permissive policies; helmet's default CSP breaks them.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow the Flutter frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL    || 'http://localhost:8080',
    process.env.PRODUCTION_URL  || 'https://kitahack-app--kitahack-tehais.us-central1.hosted.app',
    'https://kitahack-app--kitahack-tehais.us-central1.hosted.app',
    'https://kitahack-tehais.web.app',
    'https://kitahack-tehais.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:8080',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-UID'],
  credentials: true,
}));

// Rate limiting — 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  // Disable the strict trust-proxy validation so it works both locally and behind Cloud Run proxy
  validate: { trustProxy: false, xForwardedForHeader: false },
});
app.use('/api/', limiter);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/users',    usersRoutes);
app.use('/api/tags',     tagsRoutes);
app.use('/api/posts',    postsRoutes);
app.use('/api/matches',  matchesRoutes);
app.use('/api/events',   eventsRoutes);
app.use('/api/chats',    chatsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/storage',  storageRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kitahack-tehais-backend',
    timestamp: new Date().toISOString(),
    vertex_model: require('./config/vertex').MODEL_ID,
  });
});

// ─── API Info ────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name: 'Teh Ais Backend API',
    version: '1.0.0',
    description: 'Vertex AI (Gemini) + Firestore powered university collaboration platform',
    endpoints: {
      health:   'GET  /api/health',
      users: {
        profile:       'GET  /api/users/profile',
        getUser:       'GET  /api/users/:uid',
        updateProfile: 'PUT  /api/users/profile',
        patchProfile:  'PATCH /api/users/profile',
        autoTag:       'POST /api/users/auto-tag',
        applyTags:     'POST /api/users/apply-tags',
      },
      tags: {
        list:     'GET  /api/tags?category=0|1|2|3',
        get:      'GET  /api/tags/:id',
        create:   'POST /api/tags',
      },
      posts: {
        list:              'GET  /api/posts',
        mine:              'GET  /api/posts/mine',
        get:               'GET  /api/posts/:id',
        create:            'POST /api/posts',
        autoTag:           'POST /api/posts/auto-tag',
        createFromDesc:    'POST /api/posts/create-from-description',
        update:            'PUT  /api/posts/:id',
        close:             'POST /api/posts/:id/close',
      },
      matches: {
        mine:            'GET  /api/matches/mine',
        byPost:          'GET  /api/matches/post/:postId',
        findCandidates:  'POST /api/matches/find-candidates',
        apply:           'POST /api/matches/apply',
        accept:          'POST /api/matches/:matchId/accept',
        reject:          'POST /api/matches/:matchId/reject',
        autoPair:        'POST /api/matches/auto-pair',
        smartSearch:     'POST /api/matches/smart-search',
      },
      events: {
        list:          'GET  /api/events?type=&upcoming=true',
        get:           'GET  /api/events/:id',
        create:        'POST /api/events',
        update:        'PUT  /api/events/:id',
        recommend:     'POST /api/events/recommend',
        search:        'POST /api/events/search',
        join:          'POST /api/events/:id/join',
        participants:  'GET  /api/events/:id/participants',
        aiInvite:      'POST /api/events/:id/ai-invite',
      },
      chats: {
        list:     'GET  /api/chats',
        get:      'GET  /api/chats/:chatId',
        messages: 'GET  /api/chats/:chatId/messages',
        send:     'POST /api/chats/:chatId/messages',
        read:     'POST /api/chats/:chatId/read',
        expire:   'POST /api/chats/expire',
      },
      insights: {
        get: 'GET /api/insights',
      },
    },
  });
});

// ─── 404 for API routes ──────────────────────────────────────────────────────
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Serve Flutter Web Build (App Hosting) ───────────────────────────────────
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, {
  setHeaders: (res, filePath) => {
    // Prevent caching of index.html so CSP / SW updates propagate immediately
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// SPA fallback — serve index.html for all non-API routes (client-side routing)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  Teh Ais Backend running on http://localhost:' + PORT);
  console.log('  API docs at http://localhost:' + PORT + '/api');
  console.log('  Health check at http://localhost:' + PORT + '/api/health');
  console.log('  Vertex AI model: ' + (process.env.GEMINI_MODEL || 'gemini-2.5-flash'));
  console.log('');
});

module.exports = app;
