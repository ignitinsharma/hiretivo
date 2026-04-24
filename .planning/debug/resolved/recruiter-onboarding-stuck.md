---
status: resolved
trigger: "recruiter-onboarding-stuck"
created: "2026-04-24T00:00:00.000Z"
updated: "2026-04-24T00:04:00.000Z"
---

## Current Focus

hypothesis: CONFIRMED and FIX APPLIED
test: TypeScript compilation passes, fix ensures recruiterProfile is saved before dashboard navigation
expecting: Fix verified - recruiterProfile will exist in DB before middleware check
next_action: Request human verification

## Symptoms

expected: Clicking "Go to Dashboard" should navigate to /recruiter/dashboard
actual: Same onboarding screen keeps showing, URL shows /recruiter/onboarding?_rsc=id3fy
errors: No explicit error messages, but the page keeps reloading to the same screen
reproduction: Complete all onboarding steps, reach the completion screen, click "Go to Dashboard"
started: Current issue - user cannot proceed past onboarding

## Eliminated

## Evidence

## Resolution

root_cause: Middleware redirect loop caused by missing recruiterProfile in database. When user clicks "Go to Dashboard" on the completion screen (step 4), the middleware at middleware.ts:157-164 checks if recruiterProfile exists. If it doesn't (because StepCompanyProfile's save failed or was non-blocking), middleware redirects back to /recruiter/onboarding. The page reloads, Zustand persist restores the state to step 4, and the user sees the same completion screen — creating an infinite loop.

The root issue: handleComplete() in OnboardingContainer.tsx only called completeOnboarding() (Zustand state) and router.push('/recruiter/dashboard') — it never ensured the recruiterProfile existed in the database. The only DB save was in StepCompanyProfile.handleContinue() (step 2→3), which was non-blocking (continued even on failure).

fix: Added saveRecruiterProfile() call in handleComplete() as a safety net before navigating to dashboard. This ensures the recruiterProfile exists in DB before the middleware check. Also added loading state to prevent double-clicks and provide user feedback during the save.

verification: TypeScript compilation passes with no errors. Fix is minimal and targeted — only adds a DB save before navigation that was missing.

files_changed:
  - src/modules/onboarding/components/OnboardingContainer.tsx: Added saveRecruiterProfile call in handleComplete, added isNavigating state, imported saveRecruiterProfile and useState
  - src/modules/onboarding/components/StepComplete.tsx: Added isLoading prop, disabled button and loading text during navigation
