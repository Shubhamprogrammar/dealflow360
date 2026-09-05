Requirements Specification — ExpenseWise
1. Users / Roles
Single-role system for v1 — every authenticated user is the sole owner and manager of their own financial data. No admin, no shared accounts.

User — signs up, logs in, manages their own categories, transactions, and budgets.
OPEN DECISION: whether a future "household" role (shared budget across multiple users) is needed — deferred to v2, not designed for here.

2. Modules
Authentication · Category Management · Transaction Management · Budget Management · Dashboard/Analytics · Notifications (none in v1, explicitly excluded) · Audit (minimal, see §8)

3. Authentication
Required, all implemented directly in the Express backend (no third-party auth provider in this stack):

signup (email + password)
login
logout (clear the httpOnly JWT cookie)
password hashing via bcrypt — the application stores and owns passwordHash on the users collection
forgot password / reset password: since there is no auth provider to delegate this to, v1 implements a token-based reset flow (generate a single-use, time-limited reset token, email it via a transactional email provider — e.g. Resend/SendGrid — and accept it on a reset endpoint). OPEN DECISION: exact token TTL and email provider choice; default 1 hour TTL
session handling: a JWT issued on login, stored as an httpOnly cookie, verified on every request by Express middleware. OPEN DECISION: single long-lived token vs. access+refresh pair — default for v1 is a single JWT with a moderate expiry (see architecture.md §5)
rate limiting on login and password-reset requests via express-rate-limit (app-level, since there is no provider default to fall back on) — OPEN DECISION on exact thresholds, default: 5 attempts per 15 minutes per IP+email pair
4. Category
name (required, unique per user)
type: INCOME or EXPENSE (required)
color (required, defaults to a neutral gray)
default categories seeded automatically on signup: Food, Rent, Transport, Entertainment, Utilities (EXPENSE), Salary, Other Income (INCOME), Other (EXPENSE)
user can create/edit/delete their own categories
a category cannot be deleted while any transaction references it — the user must reassign or delete those transactions first (enforced entirely at the application layer — see database.md §2, since MongoDB has no foreign-key restrict behavior to fall back on)
5. Transaction
amount (required, positive decimal, 2 decimal places, stored as Decimal128 — see database.md §1)
category (required, must belong to the requesting user)
date (required)
note (optional, max 280 characters)
type is derived from the linked category's type, not stored separately, to avoid a contradictory state (e.g. INCOME category with an EXPENSE-typed transaction)
Business rules:

a transaction always belongs to exactly one category and one user
amount must be > 0; zero or negative amounts are rejected
date may be in the past or present; future-dated transactions are allowed (for planned/pending entries) — OPEN DECISION on whether v1 should warn on far-future dates; default: no warning
6. Budget
one budget per (user, category, month) — enforced by a unique compound index (userId, categoryId, month)
month stored as "YYYY-MM"
limitAmount required, positive decimal (Decimal128)
only EXPENSE-type categories may have a budget (INCOME categories are rejected with a validation error)
setting a budget for a (category, month) that already has one updates it (upsert), never creates a duplicate
7. Dashboard / Analytics
For a selected month:

total income, total expense, net balance (income − expense)
expense breakdown by category (for the pie chart)
daily expense totals across the month (for the time-series chart, including zero-value days so there are no gaps)
per-category budget progress: percentage of limit spent, with three states — under 80%, 80–100%, over 100% (over-budget)
All of the above must be computed server-side via MongoDB aggregation pipelines; the client must never be trusted to sum raw transaction data for these figures.

8. Audit
Minimal for v1: createdAt timestamps are sufficient, present on every collection where they add value (categories, transactions). budgets intentionally has no createdAt/updatedAt — an upsert on (user, category, month) always represents the current state, so a creation timestamp carries no meaning there (see database.md §4 for the full rationale). Full audit-log-per-action (actor/action/entity/IP) is explicitly OUT of scope for v1 given this is a single-user app with no admin oversight requirement.

9. Permission matrix
Action	Owner (the user)	Any other user
View own categories/transactions/budgets	✅	❌ (404)
Create/edit/delete own categories	✅	❌ (404)
Create/edit/delete own transactions	✅	❌ (404)
Set own budgets	✅	❌ (404)
View another user's data	❌ (n/a — no such feature exists)	❌ (404)
A non-owner never sees a 403/Forbidden response for another user's resource — every such request returns 404, so the response never confirms the resource exists at all (see api.md §1 and §12 below).

Enforcement: every query filters by userId = req.userId derived server-side from the verified JWT — never from a client-supplied field.

10. Non-functional requirements
Correct on desktop and mobile browser widths (375px and up)
All monetary math server-side, using Decimal128, never floating point (this now applies to Mongoose/MongoDB math instead of Prisma's Decimal type, but the requirement itself is unchanged)
No user's data visible to any other user under any circumstance
p95 API response time under 500ms for all endpoints under normal load (OPEN DECISION: formal load-testing target deferred until traffic patterns are known — treat as a soft target for v1)
11. Validation rules (summary — full schemas live in code under
/lib/validation on the backend)

email: valid email format, validated with Zod
password: minimum 8 characters — this is now an app-level rule (/lib/validation) rather than a provider default, since there is no auth provider in this stack; OPEN DECISION on whether a stronger policy (e.g. requiring a mix of character types) is desired
category name: 1–50 chars, unique per user
amount: positive decimal, max 2 decimal places, reasonable upper bound (OPEN DECISION on exact ceiling — default 10,000,000.00)
note: max 280 chars
month: must match YYYY-MM pattern
12. Error scenarios / edge cases
deleting a category that has transactions → 400 with a clear message
setting a budget on an INCOME category → 400
creating a transaction with a categoryId belonging to another user → 404 (not 403 — do not reveal the category exists)
requesting dashboard data for a month with zero transactions → 200 with all-zero totals, not an error
duplicate budget upsert → update, not a 409
expired or missing JWT on any request → 401, frontend redirects to /login
13. Acceptance criteria (v1 "done")
A user can: sign up → see seeded default categories → add transactions across categories and dates → set a budget on at least one expense category → view a dashboard that correctly totals income/expense, renders a category breakdown, a spend-over-time chart, and budget progress — with all data persisting across reloads and logins, and no other user able to see or affect that data.

14. Explicitly out of scope for v1
Multi-currency, recurring transactions, shared/household accounts, CSV/PDF export, receipt attachments, bank sync, native mobile app, notifications, full audit logging.