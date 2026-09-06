import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  customerLogin,
  login,
  logout,
  me,
  refresh,
  requestMagicLink,
  verifyMagicLink,
  registerCustomer,
} from './auth.controller.js';
import {
  customerLoginSchema,
  customerRegisterSchema,
  loginSchema,
  magicLinkSchema,
  magicLinkTokenSchema,
  refreshSchema,
} from './auth.validation.js';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), asyncHandler(login));
authRoutes.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
authRoutes.get('/me', authenticate, asyncHandler(me));
authRoutes.post('/logout', asyncHandler(logout));

authRoutes.post('/customer/magic-link', validate(magicLinkSchema), asyncHandler(requestMagicLink));
authRoutes.get(
  '/customer/verify/:token',
  validate(magicLinkTokenSchema),
  asyncHandler(verifyMagicLink),
);
authRoutes.post('/customer/login', validate(customerLoginSchema), asyncHandler(customerLogin));
authRoutes.post('/customer/register', validate(customerRegisterSchema), asyncHandler(registerCustomer));
