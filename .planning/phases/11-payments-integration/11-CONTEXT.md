# Phase 11: Payments Integration - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Recruiters can purchase and manage subscription plans through Stripe, with billing lifecycle fully synced to the database. Includes: Stripe Checkout integration, webhook handlers for subscription lifecycle, Stripe Customer Portal for self-serve billing management, and real billing tab UI replacing the "Coming soon." placeholder.

Requirements: PAY-01, PAY-02, PAY-03, PAY-04

</domain>

<decisions>
## Implementation Decisions

### Plan tier alignment (3 plans, not 5)
- **D-01:** Reduce pricing page from 5 tiers to 3: Free, PRO, Enterprise (contact sales). Remove Starter, Growth, and Pro as separate tiers entirely. This aligns the pricing page 1:1 with the PlanTier enum (FREE/PRO/ENTERPRISE).
- **D-02:** PRO plan uses the Growth feature set: 8 job posts, AI ranking, interview scheduling, ATS, unlimited resume DB, priority support, 3 team seats.
- **D-03:** Enterprise card shows price range (e.g., "Starting at $299/mo") + contact sales button. No self-serve Stripe Checkout for Enterprise in v1.1.
- **D-04:** PRO pricing — researcher/planner should research market-competitive pricing for SaaS hiring platforms. Use Growth pricing as starting point ($149/mo USD, $95/mo annual USD; ₹11999/mo INR, ₹7499/mo annual INR) and adjust based on market research.
- **D-05:** Feature-gated limits (e.g., job post count) are checked against stripePriceId on the Subscription model, not PlanTier. PlanTier controls coarse access (PRO vs FREE features), stripePriceId controls granular limits. This allows future sub-tier differentiation without PlanTier changes.

### Checkout flow & pricing page wiring
- **D-06:** Stripe Checkout redirect flow — click CTA → API creates Checkout Session → redirect to Stripe hosted page → pay → redirect back to app with success_url. No embedded payment forms.
- **D-07:** Create separate Stripe prices per currency: 4 prices for PRO (monthly-USD, monthly-INR, annual-USD, annual-INR). API selects correct price ID based on user's detected currency + selected billing period.
- **D-08:** Client sends `{ planId: 'pro', period: 'monthly'|'annual', currency: 'USD'|'INR' }` to checkout API. API maps to correct Stripe price ID and creates Checkout Session.
- **D-09:** If recruiter already has active PRO subscription, pricing page button changes to "Manage Plan" → opens Stripe Customer Portal (not duplicate checkout).
- **D-10:** Auth gate: unauthenticated users → LoginModal (not redirect, per CLAUDE.md pattern). Authenticated seekers see "This plan is for recruiters" message. Only recruiters proceed to Stripe Checkout.
- **D-11:** Pricing page must be rebuilt to show 3 cards instead of 5. Reuse existing PricingClient component structure, update PRICING_CONFIG in constants/pricing.ts.

### Billing tab UI & portal
- **D-12:** Replace "Coming soon." with plan card showing: current plan name, status badge (Active/Past Due/Canceled), renewal/period end date, and "Manage billing" button that opens Stripe Customer Portal.
- **D-13:** Stripe Customer Portal allows: cancel subscription + update payment method. No plan switching or proration in v1.1 — can be added later via Stripe portal config.
- **D-14:** Cancel behavior: cancel_at_period_end = true (standard SaaS). Recruiter keeps PRO features until period end. Webhook (`customer.subscription.deleted`) sets plan back to FREE.
- **D-15:** FREE plan users on billing tab see: "You're on the Free plan" card + "Upgrade to PRO" CTA that goes to pricing page or opens checkout directly.

### Webhook & subscription model
- **D-16:** New `Subscription` model with minimal fields: stripeSubscriptionId (String @unique), stripePriceId (String), status (SubStatus enum: ACTIVE/PAST_DUE/CANCELED), currentPeriodStart (DateTime), currentPeriodEnd (DateTime), cancelAtPeriodEnd (Boolean @default(false)), userId (String, relation to User). Everything else comes from Stripe API on demand.
- **D-17:** Handle 4 Stripe webhook events: `checkout.session.completed` (new sub), `customer.subscription.updated` (renewal/plan change), `customer.subscription.deleted` (cancel/expiry), `invoice.payment_failed` (past due).
- **D-18:** Race condition: after Stripe Checkout redirect, success page polls subscription status every 2s for up to 10s. If webhook arrives first, immediate update. Otherwise brief loading then shows PRO.
- **D-19:** Session sync: billing success page calls `update()` from next-auth to refresh the JWT session with new plan value. Auth.js v5 JWT callback reads User.plan from DB on token refresh, so this forces a fresh read.
- **D-20:** Webhook handler updates User.plan AND Subscription record atomically in a Prisma transaction. Map stripePriceId to PlanTier via a constant lookup (e.g., STRIPE_PRICE_TO_PLAN in constants).
- **D-21:** Webhook endpoint at `/api/stripe/webhook` with Stripe signature verification (STRIPE_WEBHOOK_SECRET env var). Raw body parsing required (disable Next.js body parser).

### Delete account integration
- **D-22:** Complete the TODO in `/api/auth/delete-account/route.ts` — when `stripeCustomerId` exists, call Stripe API to cancel subscription before soft-deleting user. Use `stripe.subscriptions.cancel()` with `prorate: true`.

### Claude's Discretion
- Exact PRO pricing (research market and decide)
- Enterprise "starting at" price range
- PRICING_CONFIG rewrite details (3-tier structure)
- Billing tab layout and styling specifics
- Success page copy and loading state design
- Webhook error handling and retry logic
- Whether to add a free trial period (not discussed — decide based on market research)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — PAY-01 through PAY-04 acceptance criteria
- `.planning/ROADMAP.md` §Phase 11 — Goal, success criteria, depends on Phase 10

### Existing Pricing Page (modify)
- `src/app/(public)/pricing/pricing-client.tsx` — Current 5-tier pricing UI; must be rebuilt for 3 tiers
- `src/app/(public)/pricing/page.tsx` — Server Component with CF-IPCountry geo detection
- `src/constants/pricing.ts` — PRICING_CONFIG, PricingCurrency type, CURRENCY_SYMBOL; must be updated to 3 tiers

### Settings & Billing Tab (modify)
- `src/app/recruiter/settings/page.tsx` — Billing tab currently shows "Coming soon." placeholder
- `src/app/api/auth/delete-account/route.ts` — Has TODO for Stripe cancellation (line 34)

### Schema
- `prisma/schema.prisma` — User model (plan, stripeCustomerId fields already exist), PlanTier enum (FREE/PRO/ENTERPRISE)

### Auth & Session
- `src/auth.ts` — Auth.js v5 config, JWT callback where plan is set
- `src/types/next-auth.d.ts` — Session type augmentation (user.plan: PlanTier)

### Enums & Constants
- `src/constants/enums.ts` — PlanTier enum (FREE/PRO/ENTERPRISE), UserRole
- `src/constants/pricing.ts` — Current pricing configuration (5 tiers)

### Prior Phase Context
- `.planning/phases/05-homepage-pricing-nav/05-CONTEXT.md` — Pricing page geo-detection, currency handling, PricingClient component
- `.planning/phases/08-bug-fixes-schema-foundation-cleanup/8-CONTEXT.md` — Schema migrations (stripeCustomerId added), Subscription model deferred to Phase 11
- `.planning/phases/10-settings-restructure-auth-guards/10-CONTEXT.md` — Billing tab placeholder, delete account route, settings tabs

### Project Constraints
- `.planning/PROJECT.md` — "Stripe Checkout redirect flow (no embedded payment forms)", "Billing for recruiters only (seekers use platform free)"
- `CLAUDE.md` §9 — API route rules (auth + role validation, Zod validation, consistent response shape, rate limiting)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/constants/pricing.ts` — PRICING_CONFIG structure and PricingCurrency type; needs rewrite for 3 tiers but the PricePoint interface and currency pattern are reusable
- `src/app/(public)/pricing/page.tsx` — Server Component with CF-IPCountry header reading for geo-pricing; stays as-is
- `src/lib/prisma.ts` — Prisma singleton for all DB operations
- `src/lib/redis.ts` — Upstash Redis client for rate limiting
- `src/lib/rate-limit.ts` — createRateLimiter helper; apply to checkout + webhook endpoints
- `src/auth.ts` — Auth.js v5 with JWT callback; User.plan is already set in session
- `src/store/use-ui-store.ts` — Zustand UI store for LoginModal open/close (auth gate on pricing page)

### Established Patterns
- API routes: auth check → role check → rate limit → Zod validate → action → return (see `/api/recruiter/settings/route.ts`)
- Client-side data fetching: TanStack Query useQuery + useMutation with toast feedback
- React Hook Form + zodResolver for all form validation
- shadcn/ui components (Button, Input, Skeleton, AlertDialog, Badge, Card)
- Enums from `@/constants/enums` — single source of truth, not from @prisma/client
- Geo-pricing: CF-IPCountry header in server component, pass currency prop to client component

### Integration Points
- Pricing page CTA buttons → new `/api/stripe/checkout` route → Stripe Checkout Session
- Stripe redirect back → `/pricing/success` page (new) → poll subscription status → refresh session
- Webhook endpoint → new `/api/stripe/webhook` route → update User.plan + Subscription records
- Billing tab "Manage billing" → new `/api/stripe/portal` route → Stripe Customer Portal Session
- Delete account route → Stripe cancel subscription API call (complete existing TODO)
- Auth.js JWT callback → must read User.plan from DB (already does, just needs refresh trigger)

### Key Observations
- PlanTier enum has FREE/PRO/ENTERPRISE — matches 3-plan decision perfectly, no enum migration needed
- User.stripeCustomerId already exists in schema from Phase 08 migration
- `pricing-client.tsx` has 5 hardcoded card sections — needs significant rewrite to 3 cards (follow CLAUDE.md §15: data arrays + .map())
- Current PRICING_CONFIG has 5 tiers (free/starter/growth/pro/enterprise) — needs rewrite to 3
- Delete account route already checks `stripeCustomerId` but has empty try/catch for Stripe cancellation
- Session already includes `user.plan` via JWT callback in auth.ts — just needs refresh after plan change

</code_context>

<specifics>
## Specific Ideas

- 3 pricing cards: Free (₹0/$0), PRO (with Growth feature set), Enterprise (price range + contact sales)
- PRO feature set = Growth's: 8 job posts, AI ranking, interview scheduling, ATS, unlimited resume DB, priority support, 3 team seats
- Feature limits checked against stripePriceId (granular), PlanTier for coarse access
- Stripe Customer Portal for cancel + update payment only (v1.1)
- Cancel at period end — standard SaaS pattern
- Poll-with-retry on checkout success page for race condition between redirect and webhook
- Refresh JWT session via next-auth `update()` after plan upgrade

</specifics>

<deferred>
## Deferred Ideas

- Enterprise self-serve checkout — v2 (manual setup via Stripe Dashboard for now)
- Plan switching / proration in Customer Portal — v2
- Free trial period — decide based on market research; not discussed
- Recurring invoice history in billing tab — Stripe Portal handles this
- Seeker billing — explicitly out of scope (seekers are free)
- 5-tier pricing page — replaced by 3-tier; if 5 tiers return in v2, need PlanTier expansion

</deferred>

---

*Phase: 11-payments-integration*
*Context gathered: 2026-04-16*
