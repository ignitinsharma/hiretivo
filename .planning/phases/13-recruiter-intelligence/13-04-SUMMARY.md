---
phase: 13-recruiter-intelligence
plan: "04"
subsystem: billing-boost
status: partial
tags: [boost, billing, dodopayments, seeker-feed, recruiter-intelligence]
dependency_graph:
  requires: [13-01, 13-02]
  provides: [boost-checkout-api, boost-webhook-handler, seeker-feed-pinning, boost-job-ui]
  affects: [src/app/api/billing, src/app/api/seeker/feed, src/modules/recruiter/jobs]
tech_stack:
  added: []
  patterns:
    - DodoPayments one-time payment (payments.create with product_cart)
    - Upsert-idempotent webhook handler for payment.succeeded
    - Seeker feed boost pinning before cursor pagination
    - Server Component boost status query + Client Component CTA
key_files:
  created:
    - src/lib/validations/boost-checkout.schema.ts
    - src/constants/boost.ts
    - src/app/api/billing/boost-checkout/route.ts
    - src/modules/recruiter/jobs/components/BoostJobButton.tsx
    - src/modules/recruiter/jobs/components/BoostSuccessNotifier.tsx
  modified:
    - src/app/api/billing/webhook/route.ts
    - src/app/api/seeker/feed/route.ts
    - src/app/recruiter/jobs/[id]/page.tsx
decisions:
  - "Return 404 (not 403) for unowned job boost attempts — prevents leaking job existence to other recruiters (T-13-16)"
  - "Use upsert for BoostedJob to make webhook idempotent — replay-safe (T-13-14)"
  - "Boost pinning inserted before cursor pagination so pinned jobs always lead the first page regardless of match score order"
  - "BoostSuccessNotifier is a separate client file from the server page component — required by Next.js for useSearchParams in server pages"
metrics:
  duration: ~25 minutes
  completed_date: "2026-04-19"
  tasks_completed: 2
  tasks_total: 3
  files_created: 5
  files_modified: 3
---

# Phase 13 Plan 04: Boost Job Payment Flow Summary

**One-liner:** DodoPayments one-time boost checkout with webhook activation, seeker feed pinning, and BoostJobButton UI on the recruiter job detail page.

## Status: PARTIAL — Awaiting human-verify checkpoint

Tasks 1 and 2 are complete and committed. The checkpoint task (task 3: human-verify of the full Phase 13 recruiter intelligence stack) requires manual browser verification before this plan can be marked fully complete.

## What Was Built

### Task 1: Boost checkout API, webhook extension, seeker feed boost pinning

**`POST /api/billing/boost-checkout`** — New DodoPayments one-time payment endpoint:
- Auth + RECRUITER role check
- Rate limited to 5 requests/min per recruiter (T-13-18)
- Zod validates `{ jobId }` request body
- Ownership check via `prisma.job.findFirst({ recruiterId: session.user.id })` — returns 404 for unowned jobs (T-13-13, T-13-16)
- Creates DodoPayments payment with `product_cart`, `payment_link: true`, and boost metadata
- Returns `{ data: { url } }` pointing to hosted checkout page

**Webhook extension (`src/app/api/billing/webhook/route.ts`):**
- Added `PaymentSucceededWebhookEvent` to the event union type
- Added `handleBoostPaymentSucceeded` function — upserts BoostedJob with `expiresAt = now + 7 days`
- Idempotent by design: same payment replayed just resets expiresAt to same value (T-13-14)
- New `payment.succeeded` switch case delegates to handler only when `metadata.type === 'boost'`

**Seeker feed boost pinning (`src/app/api/seeker/feed/route.ts`):**
- Inserts boost pinning logic after `filteredMatches` is computed, before cursor pagination
- Queries `prisma.boostedJob.findMany` filtered by `jobId in filteredJobIds` and `expiresAt > now`
- Partitions matches into boostedMatches + regularMatches, then reassembles with boosted first
- Expired boosts (`expiresAt <= now`) are excluded by the `{ gt: now }` filter (T-13-17)

### Task 2: BoostJobButton component and per-job page integration

**`BoostJobButton.tsx`** — Client component:
- Props: `jobId`, `isAlreadyBoosted`, `boostExpiresAt` (all typed)
- Active boost state: green badge with expiry date + disabled "Extend Boost" button
- Inactive state: card with BOOST_FEATURES array (typed `as const`), "Boost for $9" button
- On click: POST to `/api/billing/boost-checkout`, redirect to `data.url` via `window.location.href`
- Error: `toast.error` with specific message, resets loading state

**`BoostSuccessNotifier.tsx`** — Separate client component:
- Uses `useSearchParams` to detect `?boost=success` on return from DodoPayments
- Fires `toast.success` once on mount when param is present
- Kept separate from the server page component as required by Next.js

**`/recruiter/jobs/[id]/page.tsx` updates:**
- Added `prisma.boostedJob.findUnique` query after job ownership check
- Computes `isAlreadyBoosted` (boolean) and `boostExpiresAt` (ISO string or null)
- Overview tab content replaced: placeholder `<p>` swapped for `<BoostJobButton>`
- `<BoostSuccessNotifier>` rendered inside `<Suspense fallback={null}>` at top of page JSX

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 0ee14eb | feat(13-04): boost checkout API, webhook extension, and seeker feed boost pinning |
| 2 | 78f57d2 | feat(13-04): BoostJobButton component and per-job page integration |

## Known Stubs

None — all code paths are wired to real data sources and live API calls.

## Threat Flags

All STRIDE mitigations from the plan's threat model have been implemented:

| Threat ID | Mitigation | Commit |
|-----------|-----------|--------|
| T-13-13 | `prisma.job.findFirst({ recruiterId: session.user.id })` ownership check | 0ee14eb |
| T-13-14 | `prisma.boostedJob.upsert` is idempotent | 0ee14eb |
| T-13-15 | Existing `dodo.webhooks.unwrap()` HMAC verification | (pre-existing) |
| T-13-16 | 404 for unowned jobs (not 403) | 0ee14eb |
| T-13-17 | `expiresAt: { gt: now }` filter in feed query | 0ee14eb |
| T-13-18 | Rate limiter: 5 boost attempts/min | 0ee14eb |

## Self-Check: PASSED

Files verified:
- `src/lib/validations/boost-checkout.schema.ts` — FOUND
- `src/constants/boost.ts` — FOUND
- `src/app/api/billing/boost-checkout/route.ts` — FOUND
- `src/app/api/billing/webhook/route.ts` — modified, contains `payment.succeeded` and `handleBoostPaymentSucceeded`
- `src/app/api/seeker/feed/route.ts` — modified, contains `prisma.boostedJob.findMany`
- `src/modules/recruiter/jobs/components/BoostJobButton.tsx` — FOUND
- `src/modules/recruiter/jobs/components/BoostSuccessNotifier.tsx` — FOUND
- `src/app/recruiter/jobs/[id]/page.tsx` — modified, contains `BoostJobButton` and `boostedJob` query

Commits verified:
- 0ee14eb — FOUND
- 78f57d2 — FOUND
