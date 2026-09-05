import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { authService } from './auth.service.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  sendSuccess(res, 200, 'Login successful', await authService.login(email, password));
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  sendSuccess(res, 200, 'Token refreshed successfully', await authService.refresh(refreshToken));
};

export const me = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, 'Current user fetched successfully', await authService.me(req.user!.id));
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, 'Logout successful', null);
};

export const requestMagicLink = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  const result = await authService.requestMagicLink(email);
  sendSuccess(res, 202, 'If the email is registered, a portal link has been sent', result);
};

export const verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
  const token = req.params.token as string;
  sendSuccess(res, 200, 'Magic link verified', await authService.verifyMagicLink(token));
};

export const customerLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  sendSuccess(res, 200, 'Login successful', await authService.customerLogin(email, password));
};
