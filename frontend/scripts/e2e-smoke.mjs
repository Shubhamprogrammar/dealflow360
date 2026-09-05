import { chromium } from '@playwright/test';
import path from 'node:path';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const SHOTS = path.resolve(
  'C:/Users/swati/AppData/Local/Temp/claude/c--Users-swati-Desktop-Dealflow360/65a93120-6d7f-40ae-bd80-66a4f84edf96/scratchpad/screenshots',
);

const errors = [];

async function settle(page) {
  // The mock backend has an artificial ~250ms latency per call, and some
  // screens chain two calls (e.g. the portal fetches the quotation list,
  // then the selected quotation). Wait for any "Loading…"/empty-state
  // placeholder to clear, then give chained fetches room to finish too.
  await page
    .waitForFunction(
      () => !document.body.innerText.includes('Loading…') && !document.body.innerText.includes('No quotation to display'),
      null,
      { timeout: 5000 },
    )
    .catch(() => {});
  await page.waitForTimeout(600);
}

async function shot(page, name) {
  await settle(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  console.log('shot:', name);
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

  // 1. Login screen
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('text=Entry point for internal users and customers');
  await shot(page, '01-login');

  // Log in as Sales Rep
  await page.click('button:has-text("Sales Rep")');
  await page.waitForURL('**/dashboard');
  await shot(page, '02-dashboard-rep');

  // 3. Quotations list (kanban)
  await page.click('a:has-text("Quotations")');
  await page.waitForURL('**/quotations');
  await page.waitForSelector('text=Every quotation in the system');
  await shot(page, '03-quotations-kanban');

  // table view toggle
  await page.click('button:has-text("Switch to Table View")');
  await shot(page, '03b-quotations-table');
  await page.click('button:has-text("Switch to Kanban View")');

  // 4. Open Acme Corp Q-1042 (pending approval, high risk -- the worked example)
  await page.click('text=Acme Corp');
  await page.waitForURL('**/quotations/Q-1042');
  await shot(page, '04-quotation-detail-locked');

  // Back to list, open a Draft quote to test editing
  await page.goto(`${BASE}/quotations`);
  await page.click('text=Delta LLC');
  await page.waitForURL('**/quotations/Q-1020');
  await shot(page, '04b-quotation-detail-draft-editable');

  // ---- Security check: a Rep hitting /approvals directly by URL ----
  // The nav hides the Approvals tab for Rep, but does the route itself guard?
  await page.goto(`${BASE}/approvals/Q-1042`);
  await settle(page);
  const repSeesApprovalDecision = await page.locator('button:has-text("Approve")').count();
  if (repSeesApprovalDecision > 0) {
    errors.push('[security] Rep can reach /approvals/Q-1042 directly by URL and see Approve/Reject/Return buttons -- there is no route-level guard, only a hidden nav tab.');
  } else if (page.url().includes('/approvals/')) {
    errors.push('[security] Rep can reach /approvals/Q-1042 directly by URL (no redirect) even though the nav hides the tab -- route has no role guard.');
  }
  await shot(page, '04c-rep-direct-url-to-approvals');

  // 5. Approvals list -- log in as Sales Manager for the real approval flow
  await page.goto(`${BASE}/login`);
  await page.click('button:has-text("Log out")').catch(() => {});
  await page.goto(`${BASE}/login`);
  await page.click('button:has-text("Sales Manager")');
  await page.waitForURL('**/dashboard');
  await page.click('a:has-text("Approvals")');
  await page.waitForURL('**/approvals');
  await shot(page, '05-approvals-list');

  // 6. Approval detail for Q-1042 -- the category-ceiling breakdown screen
  await page.click('text=Q-1042');
  await page.waitForURL('**/approvals/Q-1042');
  await shot(page, '06-approval-detail-as-manager');

  const rowText = await page.textContent('body');
  if (!rowText.includes('pt OVER')) {
    errors.push('[logic] Expected an "Xpt OVER" line in the approval breakdown table for Q-1042 but did not find one');
  }
  const hasDecisionButtons = await page.locator('button:has-text("Approve")').count();
  if (hasDecisionButtons === 0) {
    errors.push('[logic] Sales Manager should see Approve/Return/Reject buttons on the pending step for Q-1042 but none were found');
  }

  // Switch to Admin, which per the role table can see every remaining
  // internal tab (Fulfillment/Subscriptions/Invoices/Deal Health/Reports/Products).
  await page.click('button:has-text("Log out")');
  await page.waitForURL('**/login');
  await page.click('button:has-text("Admin")');
  await page.waitForURL('**/dashboard');

  // 7. Fulfillment list
  await page.click('a:has-text("Fulfillment")');
  await page.waitForURL('**/fulfillment');
  await shot(page, '07-fulfillment-list');

  // 8. Fulfillment detail
  await page.click('text=Q-1042');
  await page.waitForURL('**/fulfillment/Q-1042');
  await shot(page, '08-fulfillment-detail');

  // 9. Subscriptions
  await page.click('a:has-text("Subscriptions")');
  await page.waitForURL('**/subscriptions');
  await shot(page, '09-subscriptions-list');

  // 10. Billing detail
  await page.click('text=Acme Corp');
  await page.waitForURL('**/subscriptions/sub1');
  await shot(page, '10-billing-detail');

  // 12. Invoices
  await page.click('a:has-text("Invoices")');
  await page.waitForURL('**/invoices');
  await shot(page, '12-invoices-list');

  // 13. Invoice detail
  await page.click('text=INV-1042');
  await page.waitForURL('**/invoices/INV-1042');
  await shot(page, '13-invoice-detail');

  // 14. Deal health
  await page.click('a:has-text("Deal Health")');
  await page.waitForURL('**/deal-health');
  await shot(page, '14-deal-health');

  // 15. Reports
  await page.click('a:has-text("Reports")');
  await page.waitForURL('**/reports');
  await shot(page, '15-reports');

  // 16. Products list
  await page.click('a:has-text("Products")');
  await page.waitForURL('**/products');
  await shot(page, '16-products-list');

  // 17. Product detail (no top nav expected)
  await page.click('text=Laptop Pro 14');
  await page.waitForURL('**/products/p1');
  await shot(page, '17-product-detail');
  const nameFieldValue = await page.locator('label:has-text("Product name") input').inputValue();
  if (nameFieldValue !== 'Laptop Pro 14') {
    errors.push(`[logic] Product detail for p1 should have loaded "Laptop Pro 14" into the name field but got "${nameFieldValue}"`);
  }
  const hasTabsOnProductDetail = await page.locator('header a:has-text("Dashboard")').count();
  if (hasTabsOnProductDetail > 0) {
    errors.push('[layout] Product detail screen (17) should not show the tabbed nav bar per wireframe, but the Dashboard tab was found');
  }

  // 18. Discount & approval setup (no top nav expected)
  await page.goto(`${BASE}/settings/discount-approval`);
  await page.waitForSelector('text=Discount tiers and approval chains');
  await shot(page, '18-discount-approval-setup');
  const hasTabsOnSettings = await page.locator('header a:has-text("Dashboard")').count();
  if (hasTabsOnSettings > 0) {
    errors.push('[layout] Settings screen (18) should not show the tabbed nav bar per wireframe, but the Dashboard tab was found');
  }

  // 11. Customer portal
  await page.goto(`${BASE}/login`);
  await page.click('button:has-text("Customer Portal")');
  await page.waitForURL('**/portal');
  await shot(page, '11-customer-portal');

  await page.click('a:has-text("Messages")');
  await shot(page, '11b-portal-messages');
  await page.click('a:has-text("Profile")');
  await shot(page, '11c-portal-profile');

  await browser.close();

  console.log('\n--- Errors / issues collected ---');
  if (errors.length === 0) {
    console.log('none');
  } else {
    for (const e of errors) console.log(e);
  }
}

run().catch((e) => {
  console.error('SMOKE TEST CRASHED:', e);
  process.exit(1);
});
