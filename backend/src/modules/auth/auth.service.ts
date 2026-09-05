import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { env } from '../../config/env.js';
import { enqueueEmail } from '../../jobs/jobs.js';
import { ApiError } from '../../utils/api-error.js';
import {
  isStaffPayload,
  signAccessToken,
  signCustomerAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { CustomerModel } from '../customers/customer.model.js';
import { UserModel } from '../users/user.model.js';
import { userService } from '../users/user.service.js';
import type { UserView } from '../users/user.types.js';
import { MAGIC_LINK_TOKEN_BYTES } from './auth.constants.js';
import type { AuthTokens, CustomerSession, MagicLinkResult, RegisterInput } from './auth.types.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const invalidCredentials = (): ApiError =>
  new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

export const authService = {
  register: async (input: RegisterInput): Promise<UserView> => userService.create(input),

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const user = await UserModel.findOne({ email }).select('+passwordHash').exec();
    if (!user) throw invalidCredentials();
    if (!(await argon2.verify(user.passwordHash, password))) throw invalidCredentials();
    if (!user.isActive) throw new ApiError(403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED');
    const payload = { sub: user._id.toString(), role: user.role };
    return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
  },

  refresh: async (token: string): Promise<AuthTokens> => {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
    if (!isStaffPayload(payload) || payload.type !== 'refresh')
      throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    const user = await UserModel.findById(payload.sub).exec();
    if (!user?.isActive)
      throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    return { accessToken: signAccessToken({ sub: user._id.toString(), role: user.role }) };
  },

  me: async (userId: string): Promise<UserView> => userService.getById(userId),

  requestMagicLink: async (contactEmail: string): Promise<MagicLinkResult> => {
    const expiresAt = new Date(Date.now() + env.MAGIC_LINK_TTL_MINUTES * 60_000);
    const customer = await CustomerModel.findOne({ contactEmail }).exec();
    if (customer) {
      const token = randomBytes(MAGIC_LINK_TOKEN_BYTES).toString('hex');
      customer.magicLinkToken = hashToken(token);
      customer.magicLinkExpiry = expiresAt;
      await customer.save();
      await enqueueEmail({
        to: customer.contactEmail,
        subject: 'Your DealFlow360 portal link',
        text: `Open your quotation portal: ${env.PORTAL_BASE_URL}/verify/${token}\n\nThis link expires in ${String(env.MAGIC_LINK_TTL_MINUTES)} minutes.`,
      });
    }
    return { expiresAt };
  },

  verifyMagicLink: async (token: string): Promise<CustomerSession> => {
    const customer = await CustomerModel.findOne({ magicLinkToken: hashToken(token) })
      .select('+magicLinkToken +magicLinkExpiry')
      .exec();
    if (!customer?.magicLinkExpiry || customer.magicLinkExpiry.getTime() < Date.now())
      throw new ApiError(401, 'Magic link is invalid or expired', 'INVALID_MAGIC_LINK');
    customer.magicLinkToken = undefined;
    customer.magicLinkExpiry = undefined;
    await customer.save();
    return {
      accessToken: signCustomerAccessToken(customer._id.toString()),
      customerId: customer._id.toString(),
      companyName: customer.companyName,
    };
  },

  customerLogin: async (contactEmail: string, password: string): Promise<CustomerSession> => {
    const customer = await CustomerModel.findOne({ contactEmail })
      .select('+portalPasswordHash')
      .exec();
    if (!customer?.portalPasswordHash) throw invalidCredentials();
    if (!(await argon2.verify(customer.portalPasswordHash, password))) throw invalidCredentials();
    return {
      accessToken: signCustomerAccessToken(customer._id.toString()),
      customerId: customer._id.toString(),
      companyName: customer.companyName,
    };
  },
};
