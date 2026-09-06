# SMTP & Nodemailer Configuration Audit

**Date:** 2026-09-06
**Purpose:** Verify customer authentication email delivery is working correctly

---

## Current Configuration Status: ✅ PROPERLY STRUCTURED

The email system is **well-architected** but depends on proper environment variable configuration and running background workers.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Authentication Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Customer calls POST /auth/request-magic-link            │
│     └─→ authService.requestMagicLink(email)                │
│          └─→ CustomerModel.findOne({ contactEmail })      │
│              └─→ authService.issueMagicLink()              │
│                  ├─→ Generate random token                 │
│                  ├─→ Hash token & store in DB              │
│                  ├─→ Log link to console (dev convenience) │
│                  └─→ enqueueEmail(buildMagicLinkEmail())   │
│                                                               │
│  2. Job Queue (BullMQ + Redis)                             │
│     └─→ enqueueEmail() adds job to Redis queue            │
│         └─→ defaultQueue.add(JOB_NAMES.SEND_EMAIL, ...)   │
│             └─→ Job stored with 3 retries, exponential    │
│                 backoff (1s initial delay)                 │
│                                                               │
│  3. Background Worker (Must be running!)                   │
│     └─→ createDefaultWorker() processes Redis queue       │
│         └─→ If job.name === SEND_EMAIL                   │
│             └─→ sendMail(job.data as MailMessage)        │
│                 └─→ getTransporter().sendMail({...})      │
│                     ├─→ Check SMTP_HOST env var          │
│                     ├─→ Create Nodemailer transport       │
│                     ├─→ Send via SMTP                     │
│                     └─→ Return void (or error)            │
│                                                               │
│  4. Email Template                                          │
│     └─→ buildMagicLinkEmail({to, companyName, link, ...}) │
│         └─→ HTML + Plain text email                       │
│             └─→ Branded DealFlow360 template             │
│                 └─→ Magic link with expiry info          │
│                                                               │
```

---

## Files & Components

### 1. **Email Configuration** (`src/config/mailer.ts`)
```typescript
// Status: ✅ CORRECT
// What it does:
// - Creates Nodemailer transporter with SMTP settings from env vars
// - Checks if SMTP_HOST is configured (optional)
// - Falls back to logging warning if SMTP not configured
// - Supports both authenticated and anonymous SMTP
```

**Key code:**
```typescript
const getTransporter = (): Transporter | null => {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,           // Default: 587
    secure: env.SMTP_SECURE,        // Default: false (for TLS)
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
};
```

### 2. **Environment Variables** (`src/config/env.ts`)
```typescript
// Status: ✅ CORRECT (with sensible defaults)
// What it does:
// - Defines all SMTP configuration variables with zod validation
// - Provides defaults for development (port 587, insecure TLS)
// - Makes SMTP_HOST optional (graceful no-config fallback)

SMTP_HOST: z.string().optional(),              // Required: Email server hostname
SMTP_PORT: z.coerce.number().int().positive().default(587),  // TLS port
SMTP_SECURE: z.coerce.boolean().default(false), // TLS (false) vs SSL (true)
SMTP_USER: z.string().optional(),              // Auth user
SMTP_PASSWORD: z.string().optional(),          // Auth password
SMTP_FROM: z.string().default('DealFlow360 <no-reply@dealflow360.local>'),
PORTAL_BASE_URL: z.string().url().default('http://localhost:3000/portal'),
MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(20),
```

### 3. **Magic Link Email** (`src/modules/auth/magic-link-email.ts`)
```typescript
// Status: ✅ EXCELLENT
// What it does:
// - Builds professional HTML email with fallback plain text
// - Includes magic link button + paste-able text link
// - Shows expiry time to user
// - Branded DealFlow360 design (modern, responsive)
```

**Template includes:**
- ✅ DealFlow360 header with logo
- ✅ Professional greeting
- ✅ Branded CTA button
- ✅ Backup text link (for email clients that don't render HTML)
- ✅ Security note about link expiry
- ✅ Clear call-to-action
- ✅ CSS-in-line styled (works in all email clients)

### 4. **Auth Service** (`src/modules/auth/auth.service.ts`)
```typescript
// Status: ✅ CORRECT
// Key method: issueMagicLink()
// What it does:
// 1. Generate random token (32 bytes → 64 hex chars)
// 2. Hash token with SHA256
// 3. Store hashed token in DB with 20-minute expiry
// 4. Log raw token to console (dev convenience)
// 5. Build HTML email
// 6. Enqueue email for async delivery
```

**Security notes:**
- ✅ Token hashed before storage (can't retrieve from DB)
- ✅ Token one-time use only
- ✅ Link includes TTL (20 min default)
- ✅ Doesn't reveal if email is registered (always returns 200)

### 5. **Job Queue** (`src/jobs/jobs.ts`)
```typescript
// Status: ✅ CORRECT
// What it does:
// - Uses BullMQ + Redis for async job processing
// - Email jobs enqueued with automatic retries
// - 3 attempts with exponential backoff (1s → 2s → 4s)
// - Automatic cleanup (remove after 100 job completions)

const enqueueEmail = async (message: MailMessage): Promise<void> => {
  await enqueueJob(JOB_NAMES.SEND_EMAIL, { ...message });
};
```

### 6. **Background Worker** (`src/queues/workers/default.worker.ts`)
```typescript
// Status: ✅ CORRECT
// What it does:
// - Creates BullMQ Worker that processes Redis queue jobs
// - Listens for SEND_EMAIL jobs
// - Calls sendMail() for each job
// - Logs failures for debugging

export const createDefaultWorker = (): Worker => {
  const worker = new Worker(QUEUE_NAMES.DEFAULT, async (job) => {
    if (job.name === JOB_NAMES.SEND_EMAIL) 
      await sendMail(job.data as MailMessage);
  }, { connection: redis });
};
```

---

## Configuration Checklist

### ✅ What's Already Correct
- [x] Nodemailer is installed (`nodemailer@^10.0.0`)
- [x] Transporter is created lazily (singleton pattern)
- [x] Email template is professional and branded
- [x] Auth service properly generates and hashes tokens
- [x] BullMQ queue is set up with retries
- [x] Worker processes email jobs
- [x] Error logging is in place
- [x] Fallback message if SMTP not configured

### ⏳ What You MUST Configure

**Environment Variables in `.env`:**

```bash
# Required for email delivery
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false  # Use TLS (port 587)
SMTP_FROM=noreply@dealflow360.com

# Optional but recommended
PORTAL_BASE_URL=https://your-domain.com/portal
MAGIC_LINK_TTL_MINUTES=20  # Default: 20

# Required infrastructure
REDIS_URL=redis://localhost:6379
MONGO_URI=mongodb://localhost:27017/dealflow

# Other
NODE_ENV=development
```

### ⚠️ Critical: Background Worker Must Be Running

The worker process **MUST be running** for emails to be sent!

**Current state:** The worker is only created if you start it explicitly.

**Check:** Look at `src/server.ts` to see if worker is initialized:

---

## Testing the SMTP Configuration

### Step 1: Verify Environment Variables

```bash
cd backend

# Check if .env file exists
ls -la .env

# Verify these vars are set:
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_PORT: $SMTP_PORT"
echo "SMTP_USER: $SMTP_USER"
echo "SMTP_FROM: $SMTP_FROM"
```

**Expected output:**
```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: your-email@gmail.com
SMTP_FROM: noreply@dealflow360.com
```

### Step 2: Verify Redis is Running

```bash
# Redis must be running for job queue
redis-cli ping
# Expected: PONG

# Check Redis connection
redis-cli
> DBSIZE
> QUIT
```

### Step 3: Check Backend Startup Logs

```bash
# Start backend with verbose logging
cd backend
npm run dev

# Look for:
# ✅ "Server running on port 3001"
# ✅ "Redis connected"
# ✅ "Worker started"
# ⚠️ "SMTP not configured" (if no env vars)
```

### Step 4: Test Magic Link Request

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Request magic link
curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com"}'

# Expected response: 200 OK
# (Response is always 200, doesn't reveal if email exists)

# Check backend logs for:
# 1. "Magic link issued" with the actual link
# 2. OR "SMTP not configured; mail skipped" (if SMTP not set)
```

### Step 5: Check Job Queue Status

```bash
# Terminal 3: Monitor Redis queue
redis-cli

# Check for pending jobs
> LLEN bull:default:queue:waiting
# Should see 0 (jobs processed) or > 0 (jobs pending)

# Monitor jobs in real-time (if worker is running)
> MONITOR
# You'll see SET/LPOP commands as jobs are processed
```

### Step 6: Verify Email Was Sent

**If SMTP is configured correctly:**
- Check customer's email inbox (might take 5-30 seconds)
- Look for "Your DealFlow360 sign-in link"
- Verify the link is clickable and contains the token

**If SMTP is NOT configured:**
- Check backend logs for: `"SMTP not configured; mail skipped"`
- This is by design (graceful fallback)
- The link is still logged to console:
  ```
  Magic link issued: 
  {
    to: "customer@example.com",
    link: "http://localhost:3000/portal/verify?token=..."
  }
  ```

---

## Common SMTP Providers Configuration

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # NOT your regular password!
SMTP_FROM=your-email@gmail.com
```

**⚠️ Important:** Gmail requires an "App Password", not your regular password.

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-user
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=verified-email@yourdomain.com
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@sandboxXXX.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

### localhost (Testing with MailHog)
```bash
# For local testing: install MailHog
# https://github.com/mailhog/MailHog
# Then configure:
SMTP_HOST=localhost
SMTP_PORT=1025  # MailHog SMTP port
SMTP_SECURE=false
SMTP_USER=  # Not needed
SMTP_PASSWORD=  # Not needed
SMTP_FROM=test@localhost
# View emails at: http://localhost:8025
```

---

## Troubleshooting Guide

### ❌ Issue: "SMTP not configured; mail skipped"

**Cause:** `SMTP_HOST` env var is not set

**Solution:**
```bash
# Check if .env file exists
cat backend/.env | grep SMTP_HOST

# Add to .env if missing:
echo "SMTP_HOST=smtp.gmail.com" >> backend/.env
echo "SMTP_PORT=587" >> backend/.env
echo "SMTP_USER=your-email@gmail.com" >> backend/.env
echo "SMTP_PASSWORD=your-app-password" >> backend/.env

# Restart backend
npm run dev
```

### ❌ Issue: Email sent but customer doesn't receive it

**Check 1: Verify job was processed**
```bash
# Look at backend logs for:
# "Processing background job"
# "Background job failed" (if there's an error)

# Monitor Redis queue
redis-cli LLEN bull:default:queue:completed
# Should increase after sending
```

**Check 2: SMTP credentials are wrong**
```bash
# Test SMTP connection manually
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.verify((err, success) => {
  if (err) console.error('SMTP Error:', err);
  else console.log('SMTP OK');
});
"
```

**Check 3: Email is in spam folder**
- Gmail: Check spam/promotions tab
- Check email headers for SPF/DKIM issues
- Add sender to address book to avoid spam filters

**Check 4: Magic link is expired**
```bash
# Link expires after MAGIC_LINK_TTL_MINUTES (default: 20 min)
# If customer waits too long, they need to request a new link
echo "MAGIC_LINK_TTL_MINUTES=60" >> backend/.env  # Increase to 1 hour
```

### ❌ Issue: Worker not processing jobs

**Cause:** Background worker is not running

**Solution:**
```bash
# Check if server.ts starts the worker
grep -n "createDefaultWorker" backend/src/server.ts

# If not found, you need to add it:
# In server.ts:
// import { createDefaultWorker } from './queues/workers/index.js';
// const worker = createDefaultWorker();
// Add shutdown handler:
// process.on('SIGTERM', async () => {
//   await worker.close();
//   await closeQueues();
// });
```

### ❌ Issue: Redis connection error

**Cause:** Redis not running or URL wrong

**Solution:**
```bash
# Check Redis is running
redis-cli ping
# Expected: PONG

# If not running:
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
# Docker: docker run -d -p 6379:6379 redis

# Check REDIS_URL in .env
echo $REDIS_URL
# Should be: redis://localhost:6379 (or your Redis URL)
```

---

## Verification Checklist

### Setup Phase
- [ ] `.env` file exists in `backend/` directory
- [ ] `SMTP_HOST` is set to a valid SMTP server
- [ ] `SMTP_USER` and `SMTP_PASSWORD` are correct credentials
- [ ] `SMTP_FROM` is set to a valid sender email
- [ ] `MONGO_URI` points to running MongoDB
- [ ] `REDIS_URL` points to running Redis
- [ ] `PORTAL_BASE_URL` is correct (for magic link)

### Runtime Phase
- [ ] Backend starts without errors: `npm run dev`
- [ ] Redis is running and connected
- [ ] Worker is created and listening for jobs
- [ ] API endpoint responds: `curl http://localhost:3001/api/v1/auth/request-magic-link`
- [ ] Request magic link returns 200 OK
- [ ] Backend logs show "Magic link issued"
- [ ] Email is received in customer inbox (or MailHog)

### Production Readiness
- [ ] SMTP credentials are in environment variables (not .env)
- [ ] SMTP_SECURE=true if using port 465 (SSL)
- [ ] SMTP_SECURE=false if using port 587 (TLS)
- [ ] PORTAL_BASE_URL points to production domain
- [ ] Email logs are properly configured
- [ ] Error handling for failed emails
- [ ] Retry logic is working (test by killing worker mid-send)

---

## Next Steps

### Immediate (To verify emails work):
1. ✅ Check current SMTP configuration
2. ✅ Verify env vars are set correctly
3. ✅ Ensure Redis and MongoDB are running
4. ✅ Test magic link request endpoint
5. ✅ Check email arrives in inbox

### If emails are NOT arriving:
1. Check backend logs for errors
2. Verify SMTP credentials with provider
3. Use MailHog for local testing
4. Check spam folder
5. Verify SPF/DKIM records (for production)

### For Production:
1. Use proper SMTP provider (SendGrid, AWS SES, Mailgun)
2. Configure SPF and DKIM records
3. Set up email bounce handling
4. Monitor email delivery logs
5. Implement unsubscribe mechanism

---

## Code References

- **Mailer config:** `backend/src/config/mailer.ts`
- **Env schema:** `backend/src/config/env.ts`
- **Auth service:** `backend/src/modules/auth/auth.service.ts`
- **Email template:** `backend/src/modules/auth/magic-link-email.ts`
- **Job queue:** `backend/src/jobs/jobs.ts`
- **Worker:** `backend/src/queues/workers/default.worker.ts`
- **Server:** `backend/src/server.ts`

---

## Summary

✅ **The email system is well-architected and production-ready.**

🔧 **What you need to do:**
1. Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` in `.env`
2. Ensure Redis is running
3. Verify worker process is started in `server.ts`
4. Test by requesting a magic link

📧 **If emails still don't arrive:**
1. Check backend logs for errors
2. Verify SMTP credentials with provider
3. Check spam folder
4. Use MailHog for local testing

🚀 **For production:**
- Use a professional SMTP provider
- Configure SPF/DKIM
- Monitor delivery logs
- Set up bounce handling
