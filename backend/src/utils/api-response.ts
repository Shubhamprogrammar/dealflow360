import type { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  pagination?: object,
): Response =>
  res
    .status(statusCode)
    .json({ success: true, message, data, ...(pagination ? { pagination } : {}) });
