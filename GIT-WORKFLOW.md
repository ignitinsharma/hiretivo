# Hiretivo — Git Workflow Guide

## 🎯 Recommended Workflow: 2-Tier (Staging → Main)

### Branch Structure
```
main (production)
  ↑
staging (default branch - primary development)
  ↑
feature/* (individual features)
```

---

## 📋 Branch Descriptions

### `main` — Production Branch
- **Purpose:** Live production code only
- **Protected:** Yes (require PR + approvals)
- **Auto-deploys to:** hiretivo.com (Production DB)
- **Who merges:** Only after thorough testing on staging
- **Merge frequency:** Weekly or per release

### `staging` — Default Branch (Primary)
- **Purpose:** Integration and testing
- **Protected:** Optional (recommend yes for teams)
- **Auto-deploys to:** hiretivo-git-staging-*.vercel.app (Staging DB)
- **Who merges:** All developers merge features here
- **Merge frequency:** Daily/multiple times per day

### `feature/*` — Feature Branches
- **Purpose:** Individual feature development
- **Base branch:** Always branch from `staging`
- **Naming:** `feature/add-job-filters`, `feature/fix-login-bug`
- **Auto-deploys to:** hiretivo-git-feature-*.vercel.app (Preview DB)
- **Lifespan:** Delete after merging to staging

---

## 🔄 Complete Workflow

### 1. Start New Feature
```bash
# Make sure staging is up to date
git checkout staging
git pull origin staging

# Create feature branch FROM staging
git checkout -b feature/add-job-filters

# Work on your feature
# ... make changes ...
git add .
git commit -m "feat: add job filters"
```

### 2. Push and Create PR to Staging
```bash
# Push feature branch
git push origin feature/add-job-filters

# On GitHub:
# 1. Open Pull Request
# 2. Base: staging ← Compare: feature/add-job-filters
# 3. Request review (optional)
# 4. Vercel will auto-deploy preview
```

### 3. Test Feature on Preview Deployment
```bash
# Vercel auto-deploys to:
# https://hiretivo-git-feature-add-job-filters-*.vercel.app

# Test the feature thoroughly
# Check logs, test edge cases
```

### 4. Merge to Staging
```bash
# After PR approval (or self-approval if solo):
# Click "Merge Pull Request" on GitHub

# Or via command line:
git checkout staging
git merge feature/add-job-filters
git push origin staging

# Delete feature branch
git branch -d feature/add-job-filters
git push origin --delete feature/add-job-filters
```

### 5. Test on Staging Deployment
```bash
# Staging auto-deploys to:
# https://hiretivo-git-staging-*.vercel.app

# Do final testing here
# This is your pre-production environment
```

### 6. Deploy to Production (When Ready)
```bash
# After accumulating multiple features on staging
# and doing thorough QA testing:

# Create PR from staging to main
git checkout staging
git pull origin staging

# On GitHub:
# 1. Open Pull Request
# 2. Base: main ← Compare: staging
# 3. Title: "Release v1.2.0" or "Deploy: Feature X, Y, Z"
# 4. Review changes carefully
# 5. Merge to main

# Production auto-deploys to:
# https://hiretivo.com
```

---

## 🚫 What NOT to Do

### ❌ Don't Branch from Main
```bash
# WRONG - Don't do this
git checkout main
git checkout -b feature/new-thing
```

**Why wrong:** Your feature will be behind staging, causing merge conflicts.

**Always branch from staging** ✅

### ❌ Don't Push Directly to Main
```bash
# WRONG - Don't do this
git checkout main
git push origin main
```

**Why wrong:** Bypasses testing, breaks production.

**Always go through staging first** ✅

### ❌ Don't Keep Long-Lived Feature Branches
```bash
# WRONG - Don't do this
feature/big-feature (open for 2 months)
```

**Why wrong:** Causes massive merge conflicts.

**Break into smaller features, merge frequently** ✅

---

## 🛡️ Branch Protection Rules

### For `main` (Production) — STRICT

**GitHub Settings → Branches → Add Rule:**
```yaml
Branch name pattern: main

Protect matching branches:
  ✓ Require a pull request before merging
    ✓ Require approvals: 1 (or 0 if solo)
  ✓ Require status checks to pass before merging
    ✓ Require branches to be up to date before merging
  ✓ Require conversation resolution before merging
  ✓ Include administrators (if team)
  
  ✗ Allow force pushes (NEVER!)
  ✗ Allow deletions (NEVER!)
```

### For `staging` (Default) — MODERATE

**GitHub Settings → Branches → Add Rule:**
```yaml
Branch name pattern: staging

Protect matching branches:
  ✓ Require a pull request before merging (optional for solo)
  ✓ Require status checks to pass before merging
  
  ✗ Allow force pushes (NEVER!)
  ✗ Allow deletions (NEVER!)
```

---

## 📅 Release Cadence Options

### Option 1: Continuous Deployment (Fast-moving)
```
Day 1: Merge 3 features to staging → Test
Day 2: Merge staging to main → Deploy

Pros: Fast iteration, quick fixes
Cons: More deployments, potential for bugs
```

### Option 2: Weekly Releases (Balanced)
```
Mon-Thu: Merge features to staging
Fri: Final testing on staging
Fri EOD: Merge staging to main

Pros: Predictable releases, batched testing
Cons: Slower feature delivery
```

### Option 3: Milestone Releases (Controlled)
```
Sprint 1-2 weeks: Develop features on staging
End of sprint: Thorough QA on staging
Release: Merge staging to main

Pros: Stable releases, thorough testing
Cons: Slowest delivery
```

**Recommendation:** Start with **Option 2** (Weekly), adjust based on your pace.

---

## 🔧 Setting Staging as Default Branch

### On GitHub:

1. Go to: **Your Repo → Settings → General**
2. Scroll to: **Default Branch**
3. Click: **Switch to another branch**
4. Select: **staging**
5. Click: **Update**

**Result:**
- New PRs default to `staging` base
- Cloning the repo checks out `staging` by default
- GitHub shows `staging` branch first

---

## 🎨 Git Aliases (Productivity Boost)

Add to `~/.gitconfig`:

```ini
[alias]
  # Start new feature from staging
  feature = "!f() { git checkout staging && git pull && git checkout -b feature/$1; }; f"
  
  # Update feature branch with latest staging
  sync = "!git checkout staging && git pull && git checkout - && git merge staging"
  
  # Quick commit and push
  ship = "!git add -A && git commit -m \"$1\" && git push"
  
  # Delete merged feature branches
  cleanup = "!git branch --merged staging | grep -v 'staging\\|main' | xargs git branch -d"
```

**Usage:**
```bash
# Start new feature
git feature add-filters
# Creates and checks out: feature/add-filters from staging

# Sync feature with staging
git sync
# Merges latest staging into your feature branch

# Quick commit and push
git ship "feat: add filters"
# Stages all, commits, pushes

# Clean up merged branches
git cleanup
# Deletes all feature branches already merged to staging
```

---

## 📊 Example Timeline

### Week 1: Feature Development
```
Mon: git feature add-filters → Work → PR to staging → Merge
Tue: git feature fix-auth-bug → Work → PR to staging → Merge
Wed: git feature improve-ui → Work → PR to staging → Merge
Thu: Test everything on staging deployment
Fri: PR staging → main → Deploy to production ✅
```

### Week 2: Hotfix Flow
```
Production bug discovered on Monday:

1. Create hotfix branch from main (exception):
   git checkout main
   git checkout -b hotfix/critical-auth-fix
   
2. Fix bug, test locally
   
3. PR to main directly (skip staging for critical fixes)
   
4. After deploy, backport to staging:
   git checkout staging
   git cherry-pick <hotfix-commit>
   git push origin staging
```

---

## 🎯 Your Workflow Summary

```
┌─────────────────────────────────────────────────┐
│  Developer Workflow (Daily)                     │
└─────────────────────────────────────────────────┘

1. Start: git checkout staging && git pull
2. Branch: git checkout -b feature/my-feature
3. Work: Code + commit + push
4. PR: feature/* → staging (auto-deploys)
5. Test: Check preview URL
6. Merge: Merge PR to staging
7. Verify: Check staging URL

┌─────────────────────────────────────────────────┐
│  Release Workflow (Weekly)                      │
└─────────────────────────────────────────────────┘

1. Review: All features merged to staging
2. QA: Test staging thoroughly
3. PR: staging → main
4. Deploy: Merge to main (auto-deploys production)
5. Monitor: Check production, watch for errors
6. Celebrate: 🎉 Feature shipped!
```

---

## 🚨 Emergency Rollback

If production breaks:

### Option 1: Revert the Merge Commit
```bash
# On main branch
git checkout main
git log  # Find the bad merge commit hash

git revert <merge-commit-hash> -m 1
git push origin main

# Production redeploys with reverted changes
```

### Option 2: Force Deploy Previous Commit (Last Resort)
```bash
# In Vercel Dashboard:
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "..." → Redeploy
# 4. Check "Use existing Build Cache"
# 5. Click "Redeploy"

# Then fix on staging and re-deploy properly
```

---

## 📚 Useful Commands Reference

```bash
# Check which branch you're on
git branch

# See all branches (local + remote)
git branch -a

# Switch to staging
git checkout staging

# Update staging from remote
git pull origin staging

# See commits on staging not on main
git log main..staging

# See what files changed between branches
git diff main..staging

# Create branch from staging
git checkout staging
git checkout -b feature/new-thing

# Push new branch
git push -u origin feature/new-thing

# Delete local branch
git branch -d feature/old-thing

# Delete remote branch
git push origin --delete feature/old-thing

# See recent commits
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git restore .

# Update feature branch with latest staging
git checkout staging && git pull
git checkout feature/my-branch
git merge staging
```

---

## ✅ Pre-Merge Checklist

Before merging staging → main:

- [ ] All feature PRs merged to staging
- [ ] Staging deployment tested thoroughly
- [ ] No console errors on staging
- [ ] All critical user flows tested
- [ ] Database migrations tested (if any)
- [ ] No secrets committed
- [ ] PR description includes all features/fixes
- [ ] Team notified of deployment
- [ ] Rollback plan ready (just in case)

---

## 🎓 Learning Resources

- [Git Branching Strategy](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)

---

## 📌 Quick Reference Card

```
┌──────────────────────────────────────────────┐
│  BRANCH HIERARCHY                            │
├──────────────────────────────────────────────┤
│  main        → Production (hiretivo.com)     │
│  staging     → Testing (default branch)      │
│  feature/*   → Development                   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  DAILY WORKFLOW                              │
├──────────────────────────────────────────────┤
│  1. git checkout staging && git pull         │
│  2. git checkout -b feature/my-feature       │
│  3. [code, commit, push]                     │
│  4. Open PR: feature/* → staging             │
│  5. Test preview deployment                  │
│  6. Merge PR to staging                      │
│  7. Delete feature branch                    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  RELEASE WORKFLOW                            │
├──────────────────────────────────────────────┤
│  1. Test staging thoroughly                  │
│  2. Open PR: staging → main                  │
│  3. Review all changes                       │
│  4. Merge to main                            │
│  5. Production auto-deploys                  │
│  6. Monitor for issues                       │
└──────────────────────────────────────────────┘
```

---

**Remember:** 
- ✅ Always branch from `staging`
- ✅ Always merge to `staging` first
- ✅ Only merge to `main` when staging is stable
- ✅ Test on staging before production
- ❌ Never push directly to `main`
- ❌ Never branch from `main` for features
