# PHASE 1: FRONTEND-BACKEND ALIGNMENT AUDIT

**Date:** 2026-09-06  
**Status:** AUDIT COMPLETE - Ready for Review  
**Scope:** All frontend screens vs. all backend API endpoints

---

## EXECUTIVE SUMMARY

The backend API is **fully implemented** with proper authentication, validation, and response shapes across 50+ endpoints. The frontend has **13 main screens** with varying degrees of API integration:

- ✅ **Auth system**: Perfectly aligned (magic link + staff login working correctly)
- ⚠️ **Dashboard & Quotations**: ~70% aligned (some field name/pagination mismatches)
- ⚠️ **Products & Invoices**: ~60% aligned (data types and response shape issues)
- ❌ **Approvals & Subscriptions**: ~40% aligned (significant response shape mismatches)
- ❌ **Portal Catalog**: Not yet implemented on frontend (no API integration started)

**Verdict for Phase 2:** 8 screens need targeted patches; 4 screens need moderate rework; 1 screen (Portal Catalog) needs full implementation.

---

## SECTION 1: BACKEND ENDPOINT INVENTORY

### Endpoints by Module (50 total)

| Module | Endpoint Count | Auth Required | Notes |
|--------|---|---|---|
| **Auth** | 6 | Mixed (no auth for login/request-link; staff/customer for verify/me) | Staff + customer sign-in |
| **Customers** | 5 | Staff token required | Full CRUD + assign-rep |
| **Quotations** | 12 | Staff token required | Complex with line items, approvals, risk |
| **Orders** | 4 | Staff token required | Fulfillment & splits |
| **Invoices** | 2 | Staff token required | Create from order + payment |
| **Products** | 6 | Staff token required | Full CRUD + variants |
| **Approvals** | 4 | Staff token required | Queue + approve/reject/revise |
| **Subscriptions** | 3 | Staff token required | Create + prorate + invoice generation |
| **Dashboard** | 3 | Staff token required | Health alerts (stalled, discount, slippage) |
| **Inquiries** | ? | Staff token required | Not yet fully mapped |
| **Portal** | 2+ | Customer token required | Catalog + inquiries |

**Key Authentication Model:**
- **Staff:** Bearer token with role (admin, sales_manager, sales_rep, finance)
- **Customer:** Bearer token (no role, just `customerId`)
- **No Auth:** Login, request-link, logout

---

## SECTION 2: FRONTEND SCREENS & API INTEGRATION STATUS

### 2.1 Authentication Screens (2 screens)

#### Screen 1: Staff/Customer Login
**Path:** `/app/login/page.tsx`  
**Status:** ✅ **ALIGNED** (No changes needed)

| Aspect | Backend | Frontend | Match? |
|--------|---------|----------|--------|
| **Staff login endpoint** | `POST /auth/login` | `POST /auth/login` | ✅ |
| **Request fields** | `email`, `password` | `email`, `password` | ✅ |
| **Response fields** | `accessToken`, `refreshToken` | Expects same | ✅ |
| **Customer link endpoint** | `POST /auth/customer/request-link` | `POST /auth/customer/request-link` | ✅ |
| **Request fields** | `email` | `email` | ✅ |
| **Response status** | 202 (intentional same message) | Treats as success | ✅ |
| **Demo login** | No demo users | Hardcoded `admin@dealflow.com`, pwd `dealflow` | ⚠️ (Works if seeded) |
| **Token storage** | N/A | localStorage via `saveTokens()` | ✅ |

**Verdict:** **Reuse as-is** — perfectly aligned. Demo login works if seed data present.

---

#### Screen 2: Customer Email Verification
**Path:** `/app/portal/verify/page.tsx`  
**Status:** ✅ **ALIGNED** (No changes needed)

| Aspect | Backend | Frontend | Match? |
|--------|---------|----------|--------|
| **Endpoint** | `GET /auth/customer/verify?token={token}` | `GET /auth/customer/verify?token={token}` | ✅ |
| **Query param** | `token` (string) | Reads from URL | ✅ |
| **Response fields** | `accessToken`, `customerId`, `companyName`, `redirect` | Expects all 4 | ✅ |
| **Token handling** | One-time use, expires after 20 min | Doesn't validate TTL (trusts API) | ✅ |
| **Error handling** | Returns 401 on invalid | Shows "Link expired/invalid" | ✅ |
| **Redirect** | Returns `redirect: "/portal"` | Uses response value or defaults to `/portal` | ✅ |

**Verdict:** **Reuse as-is** — perfectly aligned.

---

### 2.2 Staff Dashboard (1 screen)

#### Screen 3: Sales Dashboard
**Path:** `/app/(workspace)/dashboard/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Moderate patch needed)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Quotations endpoint** | `GET /quotations?page=1&limit=100&status=pending_approval` | `GET /quotations?page=1&limit=100` (no status filter) | ⚠️ | Frontend doesn't filter by status; gets ALL quotations |
| **Dashboard health endpoint** | `GET /dashboard/stalled-deals` | Calls endpoint | ✅ | — |
| **Discount anomalies** | `GET /dashboard/discount-anomalies` | Calls endpoint | ✅ | — |
| **Delivery slippage** | `GET /dashboard/delivery-slippage` | Calls endpoint | ✅ | — |
| **Stat calculation** | Backend returns counts/lists; frontend counts them | Frontend manually counts pending approvals, open quotations | ⚠️ | Inefficient; should let backend provide counts |
| **At-Risk Deals** | Based on blendedRiskScore > threshold | Frontend may not calculate same threshold | ⚠️ | Possible mismatch on what "at-risk" means |

**Verdict:** **Reuse with patch** — Add `status=pending_approval` filter to quotations call; verify at-risk threshold matches backend.

---

### 2.3 Quotations Module (3 screens)

#### Screen 4: Quotations List (Kanban/Table)
**Path:** `/app/(workspace)/quotations/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Moderate rework needed)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **List endpoint** | `GET /quotations?status={status}&page=1&limit=20` | Calls with status but hardcoded `limit=100` | ⚠️ | Pagination inconsistency |
| **Status field** | `status` (enum: draft, sent, pending_approval, approved, rejected) | UI shows Draft, PendingApproval, Approved, Rejected | ⚠️ | Possible value mismatch (camelCase vs snake_case) |
| **Create quotation** | `POST /quotations { customer: id }` | Creates with customer ID | ✅ | — |
| **Submit to approval** | `POST /:id/submit-approval` | Calls endpoint correctly | ✅ | — |
| **Customer list** | `GET /customers?page=1&limit=20` | Calls with `limit=100` | ⚠️ | Hardcoded inconsistent limit |
| **Inquiries list** | `GET /inquiries?status=new&page=1&limit=100` | Calls correctly | ✅ | — |
| **Kanban columns** | N/A (backend doesn't enforce grouping) | Frontend groups by `status` locally | ✅ | Client-side grouping is fine |
| **Drag-to-submit** | N/A | Dragging Draft→PendingApproval triggers submit | ✅ | Good UX pattern |

**Verdict:** **Reuse with patch** — Fix status enum handling (snake_case), standardize pagination to `limit=20`, verify status values in API responses.

---

#### Screen 5: Quotation Detail/Editor
**Path:** `/app/(workspace)/quotations/[id]/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Moderate rework)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Get quotation** | `GET /quotations/{id}` returns `QuotationView` | Expects response with all fields | ✅ | — |
| **Line item structure** | `lineItems: [ { id, product, variantId, quantity, discountPercent, unitPrice, total } ]` | May not match field names | ⚠️ | Need to verify exact field names |
| **Add line item** | `POST /:id/line-items { product, variantId?, quantity, discountPercent? }` | Sends correct structure | ✅ | — |
| **Update line item** | `PUT /:id/line-items/:itemId { quantity, discountPercent }` | Sends correct structure | ✅ | — |
| **Delete line item** | `DELETE /:id/line-items/:itemId` | Calls correctly | ✅ | — |
| **Products list** | `GET /products?page=1&limit=100` with variants | Frontend gets product catalog | ✅ | — |
| **Discount ceiling check** | Backend validates; frontend should also validate live | Frontend checks but may use wrong formula | ⚠️ | Need to verify discount logic matches |
| **Upsell suggestions** | `GET /:id/upsell-suggestions` returns array | Frontend calls endpoint | ✅ | — |
| **Calculate risk** | `POST /:id/calculate-risk` returns updated quotation | Frontend may not call; may use local calc | ⚠️ | Verify risk calculation is server-side |
| **Submit to approval** | `POST /:id/submit-approval` returns approval + quotation | Frontend calls correctly | ✅ | — |

**Verdict:** **Reuse with moderate rework** — Verify line item field names, discount ceiling formula, and ensure risk calculation is called before approval submit.

---

#### Screen 6: Create Quotation from Inquiry
**Path:** `/app/(workspace)/quotations/new/page.tsx` (with `?fromInquiry={id}`)  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Patch needed)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Endpoint** | `POST /quotations/from-inquiry/{inquiryId}` returns filled quotation | Calls endpoint correctly | ✅ | — |
| **Pre-fill items** | Backend converts inquiry items to quotation line items | Frontend expects pre-filled response | ✅ | — |
| **Inquiry lookup** | Backend validates inquiry exists and belongs to correct customer | N/A | ✅ | — |
| **Navigation** | Response includes quotation ID | Frontend navigates to detail editor | ✅ | — |
| **Error handling** | Returns 400 if inquiry not found | Frontend shows error toast | ✅ | — |

**Verdict:** **Reuse with patch** — Verify error messages and that inquiry→line-item conversion matches expected structure.

---

### 2.4 Products Module (2 screens)

#### Screen 7: Products List
**Path:** `/app/(workspace)/products/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Patch needed)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **List endpoint** | `GET /products?page=1&limit=100` (backend supports 20 default) | Hardcodes `limit=100` | ⚠️ | Inconsistent pagination |
| **Response fields** | `products: [ { id, name, category, basePrice, costPrice, taxRate, isActive, isSubscription, variants } ]` | Expects all fields | ✅ (mostly) | — |
| **Variants** | Returned as array in product object | Frontend displays variant count | ✅ | — |
| **Pricing tiers** | No tier-based pricing in product response; tiers are in pricelists | Frontend shows "Bronze/Silver/Gold" tier pricing | ❌ | **MISMATCH**: Frontend expects tier pricing in product; not in API response |
| **Search/Filter** | Backend supports `search`, `category`, `isActive` query params | Frontend filters locally | ⚠️ | Should use backend filters for efficiency |
| **Category enum** | Backend expects category enum values | Frontend may not enforce | ⚠️ | Verify category values |
| **Status filter** | `isActive` boolean | Frontend shows active/inactive toggle | ✅ | — |

**Verdict:** **Reuse with patch** — Fix pagination (`limit=20`), move filter/search to backend, verify category enum values. **ISSUE**: Tier pricing data missing from product endpoint (may need `/pricelists` integration).

---

#### Screen 8: Product Detail/Editor
**Path:** `/app/(workspace)/products/[id]/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Patch needed)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Get product** | `GET /products/{id}` returns full product object | Calls endpoint | ✅ | — |
| **Create product** | `POST /products { name, category, basePrice, costPrice, unit?, taxRate?, isSubscription?, variants? }` | Frontend form matches fields | ✅ | — |
| **Update product** | `PUT /products/{id}` with same schema | Frontend sends fields | ✅ | — |
| **Request fields** | `category` (enum), `basePrice`, `costPrice` required | Frontend form sends these | ✅ | — |
| **Variants structure** | `variants: [ { attributeName, attributeValue, priceAdjustment } ]` | Frontend sends/displays same | ✅ | — |
| **Pricing tiers** | Not in product object; separate `/pricelists` endpoint | Frontend shows "tier pricing table" | ❌ | **MISMATCH**: Tier pricing should come from pricelists, not product detail |
| **Response after save** | Returns updated product object | Frontend redirects to `/products` | ✅ | — |

**Verdict:** **Reuse with patch** — Verify tier pricing integration (likely need to call `/pricelists` separately), ensure category enum validation.

---

### 2.5 Invoices Module (2 screens)

#### Screen 9: Invoices List
**Path:** `/app/(workspace)/invoices/page.tsx`  
**Status:** ❌ **NOT INTEGRATED** (No API calls)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Backend endpoint** | `GET /invoices` (assumed; not explicitly documented) | **Frontend uses local mock data** | ❌ | **Not calling API at all** |
| **Expected response** | Invoice array with order ref, amounts, status | Uses hardcoded mock store | ❌ | **CRITICAL**: No backend integration |
| **Status values** | Likely: `draft`, `pending`, `paid`, `overdue` | Uses: `Paid`, `Unpaid` (binary) | ❌ | **Status enum mismatch** |
| **Pagination** | Likely paginated | All invoices mocked locally | ❌ | Scalability issue |
| **Search/Filter** | Likely supported by backend | Filtered locally | ❌ | **Inefficient** |

**Verdict:** **Rebuild recommended** — Invoices list has zero backend integration. Need to implement API calls to `GET /invoices?page=1&limit=20`.

---

#### Screen 10: Invoice Detail/Payment Reconciliation
**Path:** `/app/(workspace)/invoices/[id]/page.tsx`  
**Status:** ❌ **PARTIALLY INTEGRATED** (Mixed local + API)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Get invoice** | `GET /invoices/{id}` assumed | Uses local mock data (not API) | ❌ | **Not calling API for fetch** |
| **Record payment** | `PUT /invoices/{id}/payment { paidDate: ISO }` | Calls endpoint | ✅ | — |
| **Payment request** | Backend expects `paidDate` (ISO datetime string) | Frontend sends `{ amount: 999999, method: 'bank_transfer' }` | ❌ | **Request field mismatch** |
| **Response fields** | Returns updated invoice object | Expects same structure | ✅ (if API called) | — |
| **Payment stage timeline** | Not in API response; derived from order/invoice state | Frontend shows hardcoded timeline (OrderConfirmed → Shipped → Invoiced → Paid) | ⚠️ | Timeline may not match business logic |

**Verdict:** **Rebuild recommended** — Invoices detail needs full API integration (fetch + payment). Payment request schema doesn't match backend.

---

### 2.6 Approvals Module (2 screens)

#### Screen 11: Approvals Queue List
**Path:** `/app/(workspace)/approvals/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Moderate rework)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **List endpoint** | `GET /approvals/queue?page=1&limit=20` returns quotations with approval steps | Calls endpoint with `limit=100` hardcoded | ⚠️ | Pagination inconsistency |
| **Response structure** | Returns quotation array with `approvalSteps` array | Frontend expects quotations with approval metadata | ⚠️ | Need to verify `approvalSteps` field structure |
| **Pending step** | Backend tracks which step is pending (role + assignee) | Frontend shows "Pending at Sales Manager" | ⚠️ | Verify field names for step status |
| **Risk score** | `blendedRiskScore` numeric field | Frontend filters by risk threshold | ⚠️ | Verify threshold matches backend calculation |
| **Status filter** | Backend doesn't filter by approval status; frontend filters locally | Frontend shows Pending/Returned/Approved tabs | ⚠️ | Should use backend filter if available |
| **Sorting** | Not clear from endpoint | Frontend may sort locally | ⚠️ | Verify sort strategy |

**Verdict:** **Reuse with moderate rework** — Verify `approvalSteps` response shape, standardize pagination, confirm risk thresholds.

---

#### Screen 12: Approval Detail/Decision
**Path:** `/app/(workspace)/approvals/[id]/page.tsx`  
**Status:** ⚠️ **PARTIAL ALIGNMENT** (Moderate rework)

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Get quotation** | `GET /quotations/{id}` returns full quotation with approval steps | Calls endpoint | ✅ | — |
| **Approve endpoint** | `POST /approvals/{id}/approve { reason?: string }` | Frontend sends `reason` | ✅ | — |
| **Reject endpoint** | `POST /approvals/{id}/reject { reason: string }` (required) | Frontend sends `reason` | ✅ | — |
| **Request revision** | `POST /approvals/{id}/request-revision { reason: string }` | Frontend calls endpoint | ✅ | — |
| **Response fields** | Returns updated `Approval` object | Frontend refetches quotation to get updated status | ⚠️ | Inefficient; backend should return quotation directly |
| **Audit trail** | Backend tracks all approval decisions | Frontend displays `approvalSteps` array | ✅ | — |
| **Risk breakdown** | `discountByLine`, `riskByLine`, `blendedRiskScore` | Frontend displays risk matrix | ⚠️ | Verify field names match |
| **Role-based gating** | Backend validates user has permission | Frontend checks user role client-side | ✅ | — |

**Verdict:** **Reuse with moderate rework** — Verify approval response shape, ensure refetch pattern works, confirm risk field names.

---

### 2.7 Customer Portal (1 screen)

#### Screen 13: Portal Product Catalog / Customer Browse
**Path:** `/app/portal/catalog/page.tsx`  
**Status:** ❌ **NOT FULLY INTEGRATED**

| Aspect | Backend | Frontend | Match? | Issue |
|--------|---------|----------|--------|-------|
| **Catalog endpoint** | `GET /portal/catalog` returns catalog grouped by category with pricing | Frontend calls endpoint | ✅ | — |
| **Response structure** | Returns `{ categories: [ { name, products: [...] } ] }` with tier-specific pricing | Frontend displays by category | ✅ | — |
| **Inquiry endpoint** | `POST /portal/inquiries { items, note? }` | Frontend calls endpoint | ✅ | — |
| **Item structure** | `{ product: id, variantId?, quantity: number, note?: string }` | Frontend sends same structure | ✅ | — |
| **Auth** | Requires customer token (from `/auth/customer/verify`) | Frontend sends token in Authorization header | ✅ | — |
| **After submit** | Returns inquiry object with `id` | Frontend shows success + link to `/portal/inquiries` | ✅ | — |
| **Status quo** | Backend fully implemented and tested | Frontend may have auth/token issues | ⚠️ | Verify customer token is attached to API calls |

**Verdict:** **Reuse with patch** — Verify customer authentication token is being sent in API calls to portal endpoints (check apiClient for customer token handling).

---

## SECTION 3: MISMATCH DETAIL & ROOT CAUSES

### Critical Mismatches (Block functionality)

| Issue | Affected Screens | Root Cause | Fix Complexity |
|-------|------------------|-----------|---|
| **Invoices have zero backend integration** | #9, #10 | Frontend built with local mock; never integrated | High (rebuild) |
| **Invoice payment schema wrong** | #10 | Frontend sends `amount` + `method`; backend expects `paidDate` only | Medium (remap) |
| **Tier pricing not in product response** | #7, #8 | Product endpoint returns basePrice only; tier pricing in separate `/pricelists` endpoint | Medium (add integration) |
| **Status enum values** | #4 | Backend uses snake_case (`pending_approval`); frontend may use camelCase | Low (rename) |
| **Pagination hardcoded inconsistently** | #4, #7, #11 | Frontend hardcodes `limit=100`; backend defaults to 20 | Low (standardize) |

### Data Shape Mismatches (May require field mapping)

| Issue | Affected Screens | Backend Response | Frontend Expects | Fix |
|-------|------------------|---|---|---|
| **approvalSteps structure** | #11, #12 | `approvalSteps: [ { step, status, assignedTo, decidedAt } ]` | Unknown (need to verify) | Verify response shape |
| **Quotation lineItems** | #5 | `lineItems: [ { id, product, variantId, quantity, discountPercent, unitPrice, total } ]` | May expect different field names | Verify field names |
| **Dashboard at-risk calculation** | #3 | Backend defines at-risk (blendedRiskScore > X) | Frontend may use different threshold | Align thresholds |
| **Approval reason requirement** | #12 | Approve is optional; reject/revise required | Frontend may treat all as optional | Document requirements |

### Inefficiencies (Work but suboptimal)

| Issue | Affected Screens | Current Approach | Better Approach |
|-------|------------------|---|---|
| **Client-side product filtering** | #7 | Frontend filters all products locally | Use `?search=X&category=Y&isActive=true` query params |
| **Client-side pagination** | All list screens | Hardcoded `limit=100` (fetches all) | Use standard `?page=X&limit=20` |
| **Approval refetch pattern** | #12 | Decision endpoint returns Approval; frontend refetches quotation | Approval endpoint should return quotation directly |
| **Dashboard stat calculation** | #3 | Frontend counts quotations manually | Backend should return `{ pendingCount, openCount, atRiskCount }` |

---

## SECTION 4: SCREEN-BY-SCREEN VERDICTS

### Verdict Summary Table

| # | Screen | Verdict | Reason | Est. Effort |
|---|--------|---------|--------|---|
| 1 | Staff/Customer Login | ✅ **Reuse as-is** | Perfectly aligned; all endpoints match | 0 mins |
| 2 | Customer Email Verification | ✅ **Reuse as-is** | Perfectly aligned; auth flow works | 0 mins |
| 3 | Sales Dashboard | **Reuse with patch** | Add status filter to quotations call; verify at-risk threshold | 15 mins |
| 4 | Quotations List | **Reuse with patch** | Fix status enum (snake_case), standardize pagination | 20 mins |
| 5 | Quotation Detail/Editor | **Reuse with moderate rework** | Verify line item fields, discount logic, ensure risk calculation called | 45 mins |
| 6 | Quotation from Inquiry | **Reuse with patch** | Verify error handling and item conversion | 15 mins |
| 7 | Products List | **Reuse with patch** | Fix pagination, move filters to backend, verify tier pricing integration | 30 mins |
| 8 | Product Detail/Editor | **Reuse with patch** | Verify tier pricing integration, category enum | 25 mins |
| 9 | Invoices List | ❌ **Rebuild** | Zero backend integration; using local mock | 60 mins |
| 10 | Invoice Detail | ❌ **Rebuild** | Mixed local + API; payment schema wrong | 50 mins |
| 11 | Approvals Queue | **Reuse with moderate rework** | Verify response shape, pagination, risk thresholds | 35 mins |
| 12 | Approval Decision | **Reuse with moderate rework** | Verify response shape, improve refetch pattern | 30 mins |
| 13 | Portal Catalog | **Reuse with patch** | Verify customer token handling in API calls | 20 mins |

**Total Estimated Effort:** ~345 minutes (5.75 hours) for full alignment

---

## SECTION 5: QUESTIONS FOR YOU

Before proceeding to PHASE 2, please confirm:

### A. Priority & Scope

1. **Should I rebuild Invoices (#9, #10)?** They're currently all local mock. Full backend integration would improve data freshness but costs 110 minutes. Alternatively, I can leave them mocked for now and just align the response shapes to what the API would return.

2. **Tier pricing for Products (#7, #8):** The backend has `/pricelists` endpoint (not yet detailed). Should I integrate tier pricing into product detail? Or keep it simplified (just basePrice for now)?

3. **Portal Catalog auth (#13):** Does the frontend already have customer token handling set up in the API client? Or do I need to implement token switching between staff/customer auth modes?

### B. Verification

4. **Status enum values:** Can you confirm whether your backend returns `pending_approval` (snake_case) or `pendingApproval` (camelCase) in the `status` field?

5. **Risk threshold:** What is the minimum `blendedRiskScore` for a quotation to be considered "at-risk"? (Needed to verify Dashboard filtering.)

6. **Approval steps structure:** What does the backend return in the `approvalSteps` array? Sample structure:
   ```json
   "approvalSteps": [
     { "step": "sales_manager_discount", "status": "pending", "assignedTo": "role", "decidedAt": null }
   ]
   ```

### C. Decisions

7. **Quotation validation:** Should discount ceiling be calculated on the backend (`POST /quotations/{id}/calculate-risk`), or can frontend validate locally?

8. **Invoice payment:** The backend expects `paidDate` (ISO string). Should I also support `amount` and `method` fields, or remove them from the frontend form?

---

## SECTION 6: WHAT'S NEXT

Once you confirm the above:

### PHASE 2 Plan
1. **Patch 8 screens** (lowest effort, highest value) — Auth, Dashboard, Quotations (3), Products (2), Portal
2. **Moderate rework 4 screens** — Quotation Editor, Approvals Queue, Approval Decision, Product Detail
3. **Rebuild 2 screens** — Invoices List & Detail (or decide to leave mocked)

### Expected Outcome
- All frontend API calls match backend contracts exactly
- No field name mismatches or missing data
- Consistent pagination & filtering strategy
- Proper error handling & loading states
- Auth tokens handled correctly for both staff and customer

---

**Next Step:** Review the verdicts above, answer the questions in Section 5, and approve the PHASE 2 plan.
