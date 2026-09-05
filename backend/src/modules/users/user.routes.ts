import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createUser, getUser } from './user.controller.js';
import { createUserSchema, userIdSchema } from './user.validation.js';
export const userRoutes = Router();
userRoutes.post('/', validate(createUserSchema), asyncHandler(createUser));
userRoutes.get('/:id', authenticate, validate(userIdSchema), asyncHandler(getUser));
