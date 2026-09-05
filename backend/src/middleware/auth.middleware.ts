import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    const token = req.header('authorization')?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new Error('wrong token');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
};
