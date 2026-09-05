import { Router } from 'express';

import { healthRoutes } from './health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { productRoutes } from '../modules/products/product.routes.js';
import { pricelistRoutes } from '../modules/pricelists/pricelist.routes.js';
import { discountTierRoutes } from '../modules/discount-tiers/discount-tier.routes.js';
import { warehouseRoutes } from '../modules/warehouses/warehouse.routes.js';
import { subscriptionPlanRoutes } from '../modules/subscription-plans/subscription-plan.routes.js';
import { customerRoutes } from '../modules/customers/customer.routes.js';
import { reportRoutes } from '../modules/reports/report.routes.js';
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
routes.use('/discount-tiers', discountTierRoutes);
routes.use('/warehouses', warehouseRoutes);
routes.use('/subscription-plans', subscriptionPlanRoutes);
routes.use('/customers', customerRoutes);
routes.use('/reports', reportRoutes);
routes.use('/audit-logs', auditLogRoutes);
routes.use('/quotations', quotationRoutes);
routes.use('/approvals', approvalRoutes);
routes.use('/orders', orderRoutes);
