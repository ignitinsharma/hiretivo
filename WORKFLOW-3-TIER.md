# Hiretivo — 3-Tier Git Workflow

## 🎯 Complete Flow: feature → develop → staging → main

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   feature/*  →  develop  →  staging  →  main      │
│   (building)   (integration) (QA/test) (production)│
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📋 Branch Structure

### `main` — Production (Stable Releases Only)
- **Purpose:** Live production code serving real users
- **URL:** https://hiretivo.com
- **Database:** Production DB (real data)
- **Protected:** YES (strict)
- **Deploys:** Only from staging after thorough QA
- **Merge frequency:** Weekly or per release cycle

### `staging` — Pre-Production (QA & Final Testing)
- **Purpose:** Final testing before production
- **URL:** https://hiretivo-git-staging-*.vercel.app
- **Database:** Staging DB (test data)
- **Protected:** YES (moderate)
- **Deploys:** Only from develop after features are complete
- **Merge frequency:** 2-3 times per week

### `develop` — Development (Default Branch - Active Development)
- **Purpose:** Integration branch for all active development
- **URL:** https://hiretivo-git-develop-*.vercel.app
- **Database:** Development DB (test data)
- **Protected:** Optional
- **Deploys:** Multiple times per day as features merge
- **Merge frequency:** Daily/continuously
- **⭐ THIS IS YOUR DEFAULT BRANCH** — developers branch from here

### `feature/*` — Feature Branches
- **Purpose:** Individual feature development
- **URL:** https://hiretivo-git-feature-name-*.vercel.app (auto-preview)
- **Database:** Development DB (test data)
- **Protected:** NO
- **Base:** Always create from `develop`
- **Lifespan:** Delete after merging to develop

---

## 🔄 Complete Development Workflow

### Phase 1: Feature Development (Developer)

```bash
# 1. Start from develop (default branch)
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-job-filters

# 3. Build your feature
# ... code, code, code ...
git add .
git commit -m "feat: add advanced job filters"

# 4. Push to create preview
git push -u origin feature/add-job-filters

# 5. Open PR on GitHub: feature/add-job-filters → develop
# Vercel auto-deploys preview for testing
```

**What happens:**
- ✅ Preview URL created automatically
- ✅ You test on: hiretivo-git-feature-add-job-filters-*.vercel.app
- ✅ Uses develop database (safe testing)

### Phase 2: Integration (Developer + Team Lead)

```bash
# After PR review and approval:
# Merge feature/* → develop (on GitHub or CLI)

git checkout develop
git pull origin develop

# Vercel auto-deploys develop branch
# Test on: https://hiretivo-git-develop-*.vercel.app
```

**What happens:**
- ✅ Feature is now in develop
- ✅ Other developers can build on it
- ✅ Integration testing with other features
- ✅ Delete feature branch

### Phase 3: QA Testing (QA Team / Lead Developer)

```bash
# When multiple features are ready for QA:
# Open PR: develop → staging

git checkout staging
git pull origin staging

# On GitHub:
# Create PR: develop → staging
# Title: "Release v1.2.0 - Job Filters + Auth Fix"
# Review all changes since last staging merge

# After review, merge PR
# Vercel auto-deploys staging
```

**What happens:**
- ✅ staging gets all new features from develop
- ✅ QA tests on: https://hiretivo-git-staging-*.vercel.app
- ✅ Thorough testing with staging database
- ✅ Bug fixes go back to develop, then re-merge

### Phase 4: Production Deploy (Team Lead / DevOps)

```bash
# After QA signs off on staging:
# Open PR: staging → main

git checkout main
git pull origin main

# On GitHub:
# Create PR: staging → main
# Title: "Production Release v1.2.0"
# ⚠️ DOUBLE CHECK EVERYTHING

# After final review, merge PR
# Vercel auto-deploys production
```

**What happens:**
- ✅ main gets all tested features from staging
- ✅ Deploys to: https://hiretivo.com
- ✅ Real users see the new features
- ✅ Monitor for errors!

---

## 📊 Visual Timeline Example

### Week 1: Parallel Feature Development

```
Monday:
  Developer A: feature/add-filters → develop ✓
  Developer B: feature/fix-auth → develop ✓
  
Tuesday:
  Developer A: feature/improve-ui → develop ✓
  Developer C: feature/email-templates → develop ✓
  
Wednesday:
  Developer B: feature/job-stats → develop ✓
  
Thursday:
  All features tested on develop
  PR: develop → staging ✓
  QA starts testing on staging
  
Friday:
  QA approved staging
  PR: staging → main ✓
  🚀 PRODUCTION DEPLOY!
```

---

## 🎯 Who Does What

| Role | Branch | Responsibilities |
|------|--------|------------------|
| **Developer** | `feature/*` | Build features, write code, test locally |
| **Developer** | `develop` | Merge features, integration testing |
| **Lead Dev / QA** | `staging` | Final testing, QA approval |
| **Lead Dev / DevOps** | `main` | Production deploy, monitoring |

---

## ⚙️ Setting Up Default Branch

### Make `develop` the Default Branch:

1. Go to: **GitHub.com → Your Repo → Settings**
2. Click: **General** (left sidebar)
3. Scroll to: **Default Branch**
4. Click: **Switch to another branch**
5. Select: **`develop`**
6. Click: **Update**
7. Confirm: **I understand, update the default branch**

**Result:**
- ✅ New clones checkout `develop` by default
- ✅ New PRs default to `develop` as base
- ✅ GitHub UI shows `develop` first
- ✅ Perfect for active development!

---

## 🛡️ Branch Protection Rules

### `main` — MAXIMUM PROTECTION ⚠️

```yaml
Settings → Branches → Add Rule → main

Required:
  ✓ Require a pull request before merging
    ✓ Require approvals (1-2 people)
  ✓ Require status checks to pass
    ✓ Require branches to be up to date
  ✓ Require conversation resolution
  ✓ Include administrators

Never Allow:
  ✗ Force pushes
  ✗ Deletions
```

### `staging` — MODERATE PROTECTION ⚠️

```yaml
Settings → Branches → Add Rule → staging

Required:
  ✓ Require a pull request before merging
    ✓ Require approvals (1 person)
  ✓ Require status checks to pass
  
Never Allow:
  ✗ Force pushes
  ✗ Deletions
```

### `develop` — LIGHT PROTECTION (Optional)

```yaml
Settings → Branches → Add Rule → develop

Optional (for teams):
  ✓ Require a pull request before merging
  ✓ Require status checks to pass
  
Allow (for solo):
  ✓ Direct pushes (faster iteration)
```

---

## 🔄 Environment Mapping

| Branch | Environment | URL | Database | Purpose |
|--------|-------------|-----|----------|---------|
| `feature/*` | Preview | Auto-generated | Dev DB | Individual testing |
| `develop` | Development | develop-*.vercel.app | Dev DB | Integration |
| `staging` | Staging | staging-*.vercel.app | Staging DB | QA/Pre-prod |
| `main` | Production | hiretivo.com | Production DB | Live users |

---

## 🐛 Bug Fix Workflows

### Regular Bug (Found in Development)

```bash
# Branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/fix-auth-bug

# Fix bug, test, push
git push origin feature/fix-auth-bug

# PR: feature/fix-auth-bug → develop
# Follows normal flow: develop → staging → main
```

### Critical Hotfix (Production Down!)

```bash
# Branch directly from main (EXCEPTION)
git checkout main
git pull origin main
git checkout -b hotfix/critical-payment-bug

# Fix bug immediately
git add .
git commit -m "hotfix: fix payment processing"
git push origin hotfix/critical-payment-bug

# PR: hotfix/* → main (skip develop & staging)
# Deploy immediately

# THEN backport to staging and develop:
git checkout staging
git cherry-pick <hotfix-commit-hash>
git push origin staging

git checkout develop
git cherry-pick <hotfix-commit-hash>
git push origin develop
```

---

## 📅 Recommended Release Cadence

### Daily on Develop
- Developers merge features continuously
- Always have latest integrated code
- Quick feedback loop

### 2-3x per Week on Staging
- Batch multiple features for QA
- Thorough testing window
- Reduce QA context switching

### Weekly on Production
- Friday afternoon: Staging → Main
- Or after major milestone completion
- Predictable release schedule

---

## 🚀 Complete Example: New Feature Start to Finish

### Day 1 (Monday): Start Development

```bash
git checkout develop
git pull origin develop
git checkout -b feature/advanced-search

# Build feature
# ... code all day ...
git add .
git commit -m "feat: add advanced search with filters"
git push origin feature/advanced-search

# Open PR: feature/advanced-search → develop
```

### Day 2 (Tuesday): PR Review & Merge

```bash
# Team reviews PR
# Feedback received, make changes
git add .
git commit -m "fix: address PR feedback"
git push origin feature/advanced-search

# PR approved and merged to develop
# Vercel auto-deploys develop branch
```

### Day 3 (Wednesday): Integration Testing on Develop

```bash
# Test on: https://hiretivo-git-develop-*.vercel.app
# Works well with other features
# All developers testing their features together
```

### Day 4 (Thursday): Move to Staging for QA

```bash
# Batch this feature with 5 others from the week
# Create PR: develop → staging

# QA team tests on staging
# Test on: https://hiretivo-git-staging-*.vercel.app

# Bug found! Create fix:
git checkout develop
git checkout -b feature/fix-search-bug
# ... fix bug ...
git push origin feature/fix-search-bug
# PR → develop → merge

# Re-merge develop → staging
```

### Day 5 (Friday): Deploy to Production

```bash
# QA approved staging ✓
# Create PR: staging → main
# Final review by lead developer
# Merge to main

# 🚀 Live on: https://hiretivo.com

# Monitor for errors
# Celebrate! 🎉
```

---

## 🧪 Testing Checklist by Environment

### On Feature Branch (Developer)
- [ ] Feature works locally
- [ ] No console errors
- [ ] Unit tests pass (if any)
- [ ] Preview deployment works
- [ ] Ready for team review

### On Develop (Developer + Team)
- [ ] Feature integrates with other features
- [ ] No conflicts or breaking changes
- [ ] Develop deployment stable
- [ ] Other developers can build on it

### On Staging (QA + Lead)
- [ ] All user flows tested
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] No security issues
- [ ] Database migrations work
- [ ] Ready for production

### On Main (Lead + DevOps)
- [ ] Staging testing passed
- [ ] Production database backed up
- [ ] Rollback plan ready
- [ ] Team notified of deployment
- [ ] Monitoring enabled
- [ ] Post-deploy verification complete

---

## 🔧 Useful Git Aliases for 3-Tier Flow

Add to `~/.gitconfig`:

```ini
[alias]
  # Start new feature from develop
  feature = "!f() { git checkout develop && git pull && git checkout -b feature/$1; }; f"
  
  # Sync feature with latest develop
  sync = "!git checkout develop && git pull && git checkout - && git merge develop"
  
  # Quick status of all branches
  branches = "!git for-each-ref --sort=-committerdate refs/heads/ --format='%(committerdate:short) %(refname:short)'"
  
  # See what's in develop but not in staging
  staging-preview = "log staging..develop --oneline"
  
  # See what's in staging but not in main
  production-preview = "log main..staging --oneline"
  
  # Clean up merged feature branches
  cleanup = "!git branch --merged develop | grep 'feature/' | xargs git branch -d"
```

**Usage:**
```bash
# Start new feature
git feature add-search
# ↓ Creates: feature/add-search from develop

# Keep feature updated with develop
git sync
# ↓ Merges latest develop into your feature

# See what will go to staging
git staging-preview

# See what will go to production
git production-preview

# Clean up old feature branches
git cleanup
```

---

## 📌 Golden Rules

### ✅ DO:
1. Always branch from `develop` for features
2. Merge features to `develop` first
3. Test on `develop` before moving to `staging`
4. QA thoroughly on `staging` before `main`
5. Delete feature branches after merging
6. Keep `develop` always deployable
7. Use PRs for all merges (even if solo)

### ❌ DON'T:
1. Never push directly to `main`
2. Never branch from `main` (except hotfixes)
3. Never skip `staging` for regular features
4. Never merge broken code to `develop`
5. Never force push to protected branches
6. Never keep long-lived feature branches
7. Never deploy to production on Friday night 😅

---

## 🎯 Quick Reference Card

```
┌────────────────────────────────────────────────┐
│  BRANCH HIERARCHY (3-TIER)                     │
├────────────────────────────────────────────────┤
│  main     → Production (real users)            │
│  staging  → QA/Testing (pre-production)        │
│  develop  → Integration (DEFAULT - active dev) │
│  feature/*→ Individual features               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  DEVELOPER DAILY FLOW                          │
├────────────────────────────────────────────────┤
│  1. git checkout develop && git pull           │
│  2. git checkout -b feature/my-thing           │
│  3. [code + commit + push]                     │
│  4. Open PR: feature/* → develop               │
│  5. Merge after review                         │
│  6. Test on develop deployment                 │
│  7. Delete feature branch                      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  WEEKLY RELEASE FLOW                           │
├────────────────────────────────────────────────┤
│  Thursday:                                     │
│    PR: develop → staging                       │
│    QA tests staging                            │
│                                                │
│  Friday:                                       │
│    QA approval ✓                               │
│    PR: staging → main                          │
│    Deploy to production 🚀                     │
│    Monitor & celebrate 🎉                      │
└────────────────────────────────────────────────┘
```

---

## 🎓 Why 3-Tier?

### Benefits:
- ✅ **develop**: Fast iteration, always integrating
- ✅ **staging**: Thorough QA without blocking development
- ✅ **main**: Rock-solid production, only tested code

### vs 2-Tier (staging → main):
- ⚠️ QA blocks all development
- ⚠️ Developers wait for QA to finish
- ⚠️ Slower feedback loop

### vs 1-Tier (main only):
- ❌ No testing before production
- ❌ High risk of breaking production
- ❌ No rollback point

**3-Tier is the sweet spot for growing teams!** 🎯

---

## 📚 Next Steps

1. ✅ Set `develop` as default branch on GitHub
2. ✅ Set up branch protection rules
3. ✅ Share this guide with your team
4. ✅ Start your first feature on `develop`
5. ✅ Follow the flow: develop → staging → main
6. ✅ Adjust cadence based on your team's pace

---

**Happy Shipping! 🚀**
