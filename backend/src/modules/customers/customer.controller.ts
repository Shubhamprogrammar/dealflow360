import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { customerService } from './customer.service.js';
import type { ListCustomersQuery } from './customer.types.js';

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, 'Customer created successfully', await customerService.create(req.body));
};

export const listCustomers = async (req: Request, res: Response): Promise<void> => {
  const { customers, pagination } = await customerService.list(
    req.query as unknown as ListCustomersQuery,
  );
  sendSuccess(res, 200, 'Customers fetched successfully', customers, pagination);
};

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  const customer = await customerService.getById(req.params.id as string);
  sendSuccess(res, 200, 'Customer fetched successfully', customer);
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  const customer = await customerService.update(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Customer updated successfully', customer);
};

export const assignRep = async (req: Request, res: Response): Promise<void> => {
  const customer = await customerService.assignRep(
    req.params.id as string,
    req.body.assignedRep as string,
  );
  sendSuccess(res, 200, 'Sales rep assigned successfully', customer);
};
