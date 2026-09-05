import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  adjustStock,
  createWarehouse,
  getStock,
  listWarehouses,
  setStock,
  transferStock,
  updateWarehouse,
} from './warehouse.controller.js';
import {
  adjustStockSchema,
  createWarehouseSchema,
  listWarehousesSchema,
  setStockSchema,
  stockLevelSchema,
  transferStockSchema,
  updateWarehouseSchema,
} from './warehouse.validation.js';

export const warehouseRoutes = Router();
const canManage = authorize('admin', 'sales_manager');

warehouseRoutes.use(authenticate);

// Registered before the `/:id` routes so the literal segment is never read as an id.
warehouseRoutes.post(
  '/transfer',
  canManage,
  validate(transferStockSchema),
  asyncHandler(transferStock),
);

warehouseRoutes.post(
  '/',
  canManage,
  validate(createWarehouseSchema),
  asyncHandler(createWarehouse),
);
warehouseRoutes.get('/', validate(listWarehousesSchema), asyncHandler(listWarehouses));
warehouseRoutes.put(
  '/:id',
  canManage,
  validate(updateWarehouseSchema),
  asyncHandler(updateWarehouse),
);
warehouseRoutes.post('/:id/stock', canManage, validate(setStockSchema), asyncHandler(setStock));
warehouseRoutes.get('/:id/stock/:productId', validate(stockLevelSchema), asyncHandler(getStock));
warehouseRoutes.put(
  '/:id/stock/:productId',
  canManage,
  validate(adjustStockSchema),
  asyncHandler(adjustStock),
);
