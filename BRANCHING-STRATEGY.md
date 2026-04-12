# Hiretivo — Branching & Deployment Strategy

## 🎯 Goal: 3-Tier Environment Setup

| Environment | Purpose | Database | Users |
|-------------|---------|----------|-------|
| **Production** | Live site | Production DB | Real users |
| **Staging** | Pre-production testing | Staging DB | Internal testing |
| **Development** | Active development | Dev DB | Developers |

---

## Option A: Free Plan Setup ✓ (Recommended to Start)

### What Vercel Free Plan Gives You:

✅ **1 Production Domain** (custom domain like hiretivo.com)  
✅ **Unlimited Preview Deployments** (auto-generated URLs)  
✅ **All environment variable scopes** (Production/Preview/Development)  
❌ **No custom domains for preview branches** (need Pro plan)

### Free Plan Architecture:

```
Branch Structure:
├── main              → Production   → hiretivo.com (custom domain)
├── staging           → Preview      → hiretivo-git-staging-team.vercel.app (auto)
├── develop           → Preview      → hiretivo-git-develop-team.vercel.app (auto)
└── feature/*         → Preview      → hiretivo-git-feature-name-team.vercel.app (auto)
```

### How to Set This Up (Free Plan):

#### 1. Branch Strategy

```bash
# Create your branches
git checkout main
git checkout -b staging
git push origin staging

git checkout staging
git checkout -b develop
git push origin develop
```

#### 2. Vercel Configuration

**Create `vercel.json` with Git branch settings:**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "staging": true,
      "develop": true
    }
  },
  "github": {
    "silent": false
  },
  "crons": [
    {
      "path": "/api/cron/match",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/stale-jobs",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### 3. Environment Variables in Vercel

Create **3 separate databases in Neon**:
- `hiretivo-production`
- `hiretivo-staging`
- `hiretivo-develop`

**Configure in Vercel:**

| Variable | Production (main) | Preview (staging) | Preview (develop) | Notes |
|----------|-------------------|-------------------|-------------------|-------|
| `DATABASE_URL` | Production DB ✓ | Staging DB ✓ | Dev DB ✓ | Use separate Neon databases |
| `NEXT_PUBLIC_APP_URL` | https://hiretivo.com | See below* | See below* | Dynamic per branch |
| `AUTH_SECRET` | Strong secret ✓ | Different secret ✓ | Different secret ✓ | Never reuse |
| `VERCEL_ENV` | production | preview | preview | Auto-set by Vercel |

*For dynamic URLs, use Vercel's built-in variables (see below)

#### 4. Dynamic URL Handling

**Update your code to handle different URLs:**

```typescript
// src/lib/config.ts
export function getAppUrl(): string {
  // Explicit production URL
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://hiretivo.com'
  }
  
  // Staging branch
  if (process.env.VERCEL_GIT_COMMIT_REF === 'staging') {
    // You can hardcode this once Vercel generates it
    return process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL}`
  }
  
  // Develop branch
  if (process.env.VERCEL_GIT_COMMIT_REF === 'develop') {
    return process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL}`
  }
  
  // All other previews and local
  return process.env.NEXT_PUBLIC_APP_URL 
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

export const APP_URL = getAppUrl()
export const IS_PRODUCTION = process.env.VERCEL_ENV === 'production'
export const IS_STAGING = process.env.VERCEL_GIT_COMMIT_REF === 'staging'
export const IS_DEVELOP = process.env.VERCEL_GIT_COMMIT_REF === 'develop'
```

#### 5. Workflow

```bash
# Development work
feature-branch → develop → staging → main

# Process:
1. Create feature branch from develop
2. Work and test locally
3. PR to develop → Auto-deploys to hiretivo-git-develop-*.vercel.app
4. Test on develop, then merge to staging
5. Staging → Auto-deploys to hiretivo-git-staging-*.vercel.app
6. Final QA on staging
7. Merge staging to main → Deploys to hiretivo.com
```

#### 6. Share URLs with Your Team

After first deployment, get the URLs:

```bash
# In Vercel Dashboard, find:
Production: https://hiretivo.com
Staging:    https://hiretivo-git-staging-[your-team].vercel.app
Develop:    https://hiretivo-git-develop-[your-team].vercel.app

# Bookmark these for your team
```

**Pro Tip:** You can shorten these with a free service:
- staging.hiretivo.com → Use Cloudflare redirect or bit.ly
- Or add them to your team's wiki/Notion

---

## Option B: Pro Plan Setup 💎 ($20/month - Custom Domains)

### What Vercel Pro Adds:

✅ **Multiple custom domains per project**  
✅ **Assign domains to specific branches**  
✅ **Better collaboration features**  
✅ **More build minutes & bandwidth**

### Pro Plan Architecture:

```
Branch Structure:
├── main              → Production   → www.hiretivo.com or hiretivo.com
├── staging           → Preview      → staging.hiretivo.com (custom!)
├── develop           → Preview      → dev.hiretivo.com (custom!)
└── feature/*         → Preview      → hiretivo-git-feature-*.vercel.app
```

### Pro Plan Setup:

#### 1. DNS Configuration (in Cloudflare/Namecheap)

```
A record:
www.hiretivo.com     → 76.76.21.21 (Vercel)
hiretivo.com         → 76.76.21.21 (Vercel)

CNAME records:
staging.hiretivo.com → cname.vercel-dns.com
dev.hiretivo.com     → cname.vercel-dns.com
```

#### 2. Vercel Domain Settings

In Vercel Project → Settings → Domains:

```
Production Domain:
└─ www.hiretivo.com → main branch

Preview Domains (Pro only):
├─ staging.hiretivo.com → staging branch
└─ dev.hiretivo.com → develop branch
```

#### 3. Environment Variables

Same as free plan, but you can use fixed URLs:

```bash
# Production
NEXT_PUBLIC_APP_URL=https://www.hiretivo.com

# Staging (can hardcode now)
NEXT_PUBLIC_APP_URL=https://staging.hiretivo.com

# Develop (can hardcode now)
NEXT_PUBLIC_APP_URL=https://dev.hiretivo.com
```

---

## Comparison: Free vs Pro

| Feature | Free Plan | Pro Plan ($20/mo) |
|---------|-----------|-------------------|
| **Production domain** | ✅ hiretivo.com | ✅ www.hiretivo.com |
| **Staging domain** | ⚠️ Auto-generated URL | ✅ staging.hiretivo.com |
| **Dev domain** | ⚠️ Auto-generated URL | ✅ dev.hiretivo.com |
| **Separate databases** | ✅ Yes (3 databases in Neon free) | ✅ Yes |
| **Environment variables** | ✅ Full support | ✅ Full support |
| **Build minutes** | 6,000 min/month | 24,000 min/month |
| **Team members** | ❌ Only you | ✅ Up to 10 |
| **Preview comments** | ❌ No | ✅ Yes |

---

## Recommendation

### Start with FREE Plan ✓

**Reasons:**
1. You get 95% of the functionality
2. Auto-generated URLs work perfectly fine
3. You can upgrade later when you have:
   - A team that needs custom preview URLs
   - More traffic (exceeding free limits)
   - Budget for $20/month

**The auto-generated URLs are:**
- Stable (don't change per branch)
- Secure (HTTPS)
- Easy to bookmark
- Professional enough for internal testing

### When to Upgrade to Pro

Upgrade when you need:
- Custom branded URLs for staging/dev (looks more professional)
- Team collaboration features
- More build minutes (if hitting limits)
- Priority support

---

## Implementation Steps (Free Plan)

### Step 1: Create Branches

```bash
# From main
git checkout main
git pull

# Create staging
git checkout -b staging
git push origin staging

# Create develop from staging
git checkout -b develop  
git push origin develop
```

### Step 2: Create 3 Databases in Neon

1. Keep existing: `hiretivo-production`
2. Create new: `hiretivo-staging`
3. Create new: `hiretivo-develop`

### Step 3: Configure Vercel

Add `DATABASE_URL` three times in Vercel dashboard:

```
DATABASE_URL (Production)
└─ Scope: Production only
   Value: [production connection string]

DATABASE_URL (Staging) 
└─ Scope: Preview only
   Value: [staging connection string]
   Branch: staging (filter)

DATABASE_URL (Develop)
└─ Scope: Preview only  
   Value: [develop connection string]
   Branch: develop (filter)
```

**Note:** Vercel allows branch-specific preview variables on free plan! 🎉

### Step 4: Run Migrations

```bash
# Staging DB
DATABASE_URL="[staging-url]" pnpm db:push
DATABASE_URL="[staging-url]" pnpm prisma db seed

# Develop DB
DATABASE_URL="[develop-url]" pnpm db:push
DATABASE_URL="[develop-url]" pnpm prisma db seed
```

### Step 5: Deploy & Test

```bash
# Push all branches
git push origin main
git push origin staging
git push origin develop

# Vercel auto-deploys all three
# Check dashboard for URLs
```

---

## Git Workflow

```
developer-laptop
    ↓
feature/new-thing ──PR──→ develop (auto-deploys)
                              ↓
                          Test on dev URL
                              ↓
                         staging ──────→ (auto-deploys)
                              ↓
                          Test on staging URL
                              ↓
                          main ─────────→ (deploys to hiretivo.com)
```

### Branch Protection Rules (GitHub)

```yaml
main:
  - Require PR approval
  - Require status checks
  - No direct pushes

staging:
  - Require PR from develop
  - Require tests to pass

develop:
  - Allow direct pushes (for quick fixes)
  - Or require PR from feature branches
```

---

## Environment Variable Strategy

### Using Branch-Specific Preview Variables (Free Plan)

Vercel UI supports this! Go to Environment Variables, click "Add":

```
1. Variable: DATABASE_URL
   Value: [staging-db-url]
   Scope: ✓ Preview
   Git Branch: staging

2. Variable: DATABASE_URL  
   Value: [develop-db-url]
   Scope: ✓ Preview
   Git Branch: develop

3. Variable: DATABASE_URL
   Value: [production-db-url]
   Scope: ✓ Production
```

This works on the **FREE plan**! Each branch gets its own database.

---

## Testing the Setup

### Verify Each Environment

```bash
# Check which DB is connected (add this endpoint temporarily)
// src/app/api/debug/env/route.ts
export async function GET() {
  return Response.json({
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    env: process.env.VERCEL_ENV,
    dbHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0], // Safe extraction
  })
}

# Visit:
# https://hiretivo.com/api/debug/env
# https://hiretivo-git-staging-*.vercel.app/api/debug/env
# https://hiretivo-git-develop-*.vercel.app/api/debug/env

# Verify each uses different database
# Then DELETE this endpoint (security risk)
```

---

## Summary

✅ **Use FREE plan** with this structure:
- `main` → hiretivo.com (production DB)
- `staging` → auto-generated URL (staging DB)
- `develop` → auto-generated URL (develop DB)

✅ **Pros:**
- Costs $0
- Fully isolated environments
- Professional setup
- Room to grow

⚠️ **Minor con:**
- Preview URLs are long (but stable and bookmarkable)

💡 **Upgrade to Pro later when:**
- You want custom domains for preview branches
- You need team collaboration features
- You're making money and can afford $20/month

**Bottom line:** Start free, upgrade when needed!
