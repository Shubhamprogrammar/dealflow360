import { Router } from 'express';

import { healthRoutes } from './health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { productRoutes } from '../modules/products/product.routes.js';
import { pricelistRoutes } from '../modules/pricelists/pricelist.routes.js';
import { quotationRoutes } from '../modules/quotations/quotation.routes.js';
import { approvalRoutes } from '../modules/approvals/approval.routes.js';
import { orderRoutes } from '../modules/orders/order.routes.js';
import { auditLogRoutes } from '../modules/audit-logs/audit-log.routes.js';
import { audit } from '../middleware/audit.middleware.js';

export const routes = Router();

// Registered before the feature routers so it can observe every create, update and delete.
routes.use(audit);
routes.use(healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/products', productRoutes);
routes.use('/pricelists', pricelistRoutes);
routes.use('/quotations', quotationRoutes);
routes.use('/approvals', approvalRoutes);
routes.use('/orders', orderRoutes);
routes.use('/audit-logs', auditLogRoutes);
