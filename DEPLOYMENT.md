# Hiretivo — Deployment Guide

## Environment Strategy

### 3-Tier Setup

| Environment | Branch | Database | Users |
|-------------|--------|----------|-------|
| **Production** | `main` | Production DB | Real users |
| **Preview** | All other branches | Staging DB | Test data |
| **Development** | Local | Local/Staging DB | Test data |

---

## Step 1: Create Separate Databases in Neon

### Production Database (Already exists)
- Keep your current production database for the `main` branch only
- This database should have real user data

### Preview/Staging Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new database: **hiretivo-preview** or **hiretivo-staging**
3. Copy the connection string (starts with `postgresql://...`)
4. This database will be used for all non-main branches

---

## Step 2: Configure Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**

### Required Variables by Environment

#### DATABASE_URL
- **Production** ✓ (only)
  ```
  postgresql://[your-production-connection-string]
  ```
- **Preview** ✓ (only)
  ```
  postgresql://[your-preview-connection-string]
  ```
- **Development** ✗ (leave unchecked — uses .env.local)

#### NEXT_PUBLIC_APP_URL
- **Production** ✓
  ```
  https://hiretivo.com
  ```
- **Preview** ✓
  ```
  https://hiretivo-git-$VERCEL_GIT_COMMIT_REF-[your-team].vercel.app
  ```
  Or simply use:
  ```
  $VERCEL_URL
  ```
- **Development** ✗

#### AUTH_SECRET
- **Production** ✓
  ```
  [your-production-secret]
  ```
- **Preview** ✓
  ```
  [different-secret-for-preview]
  ```
- **Development** ✗

#### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
- **Production** ✓
- **Preview** ✓
- **Development** ✗

Add the Preview URL to your Google OAuth allowed redirects:
```
https://hiretivo-git-*.vercel.app/api/auth/callback/google
```

#### RESEND_API_KEY
- **Production** ✓
- **Preview** ✓
- **Development** ✗

#### UPSTASH_REDIS_REST_URL & TOKEN
- **Production** ✓
- **Preview** ✓ (can share same Redis instance or create separate)
- **Development** ✗

#### R2 (Cloudflare) Variables
- **Production** ✓
- **Preview** ✓

**IMPORTANT:** Consider creating a separate R2 bucket for preview (`hiretivo-uploads-preview`) to avoid mixing test files with production files.

---

## Step 3: Database Migrations

### Production Database
```bash
# Only run migrations on main branch
git checkout main
pnpm db:push
```

### Preview Database
```bash
# Run migrations on your preview database
# Use connection string directly
DATABASE_URL="postgresql://[preview-connection-string]" pnpm db:push
```

Or set it in your `.env` temporarily:
```bash
echo 'DATABASE_URL="postgresql://[preview-connection-string]"' > .env
pnpm db:push
rm .env
```

---

## Step 4: Seed Preview Database

Create test data for your preview environment:

```bash
# Connect to preview DB
DATABASE_URL="postgresql://[preview-connection-string]" pnpm db:push

# Run seed script
DATABASE_URL="postgresql://[preview-connection-string]" pnpm prisma db seed
```

This ensures your preview branches have test data to work with.

---

## Step 5: How Vercel Uses These Variables

### When you push to `main`:
- Uses **Production** variables
- Deploys to `hiretivo.com`
- Connects to production database

### When you push to any other branch (e.g., `fix/major-bugs-v1`):
- Uses **Preview** variables
- Deploys to `hiretivo-git-fix-major-bugs-v1-[team].vercel.app`
- Connects to preview/staging database
- **Safe to test** — no impact on production data

### Local development:
- Uses `.env.local`
- Connects to local/dev database
- Runs on `localhost:3000`

---

## Step 6: Testing the Setup

### Test Preview Deployment
1. Push this branch:
   ```bash
   git push origin fix/major-bugs-v1
   ```

2. Vercel will deploy and use **Preview** environment variables

3. Check deployment logs to verify:
   - Prisma connects successfully
   - Build completes
   - No production database is touched

### Test Production Deployment
1. Merge to main (after testing):
   ```bash
   git checkout main
   git merge fix/major-bugs-v1
   git push origin main
   ```

2. Vercel deploys to production using **Production** variables

---

## Common Vercel Environment Variable Patterns

### Using Built-in Variables

Vercel provides these automatically:

```bash
VERCEL_URL              # Auto-generated preview URL
VERCEL_ENV              # "production" | "preview" | "development"
VERCEL_GIT_COMMIT_REF   # Branch name
```

You can use these in your code:

```ts
// src/lib/config.ts
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL 
  ?? process.env.VERCEL_URL 
  ?? 'http://localhost:3000'

export const IS_PRODUCTION = process.env.VERCEL_ENV === 'production'
```

---

## Security Notes

⚠️ **IMPORTANT:** The credentials in `.env.local` shown in this chat are now exposed. You should:

1. **Rotate all secrets immediately:**
   - Generate new `AUTH_SECRET`: `openssl rand -base64 32`
   - Regenerate Google OAuth credentials
   - Regenerate Resend API key
   - Regenerate Upstash Redis tokens
   - Regenerate R2 access keys

2. **Never commit `.env.local` or `.env`** to git (already in `.gitignore`)

3. **Use different secrets** for production vs preview:
   - Production: Strong, rotated regularly
   - Preview: Can be simpler, but still secure

---

## Quick Reference: Setting Variables in Vercel

```bash
# Via Vercel CLI (if installed)
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview

# Or via Vercel Dashboard:
# 1. Go to Project Settings
# 2. Environment Variables
# 3. Add new variable
# 4. Select environments (Production/Preview/Development)
# 5. Save
```

---

## Troubleshooting

### Build fails with "Cannot resolve environment variable"
- Check that the variable is added in Vercel
- Ensure the environment scope is correct (Production/Preview)
- Redeploy after adding variables

### Preview uses production database
- Double-check environment scopes in Vercel
- Ensure DATABASE_URL for Preview is different
- Check Vercel logs to see which connection string is used

### OAuth redirect fails on preview
- Add `https://hiretivo-git-*.vercel.app/api/auth/callback/google` to Google Console
- Or add specific preview URL for each branch

---

## Final Checklist

- [ ] Created separate Preview database in Neon
- [ ] Added DATABASE_URL for Production (main branch only)
- [ ] Added DATABASE_URL for Preview (all other branches)
- [ ] Added all other env vars with correct scopes
- [ ] Ran migrations on Preview database
- [ ] Seeded Preview database with test data
- [ ] Rotated all exposed credentials
- [ ] Added preview URLs to OAuth providers
- [ ] Tested preview deployment
- [ ] Verified production is isolated
