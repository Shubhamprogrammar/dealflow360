# Frontend Screen to API Call Mapping

This document maps every frontend screen to the API calls it makes.

---

## Authentication Screens

### 1. Staff Login Screen
**Path:** `/app/login/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Staff Login |
| **Endpoints Called** | `POST /auth/login` (staff login), `POST /auth/customer/request-link` (customer magic link) |
| **Request Fields** | `{ email: string, password: string }` (staff) or `{ email: string }` (customer) |
| **Expected Response** | `{ accessToken: string, refreshToken: string }` (staff) or empty 200 OK (customer) |
| **Triggers** | On form submit; also demo login hardcoded with password 'dealflow' |
| **How Data Is Used** | Tokens saved to localStorage; redirects to `/dashboard` on success; errors displayed inline |

---

### 2. Customer Email Verification Screen
**Path:** `/app/portal/verify/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Portal Email Verification |
| **Endpoints Called** | `GET /auth/customer/verify?token={token}` |
| **Request Fields** | Query parameter: `token` (from URL) |
| **Expected Response** | `{ accessToken: string, customerId: string, companyName: string, redirect: string }` |
| **Triggers** | On page load (automatic) |
| **How Data Is Used** | Tokens saved to localStorage; customer session saved; redirects to URL from response or `/portal` on success; displays error if token invalid/expired |

---

## Internal Staff Screens

### 3. Dashboard / Home
**Path:** `/app/(workspace)/dashboard/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Sales Dashboard |
| **Endpoints Called** | `GET /quotations?page=1&limit=100`, `GET /dashboard/stalled-deals`, `GET /dashboard/discount-anomalies`, `GET /dashboard/delivery-slippage` |
| **Request Fields** | None (pagination built into endpoint) |
| **Expected Response** | Quotation array, 3 separate health alert arrays |
| **Triggers** | On page load (via React Query) |
| **How Data Is Used** | Displays stat tiles: Pending Approvals count, Open Quotations count, At-Risk Deals count; Recent Activity list; links to key modules |

---

### 4. Quotations List (Kanban/Table View)
**Path:** `/app/(workspace)/quotations/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Quotations Pipeline |
| **Endpoints Called** | `GET /quotations?page=1&limit=100`, `GET /customers?page=1&limit=100`, `GET /inquiries?status=new&page=1&limit=100`, `POST /quotations` (create draft), `POST /quotations/{id}/submit-approval` (submit to approval) |
| **Request Fields** | Create: `{ customer: customerId }` | Submit: none |
| **Expected Response** | Quotation array, Customer array, Inquiry array, single Quotation (on create/submit) |
| **Triggers** | Page load; create new quotation on button click (requires customer selection); drag from Draft to PendingApproval triggers submit |
| **How Data Is Used** | Kanban view groups quotations by status; table view shows all with search/filter; New Inquiry cards allow converting to draft quotation; local state for search/filter |

---

### 5. Quotation Detail / Editor
**Path:** `/app/(workspace)/quotations/[id]/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Quotation Detail Editor |
| **Endpoints Called** | `GET /quotations/{id}`, `GET /products?page=1&limit=100`, `PUT /quotations/{id}/line-items/{itemId}`, `DELETE /quotations/{id}/line-items/{itemId}`, `POST /quotations/{id}/line-items`, `POST /quotations/{id}/submit-approval` |
| **Request Fields** | Line update: `{ quantity: number, discountPercent: number }` | Line create: `{ product: productId, quantity: number, discountPercent: number }` | Submit: none |
| **Expected Response** | Quotation object (on all mutations) |
| **Triggers** | Page load; adding/editing/removing lines (optimistic local state); save draft button; submit for approval button |
| **How Data Is Used** | Shows quotation status, customer tier; editable table of line items (qty, discount %); validates discount ceiling per line live; upsell suggestions from unselected products; totals calculated locally |

---

### 6. Create Quotation from Inquiry
**Path:** `/app/(workspace)/quotations/new/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Bridge: New Quotation from Inquiry |
| **Endpoints Called** | `POST /quotations/from-inquiry/{inquiryId}` |
| **Request Fields** | None (inquiryId in URL) |
| **Expected Response** | Single Quotation object (pre-filled with inquiry items) |
| **Triggers** | On page load (automatic); navigated to via kanban "New Inquiry" card click with `?fromInquiry={id}` |
| **How Data Is Used** | Creates draft quotation server-side; invalidates both quotations and inquiries caches; navigates to quotation detail editor; shows error if inquiry not found or product unavailable |

---

### 7. Products List
**Path:** `/app/(workspace)/products/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Product Catalog Management |
| **Endpoints Called** | `GET /products?page=1&limit=100` |
| **Request Fields** | None |
| **Expected Response** | Product array with variants and pricing |
| **Triggers** | On page load; filter/search done locally |
| **How Data Is Used** | Displays table with all products; filters by category, status, search name; shows variant count and tier pricing; stat tiles with totals; link to product detail for editing |

---

### 8. Product Detail / Editor
**Path:** `/app/(workspace)/products/[id]/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Product Detail Editor |
| **Endpoints Called** | `GET /products/{id}` (if not new), `POST /products` (create new) or `PUT /products/{id}` (update) |
| **Request Fields** | `{ name, category (lowercase), basePrice, costPrice, unit, taxRate, isSubscription, isActive, variants: [ { attributeName, attributeValue, priceAdjustment } ] }` |
| **Expected Response** | Single Product object |
| **Triggers** | Page load (for existing products); save button click |
| **How Data Is Used** | Edit form for product general info (name, category, price, tax, subscription, unit); variants table (display only); pricelists table (display only); saves to backend and redirects to `/products` on success |

---

### 9. Invoices List
**Path:** `/app/(workspace)/invoices/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Invoices List |
| **Endpoints Called** | None for list (data mocked locally) |
| **Request Fields** | N/A |
| **Expected Response** | N/A |
| **Triggers** | Page load |
| **How Data Is Used** | Shows invoices from local mock store; filters by status (Paid/Unpaid) and search; stat badges for unpaid/paid counts; link to invoice detail |

---

### 10. Invoice Detail
**Path:** `/app/(workspace)/invoices/[id]/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Invoice Detail / Payment Reconciliation |
| **Endpoints Called** | `GET /invoices/{id}` (data from mock), `PUT /invoices/{id}/payment` (record payment) |
| **Request Fields** | `{ amount: number, method: string }` (payment recording uses fixed `999999` and `'bank_transfer'`) |
| **Expected Response** | Single Invoice object |
| **Triggers** | Page load; "Record Payment" button (for FinanceOps/Admin role, unpaid invoices only) |
| **How Data Is Used** | Displays payment stage timeline (OrderConfirmed → Shipped → Invoiced → Paid); invoice details table; "Record Payment" button updates mock store; invalidates invoice list cache |

---

### 11. Approvals Queue List
**Path:** `/app/(workspace)/approvals/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Approvals Queue |
| **Endpoints Called** | `GET /approvals/queue` |
| **Request Fields** | None |
| **Expected Response** | Quotation array with approval steps and risk scores |
| **Triggers** | On page load |
| **How Data Is Used** | Displays quotations requiring discount approval; filters by stage (Pending/Returned/Approved) and blended risk; stat badges for counts; shows pending step assignee (role) or final approver |

---

### 12. Approval Detail / Decision
**Path:** `/app/(workspace)/approvals/[id]/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Approval Detail & Decision |
| **Endpoints Called** | `GET /quotations/{id}`, `POST /approvals/{id}/approve`, `POST /approvals/{id}/reject`, `POST /approvals/{id}/request-revision`, `GET /quotations/{id}` (fetch after decision) |
| **Request Fields** | `{ reason: string }` (for all decision endpoints) |
| **Expected Response** | Single Quotation object (with updated approval steps) |
| **Triggers** | Page load; Approve/Return/Reject buttons (visible only to appropriate role with pending step) |
| **How Data Is Used** | Shows quotation risk breakdown (discount % vs ceiling); approval audit trail; stage timeline; decision buttons gated by user role and pending step role; decisions update quotation status and approval steps |

---

## Customer Portal Screens

### 13. Portal Product Catalog (Customer Browse)
**Path:** `/app/portal/catalog/page.tsx`

| Aspect | Details |
|--------|---------|
| **Screen Name** | Customer Product Catalog |
| **Endpoints Called** | `GET /portal/catalog`, `POST /portal/inquiries` (submit inquiry) |
| **Request Fields** | Inquiry: `{ items: [ { product: productId, variantId?: string, quantity: number, note?: string } ], note?: string }` |
| **Expected Response** | Catalog object (grouped by category with pricing), Inquiry object on submit |
| **Triggers** | Page load; checkbox to select products; submit button to send inquiry |
| **How Data Is Used** | Displays products grouped by category; shows tier-specific pricing (e.g., "Bronze tier"); customer can select multiple products with quantity and notes; submit creates inquiry and shows success message with link to `/portal/inquiries` |

---

## Summary: Services Used

### Service Files and Their Endpoints

| Service | Endpoints Used |
|---------|---|
| **userService.ts** | `GET /users`, `POST /users` |
| **quotationService.ts** | `GET /quotations?page=1&limit=100`, `GET /quotations/{id}`, `POST /quotations`, `POST /quotations/from-inquiry/{id}`, `PUT /quotations/{id}/line-items/{itemId}`, `DELETE /quotations/{id}/line-items/{itemId}`, `POST /quotations/{id}/line-items`, `POST /quotations/{id}/submit-approval` |
| **catalogService.ts** | `GET /products?page=1&limit=100`, `GET /products/{id}`, `POST /products`, `PUT /products/{id}` |
| **customerService.ts** | `GET /customers?page=1&limit=100`, `GET /customers/{id}` |
| **dealHealthService.ts** | `GET /dashboard/stalled-deals`, `GET /dashboard/discount-anomalies`, `GET /dashboard/delivery-slippage` |
| **approvalService.ts** | `GET /approvals/queue`, `POST /approvals/{id}/approve`, `POST /approvals/{id}/reject`, `POST /approvals/{id}/request-revision` |
| **inquiryService.ts** | `GET /inquiries?status=new&page=1&limit=100`, `GET /inquiries/{id}`, `POST /inquiries/{id}/dismiss`, `POST /quotations/from-inquiry/{id}` |
| **billingService.ts** | `PUT /invoices/{id}/payment` (GET/list from local mock) |
| **portalCatalogService.ts** | `GET /portal/catalog`, `POST /portal/inquiries`, `GET /portal/inquiries` |

### Authentication Service

| Endpoint | Used By |
|----------|---------|
| `POST /auth/login` | Login page, useSession hook |
| `POST /auth/customer/request-link` | Login page (customer tab) |
| `GET /auth/customer/verify?token={token}` | Portal verify page |
| `GET /auth/me` | useSession hook (after login) |

---

## Notes

1. **Local Mocking**: Invoices and Subscriptions are mocked locally (no backend list endpoints).
2. **Pagination**: All list endpoints use hardcoded `page=1&limit=100`.
3. **State Management**: React Query (TanStack Query) manages all server state; local state for UI filters/search.
4. **Role-Based Access**: Approval decisions and payment recording gated by user role.
5. **Optimistic Updates**: Line items edited in quotation detail use local state before save; discount ceiling checked live client-side.
6. **Error Handling**: Errors from API calls displayed as toast/inline messages; customer login intentionally doesn't hint if email exists.
