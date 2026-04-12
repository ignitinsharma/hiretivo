# Hiretivo — Your 3-Tier Workflow

## 🎯 Branch Structure

```
┌────────────────────────────────────────────────┐
│  main       → Production (hiretivo.com)        │
│    ↑                                           │
│  staging    → Final QA Testing                 │
│    ↑                                           │
│  develop    → DEFAULT (developers work here)   │
│    ↑                                           │
│  feature/*  → Individual features              │
└────────────────────────────────────────────────┘
```

## ✅ DEFAULT BRANCH: `develop`

**Why?** Because developers:
1. Create features FROM `develop`
2. Merge features TO `develop`
3. Test first on `develop`

---

## 🔄 Complete Workflow

### Step 1: Developer Creates Feature

```bash
# Always start from develop (default)
git checkout develop
git pull origin develop

# Create feature branch FROM develop
git checkout -b feature/add-job-filters

# Work on feature
[code, code, code...]
git add .
git commit -m "feat: add job filters"

# Push feature branch
git push origin feature/add-job-filters
```

### Step 2: Merge to Develop (First Testing)

```bash
# On GitHub: Create PR
# Base: develop ← Compare: feature/add-job-filters

# After review, merge PR

# Vercel auto-deploys develop branch
# Tester tests on: https://hiretivo-git-develop-*.vercel.app
```

### Step 3: Move to Staging (Final QA)

```bash
# After multiple features tested on develop
# Lead creates PR: develop → staging

# Vercel auto-deploys staging
# Tester does final testing on: https://hiretivo-git-staging-*.vercel.app
```

### Step 4: Deploy to Production

```bash
# After staging passes final QA
# DevOps creates PR: staging → main

# Deploys to: https://hiretivo.com 🚀
```

---

## 📊 Environment URLs

| Branch | URL | Database | Purpose |
|--------|-----|----------|---------|
| develop | develop-*.vercel.app | Dev DB | First developer testing |
| staging | staging-*.vercel.app | Staging DB | Final QA before production |
| main | hiretivo.com | Production DB | Live users |

---

## 👥 Who Does What

| Role | Branch | Action |
|------|--------|--------|
| **Developer** | `develop` | Merge features here, first testing |
| **Tester** | `develop` | Test new features |
| **Lead/QA** | `staging` | Final testing before production |
| **DevOps** | `main` | Production deployment |

---

## ⚠️ IMPORTANT: Why `develop` Must Be Default

**If `staging` is default:**
```
❌ WRONG:
Developer: git checkout staging (default)
Developer: git checkout -b feature/new
Developer: [work on feature]
Developer: PR to develop (?)
Problem: Branched from staging but merging to develop
Result: Merge conflicts! staging is ahead of develop
```

**With `develop` as default:**
```
✅ CORRECT:
Developer: git checkout develop (default)
Developer: git checkout -b feature/new
Developer: [work on feature]
Developer: PR to develop ✓
Result: Clean merge! branched from develop, merging to develop
```

---

## 🎓 Golden Rule

**Always merge back to the branch you created from!**

- Branch FROM `develop` → Merge TO `develop` ✅
- Branch FROM `staging` → Merge TO `staging` ✅
- Branch FROM `main` → Merge TO `main` ✅

---

## 📅 Weekly Cadence Example

### Monday-Thursday: Active Development
```
Day 1: Developer A: feature/filters → develop
Day 2: Developer B: feature/auth-fix → develop
Day 3: Developer A: feature/ui-update → develop
Day 4: Tester: Tests all features on develop
```

### Thursday Evening: Move to Staging
```
Lead: Creates PR develop → staging
Tester: Final QA testing on staging
```

### Friday: Deploy to Production
```
DevOps: Creates PR staging → main
Deploy to production 🚀
Monitor for issues
```

---

## 🚀 Quick Commands

```bash
# Start new feature
git checkout develop && git pull
git checkout -b feature/my-feature

# Update feature with latest develop
git checkout develop && git pull
git checkout feature/my-feature
git merge develop

# Check what's going to staging
git log staging..develop --oneline

# Check what's going to production
git log main..staging --oneline
```

---

## ✅ Current Setup

All branches are synced at: **e7b24f1**

```
✅ develop  (e7b24f1) - DEFAULT BRANCH
✅ staging  (e7b24f1) - Final QA
✅ main     (e7b24f1) - Production (just deployed!)
```

---

## 📌 Next Step

**Set `develop` as default branch on GitHub:**

1. Go to: https://github.com/ignitinsharma/hiretivo/settings
2. General → Default branch
3. Switch to: **`develop`**
4. Update

✅ Done! Developers will automatically work from `develop`
