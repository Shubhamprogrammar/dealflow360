# SMTP Testing Guide - Step-by-Step Verification

## Quick Test (5 minutes)

### Step 1: Check Environment Variables

```bash
cd backend

# Verify .env file exists and has SMTP config
cat .env | grep -E "^SMTP_|^REDIS_|^MONGO_|^PORTAL_BASE_URL"

# Expected output:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# SMTP_FROM=noreply@dealflow360.com
# REDIS_URL=redis://localhost:6379
# MONGO_URI=mongodb://localhost:27017/dealflow
# PORTAL_BASE_URL=http://localhost:3000/portal
```

**⚠️ If any are missing, add them now:**
```bash
cat >> backend/.env << 'EOF'
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@dealflow360.com
PORTAL_BASE_URL=http://localhost:3000/portal
MAGIC_LINK_TTL_MINUTES=20
EOF
```

### Step 2: Start Redis

```bash
# Check if Redis is running
redis-cli ping

# Expected: PONG
# If error, start Redis:

# macOS:
brew services start redis

# Linux:
sudo systemctl start redis-server

# Docker:
docker run -d -p 6379:6379 --name redis redis:latest

# Verify it's running:
redis-cli DBSIZE
# Expected: (integer) 0
```

### Step 3: Start MongoDB

```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Expected: { ok: 1 }
# If error, start MongoDB:

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Docker:
docker run -d -p 27017:27017 --name mongo mongo:latest

# Verify it's running:
mongosh --eval "show dbs"
```

### Step 4: Start Backend

```bash
cd backend
npm run dev

# Expected output:
# [timestamp] INFO (pid=XXXX): HTTP server listening
#   port: 3001
# 
# Check for these IMPORTANT messages:
# ✅ "HTTP server listening port 3001"
# ✅ "Redis connected" 
# ✅ No errors about SMTP or worker
```

### Step 5: Test Magic Link Request (In Another Terminal)

```bash
# Terminal 2: Test the API
curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test-customer@example.com"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Expected response:
# HTTP Status: 200

# Important: Response is ALWAYS 200 (doesn't reveal if email exists)
```

### Step 6: Check Backend Logs for Magic Link

```bash
# In Terminal 1 (backend), look for:
# ✅ "Magic link issued"
#    {
#      "to": "test-customer@example.com",
#      "link": "http://localhost:3000/portal/verify?token=abc123..."
#    }

# OR if SMTP not configured:
# ⚠️ "SMTP not configured; mail skipped"
#    {
#      "to": "test-customer@example.com",
#      "subject": "Your DealFlow360 sign-in link"
#    }
```

### Step 7: Check Email Inbox

**If SMTP is properly configured:**
- ✅ Check customer email inbox (may take 5-30 seconds)
- ✅ Look for email from `SMTP_FROM` address
- ✅ Subject should be "Your DealFlow360 sign-in link"
- ✅ Email should contain a clickable button and text link

**If SMTP is NOT configured:**
- ⚠️ Email won't be sent
- ✅ The link is visible in backend logs (copy from there for testing)
- ✅ This is OK for development

---

## Full Verification (10 minutes)

### Terminal 1: Start Backend with Verbose Logging

```bash
cd backend
npm run dev 2>&1 | tee backend.log

# This logs everything to both screen and backend.log
# Useful for debugging if something goes wrong
```

### Terminal 2: Monitor Redis Queue

```bash
# Watch Redis queue for email jobs
redis-cli --stat
# OR
watch -n 1 'redis-cli LLEN bull:default:queue:waiting'

# This shows you when jobs are added/processed
```

### Terminal 3: Monitor Email in Real-Time (Optional)

```bash
# If using MailHog (local testing):
# First install: brew install mailhog
# Then start: mailhog
# View emails at: http://localhost:8025

# If not using MailHog, skip this step
```

### Terminal 4: Test the Flow

```bash
# Step 1: Request magic link
curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Watch Terminal 1 for "Magic link issued"
# Watch Terminal 2 for job being processed
# If using MailHog, check http://localhost:8025 for email

# Step 2: Copy the link from backend logs (if SMTP not working)
# Or check email inbox / MailHog

# Step 3: Verify magic link token works
# You'll need to hit: POST /auth/verify-magic-link
# (Implementation depends on your frontend routing)
```

---

## Debugging: Email Not Arriving

### Checklist 1: Is the Job Being Queued?

```bash
# Terminal with Redis CLI:
redis-cli
> SELECT 0
> LLEN bull:default:queue:waiting
# Should be 0 (jobs are being processed)

# If > 0, jobs are accumulating (worker not processing)
> LLEN bull:default:queue:completed
# Should increase each time you request magic link

# View a failed job:
> HGETALL bull:default:job:[jobId]:state
```

### Checklist 2: Is the Worker Running?

```bash
# Check backend logs for worker startup:
# grep "Worker" backend.log
# Expected: Worker process is created

# Check if job processing is happening:
# grep "Processing background job" backend.log
# If NOT found, worker isn't processing jobs

# Check for job failures:
# grep "Background job failed" backend.log
# If found, see the error message
```

### Checklist 3: Is SMTP Configuration Correct?

```bash
# Test SMTP connection manually
cat > test-smtp.js << 'EOF'
import nodemailer from 'nodemailer';

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
  if (err) {
    console.error('❌ SMTP Error:', err.message);
  } else {
    console.log('✅ SMTP Connection OK');
  }
  process.exit(err ? 1 : 0);
});
EOF

# Run the test:
node test-smtp.js

# Expected output:
# ✅ SMTP Connection OK

# If error, check:
# 1. SMTP_HOST is correct
# 2. SMTP_PORT is correct (587 for TLS, 465 for SSL)
# 3. SMTP_USER has correct email format
# 4. SMTP_PASSWORD is correct (app password for Gmail, not regular password)
# 5. Firewall isn't blocking SMTP port
```

### Checklist 4: Is Redis Running?

```bash
redis-cli ping
# Expected: PONG

redis-cli INFO server
# Should show redis version and uptime

# If connection error:
# 1. Check REDIS_URL in .env
# 2. Verify Redis process is running
# 3. Check firewall (port 6379)
```

### Checklist 5: Is MongoDB Running?

```bash
mongosh
> db.adminCommand('ping')
# Expected: { ok: 1 }

> db.magic_link_tokens.find().limit(1)
# Should see the magic link tokens being stored

# If connection error:
# 1. Check MONGO_URI in .env
# 2. Verify MongoDB process is running
# 3. Check firewall (port 27017)
```

---

## Testing with MailHog (Local Development)

MailHog is a fake SMTP server that catches all emails locally. Perfect for development!

### Setup MailHog

```bash
# Install (macOS)
brew install mailhog

# Start MailHog
mailhog

# Output:
# [apiListener] Listening on [::]:1025
# [smtpListener] Listening on [::]:1025
# [webui] listening on [::]:8025

# View emails at: http://localhost:8025
```

### Configure for MailHog

```bash
# Update .env:
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
```

### Test Flow

```bash
# Terminal 1: Start MailHog (if not already running)
mailhog

# Terminal 2: Start backend
cd backend && npm run dev

# Terminal 3: Request magic link
curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Terminal 4: View email
# Open browser to: http://localhost:8025
# You should see the email immediately!
```

---

## Testing with Gmail

Gmail requires an app-specific password (not your regular password).

### Setup Gmail

1. **Enable 2-Factor Authentication:**
   - Visit: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password (not your regular password!)

3. **Configure .env:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Your app password
   SMTP_FROM=your-email@gmail.com
   ```

4. **Test:**
   ```bash
   cd backend && npm run dev
   
   # Request magic link
   curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   
   # Check Gmail inbox for "Your DealFlow360 sign-in link"
   ```

---

## Test Results Template

Copy and run this to save your test results:

```bash
cat > smtp-test-results.txt << 'EOF'
SMTP & Nodemailer Configuration Test Results
=============================================

Date: $(date)
Backend URL: http://localhost:3001/api/v1

Environment Variables:
SMTP_HOST: $(grep SMTP_HOST backend/.env | cut -d= -f2)
SMTP_PORT: $(grep SMTP_PORT backend/.env | cut -d= -f2)
SMTP_USER: $(grep SMTP_USER backend/.env | cut -d= -f2)
REDIS_URL: $(grep REDIS_URL backend/.env | cut -d= -f2)
MONGO_URI: $(grep MONGO_URI backend/.env | cut -d= -f2)

Service Status:
Redis: $(redis-cli ping 2>&1 || echo "NOT RUNNING")
MongoDB: $(mongosh --eval "db.adminCommand('ping')" 2>&1 | grep -o "ok" || echo "NOT RUNNING")
Backend: Starting...

Magic Link Test:
Request: curl -X POST http://localhost:3001/api/v1/auth/request-magic-link
Response: $(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/v1/auth/request-magic-link -H "Content-Type: application/json" -d '{"email":"test@example.com"}')

Result:
- [ ] Email received in inbox
- [ ] Email came from correct sender
- [ ] Magic link is clickable
- [ ] Link contains token parameter
- [ ] No errors in backend logs

Notes:
[Add your observations here]

Logs:
[Paste relevant backend logs here]
EOF

cat smtp-test-results.txt
```

---

## Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "SMTP not configured" | `SMTP_HOST` not in .env | Add SMTP vars to .env |
| Email not received | SMTP auth failed | Verify user/password with provider |
| Worker not processing | Redis not running | Start Redis (redis-server) |
| Job accumulating in queue | Worker crashed | Check backend logs for errors |
| "Invalid SMTP credentials" | Wrong password | Use app password for Gmail (not regular password) |
| Connection timeout | Wrong SMTP host/port | Verify with email provider |
| Email in spam folder | SPF/DKIM not configured | Add records (production only) |

---

## Success Criteria

✅ **Test passes when:**
1. `curl` to `/request-magic-link` returns HTTP 200
2. Backend logs show "Magic link issued" (or "SMTP not configured; mail skipped" if no SMTP)
3. Email arrives in inbox within 30 seconds (if SMTP configured)
4. Email contains DealFlow360 branding and magic link button
5. Link is clickable and contains token parameter
6. No errors in backend logs

---

## Next Steps

If tests pass:
- ✅ Email system is working
- ✅ Ready for customer testing
- ✅ Proceed to frontend integration

If tests fail:
- ❌ Check specific error in "Debugging" section above
- ❌ Verify all env vars are set correctly
- ❌ Ensure Redis and MongoDB are running
- ❌ Test SMTP connection manually with test-smtp.js
- ❌ Check email provider docs for correct credentials

---

**Need help?** Check `SMTP_CONFIGURATION_AUDIT.md` for detailed architecture explanation.
