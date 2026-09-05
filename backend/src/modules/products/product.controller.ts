import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { productService } from './product.service.js';
import type { ListProductsQuery } from './product.types.js';

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, 'Product created successfully', await productService.create(req.body));
};

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  const { products, pagination } = await productService.list(
    req.query as unknown as ListProductsQuery,
  );
  sendSuccess(res, 200, 'Products fetched successfully', products, pagination);
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.getById(req.params.id as string);
  sendSuccess(res, 200, 'Product fetched successfully', product);
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.update(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Product updated successfully', product);
};

export const deactivateProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.deactivate(req.params.id as string);
  sendSuccess(res, 200, 'Product deactivated successfully', product);
};

export const addVariant = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.addVariant(req.params.id as string, req.body);
  sendSuccess(res, 201, 'Variant added successfully', product);
};

export const updateVariant = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.updateVariant(
    req.params.id as string,
    req.params.variantId as string,
    req.body,
  );
  sendSuccess(res, 200, 'Variant updated successfully', product);
};
