// ─── Firebase Storage Routes ──────────────────────────────────────────────────
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { admin } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');

const router  = express.Router();
const upload  = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|gif|webp|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('File type not allowed'), ext && mime);
  },
});

/**
 * POST /api/storage/upload
 * Upload a file to Firebase Storage.
 * Query param: folder (default: "uploads")
 * Body: multipart/form-data with field "file"
 * Returns: { url, filename, contentType, size }
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const bucket  = admin.storage().bucket();
    const folder  = (req.query.folder || 'uploads').replace(/[^a-z0-9_/-]/gi, '');
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${folder}/${req.uid}/${Date.now()}_${safeName}`;
    const gcsFile  = bucket.file(filename);

    await gcsFile.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: { uploadedBy: req.uid },
      },
    });

    // Generate a long-lived signed URL (10 years)
    const [url] = await gcsFile.getSignedUrl({
      action:  'read',
      expires: '01-01-2036',
    });

    res.json({
      url,
      filename,
      contentType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/storage/file
 * Delete a file from Firebase Storage.
 * Query param: filename (full GCS path, e.g. "uploads/uid/xyz.png")
 */
router.delete('/file', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'filename is required' });

    // Security: ensure the file belongs to the requesting user
    if (!filename.includes(`/${req.uid}/`)) {
      return res.status(403).json({ error: 'Forbidden — not your file' });
    }

    const bucket = admin.storage().bucket();
    await bucket.file(filename).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('[Storage] Delete failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/storage/url
 * Get a fresh signed URL for an existing file.
 * Query param: filename
 */
router.get('/url', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'filename is required' });

    const bucket = admin.storage().bucket();
    const [url]  = await bucket.file(filename).getSignedUrl({
      action:  'read',
      expires: '01-01-2036',
    });
    res.json({ url, filename });
  } catch (error) {
    console.error('[Storage] Get URL failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
