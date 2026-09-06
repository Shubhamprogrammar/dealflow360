

const BASE_URL = 'http://localhost:5000/api/v1';
let adminToken, repToken, managerToken, financeToken, customerToken;
let customerId, productId, quoteId;

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(json)}`);
  return json.data;
}

async function runE2ETest() {
  console.log("🚀 Starting DealFlow360 E2E Role Verification...\n");

  try {
    // 1. Authenticate Roles
    console.log("🔐 Authenticating all staff roles...");
    adminToken = (await request('POST', '/auth/login', { email: 'admin@dealflow.com', password: 'dealflow' })).accessToken;
    repToken = (await request('POST', '/auth/login', { email: 'rep@dealflow.com', password: 'dealflow' })).accessToken;
    managerToken = (await request('POST', '/auth/login', { email: 'manager@dealflow.com', password: 'dealflow' })).accessToken;
    financeToken = (await request('POST', '/auth/login', { email: 'finance@dealflow.com', password: 'dealflow' })).accessToken;
    console.log("✅ Staff authenticated.\n");

    // 2. Setup (Admin)
    console.log("⚙️ Admin: Setting up Customer and Product...");
    const uniqueEmail = `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
    const customer = await request('POST', '/customers', {
      companyName: 'E2E Testing Corp',
      contactEmail: uniqueEmail,
      customerTier: 'bronze',
      paymentTerms: 'Net 30'
    }, adminToken);
    customerId = customer.id;
    
    // Register customer portal access
    customerToken = (await request('POST', '/auth/customer/register', {
      companyName: 'E2E Testing Corp',
      email: uniqueEmail,
      password: 'password123'
    })).accessToken;

    const product = await request('POST', '/products', {
      sku: `PROD-${Date.now()}`,
      name: 'Enterprise Server',
      category: 'Hardware',
      basePrice: 10000,
      costPrice: 6000,
      taxRate: 0.1,
      isActive: true,
      isSubscription: false
    }, adminToken);
    productId = product.id;
    console.log("✅ Setup complete.\n");

    // 3. Sales Rep Flow
    console.log("💼 Sales Rep: Creating Quotation...");
    const quote = await request('POST', '/quotations', { customer: customerId }, repToken);
    quoteId = quote.id;
    
    console.log("💼 Sales Rep: Adding high-discount Line Item...");
    await request('POST', `/quotations/${quoteId}/line-items`, {
      product: productId,
      quantity: 5,
      discountPercent: 20 // Exceeds Bronze Hardware limit (10%)
    }, repToken);
    
    console.log("💼 Sales Rep: Calculating risk and submitting for approval...");
    await request('POST', `/quotations/${quoteId}/calculate-risk`, {}, repToken);
    await request('POST', `/quotations/${quoteId}/submit-approval`, {}, repToken);
    console.log("✅ Quotation submitted for approval.\n");

    // 4. Manager Flow
    console.log("👔 Sales Manager: Reviewing approvals queue...");
    let queue = await request('GET', '/approvals/queue?page=1&limit=10', null, managerToken);
    if (!queue.items.some(q => q.id === quoteId)) throw new Error("Quote not in Manager queue!");
    
    console.log("👔 Sales Manager: Approving quotation...");
    await request('POST', `/approvals/${quoteId}/approve`, { reason: 'Approved E2E discount' }, managerToken);
    console.log("✅ Manager approved.\n");

    // 5. Finance Flow (Tier 2 approver for Bronze > 15% discount)
    console.log("🏦 Finance: Reviewing approvals queue...");
    queue = await request('GET', '/approvals/queue?page=1&limit=10', null, financeToken);
    if (!queue.items.some(q => q.id === quoteId)) throw new Error("Quote not in Finance queue!");
    
    console.log("🏦 Finance: Approving quotation...");
    await request('POST', `/approvals/${quoteId}/approve`, { reason: 'Finance approved E2E discount' }, financeToken);
    console.log("✅ Finance approved. Quote is now officially Approved.\n");

    // 6. Customer Flow
    console.log("🤝 Customer: Viewing Portal...");
    const portalQuotes = await request('GET', '/portal/quotations', null, customerToken);
    if (!portalQuotes.some(q => q.id === quoteId)) throw new Error("Quote not visible to customer!");
    
    console.log("🤝 Customer: Confirming Deal...");
    await request('POST', `/portal/quotations/${quoteId}/confirm`, {}, customerToken);
    console.log("✅ Customer confirmed the deal.\n");

    console.log("🎉 E2E Test Completed Successfully! All roles are functioning perfectly.");
    
  } catch (err) {
    console.error("\n❌ E2E Test Failed:\n", err.message);
  }
}

runE2ETest();
