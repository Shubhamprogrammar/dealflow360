import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
export const routes = Router();
routes.use(healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
