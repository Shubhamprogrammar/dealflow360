import type { RequestHandler, Response } from 'express';
import { logger } from '../config/logger.js';
import { AuditLogModel } from '../modules/audit-logs/audit-log.model.js';
import type { AuditAction, AuditEntityType } from '../types/domain.types.js';

/**
 * Only the entities the AuditLog enum covers are recorded. Configuration collections
 * (discount tiers, warehouses, subscription plans, users) are outside that enum and are skipped.
 */
const ENTITY_BY_SEGMENT: Record<string, AuditEntityType> = {
  products: 'product',
  customers: 'customer',
  quotations: 'quotation',
  orders: 'order',
  invoices: 'invoice',
  approvals: 'approval',
};

const ACTION_BY_METHOD: Record<string, AuditAction> = {
  POST: 'created',
  PUT: 'updated',
  PATCH: 'updated',
  DELETE: 'deleted',
};

/** A trailing verb outranks the method, so approving a quotation is not logged as "created". */
const ACTION_BY_VERB: Record<string, AuditAction> = {
  approve: 'approved',
  reject: 'rejected',
  send: 'sent',
};

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// AGENT.md forbids logging credentials, and request bodies reach this middleware verbatim.
const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'portalpassword',
  'portalpasswordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'magiclinktoken',
  'authorization',
]);

const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      REDACTED_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(item, depth + 1),
    ]),
  );
};

const segments = (path: string): string[] => path.split('/').filter(Boolean);

const resolveAction = (method: string, parts: string[]): AuditAction | undefined => {
  const verb = parts[parts.length - 1];
  if (verb && ACTION_BY_VERB[verb]) return ACTION_BY_VERB[verb];
  return ACTION_BY_METHOD[method];
};

const readEntityId = (payload: unknown, parts: string[]): string | undefined => {
  const data = (payload as { data?: Record<string, unknown> } | undefined)?.data;
  // res.json receives the Mongoose document, so _id is an ObjectId rather than a string here.
  const fromBody = String(data?._id ?? data?.id ?? '');
  if (OBJECT_ID.test(fromBody)) return fromBody;
  // Falls back to the path for handlers that answer 204, which carry no body.
  return [...parts].reverse().find((part) => OBJECT_ID.test(part));
};

export const audit: RequestHandler = (req, res, next) => {
  const parts = segments(req.path);
  const entityType = parts[0] ? ENTITY_BY_SEGMENT[parts[0]] : undefined;
  const action = resolveAction(req.method, parts);
  if (!entityType || !action) return next();

  let payload: unknown;
  const json = res.json.bind(res);
  res.json = (body: unknown): Response => {
    payload = body;
    return json(body);
  };

  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    const entityId = readEntityId(payload, parts);
    if (!entityId) return;

    const changes = req.method === 'DELETE' ? undefined : redact(req.body);
    // Auditing must never fail the request it is recording, so the write is fire-and-forget.
    void AuditLogModel.create({
      entityType,
      entityId,
      action,
      performedBy: req.user?.id,
      changes,
      ipAddress: req.ip,
      timestamp: new Date(),
    }).catch((error: unknown) => {
      logger.error({ err: error, requestId: req.id }, 'Failed to write audit log');
    });
  });

  next();
};
