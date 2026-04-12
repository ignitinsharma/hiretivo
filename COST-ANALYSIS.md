# Hiretivo — Cost Analysis & Free Plan Limits

## 🆓 Vercel Free Plan Limits

| Resource | Free Plan Limit | Your Multi-Environment Setup |
|----------|----------------|------------------------------|
| **Deployments** | 100/day | ~5-15/day (safe ✅) |
| **Build Minutes** | 6,000/month | ~200-400/month (safe ✅) |
| **Bandwidth** | 100 GB/month | <5 GB/month early stage (safe ✅) |
| **Concurrent Builds** | 1 at a time | Can queue (minor delays ⚠️) |
| **Team Members** | Solo only | Just you (safe ✅) |
| **Function Executions** | Unlimited | No issues ✅ |
| **Function Duration** | 10s max | Plenty for API routes ✅ |

---

## 📊 Realistic Usage Calculation

### Scenario 1: Solo Developer (Early Stage) ✅ SAFE

**Daily Activity:**
- 5 commits to `develop` branch = 5 builds
- 2 commits to `staging` branch = 2 builds  
- 1 merge to `main` = 1 build
- 2 feature branch PRs = 2 builds

**Total: ~10 deployments/day**
- **Per month:** ~300 deployments (well under 3,000 limit)
- **Build minutes:** ~300 min/month (5% of 6,000 limit) ✅

**Verdict:** You'll use **~5%** of your free plan. Totally safe! ✅

---

### Scenario 2: Active Development (2-3 people, frequent pushes) ⚠️ WATCH

**Daily Activity:**
- 15 commits to `develop` = 15 builds
- 5 commits to `staging` = 5 builds
- 2 merges to `main` = 2 builds
- 5 feature PRs = 5 builds

**Total: ~27 deployments/day**
- **Per month:** ~810 deployments (27% of limit)
- **Build minutes:** ~810 min/month (13.5% of 6,000 limit) ⚠️

**Verdict:** Still safe, but starting to accumulate. Monitor usage. ⚠️

---

### Scenario 3: Heavy Usage (Will Hit Limits) ❌

**Daily Activity:**
- 30+ commits across all branches
- Multiple team members pushing simultaneously
- Every small change triggers a build

**Total: 50+ deployments/day**
- **Per month:** 1,500+ deployments (50% of limit)
- **Build minutes:** 1,500+ min/month (25% of limit) ❌

**Verdict:** You'll hit limits. Time to optimize or upgrade. ❌

---

## 💡 How to Stay Within Free Limits

### 1. Don't Deploy Every Single Commit ✅

**Bad Practice:**
```bash
git commit -m "fix typo"
git push  # triggers build

git commit -m "fix another typo"
git push  # triggers another build

git commit -m "oops one more"
git push  # triggers yet another build
```

**Good Practice:**
```bash
# Work locally, commit multiple times
git commit -m "fix typo"
git commit -m "fix another typo"
git commit -m "final fixes"

# Push once when ready to test
git push  # only 1 build instead of 3!
```

**Savings:** 3× fewer builds ✅

---

### 2. Disable Auto-Deploy for Feature Branches ⚠️

By default, **every** branch triggers a deployment. For early stage, you don't need this.

**Update `vercel.json`:**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "staging": true,
      "develop": true
      // Feature branches (feature/*) won't auto-deploy
      // Only deploy when you manually trigger or open PR
    }
  }
}
```

**Savings:** 50% fewer builds if you work on many feature branches ✅

---

### 3. Use Draft PRs to Prevent Preview Builds

When opening a PR, mark it as **Draft** initially:

```
GitHub PR → Create Pull Request → Convert to Draft

When ready for review:
→ Ready for Review (triggers deployment)
```

**Savings:** Only build when actually ready for review ✅

---

### 4. Skip CI for Docs/Minor Changes

Add `[skip ci]` to commit message:

```bash
git commit -m "docs: update README [skip ci]"
git push  # No build triggered!
```

**Use for:**
- Documentation updates
- README changes
- Comment-only changes

**Savings:** ~10-20% fewer builds ✅

---

### 5. Batch Your Work

Instead of:
```bash
# Monday: 5 separate pushes to develop
# Tuesday: 5 separate pushes to develop
# Wednesday: 5 separate pushes to develop
```

Do this:
```bash
# Monday-Wednesday: Work locally, test locally
# Wednesday EOD: 1 push to develop with all changes
```

**Savings:** 15 builds → 1 build ✅

---

## 🗄️ Neon Database Limits (Free Plan)

| Resource | Free Plan Limit | 3-Database Setup |
|----------|----------------|------------------|
| **Storage** | 0.5 GB per database | 1.5 GB total (3 × 0.5) |
| **Compute** | 191.9 hours/month | Shared across 3 DBs |
| **Projects** | 10 projects | Using 1 project, 3 databases ✅ |

### Will You Hit Database Limits?

**Early Stage (0-1,000 users):**
- Database size: <50 MB per environment
- Compute: Minimal (mostly idle)
- **Verdict:** Totally safe ✅

**Growth Stage (1,000-10,000 users):**
- Production DB: ~200-300 MB (still safe)
- Staging/Dev: <100 MB each
- **Verdict:** Still within free tier ✅

**Scale Stage (10,000+ users):**
- Production DB: May exceed 0.5 GB
- **Action:** Upgrade production DB only (~$19/month for 10 GB)
- Staging/Dev can stay on free tier ✅

---

## 💸 When You'll Need to Pay

### Vercel Pro ($20/month) - When You Need:

✅ **Worth upgrading when:**
- You have 2+ team members
- You're making money from the app
- You need custom preview domains (staging.hiretivo.com)
- You exceed 6,000 build minutes/month
- You need faster builds (4 concurrent builds)

❌ **Not worth it yet if:**
- You're solo or small team
- Still in development/MVP stage
- Staying within free limits

### Neon Scale Plan ($19+/month) - When You Need:

✅ **Worth upgrading when:**
- Production database > 0.5 GB
- You have significant user traffic
- You need autoscaling compute

❌ **Not worth it yet if:**
- Database is under 0.5 GB
- Low traffic (< 10,000 users)

---

## 📈 Cost Projection by Stage

### Stage 1: MVP / Early Development (Months 0-6)
**Users:** 0-100  
**Traffic:** Minimal

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Free | $0 |
| Neon (3 DBs) | Free | $0 |
| Cloudflare R2 | Free tier | $0 |
| Upstash Redis | Free | $0 |
| **Total** | | **$0/month** ✅ |

**Will you hit limits?** NO ✅

---

### Stage 2: Beta / Soft Launch (Months 6-12)
**Users:** 100-1,000  
**Traffic:** Low-Medium

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Free (watching limits) | $0 |
| Neon (3 DBs) | Free | $0 |
| Cloudflare R2 | ~$1-5 | $5 |
| Upstash Redis | Free | $0 |
| **Total** | | **~$5/month** ✅ |

**Will you hit limits?** Probably not, but monitor ⚠️

---

### Stage 3: Launch / Growth (Months 12-24)
**Users:** 1,000-10,000  
**Traffic:** Medium-High

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro (worth it now) | $20 |
| Neon Production | Scale (~10GB) | $19 |
| Neon Staging/Dev | Free | $0 |
| Cloudflare R2 | ~$10-20 | $15 |
| Upstash Redis | Pay-as-you-go | $5 |
| **Total** | | **~$59/month** |

**Will you hit limits?** Yes, time to upgrade ✓

---

### Stage 4: Scaled (Year 2+)
**Users:** 10,000+  
**Traffic:** High

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro or Enterprise | $20-100+ |
| Neon Production | Scale (larger) | $50-100 |
| Neon Staging | Scale (smaller) | $19 |
| Cloudflare R2 | Pay-as-you-go | $30-50 |
| Upstash Redis | Pay-as-you-go | $20-30 |
| **Total** | | **~$139-300/month** |

But at this stage, **you're making money** 💰

---

## 🚨 Early Warning Signs You're Hitting Limits

### Vercel Build Limits

**Signs you're approaching limit:**
- ⚠️ Email from Vercel: "You've used 80% of your build minutes"
- ⚠️ Builds taking longer (queue delays)
- ⚠️ Build failures due to concurrent build limit

**Check usage:**
1. Go to Vercel Dashboard
2. Click your project
3. **Settings → Usage**
4. Monitor: Deployments, Build Minutes, Bandwidth

**Action:**
- Optimize (see Section 💡 above)
- Or upgrade to Pro ($20/month)

### Neon Database Limits

**Signs you're approaching limit:**
- ⚠️ Email: "Your database is 80% full"
- ⚠️ Slower queries
- ⚠️ Connection errors

**Check usage:**
1. Go to Neon Console
2. Select your database
3. Check **Storage** and **Compute Hours**

**Action:**
- Upgrade production DB only
- Keep staging/dev on free tier

---

## 🎯 Optimization Strategy: Stay Free Longer

### Month 1-3: Learn the Setup
- Push frequently, test the workflow
- Don't worry about limits yet
- Get comfortable with the setup

### Month 4-6: Optimize
- Batch commits before pushing
- Use `[skip ci]` for docs
- Disable auto-deploy for feature branches
- **Goal:** Stay under 30% of limits

### Month 6-12: Monitor Actively
- Check Vercel usage weekly
- Watch database growth
- Optimize before hitting 50% of limits
- **Goal:** Stay on free plan until you have paying users

### Month 12+: Plan to Pay
- By now, you should have:
  - Real users
  - Revenue or funding
  - Need for better performance
- **Upgrade is worth it at this stage**

---

## 🆚 Comparison: 3-Branch vs 1-Branch Setup

### Your Old Setup (1 branch = main)
- Deployments: ~5-10/month
- Risk: All changes go directly to production ❌
- Cost: $0 ✅

### Your New Setup (3 branches)
- Deployments: ~15-30/month (3× more)
- Risk: Safe testing before production ✅
- Cost: Still $0 ✅
- **Build minutes increase: 3×, but still well under limit**

**Trade-off:** 3× more builds, but **infinitely safer** ✅

The extra builds are **worth it** for the safety!

---

## ✅ Final Verdict

### Your Multi-Environment Setup: **SAFE FOR FREE PLAN** ✅

**Realistic Early Usage:**
- Deployments: ~10-20/day (10-20% of limit)
- Build minutes: ~300-600/month (5-10% of limit)
- Bandwidth: <5 GB/month (<5% of limit)

**You're using roughly 10% of your free plan.**

### When to Worry:

❌ **Don't worry if:**
- You're solo or 2-3 person team
- Pushing <30 times per day
- In development/MVP stage

⚠️ **Start monitoring if:**
- Team of 4+ people
- Pushing 50+ times per day
- Vercel sends usage warnings

✅ **Upgrade when:**
- Consistently hitting 80% of limits
- Have paying customers (can afford it)
- Need better performance/features

---

## 📌 Summary

| Question | Answer |
|----------|--------|
| **Will 3 branches cost extra?** | No, still $0/month ✅ |
| **Will I hit limits?** | Very unlikely in first 6-12 months ✅ |
| **Is it worth it?** | YES! Safety > a few extra builds ✅ |
| **When do I need to pay?** | When you have real users & revenue 💰 |

**Bottom Line:** Your multi-environment setup will use ~10-15% of free plan limits. You're **completely safe** for at least 6-12 months. By then, you'll hopefully have users/revenue and upgrading will be worth it! 🚀

---

## 🔗 Quick Links to Check Your Usage

- **Vercel Usage:** https://vercel.com/dashboard/usage
- **Neon Usage:** https://console.neon.tech/ → Select DB → Usage tab
- **Cloudflare R2:** https://dash.cloudflare.com/ → R2 → Your bucket → Metrics

**Set a calendar reminder:** Check usage every 2 weeks initially, then monthly.
