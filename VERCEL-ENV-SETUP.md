# Vercel Environment Variables Setup Guide

## 🎯 Understanding Vercel's 3 Environment Types

Vercel provides only 3 environment scopes:

| Vercel Scope | Maps To | Your Branches |
|--------------|---------|---------------|
| **Production** | Production only | `main` branch |
| **Preview** | All non-production | `staging`, `develop`, `feature/*` |
| **Development** | Local only | Your computer |

**To separate staging and develop:** Use **Git Branch filters** within Preview!

---

## 📋 Complete Setup: DATABASE_URL

### Variable 1: Production Database

```
Key: DATABASE_URL
Value: postgresql://[production-connection-string]
Environments: ✓ Production
Git Branch: (leave empty)
```

**Result:** Only `main` branch uses this database

---

### Variable 2: Staging Database

```
Key: DATABASE_URL
Value: postgresql://[staging-connection-string]
Environments: ✓ Preview
Git Branch: staging
```

**Result:** Only `staging` branch uses this database

---

### Variable 3: Develop Database

```
Key: DATABASE_URL
Value: postgresql://[develop-connection-string]
Environments: ✓ Preview
Git Branch: develop
```

**Result:** Only `develop` branch uses this database

---

## 🔧 Step-by-Step Instructions

### Step 1: Navigate to Environment Variables

1. Go to: https://vercel.com/[your-team]/hiretivo
2. Click: **Settings** (top navigation)
3. Click: **Environment Variables** (left sidebar)

---

### Step 2: Add Production Variable

1. Click: **Add New**
2. **Key:** `DATABASE_URL`
3. **Value:** `postgresql://[production-url]`
4. **Select Environments:**
   - ✓ Production
   - ✗ Preview
   - ✗ Development
5. Click: **Save**

✅ **Result:** Production (main) now has its own database

---

### Step 3: Add Staging Variable (with Branch Filter)

1. Click: **Add New** (again, same key name is OK!)
2. **Key:** `DATABASE_URL`
3. **Value:** `postgresql://[staging-url]`
4. **Select Environments:**
   - ✗ Production
   - ✓ Preview
   - ✗ Development

5. **Set Branch Filter:**
   - Look for **"Git Branch"** or **"Branch"** field
   - If you don't see it immediately:
     - Click **Save** first
     - Then click **"⋮" (three dots)** → **Edit**
     - The branch filter should appear
   
6. **Git Branch:** Type `staging`
7. Click: **Save**

✅ **Result:** Staging branch now has its own database

---

### Step 4: Add Develop Variable (with Branch Filter)

1. Click: **Add New** (third time)
2. **Key:** `DATABASE_URL`
3. **Value:** `postgresql://[develop-url]`
4. **Select Environments:**
   - ✗ Production
   - ✓ Preview
   - ✗ Development

5. **Git Branch:** Type `develop`
6. Click: **Save**

✅ **Result:** Develop branch now has its own database

---

### Step 5: Feature Branches (Default Fallback)

**What about `feature/*` branches?**

They will use **develop** database by default (since they're Preview branches without a specific Git Branch filter).

**Optional:** Add a catch-all for feature branches:

```
Key: DATABASE_URL
Value: postgresql://[develop-url] (same as develop)
Environments: ✓ Preview
Git Branch: (leave empty or *)
```

This ensures all other preview branches use the develop database.

---

## 📊 Final Result

After setup, your environment variables will look like:

```
DATABASE_URL
├─ Production: postgresql://prod...
├─ Preview (staging): postgresql://staging...
├─ Preview (develop): postgresql://develop...
└─ Preview (default): postgresql://develop... (fallback for feature/*)
```

---

## 🔄 How Vercel Selects the Right Variable

When a branch deploys, Vercel follows this priority:

1. **Exact branch match:** If `staging` branch, use Preview + staging filter ✅
2. **Branch pattern match:** If filter uses wildcard (e.g., `feature/*`)
3. **Environment fallback:** If no branch match, use Preview default
4. **Global fallback:** If no Preview, error (missing variable)

**Example:**
- `main` branch → Uses **Production** value
- `staging` branch → Uses **Preview (staging branch)** value
- `develop` branch → Uses **Preview (develop branch)** value
- `feature/add-filters` → Uses **Preview (default)** value (same as develop)

---

## ✅ Variables to Configure (Complete List)

### Must Configure with Branch Filters:

| Variable | Production | Preview (staging) | Preview (develop) |
|----------|-----------|-------------------|-------------------|
| `DATABASE_URL` | Prod DB | Staging DB | Dev DB |
| `AUTH_SECRET` | Prod secret | Staging secret | Dev secret |
| `R2_BUCKET_NAME` | prod bucket | staging bucket | dev bucket |
| `R2_ACCESS_KEY_ID` | Prod key | Staging key | Dev key |
| `R2_SECRET_ACCESS_KEY` | Prod secret | Staging secret | Dev secret |

### Can Share (Same for All):

| Variable | All Environments |
|----------|-----------------|
| `UPSTASH_REDIS_REST_URL` | Same URL |
| `UPSTASH_REDIS_REST_TOKEN` | Same token |
| `GOOGLE_CLIENT_ID` | Same ID |
| `GOOGLE_CLIENT_SECRET` | Same secret |
| `RESEND_API_KEY` | Same key |
| `RESEND_FROM_EMAIL` | Same email |
| `R2_ACCOUNT_ID` | Same account |
| `R2_ENDPOINT` | Same endpoint |

**For shared variables:**
- Check: ✓ Production, ✓ Preview, ✓ Development
- No branch filter needed

---

## 🎯 Quick Reference: Adding a Variable

### For Production Only:
```
1. Add New
2. Key: YOUR_VARIABLE
3. Value: production-value
4. Environments: ✓ Production
5. Save
```

### For Specific Branch (staging/develop):
```
1. Add New
2. Key: YOUR_VARIABLE
3. Value: branch-specific-value
4. Environments: ✓ Preview
5. Git Branch: staging (or develop)
6. Save
```

### For All Preview Branches:
```
1. Add New
2. Key: YOUR_VARIABLE
3. Value: default-value
4. Environments: ✓ Preview
5. Git Branch: (leave empty)
6. Save
```

---

## 🐛 Troubleshooting

### Issue: Don't see "Git Branch" filter

**Solutions:**
1. **Save the variable first**, then edit it
2. Click **"⋮" (three dots)** → **Edit** → Branch filter appears
3. Some UI versions show it under **"Advanced"**
4. Free plan supports this! No upgrade needed.

### Issue: Multiple branches using wrong database

**Check:**
1. Go to: Settings → Environment Variables
2. Look for duplicate `DATABASE_URL` entries
3. Verify each has correct branch filter:
   - Production: (no branch filter)
   - Preview: staging
   - Preview: develop

### Issue: Feature branches error "DATABASE_URL not found"

**Solution:**
Add a fallback Preview variable without branch filter:
```
Key: DATABASE_URL
Value: postgresql://[develop-url]
Environments: ✓ Preview
Git Branch: (empty) ← This is the fallback
```

---

## 📸 Visual Example

```
After Setup, you'll see in Vercel:

Environment Variables (3)

DATABASE_URL
  Production
  Value: postgres://prod-***
  
DATABASE_URL
  Preview (staging)
  Value: postgres://staging-***
  Git Branch: staging
  
DATABASE_URL
  Preview (develop)
  Value: postgres://develop-***
  Git Branch: develop
```

---

## 🚀 Verification

After adding variables, verify by deploying:

```bash
# Deploy develop
git checkout develop
git push origin develop
# Check logs: Should connect to develop DB

# Deploy staging
git checkout staging
git push origin staging
# Check logs: Should connect to staging DB

# Deploy main
git checkout main
git push origin main
# Check logs: Should connect to production DB
```

**Check deployment logs in Vercel:**
- Vercel Dashboard → Deployments
- Click on a deployment
- Check build logs for database connection
- Should show correct DATABASE_URL (first few characters)

---

## ✅ Checklist

Complete setup checklist:

- [ ] Created 3 databases in Neon (production, staging, develop)
- [ ] Added `DATABASE_URL` for Production
- [ ] Added `DATABASE_URL` for Preview (staging branch)
- [ ] Added `DATABASE_URL` for Preview (develop branch)
- [ ] Added `AUTH_SECRET` for all 3 environments (different values!)
- [ ] Added R2 variables for Production and Preview (separate buckets)
- [ ] Added shared variables (Redis, OAuth, Email) for all environments
- [ ] Tested deployment on develop branch
- [ ] Tested deployment on staging branch
- [ ] Tested deployment on main branch
- [ ] Verified correct database connection in logs

---

**You're all set!** 🎉

Each branch now deploys to the correct environment with the correct database!
