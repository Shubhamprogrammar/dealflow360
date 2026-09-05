import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { login, logout, refresh } from './auth.controller.js';
import { loginSchema, refreshSchema } from './auth.validation.js';
export const authRoutes = Router();
authRoutes.post('/login', validate(loginSchema), asyncHandler(login));
authRoutes.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
authRoutes.post('/logout', asyncHandler(logout));
