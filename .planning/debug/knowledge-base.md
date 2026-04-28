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

## avatar-upload-issues — Avatar disappears on reload, >2MB rejected, Next.js parse error
- **Date:** 2026-04-26
- **Error patterns:** avatar disappears, file too large max 2 MB, Failed to parse src, next/image, avatars/ missing leading slash, stale state
- **Root cause:** Three issues: (1) AvatarSection and CompanyAvatarSection used useState(prop) which only initializes once — when async API data arrives and prop changes, local state stays stale. (2) No client-side compression existed; server rejects >2MB with no preprocessing. (3) /api/recruiter/talent and /api/recruiter/talent/[id] returned seeker.image as raw R2 key without resolveLogoUrl(), causing next/image to receive "avatars/xxx/avatar.webp" (missing leading "/").
- **Fix:** (1) Added useEffect to sync local state with image/logo prop changes in both avatar components. (2) Created src/lib/image-compression.ts using Canvas API — converts to WebP, resizes to max 800px, progressively reduces quality until under 2MB. Applied in both AvatarSection and CompanyAvatarSection upload flows. (3) Added resolveLogoUrl() to both talent API routes.
- **Files changed:** src/modules/seeker/settings/components/AvatarSection.tsx, src/modules/recruiter/settings/components/CompanyAvatarSection.tsx, src/lib/image-compression.ts, src/app/api/recruiter/talent/route.ts, src/app/api/recruiter/talent/[id]/route.ts
---
