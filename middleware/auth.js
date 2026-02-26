// ─── Auth Middleware — Validates Firebase ID Token ────────────────────────────
const { admin } = require('../config/firebase');

const DEV_MODE = process.env.NODE_ENV !== 'production';

/**
 * Middleware: Verify Firebase Auth token from Authorization header.
 * In dev mode, also accepts X-Dev-UID header as bypass.
 * Sets req.uid and req.userToken on success.
 */
async function authMiddleware(req, res, next) {
  try {
    // Dev bypass: accept X-Dev-UID header in non-production
    if (DEV_MODE && req.headers['x-dev-uid']) {
      req.uid = req.headers['x-dev-uid'];
      req.userToken = { uid: req.uid, dev: true };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    req.uid = decoded.uid;
    req.userToken = decoded;

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

/**
 * Middleware: Optional auth — if token is present, decode it; otherwise continue.
 * Useful for public endpoints that can optionally personalize results.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.uid = decoded.uid;
      req.userToken = decoded;
    }
  } catch {
    // silently ignore — auth is optional
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
