export type AuthTokens = { accessToken: string; refreshToken?: string };
export type MagicLinkResult = { expiresAt: Date };
export type CustomerSession = { accessToken: string; customerId: string; companyName: string };
