import type { RequestHandler } from 'express';
import type { Role } from '../types/common.types.js';
import { ApiError } from '../utils/api-error.js';
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return next(new ApiError(403, 'Insufficient permissions', 'FORBIDDEN'));
    next();
  };
