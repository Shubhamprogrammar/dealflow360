import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createUser, getUser, getUsers } from './user.controller.js';
import { createUserSchema, userIdSchema } from './user.validation.js';
export const userRoutes = Router();

userRoutes.get('/', authenticate, authorize('admin'), asyncHandler(getUsers));

userRoutes.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createUserSchema),
  asyncHandler(createUser),
);
userRoutes.get('/:id', authenticate, validate(userIdSchema), asyncHandler(getUser));
