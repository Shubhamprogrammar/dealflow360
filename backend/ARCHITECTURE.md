Architecture — ExpenseWise
1. System architecture
Two separate services: a Next.js 14 (App Router) frontend and a standalone Express/Node.js backend exposing a REST API. This is a deliberate split from a single combined app — the frontend and backend are independently deployable, independently scalable, and communicate only over HTTP(S).

Browser
  ↓
Next.js frontend (App Router, Node runtime, own container)
  ↓ (HTTPS, credentials: 'include' — JWT cookie)
Express/Node.js backend API (own container)
  ↓ (Mongoose)
MongoDB (self-hosted replica set or Atlas)

Auth: custom JWT issued by the Express backend on login, verified on
every request via Express middleware in /middleware/auth.ts
OPEN DECISION: monorepo (npm/pnpm workspaces with /frontend and /backend packages) vs. two separate repos. Default for v1: monorepo, since a single developer/small team benefits from atomic commits across the API contract and the client that consumes it.

2. Frontend architecture
App Router, route groups: (auth) for signup/login, (dashboard) for authenticated pages
Feature-oriented component folders
A typed API client wrapper (/lib/api-client.ts) that targets NEXT_PUBLIC_API_BASE_URL (the Express backend's origin) — components never call fetch directly against the backend
Every request from the client sends credentials: 'include' so the JWT cookie set by the backend is attached cross-origin
Loading/error/empty states are mandatory on every data-bound page (enforced in code review, not just convention)
3. Backend architecture (Express)
Layered structure: routes/ (thin — just wire HTTP verb + path to a controller) → controllers/ (parse request, Zod-validate, call a service, shape the response) → services/ (business logic, all Mongoose access) → models/ (Mongoose schemas)
Centralized error handling: a shared Express error-handling middleware (registered last, via app.use) maps known error classes (ValidationError, NotFoundError, ConflictError) to consistent HTTP responses (see docs/api.md for the exact shape) — controllers never construct ad-hoc error responses, they next(err)
CORS is configured explicitly (cors middleware) to allow only the frontend's origin, with credentials: true, since frontend and backend are different origins
4. Database architecture
MongoDB, accessed only through Mongoose — no raw driver calls except inside clearly-commented aggregation pipelines in services/calculations.ts where Mongoose's query builder is insufficient. Full schema in docs/database.md.

5. Authentication architecture
Since there is no Supabase Auth in this stack, authentication is implemented directly in the Express backend:

Passwords hashed with bcrypt before being stored on the users collection — the app itself now owns credential storage (unlike the previous design, which delegated this entirely)
On successful login, the backend signs a JWT (jsonwebtoken) containing userId and sets it as an httpOnly cookie (SameSite=None; Secure in production, since frontend and backend are cross-origin; SameSite=Lax is fine in local dev if both run on localhost)
Every protected Express route runs a shared requireAuth middleware that verifies the JWT and attaches req.userId — this is the ONLY source of truth for "who is making this request." No endpoint accepts a userId from the request body or query string
OPEN DECISION: single long-lived JWT vs. access+refresh token pair. Default for v1: a single JWT with a moderate expiry (e.g. 7 days) — simpler to implement correctly than a refresh-token rotation scheme, revisit if session-hijacking risk needs tightening in v1.1
6. Authorization architecture
Single-role, single-owner model (see requirements §9). Every Mongoose query for Category/Transaction/Budget includes { userId: req.userId } in its filter. There is no separate RBAC layer in v1 since there's only one role — this is intentionally simpler than a multi-role system, but the "always scope to the authenticated user" rule is non-negotiable and enforced in every service function, not just at the route layer, so a future service reuse can't accidentally skip it.

7. Redis / Queue architecture
Not used in v1 — there are no background jobs (no email digests, no scheduled recurring transactions). OPEN DECISION: if v2 adds recurring transactions or email summaries, introduce Redis + BullMQ at that point rather than pre-building unused infrastructure now.

8. File storage architecture
Not used in v1 (no receipt attachments). Deferred to v2.

9. Notification architecture
Not used in v1 (explicitly out of scope per requirements §14).

10. Logging architecture
Structured JSON logs from Express middleware (pino or morgan + pino) — request method, path, userId if authenticated, status, duration, request ID. No request body logged if it could contain sensitive data; raw passwords are never logged (bcrypt hashing happens before any logging middleware could see them).

11. Error handling architecture
See docs/api.md §2 for the standard error response shape. All thrown errors in services/ are one of a small set of typed error classes (ValidationError, NotFoundError, ConflictError), caught by the centralized Express error-handling middleware and mapped to HTTP status codes — controllers never construct ad-hoc error responses. There is no ForbiddenError/403: cross-user access is always represented as NotFoundError/404 (see requirements §9, §12) to avoid confirming a resource's existence. UNAUTHORIZED/401 is not one of these thrown errors — it comes from the requireAuth middleware rejecting the request before a controller's business logic ever runs.

12. API versioning
All routes mounted under /api/v1/... via an Express Router. A breaking change to a v1 contract requires an /api/v2/... router rather than mutating v1's behavior.

13. Configuration management
Environment variables via .env files per service (dev) / platform env vars (prod).

Backend: MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN (the frontend's URL), PORT.

Frontend: NEXT_PUBLIC_API_BASE_URL (the backend's URL).

.env.example in each package documents every required variable with a placeholder value. JWT_SECRET is never committed and is generated fresh per environment.

14. Docker architecture
Two separate multi-stage Dockerfiles — one per service:

backend: build stage (install deps, tsc build), runtime stage (minimal Node image, non-root user, only production deps + compiled dist/ copied in)
frontend: build stage (next build), runtime stage (minimal Node image, non-root user, only production deps + .next output copied in)
A docker-compose.yml orchestrates both containers plus a local MongoDB container for development, so docker compose up gives a full working stack without needing Atlas locally.

15. CI/CD architecture
GitHub Actions: PR pipeline runs lint/typecheck/test/build for both frontend and backend packages (can run as a matrix job); main-branch pipeline additionally builds and pushes two Docker images (frontend, backend) and deploys both to staging with smoke tests; production deployment is a manual, explicit promotion step — never automatic.

16. Staging / production architecture
Staging and production use separate MongoDB databases (either separate Atlas projects/clusters, or separate database names on the same self-hosted replica set — Atlas project separation is preferred to also isolate credentials) and separate deployed containers for both frontend and backend, so staging data/testing never touches real user data.

17. Backup strategy
If using MongoDB Atlas: rely on Atlas's automated continuous backups for v1. If self-hosting MongoDB: a scheduled mongodump to durable storage (e.g. S3) is the minimum viable backup, run on a cron job outside the app containers. Document the restore procedure once the hosting choice is confirmed (docs/disaster-recovery.md, created during the roadmap's "Backups" task) rather than building a custom backup pipeline upfront. OPEN DECISION: Atlas vs. self-hosted MongoDB — Atlas is the lower-effort default for v1.

18. Disaster recovery
Documented restore procedure — either restoring an Atlas backup to a fresh cluster, or mongorestore from the latest mongodump snapshot to a fresh instance — plus an application-level rollback plan (redeploy the last known-good Docker images for both frontend and backend; Mongo has no schema migrations to "resolve" the way Prisma does, so rollback is just redeploying prior code alongside any necessary one-off data fix scripts).

19. Monitoring
Structured logs + /api/v1/health and /api/v1/ready endpoints (liveness/readiness) on the Express backend as the minimum for v1, plus the frontend's own basic uptime check. Full metrics/alerting stack is an OPEN DECISION pending choice of hosting platform (many, like Render/Fly/Railway, provide basic container metrics out of the box, which may be sufficient at this scale).

20. Security architecture
See requirements §9 (permission matrix) and AGENTS.md rule 19 — every query scoped server-side to the authenticated user. Standard security headers applied via helmet on the Express backend and via next.config.js headers on the frontend. Input validated with Zod on every mutating endpoint. CORS is locked to the known frontend origin only (CORS_ORIGIN), with credentials: true — this is more critical here than in a same-origin app, since a misconfigured CORS policy would let any site read authenticated responses.

21. Scaling strategy
Not a concern at v1 scale (single-user-per-account personal finance app). Both the Next.js frontend and the Express backend are stateless containers and can be horizontally scaled independently behind a load balancer if ever needed; MongoDB is the only stateful component (Atlas manages its own scaling; a self-hosted replica set would need manual scaling).

Request flows
Login Browser → POST /api/v1/auth/login on the Express backend with {email, password} → backend verifies the bcrypt hash → signs a JWT → sets it as an httpOnly cookie on the backend's domain → frontend redirects to /dashboard → subsequent requests from the frontend include credentials: 'include' so the cookie is sent cross-origin → requireAuth middleware verifies it per request.

Authenticated API request (generic) Browser (via Next.js frontend) → Express route → requireAuth middleware verifies JWT → if invalid/missing, 401 → if valid, attach req.userId → Zod-validate input → call a service function scoped to userId → Mongoose query → shape response → return.

Create transaction Browser (form submit) → frontend API client → POST /api/v1/transactions with {amount, categoryId, date, note} → Zod validation (amount > 0, valid date, note length) → verify categoryId belongs to req.userId (404 if not, per requirements §12) → Mongoose create → return created document → client updates list optimistically.

Set budget Browser → POST /api/v1/budgets with {categoryId, month, limitAmount} → Zod validation → verify category belongs to user AND is type EXPENSE (400 otherwise) → Mongoose findOneAndUpdate with {upsert: true} on (userId, categoryId, month) → return the budget document.

Dashboard load Browser (month selected) → three parallel requests to the Express backend: GET /api/v1/dashboard/summary, /by-category, /over-time, all scoped by ?month= and req.userId → each computed via a Mongoose aggregation pipeline in services/calculations.ts → charts render from the three responses; budget progress bars additionally fetch GET /api/v1/budgets?month=.

OPEN DECISION: whether to combine the three dashboard endpoints into one GET /api/v1/dashboard?month= to reduce round trips — deferred; if the frontend feels janky with 3 parallel cross-origin calls, revisit as a v1.1 optimization, not a v1 blocker.