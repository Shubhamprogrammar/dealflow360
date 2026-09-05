# SMTP & Nodemailer Quick Reference Card

**Print this or bookmark for quick access during testing**

---

## One-Minute Setup

```bash
# 1. Add to backend/.env
cat >> backend/.env << 'EOF'
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@dealflow360.com
EOF

# 2. Start Redis (required)
redis-cli ping  # Should see PONG

# 3. Start backend
cd backend && npm run dev

# 4. Test
curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 5. Check email inbox or backend logs
```

---

## Verify It Works (30 seconds)

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Redis running | `redis-cli ping` | `PONG` |
| Backend logs | Look for | `"Magic link issued"` OR `"SMTP not configured"` |
| Email received | Check inbox | Email from SMTP_FROM address within 30s |
| Link valid | Copy from logs | Contains `?token=...` parameter |

---

## SMTP Provider Credentials

### Gmail (Most Common)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=16-char-app-password  ← Get from myaccount.google.com/apppasswords
SMTP_FROM=your-email@gmail.com
```
⚠️ **Important:** Use App Password, NOT your regular Gmail password

### SendGrid
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key
SMTP_FROM=noreply@yourdomain.com
```

### AWS SES
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  ← Change region
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-username
SMTP_PASSWORD=your-ses-password
SMTP_FROM=verified-email@yourdomain.com
```

### Local Testing (MailHog)
```bash
# Install: brew install mailhog
# Start: mailhog
# View: http://localhost:8025

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=test@localhost
```

---

## Email Template Variables

```
to:          Customer email address
subject:     "Your DealFlow360 sign-in link"
companyName: Customer company name (shown in greeting)
link:        Full sign-in URL with token
ttlMinutes:  Token expiry time (default 20)
```

---

## Backend Files

| File | Purpose |
|------|---------|
| `src/config/mailer.ts` | Nodemailer transport setup |
| `src/config/env.ts` | SMTP env var schema (Zod validation) |
| `src/modules/auth/magic-link-email.ts` | Email HTML template |
| `src/modules/auth/auth.service.ts` | Magic link generation |
| `src/jobs/jobs.ts` | Job queue setup |
| `src/queues/workers/default.worker.ts` | Background job processor |
| `src/server.ts` | Worker initialization |

---

## Env Variables (Copy-Paste Template)

```bash
# Email Configuration
SMTP_HOST=                          # Required: your SMTP server
SMTP_PORT=587                       # Default: 587 (TLS)
SMTP_SECURE=false                   # false=TLS(587), true=SSL(465)
SMTP_USER=                          # Your email/username
SMTP_PASSWORD=                      # Your password or app password
SMTP_FROM=noreply@dealflow360.com   # Sender address (must be verified with provider)

# Portal Configuration
PORTAL_BASE_URL=http://localhost:3000/portal  # Where the verify link goes
MAGIC_LINK_TTL_MINUTES=20           # Token expiry time

# Infrastructure (also required)
REDIS_URL=redis://localhost:6379    # Redis for job queue
MONGO_URI=mongodb://localhost:27017/dealflow  # MongoDB for token storage
```

---

## Test Endpoints

### Request Magic Link
```bash
curl -X POST http://localhost:3001/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com"}'

# Response: 200 OK (always, doesn't reveal if email exists)
```

### Verify Magic Link (After customer clicks link)
```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-magic-link \
  -H "Content-Type: application/json" \
  -d '{"token":"xxx-from-email-link"}'

# Response: { customerSession: {...}, redirect: "/portal" }
```

---

## Debugging Commands

```bash
# Check SMTP config is loaded
grep SMTP backend/.env

# Check Redis has job queue
redis-cli LLEN bull:default:queue:waiting
# 0 = jobs processed
# > 0 = jobs accumulating (worker not processing)

# Check completed jobs
redis-cli LLEN bull:default:queue:completed

# Monitor Redis
redis-cli --stat

# Check backend logs for errors
grep "Background job failed" backend.log
grep "SMTP Error" backend.log
grep "Magic link" backend.log
```

---

## Status Indicators

### ✅ Everything Working
```
Backend logs show:
✅ "HTTP server listening port 3001"
✅ "Magic link issued" { to: "...", link: "..." }
✅ Customer receives email within 30 seconds
✅ Email contains clickable button and text link
```

### ⚠️ SMTP Not Configured (But System Still Works)
```
Backend logs show:
⚠️ "SMTP not configured; mail skipped"
✅ Link is printed to console: "link": "http://localhost:3000/portal/verify?token=..."
✅ Use this link directly for testing
```

### ❌ Something's Wrong
```
Backend logs show:
❌ "Background job failed"
❌ "SMTP Error: connect ECONNREFUSED"
❌ "Invalid credentials"
→ See detailed troubleshooting in SMTP_CONFIGURATION_AUDIT.md
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using regular Gmail password | Use App Password from myaccount.google.com/apppasswords |
| SMTP_PORT=465 with SMTP_SECURE=false | Should be SMTP_PORT=587 or change SMTP_SECURE=true |
| Forgetting to start Redis | Run `redis-cli ping` to verify |
| .env file not in backend/ | Should be at `backend/.env` not root |
| SMTP_FROM not verified with provider | Verify sender address in SMTP provider settings |
| Worker not initialized | Check server.ts calls `createWorkers()` (it does by default) |

---

## Time Expectations

| Task | Time |
|------|------|
| Configure SMTP vars in .env | 2 min |
| Start Redis & MongoDB | 2 min |
| Start backend | 2 min |
| Send test magic link | 1 min |
| Email arrives in inbox | 5-30 sec |
| **Total** | **~12 minutes** |

---

## Production Checklist

- [ ] SMTP credentials in environment variables (not .env)
- [ ] PORTAL_BASE_URL points to production domain
- [ ] SMTP_FROM is verified sender address
- [ ] Redis is replicated/backed up
- [ ] MongoDB is replicated/backed up
- [ ] SPF/DKIM/DMARC configured on domain
- [ ] Error logs monitored
- [ ] Test sending emails before launch
- [ ] Rate limiting configured

---

## Support Resources

| Document | Use For |
|----------|---------|
| `CUSTOMER_AUTH_VERIFICATION.md` | Verify system is correct (quick review) |
| `SMTP_CONFIGURATION_AUDIT.md` | Understand how system works (deep dive) |
| `SMTP_TESTING_GUIDE.md` | Step-by-step testing procedures |
| This file | Quick lookup during testing |

---

## Emergency Commands

```bash
# Kill any stuck processes
lsof -ti:3001 | xargs kill -9     # Kill backend
lsof -ti:6379 | xargs kill -9     # Kill Redis
lsof -ti:27017 | xargs kill -9    # Kill MongoDB

# Clear Redis completely
redis-cli FLUSHALL

# Clear job queue only
redis-cli FLUSHDB 0  # Clears current DB (default 0)

# Watch job processing in real-time
redis-cli MONITOR

# Check specific job details
redis-cli HGETALL "bull:default:job:<jobId>:state"
```

---

**Need more help?** See the detailed guides listed above.

**Is it working?** Great! You can now test the customer auth flow end-to-end.

---

**Last Updated:** 2026-09-06
**Version:** 1.0
