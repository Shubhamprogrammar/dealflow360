import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../utils/api-response.js';
export const login = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(
    res,
    200,
    'Login successful',
    await authService.login(req.body.email, req.body.password),
  );
};
export const refresh = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(
    res,
    200,
    'Token refreshed successfully',
    await authService.refresh(req.body.refreshToken),
  );
};
export const logout = async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, 'Logout successful', null);
};
