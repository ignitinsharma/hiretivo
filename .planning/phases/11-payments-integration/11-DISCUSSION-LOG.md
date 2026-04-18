# Phase 11: Payments Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 11-payments-integration
**Areas discussed:** Plan tier alignment, Checkout flow & pricing page wiring, Billing tab UI & portal, Webhook & subscription model

---

## Plan tier alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Expand PlanTier to 5 values | Add STARTER, GROWTH to PlanTier. 1:1 mapping with pricing page. | |
| Keep 3, merge Starter+Growth→PRO | Starter and Growth both map to PRO in DB. | ✓ |
| Keep 3, add priceId field | PlanTier stays FREE/PRO/ENTERPRISE, add stripePriceId to User. | |

**User's choice:** Keep 3, merge Starter+Growth→PRO
**Notes:** Simpler enum, fewer Stripe products to manage. Feature limits distinguished via stripePriceId on Subscription model.

### PRO feature set

| Option | Description | Selected |
|--------|-------------|----------|
| Growth feature set | 8 job posts, AI ranking, interview scheduling, ATS, unlimited resume DB, priority support, 3 team seats | ✓ |
| Between Growth + Pro features | ~15 job posts, AI ranking + scoring, full ATS, analytics, API access, 5 seats | |
| Starter + Growth merged | 5 job posts, AI matching, candidate contact, resume search, basic analytics | |

**User's choice:** Growth feature set

### Enterprise handling

| Option | Description | Selected |
|--------|-------------|----------|
| Contact sales only | Manual setup via Stripe Dashboard, no self-serve checkout | |
| Stripe Checkout with custom amount | Dynamic price passed to checkout | |
| Skip Enterprise for now | "Coming soon" on Enterprise, only implement Free/PRO checkout | ✓ |

**User's choice:** Skip Enterprise for now — shows price range + contact sales button

### Feature limit granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe price ID on Subscription | Feature limits checked against stripePriceId. PlanTier for coarse access. | ✓ |
| Add sub-tier field to User | User.planSubTier (STARTER/GROWTH). Another enum. | |
| Feature limits from Stripe metadata | Fetch from Stripe on demand. Latency + dependency. | |

**User's choice:** Stripe price ID on Subscription

---

## Checkout flow & pricing page wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to Stripe Checkout | Click → API creates session → redirect to Stripe → pay → redirect back | ✓ |
| Login-first if not authenticated | Show LoginModal before checkout | |
| Both (auth gate + redirect) | Unauthenticated → LoginModal; seeker → "for recruiters"; recruiter → checkout | ✓ |

**User's choice:** Redirect to Stripe Checkout (with auth gate for non-logged-in / non-recruiters)

### Currency handling

| Option | Description | Selected |
|--------|-------------|----------|
| Separate Stripe prices per currency | 4 prices for PRO (monthly-USD, monthly-INR, annual-USD, annual-INR) | ✓ |
| USD only on Stripe | Simpler but confusing UX for INR users | |
| Let user pick currency | Unnecessary complexity for 2 currencies | |

**User's choice:** Separate Stripe prices per currency

### Billing cycle

| Option | Description | Selected |
|--------|-------------|----------|
| Pass period to API | Client sends {planId, period, currency}. API picks price ID. | ✓ |
| Two buttons per tier | Separate Monthly/Annual CTAs per card | |

**User's choice:** Pass period to API

### Already-subscribed recruiter

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to billing portal | "Manage Plan" button opens Stripe Customer Portal | ✓ |
| Show "You're already on PRO" | Button disabled, user goes to Billing tab | |
| Allow upgrade path later | For now portal redirect, future prorated upgrades | |

**User's choice:** Redirect to billing portal

---

## Billing tab UI & portal

| Option | Description | Selected |
|--------|-------------|----------|
| Plan card + portal link | Current plan name, status badge, renewal date, "Manage billing" button | ✓ |
| Full billing dashboard | Plan card + payment method + invoice history + portal link | |
| You decide | Keep simple — plan card + portal link | |

**User's choice:** Plan card + portal link

### Portal capabilities

| Option | Description | Selected |
|--------|-------------|----------|
| Cancel + update payment | Allow cancel and update payment method only | ✓ |
| Full portal features | Cancel, update, switch monthly/annual, view invoices | |
| Cancel only | Too limited | |

**User's choice:** Cancel + update payment

### Cancel behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Downgrade to FREE at period end | cancel_at_period_end = true, webhook sets plan to FREE | ✓ |
| Immediate cancellation | Harsh UX, not recommended | |
| Grace period | Extra complexity for minimal benefit | |

**User's choice:** Downgrade to FREE at period end

---

## Webhook & subscription model

### Subscription fields

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: Stripe refs + status + dates | stripeSubscriptionId, stripePriceId, status, period dates, cancelAtPeriodEnd | ✓ |
| Full: include plan details | All above + planId, interval, amount, currency | |

**User's choice:** Minimal fields

### Webhook events

| Option | Description | Selected |
|--------|-------------|----------|
| Essential 4 | checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed | ✓ |
| Essential + trial | Add trial_will_end — premature for v1.1 | |
| You decide | Pick what's needed for lifecycle | |

**User's choice:** Essential 4 events

### Race condition (redirect vs webhook)

| Option | Description | Selected |
|--------|-------------|----------|
| Poll with retry | Success page polls every 2s for up to 10s | ✓ |
| Optimistic update on redirect | Set plan to PRO immediately from checkout data | |
| Just wait for webhook | Could take 30s+, poor UX | |

**User's choice:** Poll with retry

### Session sync

| Option | Description | Selected |
|--------|-------------|----------|
| Force session refresh on next request | Billing success page calls update() from next-auth | ✓ |
| Invalidate session + redirect to login | Harsh, forces re-login | |

**User's choice:** Force session refresh via next-auth update()

---

## Claude's Discretion

- Exact PRO pricing (research market and decide)
- Enterprise "starting at" price range
- PRICING_CONFIG rewrite details
- Billing tab layout and styling specifics
- Success page copy and loading state design
- Webhook error handling and retry logic
- Whether to add a free trial period

## Deferred Ideas

- Enterprise self-serve checkout — v2
- Plan switching / proration in Customer Portal — v2
- Free trial period — not discussed
- 5-tier pricing page — replaced by 3-tier
