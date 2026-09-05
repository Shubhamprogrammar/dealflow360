import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { login, logout, me, refresh, requestMagicLink, verifyMagicLink } from './auth.controller.js';
import {
  loginSchema,
  magicLinkSchema,
  magicLinkVerifySchema,
  refreshSchema,
} from './auth.validation.js';

export const authRoutes = Router();

// Staff auth (email + password) -- unrelated to customer auth below.
authRoutes.post('/login', validate(loginSchema), asyncHandler(login));
authRoutes.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
authRoutes.get('/me', authenticate, asyncHandler(me));
authRoutes.post('/logout', asyncHandler(logout));

// Customer portal auth -- magic link only. No password, no signup.
authRoutes.post(
  '/customer/request-link',
  validate(magicLinkSchema),
  asyncHandler(requestMagicLink),
);
authRoutes.get(
  '/customer/verify',
  validate(magicLinkVerifySchema),
  asyncHandler(verifyMagicLink),
);
