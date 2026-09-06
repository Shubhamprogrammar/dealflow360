import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
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
import { buildMagicLinkEmail } from './magic-link-email.js';
import { MagicLinkTokenModel } from './magic-link-token.model.js';
import type { AuthTokens, CustomerSession } from './auth.types.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const invalidCredentials = (): ApiError =>
  new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

// Portal home the verified customer lands on. Kept here so both the API
// response and any future caller agree on one target.
const PORTAL_REDIRECT = '/portal';

/**
 * Mint a fresh single-use magic-link token for a customer and email the link.
 * The only place customer magic links are created -- self-serve "request link"
 * calls this, and any future system trigger (e.g. quotation sent to customer)
 * can call it too rather than re-implementing token generation.
 */
export const issueMagicLink = async (customerId: string, contactEmail: string, companyName: string): Promise<void> => {
  const rawToken = randomBytes(MAGIC_LINK_TOKEN_BYTES).toString('hex');
  const ttlMinutes = env.MAGIC_LINK_TTL_MINUTES;

  await MagicLinkTokenModel.create({
    customer: customerId,
    token: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    used: false,
  });

  const link = `${env.PORTAL_BASE_URL}/verify?token=${rawToken}`;

  // Dev convenience: the link is always in the server logs so the flow can be
  // tested without opening the mailbox.
  logger.info({ to: contactEmail, link }, 'Magic link issued');

  await enqueueEmail(buildMagicLinkEmail({ to: contactEmail, companyName, link, ttlMinutes }));
};

export const authService = {
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

  // Self-serve: customer asks for a sign-in link. The response is identical
  // whether or not the email matched a customer, so it can't be used to probe
  // which emails are registered.
  requestMagicLink: async (email: string): Promise<void> => {
    const customer = await CustomerModel.findOne({ contactEmail: email.toLowerCase() }).exec();
    if (!customer) return;
    await issueMagicLink(customer._id.toString(), customer.contactEmail, customer.companyName);
  },

  verifyMagicLink: async (rawToken: string): Promise<CustomerSession & { redirect: string }> => {
    const record = await MagicLinkTokenModel.findOne({ token: hashToken(rawToken) }).exec();
    const linkInvalid = new ApiError(
      401,
      'This link is invalid or has expired.',
      'INVALID_MAGIC_LINK',
    );
    if (!record || record.used || record.expiresAt.getTime() < Date.now()) throw linkInvalid;

    record.used = true;
    await record.save();

    const customer = await CustomerModel.findById(record.customer).exec();
    if (!customer) throw linkInvalid;

    return {
      accessToken: signCustomerAccessToken(customer._id.toString()),
      customerId: customer._id.toString(),
      companyName: customer.companyName,
      redirect: PORTAL_REDIRECT,
    };
  },
};
