import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  assignRep,
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customer.controller.js';
import {
  assignRepSchema,
  createCustomerSchema,
  customerIdSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from './customer.validation.js';

export const customerRoutes = Router();

// Reps own their accounts and need to create and maintain them for the quotation builder,
// but moving an account to a different rep stays with admins and managers.
const canManage = authorize('admin', 'sales_manager', 'sales_rep');
const canAssign = authorize('admin', 'sales_manager');

customerRoutes.use(authenticate);

customerRoutes.post('/', canManage, validate(createCustomerSchema), asyncHandler(createCustomer));
customerRoutes.get('/', validate(listCustomersSchema), asyncHandler(listCustomers));
customerRoutes.get('/:id', validate(customerIdSchema), asyncHandler(getCustomer));
customerRoutes.put('/:id', canManage, validate(updateCustomerSchema), asyncHandler(updateCustomer));
customerRoutes.put(
  '/:id/assign-rep',
  canAssign,
  validate(assignRepSchema),
  asyncHandler(assignRep),
);
