---
phase: 11-payments-integration
verified: 2026-04-17T05:19:38Z
status: gaps_found
score: 3/4 must-haves verified
gaps:
  - truth: "Recruiter can select PRO or ENTERPRISE on the pricing page, complete Stripe Checkout, and return to the app with their plan upgraded"
    status: partial
    reason: "PRO Checkout is implemented end-to-end, but Enterprise is rendered as Contact sales and the checkout schema only accepts planId 'pro'. PAY-01 and the roadmap success criterion require PRO or ENTERPRISE via Stripe Checkout."
    artifacts:
      - path: "src/constants/pricing.ts"
        issue: "Enterprise tier CTA is Contact sales and is marked contact-sales/no self-serve."
      - path: "src/app/(public)/pricing/pricing-client.tsx"
        issue: "Enterprise CTA links to /contact; only PRO invokes checkoutMutation."
      - path: "src/lib/validations/checkout.schema.ts"
        issue: "CheckoutRequestSchema only permits planId 'pro'."
    missing:
      - "Either implement Enterprise Stripe Checkout support or update PAY-01 and the Phase 11 success criterion to explicitly define Enterprise as contact-sales only."
human_verification:
  - test: "Live PRO Checkout purchase"
    expected: "A recruiter can complete Stripe Checkout, return to /pricing/success, and see their session/database plan become PRO."
    why_human: "Requires configured Stripe products, webhook endpoint, and live/test Stripe redirect flow."
  - test: "Live Customer Portal management"
    expected: "A PRO recruiter can open Stripe Customer Portal from Billing settings and cancel/update payment method."
    why_human: "Requires Stripe-hosted portal configuration and an existing Stripe customer."
---

# Phase 11: Payments Integration Verification Report

**Phase Goal:** Recruiters can purchase and manage subscription plans through Stripe, with billing lifecycle fully synced to the database
**Verified:** 2026-04-17T05:19:38Z
**Status:** gaps_found
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Recruiter can select PRO or ENTERPRISE on pricing page, complete Stripe Checkout, and return with plan upgraded | ✗ PARTIAL | PRO path is wired: pricing posts to `/api/stripe/checkout`, checkout creates a subscription session, success polls status, webhook upgrades plan. Enterprise is contact-sales only: `src/constants/pricing.ts` sets `cta: "Contact sales"`, `src/app/(public)/pricing/pricing-client.tsx` links Enterprise to `/contact`, and `src/lib/validations/checkout.schema.ts` only accepts `planId: "pro"`. |
| 2 | Recruiter can open Stripe Customer Portal from Billing settings to cancel subscription or update payment method | ✓ VERIFIED | Billing tab fetches portal URL with `POST /api/stripe/portal` and redirects. Portal API requires authenticated recruiter, existing `stripeCustomerId`, then calls `stripe.billingPortal.sessions.create()`. |
| 3 | Recruiter Billing tab displays current plan name, subscription status, period end date, and cancel-at-period-end state from DB | ✓ VERIFIED | `BillingTabContent` uses `useQuery(["subscription-status"])`; API selects `user.plan` and `subscription.status/currentPeriodEnd/cancelAtPeriodEnd`; UI renders Free/PRO/Enterprise cards, status badges, "Renews on"/"Expires on", and cancel-at-period-end notice. |
| 4 | Stripe lifecycle events automatically update User.plan and Subscription records | ✓ VERIFIED | Webhook verifies Stripe signature, handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`; writes use `prisma.$transaction`. Source-contract webhook tests passed: 7/7. |

**Score:** 3/4 phase-level truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `prisma/schema.prisma` | `SubStatus`, `Subscription`, `User.subscription` | ✓ VERIFIED | Schema has enum, relation, required Stripe fields, period dates, cancel flag, and indexes. `pnpm exec prisma validate` passed. |
| `src/lib/stripe.ts` | Server Stripe client | ✓ VERIFIED | Exports `stripe` using `STRIPE_SECRET_KEY` and Stripe API version `2026-03-25.dahlia`. |
| `src/constants/stripe.ts` | PRO price IDs, mapping, price lookup | ✓ VERIFIED | Four PRO env price IDs map to `PlanTier.PRO`; `getStripePriceId()` returns a price for PRO only. |
| `src/constants/pricing.ts` | 3-tier pricing config | ✓ VERIFIED | Free, PRO, Enterprise are present; PRO uses required Growth prices; Enterprise has starting prices and Contact sales CTA. |
| `src/app/(public)/pricing/pricing-client.tsx` | Pricing UI and checkout/portal CTA wiring | ⚠ PARTIAL | Substantive and wired for PRO checkout and PRO portal. Enterprise does not use checkout, which conflicts with PAY-01/roadmap wording. |
| `src/app/api/stripe/checkout/route.ts` | Checkout Session API | ✓ VERIFIED | Auth, recruiter role, rate limit, Zod parse, customer create/update, and `stripe.checkout.sessions.create()` are implemented. |
| `src/app/api/stripe/portal/route.ts` | Customer Portal API | ✓ VERIFIED | Auth, recruiter role, rate limit, customer lookup, and `stripe.billingPortal.sessions.create()` are implemented. |
| `src/app/api/stripe/webhook/route.ts` | Webhook lifecycle sync | ✓ VERIFIED | Raw body signature verification plus four event handlers with Prisma transactions. |
| `src/app/api/stripe/subscription-status/route.ts` | Current billing status API | ✓ VERIFIED | Auth-gated DB read returns plan and subscription status/date/cancel flag. |
| `src/app/(public)/pricing/success/page.tsx` | Checkout success polling | ✓ VERIFIED | Polls `/api/stripe/subscription-status`, calls `update()` on active/PRO, and handles timeout/error states. |
| `src/modules/billing/components/BillingTabContent.tsx` | Real billing settings tab | ✓ VERIFIED | Handles loading/error/data states, Free upgrade CTA, paid status badges, renewal/expiry text, and portal mutation. |
| `src/app/recruiter/settings/page.tsx` | Billing tab wiring | ✓ VERIFIED | Imports and renders `<BillingTabContent />`; "Coming soon" placeholder removed. |
| `src/app/api/auth/delete-account/route.ts` | Stripe cancel before soft delete | ✓ VERIFIED | Lists active subscriptions and calls `stripe.subscriptions.cancel(..., { prorate: true })` before soft deleting. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Pricing page | `PricingClient` | Server component passes currency prop | ✓ VERIFIED | GSD key-link check found `<PricingClient`. |
| `PricingClient` | `PRICING_CONFIG` | Import and `.map()` render | ✓ VERIFIED | Direct source check found `PRICING_CONFIG` import and `PRICING_CONFIG.map`. GSD regex missed multiline import. |
| `PricingClient` | `/api/stripe/checkout` | PRO recruiter CTA mutation | ✓ VERIFIED | Direct source check found fetch at pricing-client line 399 and PRO mutation at lines 424-470. |
| Checkout API | `src/lib/stripe.ts` | `stripe.checkout.sessions.create()` | ✓ VERIFIED | Direct source check found call at checkout route line 75. |
| Success page | `/api/stripe/subscription-status` | Polling loop | ✓ VERIFIED | Fetch at success page lines 28-36, polling/update at lines 45-85. |
| Billing tab | `/api/stripe/subscription-status` | `useQuery` | ✓ VERIFIED | `BillingTabContent` fetches status at lines 67-75 and uses query at lines 211-220. |
| Billing tab | `/api/stripe/portal` | `useMutation` | ✓ VERIFIED | Portal fetch at lines 78-89; mutation and redirect at lines 140-147 and 199-205. |
| Webhook | Prisma | Transactions updating `User` and `Subscription` | ✓ VERIFIED | Transactions at webhook lines 97, 144, 185, and 218. |
| Delete account | Stripe client | `stripe.subscriptions.cancel()` | ✓ VERIFIED | Route imports `stripe`, lists active subscription, cancels with `prorate: true` at lines 29-41. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `PricingClient` | `url` from checkout/portal mutations | `/api/stripe/checkout`, `/api/stripe/portal` | Yes - Stripe-hosted URLs returned from Stripe SDK calls | ✓ FLOWING |
| Checkout API | `priceId`, `stripeCustomerId`, `checkoutSession.url` | Env price map, Prisma user, Stripe customer/session APIs | Yes - request is validated and Stripe session URL is returned | ✓ FLOWING |
| Success page | `payload.data.plan`, `payload.data.subscription.status` | `/api/stripe/subscription-status` | Yes - API reads Prisma user/subscription | ✓ FLOWING |
| Webhook | `User.plan`, `Subscription` fields | Stripe event payload + retrieved subscription | Yes - handlers write real Prisma records in transactions | ✓ FLOWING |
| Billing tab | `data.plan`, `data.subscription` | `/api/stripe/subscription-status` | Yes - API selects plan and subscription fields from DB | ✓ FLOWING |
| Delete account | active Stripe subscription | Stripe subscriptions list by customer ID | Yes - cancels actual active Stripe subscription if found | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Prisma schema is valid | `pnpm exec prisma validate` | Schema valid | ✓ PASS |
| Webhook source-contract tests pass | `pnpm exec tsx --test src/app/api/stripe/webhook/__tests__/webhook.test.ts` | 7 tests passed | ✓ PASS |
| Stripe package installed | `pnpm list stripe --depth 0` | `stripe@22.0.2` installed | ✓ PASS |
| Full TypeScript compile | `pnpm exec tsc --noEmit` | Not rerun; known blocked by stale `.next/types` and missing `@radix-ui/react-alert-dialog` per provided context | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| PAY-01 | 11-01, 11-02 | Recruiter can purchase PRO or ENTERPRISE plan via Stripe Checkout | ✗ PARTIAL | PRO Checkout is implemented. Enterprise is Contact sales only and checkout schema only accepts `pro`, so the requirement is not fully satisfied as written. |
| PAY-02 | 11-02, 11-03 | Recruiter can manage billing via Stripe Customer Portal | ✓ SATISFIED | Pricing PRO "Manage Plan" and Billing tab "Manage billing" both call `/api/stripe/portal`; portal route creates Stripe portal sessions. |
| PAY-03 | 11-01, 11-03 | Recruiter can view current plan, expiry date, and subscription status in Billing settings tab | ✓ SATISFIED | Billing tab reads DB-backed subscription status and renders plan name, status badge, renewal/expiry date, and cancel-at-period-end message. |
| PAY-04 | 11-02 | Stripe webhooks automatically sync subscription status to `User.plan` field | ✓ SATISFIED | Checkout and subscription update set plan from Stripe price; deleted downgrades to Free; payment failed marks subscription Past Due without downgrade per phase context. |

No orphaned Phase 11 requirement IDs were found in `.planning/REQUIREMENTS.md`; PAY-01 through PAY-04 are all claimed by phase plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/constants/pricing.ts` | 79 | Enterprise `Contact sales` CTA instead of checkout | 🛑 Blocker | Blocks PAY-01/roadmap wording for Enterprise purchase via Stripe Checkout. |
| `src/lib/validations/checkout.schema.ts` | 4 | Checkout schema accepts only `pro` | 🛑 Blocker | Confirms Enterprise cannot enter checkout API. |

No blocker placeholder/TODO stubs were found in the implemented PRO, portal, webhook, billing-tab, or delete-account paths. Console logging in webhook/error paths is operational logging, not a stub.

### Human Verification Required

### 1. Live PRO Checkout Purchase

**Test:** As a recruiter on Free, click the PRO CTA, complete Stripe Checkout with configured test prices, return to `/pricing/success`, and open settings Billing.
**Expected:** Success page confirms PRO, session refreshes, Billing tab shows PRO with Active status and period end date.
**Why human:** Requires Stripe Dashboard products/prices, a reachable webhook endpoint, and hosted Stripe redirect/payment flow.

### 2. Live Customer Portal Management

**Test:** As a PRO recruiter, click "Manage billing" from Billing settings and cancel or update payment method in Stripe Portal.
**Expected:** Browser opens Stripe Portal; cancellation/update emits webhook and local billing status reflects the change.
**Why human:** Requires real Stripe Customer Portal configuration and webhook delivery.

### Gaps Summary

The implementation is substantive for the PRO subscription flow: pricing, checkout, success polling, webhook database sync, portal management, billing tab, and delete-account cancellation are all wired to real APIs/data sources. The remaining blocker is a contract mismatch: phase plans intentionally made Enterprise contact-sales only, but `.planning/REQUIREMENTS.md` and the Phase 11 roadmap success criterion still require Enterprise purchase via Stripe Checkout. Until that requirement is either implemented or amended, Phase 11 cannot be marked passed.

---

_Verified: 2026-04-17T05:19:38Z_
_Verifier: Claude (gsd-verifier)_
