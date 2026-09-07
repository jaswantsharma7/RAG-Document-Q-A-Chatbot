import { logger } from "./logger.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack });

  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "An unexpected error occurred.",
  });
}
