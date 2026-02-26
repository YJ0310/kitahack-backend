// ─── Error Handler Middleware ──────────────────────────────────────────────────

function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.stack || err.message || err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
