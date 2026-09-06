import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { userService } from './user.service.js';
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const users = await userService.list();
  sendSuccess(res, 200, 'Users fetched successfully', users);
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.create(req.body);
  sendSuccess(res, 201, 'User created successfully', user);
};
export const getUser = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getById(req.params.id as string);
  sendSuccess(res, 200, 'User fetched successfully', user);
};
