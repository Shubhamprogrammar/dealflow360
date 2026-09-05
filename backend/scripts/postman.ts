/**
 * Generates a Postman v2.1 collection from the OpenAPI spec so the two can never drift.
 * Run with `npm run postman` after adding or changing a route.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { swaggerSpec } from '../src/docs/swagger.js';

type Json = { [key: string]: unknown };

/** The spec is untyped at the edges, so every traversal step is narrowed rather than cast. */
const obj = (value: unknown): Json =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const spec = obj(swaggerSpec);
const here = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(here, '../docs/dealflow360.postman_collection.json');

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

/**
 * Path params are bound to collection variables so ids set by one request feed the next.
 * Keyed by path then param name, since a path can carry two ids that map to different variables.
 */
const PATH_VARIABLE: Record<string, Record<string, string>> = {
  '/users/{id}': { id: 'userId' },
  '/products/{id}': { id: 'productId' },
  '/products/{id}/variants': { id: 'productId' },
  '/products/{id}/variants/{variantId}': { id: 'productId', variantId: 'variantId' },
  '/pricelists/tier/{tierName}': { tierName: 'tierName' },
  '/auth/customer/verify/{token}': { token: 'magicLinkToken' },
  '/discount-tiers/{id}': { id: 'discountTierId' },
  '/discount-tiers/{id}/category-limits': { id: 'discountTierId' },
  '/discount-tiers/{id}/approval-chain': { id: 'discountTierId' },
  '/warehouses/{id}': { id: 'warehouseId' },
  '/warehouses/{id}/stock': { id: 'warehouseId' },
  '/warehouses/{id}/stock/{productId}': { id: 'warehouseId', productId: 'productId' },
  '/subscription-plans/{id}': { id: 'subscriptionPlanId' },
  '/subscription-plans/{id}/proration': { id: 'subscriptionPlanId' },
  '/subscription-plans/{id}/cancellation': { id: 'subscriptionPlanId' },
  '/customers/{id}': { id: 'customerId' },
  '/customers/{id}/assign-rep': { id: 'customerId' },
};

/** Fixed so regenerating the collection produces no spurious diff. */
const DATE_EXAMPLE: Record<string, string> = {
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2026-12-31T23:59:59.000Z',
};

/** Scripts that carry state between requests, keyed by `METHOD path`. */
const TESTS: Record<string, string[]> = {
  'POST /auth/login': [
    'const body = pm.response.json();',
    'if (body.data && body.data.accessToken) {',
    "  pm.collectionVariables.set('accessToken', body.data.accessToken);",
    "  pm.collectionVariables.set('refreshToken', body.data.refreshToken || '');",
    '}',
  ],
  'POST /auth/refresh': [
    'const body = pm.response.json();',
    "if (body.data && body.data.accessToken) pm.collectionVariables.set('accessToken', body.data.accessToken);",
  ],
  'POST /users': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('userId', id);",
  ],
  'GET /auth/customer/verify/{token}': [
    'const body = pm.response.json();',
    "if (body.data && body.data.accessToken) pm.collectionVariables.set('customerToken', body.data.accessToken);",
  ],
  'POST /auth/customer/login': [
    'const body = pm.response.json();',
    "if (body.data && body.data.accessToken) pm.collectionVariables.set('customerToken', body.data.accessToken);",
  ],
  'POST /products': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('productId', id);",
  ],
  'GET /products': [
    'const first = (pm.response.json().data || [])[0];',
    "if (first && first._id) pm.collectionVariables.set('productId', first._id);",
  ],
  'POST /products/{id}/variants': [
    'const body = pm.response.json();',
    'const variants = (body.data && body.data.variants) || [];',
    'const last = variants[variants.length - 1];',
    "if (last && last._id) pm.collectionVariables.set('variantId', last._id);",
  ],
  'POST /pricelists': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('priceListId', id);",
  ],
  'POST /discount-tiers': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('discountTierId', id);",
  ],
  'GET /discount-tiers': [
    'const first = (pm.response.json().data || [])[0];',
    "if (first && first._id) pm.collectionVariables.set('discountTierId', first._id);",
  ],
  'POST /warehouses': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('warehouseId', id);",
  ],
  'GET /warehouses': [
    'const list = pm.response.json().data || [];',
    "if (list[0] && list[0]._id) pm.collectionVariables.set('warehouseId', list[0]._id);",
    "if (list[0] && list[0]._id) pm.collectionVariables.set('fromWarehouseId', list[0]._id);",
    "if (list[1] && list[1]._id) pm.collectionVariables.set('toWarehouseId', list[1]._id);",
  ],
  'POST /subscription-plans': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('subscriptionPlanId', id);",
  ],
  'GET /subscription-plans': [
    'const first = (pm.response.json().data || [])[0];',
    "if (first && first._id) pm.collectionVariables.set('subscriptionPlanId', first._id);",
  ],
  'POST /customers': [
    'const body = pm.response.json();',
    'const id = body.data && (body.data._id || body.data.id);',
    "if (id) pm.collectionVariables.set('customerId', id);",
  ],
  'GET /customers': [
    'const first = (pm.response.json().data || [])[0];',
    "if (first && first._id) pm.collectionVariables.set('customerId', first._id);",
  ],
  'GET /pricelists': [
    'const first = (pm.response.json().data || [])[0];',
    "if (first && first._id) pm.collectionVariables.set('priceListId', first._id);",
  ],
};

/** Resolves $ref pointers and flattens allOf so the sampler sees a plain schema. */
const deref = (node: unknown): Json => {
  const schema = obj(node);
  const ref = str(schema.$ref);
  if (ref) {
    const target = ref
      .replace(/^#\//, '')
      .split('/')
      .reduce<unknown>((acc, key) => obj(acc)[key], spec);
    return deref(target);
  }
  if (Array.isArray(schema.allOf)) {
    const properties: Json = {};
    const required: unknown[] = [];
    for (const part of schema.allOf.map(deref)) {
      Object.assign(properties, obj(part.properties));
      required.push(...arr(part.required));
    }
    return { type: 'object', properties, required };
  }
  return schema;
};

/** Builds a realistic request body from a schema, favouring documented examples. */
const sample = (rawSchema: unknown, depth = 0, property = ''): unknown => {
  const schema = deref(rawSchema);
  if (depth > 6) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum)) return schema.enum[0];

  switch (schema.type) {
    case 'object': {
      const out: Json = {};
      for (const [key, value] of Object.entries(obj(schema.properties))) {
        out[key] = sample(value, depth + 1, key);
      }
      return out;
    }
    case 'array':
      return [sample(schema.items, depth + 1, property)];
    case 'integer':
      return schema.minimum ?? 1;
    case 'number':
      return schema.minimum ?? 0;
    case 'boolean':
      return true;
    case 'string':
      if (schema.format === 'email') return 'user@example.com';
      // A validFrom equal to validTo is rejected with 422, so the two need distinct values.
      if (schema.format === 'date-time') return DATE_EXAMPLE[property] ?? DATE_EXAMPLE.validFrom;
      if (str(schema.description)?.includes('sales_rep')) return '{{salesRepId}}';
      if (str(schema.description)?.includes('24-hex user id')) return '{{userId}}';
      if (str(schema.description)?.includes('24-hex warehouse id'))
        return property === 'toWarehouse' ? '{{toWarehouseId}}' : '{{fromWarehouseId}}';
      return str(schema.description)?.includes('24-hex') ? '{{productId}}' : 'string';
    default:
      return schema.properties ? sample({ ...schema, type: 'object' }, depth, property) : null;
  }
};

const pathVarName = (path: string, param: string): string => PATH_VARIABLE[path]?.[param] ?? param;

const buildRequest = (path: string, method: string, operation: Json): Json => {
  const params = arr(operation.parameters).map(deref);
  const queryParams = params.filter((p) => p.in === 'query');
  const pathParams = params.filter((p) => p.in === 'path');

  const url: Json = {
    raw: `{{baseUrl}}${path.replace(/\{(\w+)\}/g, ':$1')}`,
    host: ['{{baseUrl}}'],
    // Postman renders a `:param` segment as an editable path-variable row.
    path: path
      .replace(/^\//, '')
      .split('/')
      .map((segment) => (segment.startsWith('{') ? `:${segment.slice(1, -1)}` : segment)),
  };
  if (queryParams.length) {
    url.query = queryParams.map((p) => {
      const schema = obj(p.schema);
      return {
        key: str(p.name),
        value: String(schema.default ?? arr(schema.enum)[0] ?? ''),
        description: str(p.description),
        disabled: true,
      };
    });
  }
  if (pathParams.length) {
    url.variable = pathParams.map((p) => {
      const name = str(p.name) ?? '';
      return {
        key: name,
        value: `{{${pathVarName(path, name)}}}`,
        description: str(p.description),
      };
    });
  }

  const header: Json[] = [];
  const request: Json = {
    method: method.toUpperCase(),
    header,
    url,
    description: [str(operation.summary), str(operation.description)].filter(Boolean).join('\n\n'),
  };

  // Operations without a `security` block are public; opt them out of the collection bearer token.
  if (!arr(operation.security).length) request.auth = { type: 'noauth' };

  const bodySchema = obj(obj(obj(operation.requestBody).content)['application/json']).schema;
  if (bodySchema) {
    header.push({ key: 'Content-Type', value: 'application/json' });
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(sample(bodySchema), null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  const item: Json = {
    name: str(operation.summary) ?? `${method.toUpperCase()} ${path}`,
    request,
    response: [],
  };
  const test = TESTS[`${method.toUpperCase()} ${path}`];
  if (test) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: test } }];
  return item;
};

const specTags = arr(spec.tags).map(obj);
const folders = new Map<string, Json[]>(specTags.map((tag) => [str(tag.name) ?? '', [] as Json[]]));

for (const [path, pathItem] of Object.entries(obj(spec.paths))) {
  for (const method of METHODS) {
    const operation = obj(pathItem)[method];
    if (!operation) continue;
    const tag = str(arr(obj(operation).tags)[0]) ?? 'Other';
    if (!folders.has(tag)) folders.set(tag, []);
    folders.get(tag)?.push(buildRequest(path, method, obj(operation)));
  }
}

const info = obj(spec.info);
const collection = {
  info: {
    name: `${str(info.title)} v${str(info.version)}`,
    description:
      `${str(info.description)}\n\n` +
      'Generated from the OpenAPI spec by `npm run postman` — edit the route JSDoc, not this file.\n\n' +
      'Run "Staff login" first: it stores accessToken, which every secured request sends automatically. ' +
      'Ids captured from create and list responses (productId, priceListId, userId, variantId) feed the ' +
      'path variables of later requests.\n\n' +
      'All responses are wrapped as { success, message, data, pagination? }.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  item: [...folders.entries()]
    .filter(([, items]) => items.length)
    .map(([name, items]) => ({
      name,
      description: str(specTags.find((tag) => tag.name === name)?.description),
      item: items,
    })),
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api/v1', type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
    { key: 'refreshToken', value: '', type: 'string' },
    { key: 'customerToken', value: '', type: 'string' },
    { key: 'magicLinkToken', value: '', type: 'string' },
    { key: 'userId', value: '', type: 'string' },
    { key: 'productId', value: '', type: 'string' },
    { key: 'variantId', value: '', type: 'string' },
    { key: 'priceListId', value: '', type: 'string' },
    { key: 'discountTierId', value: '', type: 'string' },
    { key: 'warehouseId', value: '', type: 'string' },
    { key: 'fromWarehouseId', value: '', type: 'string' },
    { key: 'toWarehouseId', value: '', type: 'string' },
    { key: 'subscriptionPlanId', value: '', type: 'string' },
    { key: 'customerId', value: '', type: 'string' },
    { key: 'salesRepId', value: '', type: 'string' },
    { key: 'tierName', value: 'gold', type: 'string' },
  ],
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(collection, null, 2)}\n`);

const count = collection.item.reduce((total, folder) => total + folder.item.length, 0);
console.log(`Wrote ${count} requests across ${collection.item.length} folders to ${outFile}`);
