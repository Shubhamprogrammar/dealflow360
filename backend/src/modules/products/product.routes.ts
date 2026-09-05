import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  addVariant,
  createProduct,
  deactivateProduct,
  getProduct,
  listProducts,
  updateProduct,
  updateVariant,
} from './product.controller.js';
import {
  addVariantSchema,
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
  updateVariantSchema,
} from './product.validation.js';

export const productRoutes = Router();
const canManage = authorize('admin', 'sales_manager');

productRoutes.use(authenticate);

productRoutes.post('/', canManage, validate(createProductSchema), asyncHandler(createProduct));
productRoutes.get('/', validate(listProductsSchema), asyncHandler(listProducts));
productRoutes.get('/:id', validate(productIdSchema), asyncHandler(getProduct));
productRoutes.put('/:id', canManage, validate(updateProductSchema), asyncHandler(updateProduct));
productRoutes.delete('/:id', canManage, validate(productIdSchema), asyncHandler(deactivateProduct));
productRoutes.post(
  '/:id/variants',
  canManage,
  validate(addVariantSchema),
  asyncHandler(addVariant),
);
productRoutes.put(
  '/:id/variants/:variantId',
  canManage,
  validate(updateVariantSchema),
  asyncHandler(updateVariant),
);
