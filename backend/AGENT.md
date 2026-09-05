# Agent Instructions

These instructions apply to every change in this repository. Read them before inspecting or modifying files.

## Project Scope

- This is a reusable Node.js backend starter.
- The stack is Node.js 20+, Express 5, TypeScript, MongoDB, Mongoose, Redis, BullMQ, Socket.IO, JWT, RBAC, Pino, Zod, and Swagger/OpenAPI.
- The repository intentionally does not contain testing infrastructure, Husky, lint-staged, Docker, Docker Compose, or GitHub Actions workflows. Do not reintroduce them unless the user explicitly requests them.
- Do not add project-specific integrations such as AWS, Stripe, Twilio, Puppeteer, or OpenAI unless explicitly required.
- Email is an approved integration for this project. Use SMTP via `nodemailer` only; do not add hosted email APIs such as SendGrid, SES, Postmark, or Resend.
  - Transport configuration lives in `src/config/mailer.ts` and is driven by the `SMTP_*` environment variables.
  - Services must not call `sendMail` directly in a request path. Enqueue with `enqueueEmail` so delivery is retried by the BullMQ worker.
  - When `SMTP_HOST` is unset the mailer logs and skips sending, so local development works without a mail server.

## Before Changes

- Inspect the relevant folder structure, `package.json`, `tsconfig.json`, environment files, and source files before making assumptions.
- Check whether the requested behavior already exists.
- Preserve existing application behavior and unrelated user changes.
- Do not overwrite or revert changes you did not make.
- Prefer the smallest correct change.
- Ask one concise question if requirements are genuinely ambiguous and the choice could cause destructive or incompatible behavior.

## Architecture

Use feature/module-based organization under `src/modules`.

The request flow is:

```text
Client -> Route -> Middleware -> Validation -> Controller -> Service -> Mongoose Model -> MongoDB
```

- Routes define only HTTP method, path, middleware, and controller.
- Middleware handles authentication, authorization, validation, rate limiting, request IDs, and errors.
- Controllers receive requests, call services, and return responses. Controllers stay thin.
- Services contain business rules, workflows, and external-service orchestration. Services must not use HTTP response objects.
- This project intentionally has no repository layer. Services use Mongoose models directly for database access.
- Mongoose schemas/models belong to the database/model layer.
- Expensive or retryable work belongs in BullMQ jobs, not HTTP request handlers.
- Socket handlers should delegate business logic to services.
- Add abstractions only when they solve a concrete reuse or infrastructure problem.

## TypeScript

- Use strict TypeScript and avoid `any`.
- Prefer arrow functions unless a technical reason requires another form.
- Prefer `async`/`await`; do not add unnecessary promise chains.
- Give important public functions explicit parameter and return types.
- Use `camelCase` for variables/functions, `PascalCase` for types/classes, `UPPER_SNAKE_CASE` for constants, and `kebab-case` for API paths.
- Follow file names such as `user.controller.ts`, `user.service.ts`, `user.model.ts`, `user.routes.ts`, and `user.validation.ts`.
- Keep code readable and avoid unnecessary comments. Add comments only for non-obvious decisions.
- Use ASCII by default.

## Validation and APIs

- Validate request `body`, `params`, `query`, and `headers` with Zod before controller execution.
- Invalid input returns HTTP 400 with the standard error shape.
- All application routes use `/api/v1`.
- Use resource-oriented REST paths and consistent HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, and 500 as appropriate.
- Success responses use `{ success: true, message, data }`.
- Paginated responses add a `pagination` object containing `page`, `limit`, `total`, and `totalPages`.
- Error responses use `{ success: false, message, error: { code } }`.
- Do not expose stack traces, database internals, secrets, passwords, JWTs, refresh tokens, or sensitive implementation details.

## Authentication and Authorization

- Never store plaintext passwords. Use Argon2 or an explicitly approved secure password hash.
- Access tokens and refresh tokens must use centralized JWT helpers and environment-provided secrets.
- Protected HTTP APIs use authentication middleware.
- Privileged APIs use reusable RBAC middleware such as `authorize('admin')`.
- Do not hardcode authorization rules inside controllers.
- Preserve the design for future refresh-token rotation, token revocation, multiple devices, and session management.
- Socket connections must authenticate during the handshake.

## Configuration and Infrastructure

- Do not access `process.env` throughout application code. Use `src/config/env.ts` and validate configuration with Zod.
- Never hardcode secrets or credentials.
- Keep MongoDB connection management in `src/config/database.ts`.
- Keep Redis connection management in `src/config/redis.ts` and avoid unnecessary duplicate connections.
- Use timestamps and intentional indexes. Document why non-obvious indexes exist.
- Keep BullMQ queue names, retry behavior, workers, processors, and shutdown logic centralized.
- Keep Socket.IO setup, authentication, events, rooms, types, and handlers under `src/socket`.
- Keep Swagger configuration extensible for future modules.

## Security and Logging

- Preserve Helmet, configured CORS, request size limits, rate limiting, input validation, and secure JWT handling.
- Authenticated production CORS must not default to `*`.
- Use Pino structured logs with request ID, method, path, status code, duration, and error context where appropriate.
- Redact passwords, authorization headers, JWTs, refresh tokens, API keys, and private user data.
- Do not log request bodies or credentials unless explicitly sanitized and required for debugging.

## Error Handling and Shutdown

- Use `ApiError`, `asyncHandler`, `not-found.middleware.ts`, and centralized error middleware.
- Convert known validation, Mongoose, duplicate-key, authentication, authorization, and operational errors into safe API responses.
- Unexpected errors return a generic 500 response and are logged server-side.
- Graceful shutdown must close HTTP, Socket.IO, BullMQ workers/queues, Redis, and MongoDB resources in an orderly manner.
- Handle both `SIGINT` and `SIGTERM`.

## Editing Rules

- Use `apply_patch` for manual file edits.
- Do not use destructive Git commands such as `git reset --hard` or `git checkout --`.
- Do not commit, amend, push, or create pull requests unless explicitly requested.
- Never commit `.env`, credentials, private keys, tokens, or generated secrets.
- Do not modify unrelated files.

## Verification

After changes, run the applicable commands and report actual results:

```bash
npm install
npm run typecheck
npm run lint
npm run format:check
npm run build
```

- Start the application only when MongoDB and Redis are configured and available.
- Verify `/api/v1/health`, `/api/v1/ready`, and `/docs/` when runtime dependencies are available.
- Do not claim database, Redis, BullMQ, Socket.IO, or production startup verification unless it was actually performed.
- If a check cannot run, state the reason and its impact clearly.

## Documentation

- Update `README.md`, `ARCHITECTURE.md`, `API_GUIDELINES.md`, or `CONTRIBUTING.md` when behavior or project conventions change.
- Keep documentation consistent with the actual repository. In particular, do not document tests, Husky, Docker, Compose, or workflows as available while they remain removed.
