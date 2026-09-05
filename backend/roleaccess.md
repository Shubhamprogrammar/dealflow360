# 🔐 DealFlow360 — Role-Based Access Control (RBAC Specification)

Based on system architecture with RBAC (Rep, Manager, Finance/Ops, Admin, Customer).

---

## 🧑‍💼 1. Sales Representative (Rep)

### 🔍 Access
- Quotation Builder (products, pricing, discounts)
- Pipeline / Quotation list (own deals only)
- Upsell / Cross-sell suggestions
- Deal health (own deals)
- Limited customer data

### ⚙️ Permissions
- Create & edit quotations
- Add/remove products
- Apply discounts (within limits)
- View live margin & risk score
- Submit quote for approval
- Respond to customer negotiation
- Trigger fulfillment (post-approval)

### 🚫 Restrictions
- Cannot approve discounts
- Cannot change pricing/discount rules
- No access to financial reports

---

## 🧑‍💼 2. Sales Manager / Approver

### 🔍 Access
- All Rep-level access
- Team quotations
- Discount Approval Screen
- Deal Health Dashboard (team-level)

### ⚙️ Permissions
- Approve / reject / return quotes
- View blended risk score
- Add audit comments
- Escalate to Finance
- Monitor team performance

### 🚫 Restrictions
- Cannot configure system rules
- Cannot manage billing/invoices

---

## 💰 3. Finance / Operations User

### 🔍 Access
- Approved quotations
- Billing & subscription module
- Fulfillment & inventory system
- Warehouse split view
- Financial reports

### ⚙️ Permissions
- Final approval (high-risk deals)
- Generate invoices
- Handle proration, refunds, credit notes
- Manage warehouse allocation
- Override fulfillment splits
- Track order fulfillment

### 🚫 Restrictions
- Cannot create/edit quotations
- Cannot modify pricing/discount logic

---

## 👤 4. Customer (Portal User)

### 🔍 Access
- Own quotations only
- Negotiation interface
- Status tracking (Sent / Negotiation / Confirmed)

### ⚙️ Permissions
- View quotation
- Add comments
- Request counter-discounts
- Confirm quotation

### ⚠️ System Behavior
- If discount exceeds threshold → auto re-approval triggered

### 🚫 Restrictions
- No access to margins, risk score, approvals
- No backend/system access

---

## 🛠️ 5. Admin

### 🔍 Access
- Full system access
- Admin Console
- Reports & analytics

### ⚙️ Permissions
- Manage products & pricing
- Configure discount tiers & approval chains
- Setup warehouses & inventory rules
- Configure billing & subscription plans
- Define upsell/cross-sell rules
- Access reports & exports

### 🚫 Restrictions
- No operational limitations (superuser role)

---

## 📊 Summary Table

| Role            | Create Quote | Approve | Billing | Fulfillment | Config | Portal |
|-----------------|-------------|--------|--------|-------------|--------|--------|
| Sales Rep       | ✅          | ❌     | ❌     | Limited     | ❌     | ❌     |
| Manager         | ✅          | ✅     | ❌     | ❌          | ❌     | ❌     |
| Finance/Ops     | ❌          | ✅     | ✅     | ✅          | ❌     | ❌     |
| Customer        | ❌          | ❌     | ❌     | ❌          | ❌     | ✅     |
| Admin           | ❌          | ❌     | ❌     | ❌          | ✅     | ❌     |

---

## 🧠 Role Philosophy

- **Sales Rep → Execution**
- **Manager → Risk Control**
- **Finance → Financial + Operational Control**
- **Customer → External Interaction**
- **Admin → System Configuration**

---

## ✅ Key Benefits

- Secure role separation
- Controlled discount approvals
- Strong audit trail
- Clean workflow (Quote → Approval → Fulfillment → Billing)
- Prevents misuse of pricing & financial operations

---