# DealFlow360 — Architecture & Feature Breakdown

A self-governing B2B sales operations platform: quotation → approval → fulfillment → billing → negotiation → reporting.

---

## 1. System Architecture (Overview)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Sales Workspace   │  │ Customer Portal   │  │ Admin Console     │   │
│  │ (Rep / Manager /  │  │ (external, auth-  │  │ (backend config,  │   │
│  │  Finance & Ops)   │  │  restricted view) │  │  analytics)       │   │
│  └────────┬──────────┘  └────────┬──────────┘  └────────┬──────────┘   │
└───────────┼──────────────────────┼──────────────────────┼──────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / BFF (auth + routing)                │
└───────────┬──────────────┬──────────────┬──────────────┬─────────────┘
            ▼              ▼              ▼              ▼
   ┌────────────┐  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
   │ Quotation & │  │ Approval &   │ │ Fulfillment │ │ Subscription│
   │ Pricing     │  │ Risk Engine  │ │ & Inventory │ │ & Billing   │
   │ Service     │  │              │ │ Service     │ │ Service     │
   └──────┬──────┘  └──────┬───────┘ └──────┬──────┘ └──────┬──────┘
          │                │                │               │
          └────────┬───────┴────────┬───────┴───────┬───────┘
                    ▼                ▼               ▼
          ┌──────────────┐  ┌──────────────┐ ┌──────────────────┐
          │ Auth & RBAC   │  │ Notification │ │ Reporting &       │
          │ Service       │  │ Service      │ │ Analytics Service │
          └──────┬────────┘  └──────┬───────┘ └─────────┬─────────┘
                  ▼                  ▼                    ▼
          ┌───────────────────────────────────────────────────────┐
          │        Primary Database  +  Audit / Event Log          │
          └───────────────────────────────────────────────────────┘
```

**Guiding principle:** every business rule (discount ceilings, blended risk scoring, warehouse split logic, proration, approval re-routing) lives in the **backend services**, never in the frontend. The frontend only renders state and calls APIs — this is what keeps the two aligned and prevents "faked for the demo" logic.

---

## 2. Backend Architecture

### 2.1 Services

| Service | Responsibility | Key Data Owned |
|---|---|---|
| **Auth & RBAC Service** | Internal login/signup, customer portal login (magic link / email+password), role-based access (Rep, Manager, Finance/Ops, Admin, Customer) | Users, Roles, Sessions, Portal tokens |
| **Catalog & Pricing Service** | Products, variants, price lists, customer-tier pricing, currency rules | Products, Variants, PriceLists |
| **Quotation Service** | Quote CRUD, line items, live margin calculation, upsell/cross-sell recommendation engine | Quotations, QuoteLines, Recommendations |
| **Discount & Approval (Risk) Engine** | Discount ceiling config per tier/category, blended risk score computation, approval chain routing, audit logging | DiscountTiers, ApprovalChains, ApprovalLog |
| **Fulfillment & Inventory Service** | Warehouse config, stock levels, auto-split algorithm (shipment-cost-weighted), manual override, backorder consolidation | Warehouses, StockLevels, FulfillmentSplits |
| **Subscription & Billing Service** | Recurring plan config, proration engine, invoice generation for one-time + recurring lines, cancellation/refund/credit-note logic | Plans, Subscriptions, Invoices, CreditNotes |
| **Negotiation / Portal Service** | Customer-facing quote view, line comments, counter-discount proposals, confirmation, re-routing to approval when terms exceed thresholds | NegotiationThreads, PortalEvents |
| **Deal Health & Anomaly Service** | Stall detection, discount-anomaly detection (vs rep's historical average), delivery-slippage flags, nudge/escalation triggers | HealthAlerts, RepBaselines |
| **Reporting & Analytics Service** | Aggregations by period/rep/team/approval-status/product, PDF/XLS export | ReportSnapshots (materialized views) |
| **Notification Service** | Email/portal notifications for approvals, negotiation events, nudges | NotificationQueue |

### 2.2 Core Data Model (entities)

`User` → `Role` · `Customer` (with `Tier`) · `Product` → `Variant` · `PriceList` · `DiscountTier` → `CategoryCeiling` · `ApprovalChain` → `ApprovalStep` · `Quotation` → `QuoteLine` → `Discount` · `Warehouse` → `StockLevel` · `FulfillmentSplit` → `SplitLine` · `SubscriptionPlan` → `Subscription` → `BillingSchedule` · `Invoice` → `InvoiceLine` · `CreditNote` · `NegotiationThread` → `Comment` / `CounterProposal` · `AuditLogEntry` (user, timestamp, action, reason — attached to every approval/reject/edit) · `HealthAlert`

### 2.3 Key Backend Logic (must be server-side, not UI-simulated)

1. **Blended risk scoring** — for every quote line, compute `discount_given − category_ceiling`. Sum/weight overages across all lines (not just the worst single line) into one blended score; route to Manager-only or Manager→Finance based on configured thresholds.
2. **Approval routing** — driven by `ApprovalChain` config, re-evaluated automatically whenever a quote changes (including customer counter-proposals from the portal).
3. **Warehouse auto-split** — minimize shipment count using shipping-cost weighting against live `StockLevel`; support manual override and "consolidate remaining backorder" re-trigger when stock arrives.
4. **Hybrid billing / proration** — one order can hold one-time and recurring lines; recurring lines generate a `BillingSchedule`; mid-cycle quantity/plan changes trigger proration and, where applicable, credit notes.
5. **Portal re-entry rule** — any customer-confirmed change that exceeds discount/risk thresholds automatically re-opens the approval workflow before fulfillment.

### 2.4 API Surface (representative endpoints)

```
POST   /auth/login | /auth/signup | /portal/auth/magic-link
GET    /catalog/products | /catalog/price-lists
POST   /quotations                      → create quote
PATCH  /quotations/{id}/lines           → add/update line, triggers risk recompute
GET    /quotations/{id}/recommendations → upsell/cross-sell panel
POST   /quotations/{id}/submit          → triggers approval routing
POST   /approvals/{id}/decision         → approve | reject | return
GET    /fulfillment/{orderId}/split     → suggested warehouse split
POST   /fulfillment/{orderId}/override
GET    /billing/{orderId}/schedule
POST   /billing/{orderId}/proration
POST   /portal/quotations/{id}/comment | /counter-discount
POST   /portal/quotations/{id}/confirm  → re-enters approval if over threshold
GET    /dashboard/deal-health
GET    /reports?period=&rep=&status=&product=
```

---

## 3. Frontend Architecture

The frontend is split into **three surfaces** that map 1:1 to the client layer above, each a separate app/shell sharing one design system and API client.

| Surface | Users | Auth |
|---|---|---|
| **A. Admin / Backend Console** | Admin | Internal login |
| **B. Sales Workspace** | Rep, Sales Manager, Finance/Ops | Internal login |
| **C. Customer Portal** | Customer | Magic link / email+password — restricted, cannot see internal screens |

### 3.1 Admin / Backend Console — Screens

| Screen | Maps to Backend | Feature List |
|---|---|---|
| Product & Price List Manager | Catalog & Pricing Service | Product CRUD, variant/attribute editor, tier & currency price lists |
| Discount Tier & Approval Chain Setup | Discount & Approval Engine | Per-tier ceilings, per-category ceilings, approval chain builder (Manager / Manager→Finance), audit trail viewer |
| Warehouse & Fulfillment Setup | Fulfillment & Inventory Service | Warehouse CRUD, stock/replenishment config, shipping-cost weighting inputs |
| Subscription Plan Setup | Subscription & Billing Service | Recurring plan CRUD, proration rule config, cancellation/refund rules |
| Upsell/Cross-sell Rule Setup | Quotation Service (recommendation engine) | Product pairing rules, promotion flags, minimum margin threshold |
| Reporting Configuration & Dashboard | Reporting & Analytics Service | Filters (period, rep/team, approval status, product/category), PDF/XLS export |

### 3.2 Sales Workspace — Screens

| Screen | Maps to Backend | Feature List |
|---|---|---|
| Top menu (Quotations / Pipeline / Reload / Back-end / Close) | Quotation Service, Auth | Nav shell, data refresh action pulling latest price/stock/approval state |
| Quotation List / Pipeline (Kanban) | Quotation Service | Cards with customer, amount, stage; click-through to builder |
| Quotation Builder (products + cart) | Catalog & Pricing, Quotation Service | Product picker by category, qty +/-, line/order discounts, live margin indicator |
| Upsell & Cross-sell Panel | Quotation Service (recommendations) | Ranked suggestions, margin delta, promo tag, Add/Dismiss — live margin update on add |
| Discount Approval Screen | Discount & Approval Engine | Blended risk score display, dynamic approval steps list, approve/reject/return, audit entry |
| Fulfillment & Warehouse Split Screen | Fulfillment & Inventory Service | Suggested split by warehouse, shipment count/cost estimate, Accept / Manual Override, auto "consolidate backorder" prompt |
| Subscription & Billing Screen | Subscription & Billing Service | One-time vs recurring lines shown separately, billing schedule, proration on qty change, cancel/modify with auto credit note |
| Deal Health & Anomaly Dashboard | Deal Health & Anomaly Service | Stalled deals, discount anomaly alerts, delivery slippage indicators, click-through, nudge/escalation trigger |

### 3.3 Customer Portal — Screens

| Screen | Maps to Backend | Feature List |
|---|---|---|
| Quotation Negotiation View | Negotiation / Portal Service | Status (Sent / Under Negotiation / Confirmed), line-level comments, counter-discount field, Submit Request / Confirm Quotation |
| Post-confirmation routing | Negotiation Service → Discount & Approval Engine (conditional) | If terms exceed thresholds → auto re-enters approval; else → straight to fulfillment |

### 3.4 Shared Frontend Concerns (apply to all three surfaces)

- One API client / SDK layer wrapping the endpoints in §2.4, with role-aware request headers.
- Shared component library: quote line table, margin indicator, status badges, approval-step tracker.
- Real-time-ish refresh: polling or websocket push for price/stock/approval updates ("Reload Data" and live margin/risk recompute after every edit).
- Notification surface fed by the Notification Service (approval requests, negotiation events, health alerts).

---

## 4. Frontend ↔ Backend Alignment Map

This is the traceability table a judge/demo would want — every frontend action names the exact backend service and rule it exercises.

| User Action (Frontend) | Backend Service Invoked | Business Rule Enforced |
|---|---|---|
| Rep adds a line with a high discount | Quotation Service → Discount & Approval Engine | Per-line ceiling check + blended risk recompute |
| Rep accepts an upsell suggestion | Quotation Service (recommendations) | Minimum margin threshold filter, live margin recalculation |
| Quote submitted | Discount & Approval Engine | Route to Manager-only or Manager→Finance based on blended score |
| Manager/Finance approves | Discount & Approval Engine | Audit log write (user, timestamp, reason), status transition |
| Order enters fulfillment | Fulfillment & Inventory Service | Cost-weighted auto-split across warehouses, backorder logic |
| Rep applies manual override on split | Fulfillment & Inventory Service | Override persisted, still logged for audit |
| Order has one-time + recurring lines | Subscription & Billing Service | Separate invoice + billing schedule generation |
| Quantity changed mid-cycle | Subscription & Billing Service | Proration calculation, possible credit note |
| Customer submits counter-discount | Negotiation Service | Threshold check → conditional re-entry into Discount & Approval Engine |
| Customer confirms quotation | Negotiation Service → Fulfillment Service | Direct-to-fulfillment if within thresholds |
| Manager opens Deal Health dashboard | Deal Health & Anomaly Service | Stall/anomaly detection against rep baseline, delivery slippage checks |
| Admin edits discount ceilings | Discount & Approval Engine (config API) | Immediately affects live risk scoring for open quotes |

---

## 5. Suggested Tech Stack (agnostic, one example)

- **Frontend:** React (Workspace + Admin as one SPA behind role-based routing; Customer Portal as a separate restricted app), shared component library, state via React Query for server sync.
- **Backend:** Node.js/NestJS or similar, one service per row in §2.1 (can start as a modular monolith with clear service boundaries for the hackathon, split later).
- **Database:** PostgreSQL (relational fits the tiered discount/approval/warehouse relationships well) + an append-only `AuditLogEntry` table.
- **Async/events:** a lightweight event bus (or DB-triggered jobs) for notification dispatch, anomaly detection, and stalled-deal scans.

---

## 6. What to Build First (aligned MVP slice)

To hit the "Quick Test Flow" in the spec with both sides in sync, build in this order:
1. Auth (internal + portal) → 2. Catalog/Price List → 3. Discount Tier & Approval Chain config → 4. Quotation Builder + blended risk scoring → 5. Approval screen → 6. Warehouse split → 7. Subscription/Billing → 8. Customer Portal negotiation + re-approval loop → 9. Deal Health dashboard + Reporting.
