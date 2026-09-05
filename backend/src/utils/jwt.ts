import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../types/common.types.js';

export type StaffTokenPayload = { sub: string; role: Role; type: 'access' | 'refresh' };
export type CustomerTokenPayload = { sub: string; type: 'customer_access' };
export type TokenPayload = StaffTokenPayload | CustomerTokenPayload;

export const signAccessToken = (payload: Omit<StaffTokenPayload, 'type'>): string =>
  jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const signRefreshToken = (payload: Omit<StaffTokenPayload, 'type'>): string =>
  jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const signCustomerAccessToken = (customerId: string): string =>
  jwt.sign({ sub: customerId, type: 'customer_access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_CUSTOMER_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

export const isStaffPayload = (payload: TokenPayload): payload is StaffTokenPayload =>
  payload.type === 'access' || payload.type === 'refresh';

export const isCustomerPayload = (payload: TokenPayload): payload is CustomerTokenPayload =>
  payload.type === 'customer_access';
