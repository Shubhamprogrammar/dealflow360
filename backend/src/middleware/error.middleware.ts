import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const known = error instanceof ApiError;
  const status = known
    ? error.statusCode
    : error instanceof mongoose.Error.ValidationError
      ? 400
      : 500;
  const code = known ? error.code : status === 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR';
  if (status >= 500) logger.error({ err: error, requestId: req.id }, 'Unhandled error');
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : error.message,
    error: { code },
  });
};
