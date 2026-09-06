import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/api-error.js';

type ValidatedRequest = { body: unknown; params: unknown; query: unknown };

// Express 5 exposes `query` (and `params`) as getter-only accessors on the prototype,
// so validated values have to be redefined on the request rather than assigned.
const applyValidated = (req: Request, key: keyof ValidatedRequest, value: unknown): void => {
  Object.defineProperty(req, key, { value, writable: true, enumerable: true, configurable: true });
};

export const validate =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse({
      // Express 5 leaves `body` undefined when a request carries no payload (e.g. GET),
      // which would fail schemas that declare an empty object body.
      body: req.body ?? {},
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    if (!result.success)
      return next(new ApiError(400, 'Request validation failed', 'VALIDATION_ERROR'));
    const data = result.data as ValidatedRequest;
    applyValidated(req, 'body', data.body);
    applyValidated(req, 'params', data.params);
    applyValidated(req, 'query', data.query);
    next();
  };
