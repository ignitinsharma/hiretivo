# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## recruiter-onboarding-stuck — Middleware redirect loop on dashboard navigation
- **Date:** 2026-04-24
- **Error patterns:** onboarding stuck, Go to Dashboard, same screen keeps showing, redirect loop, recruiterProfile not found
- **Root cause:** handleComplete() in OnboardingContainer.tsx didn't save recruiterProfile to DB before navigating to /recruiter/dashboard. Middleware (middleware.ts:157-164) checks for recruiterProfile existence and redirects back to /recruiter/onboarding if missing. Zustand persist restores state to step 4, creating infinite redirect loop on completion screen.
- **Fix:** Added saveRecruiterProfile() call in handleComplete() as safety net before router.push('/recruiter/dashboard'). Added isNavigating state to prevent double-clicks and show loading feedback. Passed isLoading prop to StepComplete for button disabled state.
- **Files changed:** src/modules/onboarding/components/OnboardingContainer.tsx, src/modules/onboarding/components/StepComplete.tsx
---

## pricing-page-plan-count-and-dodo-prices — Pricing page exposed stale paid plan variants
- **Date:** 2026-04-26
- **Error patterns:** pricing page, five plan sections, five plan cards, Free Pro Custom, Dodo prices, Monthly_PRO_USD, Annual_PRO_USD, Monthly_PRO_INR, Annual_PRO_INR, visual data mismatch
- **Root cause:** Stale static PRICING_CONFIG had five public tiers and the pricing page rendered the entire array directly, while billing/checkout only supports the Pro Dodo products.
- **Fix:** Reduced PRICING_CONFIG to Free, Pro, and Custom; removed stale Starter/Growth/public Enterprise pricing; changed pricing card to use Custom with no public price and Pro annual Dodo product totals.
- **Files changed:** src/constants/pricing.ts, src/app/(public)/pricing/pricing-client.tsx
---
