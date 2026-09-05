/**
 * A minimal OpenAPI 3.0 type surface — enough to typecheck the path modules in `paths/`
 * so a mistyped key or a bad $ref fails the build instead of silently vanishing from the spec.
 */
export type Schema =
  | { $ref: string }
  | {
      type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
      format?: 'email' | 'date-time' | 'uuid' | 'password';
      description?: string;
      example?: unknown;
      default?: unknown;
      enum?: readonly string[];
      minimum?: number;
      maximum?: number;
      minLength?: number;
      maxLength?: number;
      minItems?: number;
      required?: readonly string[];
      properties?: Record<string, Schema>;
      items?: Schema;
      allOf?: readonly Schema[];
    };

export type Content = { 'application/json': { schema: Schema } };

export type Parameter = {
  in: 'path' | 'query' | 'header';
  name: string;
  required?: boolean;
  description?: string;
  schema: Schema;
};

export type Response = { description: string; content?: Content };

export type Operation = {
  tags: readonly [string, ...string[]];
  summary: string;
  description?: string;
  /** Omit entirely for public endpoints — the Postman generator treats a missing block as no-auth. */
  security?: readonly [{ bearerAuth: readonly [] }];
  parameters?: readonly Parameter[];
  requestBody?: { required: boolean; content: Content };
  responses: Record<number, Response>;
};

export type PathItem = Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', Operation>>;

export type Paths = Record<string, PathItem>;
