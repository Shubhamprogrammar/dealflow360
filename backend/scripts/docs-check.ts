/**
 * Fails when a registered Express route has no OpenAPI entry, or the spec documents a route
 * that no longer exists. Run with `npm run docs:check`.
 *
 * The route files are parsed as text rather than imported: importing the router pulls in the
 * whole service graph (and constructs the Redis client), and Express 5 no longer exposes mount
 * prefixes on the layer regexps, so introspection could not recover the `/auth` in `/auth/login`.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { swaggerSpec } from '../src/docs/swagger.js';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '../src');
const indexFile = resolve(srcDir, 'routes/index.ts');

const read = (file: string): string => readFileSync(file, 'utf8');

/** `import { authRoutes } from '../modules/auth/auth.routes.js'` -> authRoutes: <abs path>.ts */
const routerFiles = (source: string): Map<string, string> => {
  const found = new Map<string, string>();
  const pattern = /import\s*\{\s*([\w,\s]+?)\s*\}\s*from\s*'(\.[^']*\.routes)\.js'/g;
  for (const [, names, specifier] of source.matchAll(pattern)) {
    for (const name of (names ?? '').split(',').map((n) => n.trim())) {
      found.set(name, resolve(dirname(indexFile), `${specifier}.ts`));
    }
  }
  return found;
};

/** `routes.use('/auth', authRoutes)` -> authRoutes: '/auth'; an unprefixed mount yields ''. */
const mounts = (source: string): Map<string, string> => {
  const found = new Map<string, string>();
  const pattern = /routes\.use\(\s*(?:'([^']*)'\s*,\s*)?(\w+)\s*\)/g;
  for (const [, prefix, router] of source.matchAll(pattern)) found.set(router ?? '', prefix ?? '');
  return found;
};

/** `authRoutes.post('/customer/login', ...)` -> `POST /auth/customer/login` */
const registrations = (source: string, prefix: string): string[] => {
  const pattern = /\b\w+\.(get|post|put|patch|delete)\(\s*'([^']*)'/g;
  return [...source.matchAll(pattern)].map(([, method, path]) => {
    const full = `${prefix}${path ?? ''}`.replace(/\/$/, '') || '/';
    return `${(method ?? '').toUpperCase()} ${full.replace(/:(\w+)/g, '{$1}')}`;
  });
};

const indexSource = read(indexFile);
const files = routerFiles(indexSource);
const prefixes = mounts(indexSource);

const routes = new Set<string>();
for (const [router, prefix] of prefixes) {
  // `routes.use()` also mounts plain middleware; only names imported from a *.routes file
  // are routers, so anything else is skipped rather than reported as unresolvable.
  const file = files.get(router);
  if (!file) continue;
  for (const route of registrations(read(file), prefix)) routes.add(route);
}

const documented = new Set<string>();
for (const [path, item] of Object.entries<unknown>(swaggerSpec.paths)) {
  if (item === null || typeof item !== 'object') continue;
  for (const method of Object.keys(item)) documented.add(`${method.toUpperCase()} ${path}`);
}

const undocumented = [...routes].filter((route) => !documented.has(route)).sort();
const orphaned = [...documented].filter((route) => !routes.has(route)).sort();

for (const route of undocumented) console.error(`Undocumented route: ${route}`);
for (const route of orphaned) console.error(`Documented but not registered: ${route}`);

if (undocumented.length || orphaned.length) {
  console.error(
    `\n${undocumented.length} undocumented, ${orphaned.length} orphaned. ` +
      'Update src/docs/paths/ to match the routes.',
  );
  process.exit(1);
}

console.log(`OK — all ${routes.size} registered routes are documented.`);
