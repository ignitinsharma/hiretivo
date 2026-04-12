# Hiretivo — Environment Resources Guide

## 🎯 What to Separate vs Share Across Environments

Quick reference for which services need separate instances for Production/Staging/Development.

---

## 📋 Complete Checklist

| Service | Separate or Share? | Why | Cost Impact |
|---------|-------------------|-----|-------------|
| **Database (Neon)** | ✅ SEPARATE (3 DBs) | Real data vs test data | $0 (free tier) |
| **R2 Storage** | ✅ SEPARATE (2-3 buckets) | Real files vs test files | ~$0-1/month |
| **Redis (Upstash)** | ⚠️ CAN SHARE* | With key prefixes | $0 (free tier) |
| **Auth Secrets** | ✅ SEPARATE | Security best practice | $0 |
| **OAuth Credentials** | ✅ CAN SHARE | Add redirect URLs | $0 |
| **Resend API Key** | ✅ CAN SHARE | Same API key works | $0 |
| **Domain/URLs** | ✅ SEPARATE | Auto-handled by Vercel | $0 |

*Using key prefixes like `prod:`, `staging:`, `dev:`

---

## 1. 🗄️ Database (Neon) — MUST SEPARATE

### Create 3 Separate Databases ✅

**Why separate:**
- Production has real user data
- Staging/Dev have test data
- Never mix test and production data!

**Setup:**
```
✅ hiretivo-production    → main branch
✅ hiretivo-staging       → staging branch  
✅ hiretivo-develop       → develop branch
```

**Cost:** $0 (each gets 0.5GB free)

**Vercel Environment Variables:**
```bash
DATABASE_URL (Production scope)
→ postgresql://prod-connection-string

DATABASE_URL (Preview scope, staging branch)
→ postgresql://staging-connection-string

DATABASE_URL (Preview scope, develop branch)
→ postgresql://develop-connection-string
```

---

## 2. 📦 R2 Storage (Cloudflare) — RECOMMEND SEPARATE

### Option A: Full Separation (Recommended) ✅

**Create 2-3 buckets:**
```
✅ hiretivo-uploads-production    → Real user files
✅ hiretivo-uploads-preview       → Staging + Develop test files
```

Or if you want full separation:
```
✅ hiretivo-uploads-production    → Production
✅ hiretivo-uploads-staging       → Staging
✅ hiretivo-uploads-develop       → Develop
```

**Why separate:**
- ✅ Prevents test files mixing with production
- ✅ Can delete staging/dev buckets anytime
- ✅ Production stays clean
- ✅ Better security (separate access keys)

**Cost:** 
- First 10 GB storage: **FREE**
- Each bucket counts toward this 10 GB
- Realistic: ~$0-1/month for all buckets

**Setup Steps:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create buckets:
   ```
   Name: hiretivo-uploads-production
   Location: Auto (or closest to your Neon DB region)
   
   Name: hiretivo-uploads-preview
   Location: Auto
   ```

3. Create **separate API tokens** for each:
   ```
   Token 1: Production bucket (read/write)
   Token 2: Preview bucket (read/write)
   ```

**Vercel Environment Variables:**

```bash
# Production
R2_BUCKET_NAME=hiretivo-uploads-production
R2_ACCESS_KEY_ID=[production-key]
R2_SECRET_ACCESS_KEY=[production-secret]

# Preview (both staging and develop)
R2_BUCKET_NAME=hiretivo-uploads-preview
R2_ACCESS_KEY_ID=[preview-key]
R2_SECRET_ACCESS_KEY=[preview-secret]
```

Other R2 vars can be shared:
```bash
R2_ACCOUNT_ID=5e1099308438e1fd95ad275d9fc9e729  # Same for all
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com  # Same for all
```

---

### Option B: Single Bucket with Prefixes (Budget Option) ⚠️

**Use 1 bucket with folder structure:**
```
hiretivo-uploads/
├── production/
│   ├── resumes/
│   └── logos/
├── staging/
│   ├── resumes/
│   └── logos/
└── develop/
    ├── resumes/
    └── logos/
```

**Update your upload code:**
```typescript
// src/lib/storage/r2.ts
import { IS_PRODUCTION, IS_STAGING, IS_DEVELOP } from '@/lib/config'

function getEnvironmentPrefix(): string {
  if (IS_PRODUCTION) return 'production'
  if (IS_STAGING) return 'staging'
  return 'develop'
}

export async function uploadFile(file: File, path: string) {
  const prefix = getEnvironmentPrefix()
  const key = `${prefix}/${path}` // e.g., "staging/resumes/abc123.pdf"
  
  // ... rest of upload logic
}
```

**Pros:**
- ✅ Cheaper (only 1 bucket)
- ✅ Simpler setup

**Cons:**
- ⚠️ Can't fully delete test data (mixed with prod)
- ⚠️ Harder to manage permissions
- ⚠️ Risk of accidentally accessing wrong environment

**My Recommendation:** Use Option A (separate buckets). R2 storage is so cheap that the added safety is worth it.

---

## 3. 🔴 Redis (Upstash) — CAN SHARE with Key Prefixes

### Option A: Single Redis Instance (Recommended for Free Tier) ✅

**Use 1 Redis instance with key prefixes:**

```typescript
// src/lib/cache/redis.ts
import { Redis } from '@upstash/redis'
import { IS_PRODUCTION, IS_STAGING } from '@/lib/config'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Get environment-specific key prefix
function getKeyPrefix(): string {
  if (IS_PRODUCTION) return 'prod'
  if (IS_STAGING) return 'staging'
  return 'dev'
}

// Wrapper functions with automatic prefixing
export async function setCache(key: string, value: any, ttl?: number) {
  const prefix = getKeyPrefix()
  const prefixedKey = `${prefix}:${key}`
  
  if (ttl) {
    return redis.setex(prefixedKey, ttl, JSON.stringify(value))
  }
  return redis.set(prefixedKey, JSON.stringify(value))
}

export async function getCache(key: string) {
  const prefix = getKeyPrefix()
  const prefixedKey = `${prefix}:${key}`
  const data = await redis.get(prefixedKey)
  return data ? JSON.parse(data as string) : null
}

export async function deleteCache(key: string) {
  const prefix = getKeyPrefix()
  const prefixedKey = `${prefix}:${key}`
  return redis.del(prefixedKey)
}

// Example keys created:
// prod:recommendations:user123
// staging:recommendations:user123
// dev:recommendations:user123
```

**Why this works:**
- ✅ Same Redis instance
- ✅ Keys are automatically prefixed
- ✅ No data collision between environments
- ✅ Free tier is enough

**Vercel Setup:**
```bash
# Same for ALL environments (Production, Preview)
UPSTASH_REDIS_REST_URL=https://genuine-deer-79681.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

### Option B: Separate Redis Instances (For Scale/Enterprise) 💎

**Create 2-3 Redis databases in Upstash:**
```
✅ hiretivo-redis-production
✅ hiretivo-redis-staging
✅ hiretivo-redis-develop
```

**When to use:**
- You're paying for Upstash already
- High traffic that might hit free tier limits
- Want complete isolation

**Cost:** ~$10/month per instance (after free tier)

**My Recommendation:** Start with Option A (shared with prefixes). Only separate if you hit limits or need isolation.

---

## 4. 🔐 Auth Secrets — MUST BE DIFFERENT

### Generate Different Secrets for Each Environment ✅

**Why separate:**
- ✅ Security: If one leaks, others are safe
- ✅ Can't use staging session on production
- ✅ Best practice

**Generate 3 secrets:**
```bash
# Production
openssl rand -base64 32
# Example: a8d6f3...4e2c1b

# Staging
openssl rand -base64 32
# Example: 7b2e9c...1d3f8a

# Develop
openssl rand -base64 32
# Example: 9f1c4e...6a7b2d
```

**Vercel Environment Variables:**
```bash
AUTH_SECRET (Production)
→ a8d6f3...4e2c1b

AUTH_SECRET (Preview, staging branch)
→ 7b2e9c...1d3f8a

AUTH_SECRET (Preview, develop branch)
→ 9f1c4e...6a7b2d

# Same for BETTER_AUTH_SECRET
```

**IMPORTANT:** Never reuse secrets across environments!

---

## 5. 🔑 OAuth Credentials (Google, GitHub, etc.) — CAN SHARE

### Use Same Credentials, Add All Redirect URLs ✅

**You only need 1 Google OAuth app:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Credentials → Edit your OAuth client
3. Add **all redirect URLs:**

```
Authorized redirect URIs:
✅ https://hiretivo.com/api/auth/callback/google
✅ https://hiretivo-git-staging-[team].vercel.app/api/auth/callback/google
✅ https://hiretivo-git-develop-[team].vercel.app/api/auth/callback/google
✅ http://localhost:3000/api/auth/callback/google

Or use wildcard (if supported):
✅ https://hiretivo.com/api/auth/callback/google
✅ https://*.vercel.app/api/auth/callback/google
✅ http://localhost:3000/api/auth/callback/google
```

**Vercel Setup:**
```bash
# Same for ALL environments
GOOGLE_CLIENT_ID=748816325467-oul...
GOOGLE_CLIENT_SECRET=GOCSPX-RoiH...
```

**Why share:**
- ✅ Simpler setup
- ✅ Free OAuth credentials
- ✅ No limit on redirect URLs
- ✅ Same credentials work everywhere

---

## 6. 📧 Email (Resend) — CAN SHARE

### Use Same API Key, Optionally Different From Addresses ✅

**Single API key works for all environments:**

```bash
# Same for ALL environments
RESEND_API_KEY=re_GTH6Csnv_...
```

**Optional: Different "from" addresses per environment:**

```bash
# Production
RESEND_FROM_EMAIL=Hiretivo <noreply@hiretivo.com>

# Staging
RESEND_FROM_EMAIL=Hiretivo Staging <staging@hiretivo.com>

# Develop
RESEND_FROM_EMAIL=Hiretivo Dev <dev@hiretivo.com>
```

**Or simpler (shared):**
```bash
# All environments
RESEND_FROM_EMAIL=Hiretivo <onboarding@resend.dev>
```

**Why share:**
- ✅ Resend free tier: 100 emails/day (enough for all envs)
- ✅ Same API key works everywhere
- ✅ Can add env badge to email subject in code

**Add environment to email subject:**
```typescript
// src/lib/email/send-email.ts
import { IS_PRODUCTION, getEnvironmentName } from '@/lib/config'

export async function sendEmail(to: string, subject: string, html: string) {
  const envPrefix = IS_PRODUCTION ? '' : `[${getEnvironmentName()}] `
  const finalSubject = `${envPrefix}${subject}`
  
  // Example:
  // Production: "Welcome to Hiretivo!"
  // Staging: "[Staging] Welcome to Hiretivo!"
  // Develop: "[Development] Welcome to Hiretivo!"
  
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: finalSubject,
    html,
  })
}
```

---

## 7. 🌐 Domains & URLs — AUTO-HANDLED

**Vercel automatically provides different URLs:**

```
Production:  https://hiretivo.com
Staging:     https://hiretivo-git-staging-[team].vercel.app
Develop:     https://hiretivo-git-develop-[team].vercel.app
```

**No setup needed!** ✅

**Optional: Set NEXT_PUBLIC_APP_URL explicitly:**

```bash
# Production
NEXT_PUBLIC_APP_URL=https://hiretivo.com

# Preview (both staging and develop) - can leave empty
NEXT_PUBLIC_APP_URL=  # Auto-detected from VERCEL_URL
```

Or use the `src/lib/config.ts` I created - it auto-detects!

---

## 📊 Complete Setup Summary

### What You MUST Create (3 instances):

1. ✅ **Neon Databases (3)**
   - `hiretivo-production`
   - `hiretivo-staging`
   - `hiretivo-develop`
   - **Cost:** $0

2. ✅ **Auth Secrets (3)**
   - Different secret for each environment
   - **Cost:** $0

### What You SHOULD Create (separate for safety):

3. ✅ **R2 Buckets (2-3)**
   - `hiretivo-uploads-production`
   - `hiretivo-uploads-preview` (or separate staging/dev)
   - **Cost:** ~$0-1/month

### What You CAN SHARE (1 instance for all):

4. ✅ **Redis (Upstash)** - 1 instance with key prefixes
   - **Cost:** $0

5. ✅ **OAuth Credentials** - 1 app, multiple redirect URLs
   - **Cost:** $0

6. ✅ **Resend API Key** - 1 key for all
   - **Cost:** $0

---

## 🎯 Recommended Setup (Best Balance)

### Services to Separate (3 instances each):
```
✅ Database (Neon)        → 3 separate DBs
✅ Auth Secrets           → 3 different secrets
```

### Services to Separate (2 instances):
```
✅ R2 Storage (Cloudflare) → Production + Preview
```

### Services to Share (1 instance):
```
✅ Redis (Upstash)         → Shared with key prefixes
✅ OAuth (Google/GitHub)   → Shared with multiple redirect URLs
✅ Email (Resend)          → Shared API key
```

**Total Cost:** Still **$0/month** on free tiers! 🎉

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Create Databases (Already Covered) ✅
```
✅ 3 Neon databases created
✅ Migrations run on each
✅ Test data seeded
```

### Step 2: Create R2 Buckets (5 minutes)

1. Go to [Cloudflare R2](https://dash.cloudflare.com/) → R2 Object Storage
2. Click **Create bucket**
   ```
   Name: hiretivo-uploads-production
   Location: Automatic
   ```
3. Click **Create bucket** again
   ```
   Name: hiretivo-uploads-preview
   Location: Automatic
   ```

4. Create API Tokens:
   - Click **Manage R2 API Tokens**
   - **Create API Token**
   ```
   Token name: hiretivo-production-token
   Permissions: Object Read & Write
   Bucket: hiretivo-uploads-production
   ```
   - Copy: `Access Key ID` and `Secret Access Key`
   
   - **Create API Token** (again)
   ```
   Token name: hiretivo-preview-token
   Permissions: Object Read & Write
   Bucket: hiretivo-uploads-preview
   ```
   - Copy: `Access Key ID` and `Secret Access Key`

### Step 3: Configure Vercel Environment Variables

Add **separate R2 configs** for Production vs Preview:

```bash
# === PRODUCTION ENVIRONMENT ===
R2_ACCOUNT_ID=5e1099308438e1fd95ad275d9fc9e729  # Same for all
R2_ENDPOINT=https://[id].r2.cloudflarestorage.com  # Same for all
R2_BUCKET_NAME=hiretivo-uploads-production
R2_ACCESS_KEY_ID=[production-access-key]
R2_SECRET_ACCESS_KEY=[production-secret-key]
Scope: ✓ Production

# === PREVIEW ENVIRONMENT (Staging + Develop) ===
R2_ACCOUNT_ID=5e1099308438e1fd95ad275d9fc9e729  # Same
R2_ENDPOINT=https://[id].r2.cloudflarestorage.com  # Same
R2_BUCKET_NAME=hiretivo-uploads-preview
R2_ACCESS_KEY_ID=[preview-access-key]
R2_SECRET_ACCESS_KEY=[preview-secret-key]
Scope: ✓ Preview
```

### Step 4: Update Redis Code (5 minutes)

Update your Redis utility to use key prefixes:

```bash
# Edit or create: src/lib/cache/redis.ts
# Use the code from Section 3 above
```

### Step 5: Generate New Auth Secrets (2 minutes)

```bash
# Generate 3 different secrets
openssl rand -base64 32  # For production
openssl rand -base64 32  # For staging
openssl rand -base64 32  # For develop

# Add to Vercel with appropriate scopes
```

### Step 6: Update OAuth Redirect URLs (3 minutes)

1. Google Cloud Console → Credentials
2. Edit OAuth 2.0 Client ID
3. Add all redirect URLs (see Section 5)
4. Save

### Step 7: Test Each Environment

```bash
# Deploy and test
git push origin main      # Production
git push origin staging   # Staging
git push origin develop   # Develop

# Verify:
# - Different databases (check data)
# - Different R2 buckets (upload a file)
# - Redis with prefixes (check keys)
# - OAuth works on all URLs
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:
- Use same database for prod and staging
- Share R2 bucket with production (risky!)
- Reuse AUTH_SECRET across environments
- Forget to add OAuth redirect URLs

### ✅ DO:
- Separate databases always
- Use different R2 buckets (production vs preview)
- Generate unique AUTH_SECRET for each environment
- Test file uploads in each environment
- Use environment badge component to verify

---

## 🧪 Testing Your Setup

### Verify Environment Isolation

1. **Upload a file in Staging:**
   - Should appear in `hiretivo-uploads-preview` bucket
   - Should NOT appear in `hiretivo-uploads-production`

2. **Create a test user in Develop:**
   - Should appear in `hiretivo-develop` database
   - Should NOT appear in `hiretivo-production` database

3. **Check Redis keys:**
   ```bash
   # In Upstash Console → Data Browser
   prod:recommendations:user123       # Production key
   staging:recommendations:user456    # Staging key
   dev:recommendations:user789        # Develop key
   ```

4. **Test OAuth login in each environment:**
   - Production: Login works ✓
   - Staging: Login works ✓
   - Develop: Login works ✓

---

## 💰 Final Cost Check

| Service | Instances | Cost |
|---------|-----------|------|
| Neon (3 DBs) | 3 × 0.5GB free | $0 |
| R2 (2 buckets) | 10GB free total | $0 |
| Upstash Redis | 1 shared | $0 |
| Resend | 1 shared | $0 |
| OAuth | 1 shared | $0 |
| **TOTAL** | | **$0/month** ✅ |

**You're still completely free!** 🎉

---

## 📌 Quick Reference

**Services to create separately:**
```
✅ Neon Databases → 3 instances
✅ R2 Buckets → 2-3 instances  
✅ Auth Secrets → 3 different values
```

**Services to share:**
```
✅ Redis → 1 instance (with prefixes)
✅ OAuth → 1 app (multiple redirects)
✅ Email → 1 API key
```

**Result:** Safe, isolated environments, still $0/month! 🚀
