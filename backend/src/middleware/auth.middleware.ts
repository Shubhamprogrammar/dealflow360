import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';
import { isCustomerPayload, isStaffPayload, verifyAccessToken } from '../utils/jwt.js';

const readBearerToken = (header?: string): string => {
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  if (!token) throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
  return token;
};

export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    const payload = verifyAccessToken(readBearerToken(req.header('authorization')));
    if (!isStaffPayload(payload) || payload.type !== 'access')
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
};

export const authenticateCustomer: RequestHandler = (req, _res, next) => {
  try {
    const payload = verifyAccessToken(readBearerToken(req.header('authorization')));
    if (!isCustomerPayload(payload))
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED');
    req.customer = { id: payload.sub };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
};
