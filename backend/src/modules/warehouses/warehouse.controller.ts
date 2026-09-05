import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { warehouseService } from './warehouse.service.js';
import type { ListWarehousesQuery } from './warehouse.types.js';

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, 'Warehouse created successfully', await warehouseService.create(req.body));
};

export const listWarehouses = async (req: Request, res: Response): Promise<void> => {
  const { warehouses, pagination } = await warehouseService.list(
    req.query as unknown as ListWarehousesQuery,
  );
  sendSuccess(res, 200, 'Warehouses fetched successfully', warehouses, pagination);
};

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  const warehouse = await warehouseService.update(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Warehouse updated successfully', warehouse);
};

export const setStock = async (req: Request, res: Response): Promise<void> => {
  const { warehouse, created } = await warehouseService.setStock(req.params.id as string, req.body);
  sendSuccess(
    res,
    created ? 201 : 200,
    created ? 'Stock level added successfully' : 'Stock level updated successfully',
    warehouse,
  );
};

export const getStock = async (req: Request, res: Response): Promise<void> => {
  const stock = await warehouseService.getStock(
    req.params.id as string,
    req.params.productId as string,
  );
  sendSuccess(res, 200, 'Stock level fetched successfully', stock);
};

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  const stock = await warehouseService.adjustStock(
    req.params.id as string,
    req.params.productId as string,
    req.body,
  );
  sendSuccess(res, 200, 'Stock level adjusted successfully', stock);
};

export const transferStock = async (req: Request, res: Response): Promise<void> => {
  await warehouseService.transfer(req.body);
  sendSuccess(res, 200, 'Stock transferred successfully', null);
};
