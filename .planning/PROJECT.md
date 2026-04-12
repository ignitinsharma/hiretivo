# Hiretivo

## What This Is

Hiretivo (hiretivo.com) is a skills-based remote job portal where job seekers add their skills and a matching engine computes a `matchScore` per job — seekers only see matched jobs in their feed. There are two user types (SEEKER and RECRUITER) and four plan tiers (FREE, STARTER, GROWTH, ENTERPRISE) with features gated by plan. The UI is fully built; remaining work is entirely backend logic, API routes, data fetching, and state wiring.

## Core Value

Seekers see only the jobs they match — match score drives every surface, from feed ranking to per-skill breakdowns, creating a signal-rich experience that generic job boards can't offer.

## Current Milestone: v1.0 Full Hiretivo V1 Launch Build

**Goal:** Wire all backend logic, APIs, data fetching, and state management across all 7 phases to ship a fully functional V1 platform — all UI is pre-built and must not be modified.

**Target features:**
- Phase 1: Auth & Onboarding (signup, email verification, seeker wizard, recruiter onboarding, route guards, profile completeness)
- Phase 2: Job Posting (skill seed, CRUD APIs, plan gates)
- Phase 3: Matching Engine & Feed (matchScore algorithm, Redis cache, feed API, job detail, public listings)
- Phase 4: Applications & Recruiter Dashboard (apply flows, status pipeline, Resend notifications, blur gate)
- Phase 5: Homepage, Pricing & Nav (dynamic data, geo pricing INR/USD, nav auth state)
- Phase 6: Interview Scheduling (Google Calendar OAuth AES-256, availability API, Meet links, plan gates)
- Phase 7: Polish & Pre-Launch (errors, skeletons, toasts, SEO, rate limiting, cron, a11y)

## Critical Constraint

**DO NOT modify existing UI components.** All pages are built via Stitch. Only wire logic, API routes, data fetching, server actions, and state management. If a UI component needs data or event handlers — connect them, don't redesign them.

## Requirements

### Validated

- ✓ Next.js 14 App Router project scaffold with TypeScript strict mode — existing
- ✓ pnpm workspace with full dependency set installed — existing
- ✓ Prisma ORM configured with Neon PostgreSQL — existing
- ✓ Auth.js v5 (NextAuth) configured with Credentials + Google OAuth providers — existing
- ✓ Cloudflare R2 (S3-compatible) client configured — existing
- ✓ Upstash Redis client configured — existing
- ✓ Resend email client configured — existing
- ✓ shadcn/ui + Tailwind CSS + Radix UI component library — existing
- ✓ Zustand stores for UI state (ApplyJobModal, PostJobModal, SeekerOnboarding) — existing
- ✓ TanStack Query setup for server state caching — existing
- ✓ Zod validation schemas for auth, jobs, profiles, onboarding — existing
- ✓ Module-based feature architecture under `src/modules/` — existing
- ✓ All UI pages built (auth, onboarding, job feed, dashboards, pricing, scheduling) — existing
- ✓ Role-based layout hierarchy (seeker vs recruiter routes separated) — existing
- ✓ Phase 1 — Auth & Onboarding complete — validated in Phase 1
- ✓ Phase 2 — Job Posting complete — validated in Phase 2 (02-VERIFICATION.md)
- ✓ Phase 4 — Applications & Recruiter Dashboard complete — validated in Phase 4 (04-VERIFICATION.md)
- ✓ Phase 5 — Homepage, Pricing & Nav complete — validated in Phase 5 (05-VERIFICATION.md)
- ✓ Phase 6 — Interview Scheduling complete — validated in Phase 6 (06-VERIFICATION.md)

### Active

**Phase 1 — Auth & Onboarding:**
- [ ] Email + Google OAuth signup with role selection (SEEKER / RECRUITER)
- [ ] Email verification flow via Resend
- [ ] 5-step seeker wizard persisted to DB (Step 1: situation/experience level mandatory; Step 2: role/years/skills mandatory; Step 3: resume upload skippable; Step 4: job preferences skippable; Step 5: completion)
- [ ] Recruiter company onboarding (company name, size, website, description)
- [ ] Middleware route guards enforcing role-based access
- [ ] Profile completeness score computed from filled wizard fields

**Phase 2 — Job Posting:**
- [x] Seed 80+ skills across 6 categories to DB — Validated Phase 2
- [x] Job posting form wired (title, description rich text, skills multi-select, apply type internal/external, salary, location) — Validated Phase 2
- [x] Job CRUD API routes (create, read, update, delete, toggle active) — Validated Phase 2
- [x] My Jobs list for recruiters with status management — Validated Phase 2
- [x] FREE plan gate: 1 active job limit enforced server-side — Validated Phase 2

**Phase 3 — Matching Engine & Seeker Feed:**
- [ ] Core matching algorithm: `matchScore = (seeker skills ∩ job required skills) / job required skills × 100`
- [ ] Redis cache for match scores (15-min TTL, invalidate on skill/job change)
- [ ] Seeker feed: only matched jobs, sorted by score descending
- [ ] Job detail with per-skill match breakdown
- [ ] Public job listings with match scores locked (show upgrade/login prompt)
- [ ] LoginModal on unauthenticated apply attempt

**Phase 4 — Applications & Recruiter Dashboard:**
- [x] Internal apply flow with cover letter (text input) — Validated Phase 4
- [x] External apply click-through tracking with UTM parameters — Validated Phase 4
- [x] My Applications page for seekers with status timeline — Validated Phase 4
- [x] Recruiter dashboard: stats bar, candidate table, 480px side drawer — Validated Phase 4
- [x] 6-stage application status pipeline (applied → reviewing → interview → offer → hired → rejected) — Validated Phase 4
- [x] Email notifications via Resend on every status change — Validated Phase 4
- [x] FREE plan blur gate: applicants 21+ blurred in recruiter view — Validated Phase 4

**Phase 5 — Homepage, Public Pages & Pricing:**
- [x] Homepage sections wired with real data (job counts, seeker stats, featured jobs) — Validated Phase 5
- [x] Pricing page with Monthly/Annual toggle and geo-detection (INR for India, USD otherwise) — Validated Phase 5
- [x] 3 nav variants wired: public (unauthenticated), seeker, recruiter — Validated Phase 5
- [ ] SEO metadata for all public-facing pages

**Phase 6 — Interview Scheduling:**
- [x] Settings page with 4 tabs (profile, notifications, calendar, security) — Validated Phase 6
- [x] Schedule/reschedule/cancel interview with email notifications — Validated Phase 6
- [x] Plan gate for scheduling features (FREE plan disabled with tooltip) — Validated Phase 6
- [x] UpcomingInterviewsList dashboard widget wired to live data — Validated Phase 6
- [x] RecruiterProfile notification preferences (emailNotifications, applicationAlerts, interviewNotifications) — Validated Phase 6
- [ ] Google Calendar OAuth with encrypted token storage (deferred — calendar tab shows Coming Soon)

**Phase 7 — Polish & Pre-Launch:**
- [ ] Custom 404 and 500 error pages wired
- [ ] Loading skeletons on all async surfaces
- [ ] Sonner toasts wired for all user actions (success/error/info)
- [ ] SEO meta + Open Graph tags on all pages
- [ ] Rate limiting on all public API routes
- [ ] Daily cron job for stale job nudge emails (recruiters with jobs inactive > 30 days)
- [ ] Terms of Service and Privacy Policy placeholder pages
- [ ] Accessibility audit (keyboard nav, ARIA labels, color contrast)
- [ ] Performance optimization (image optimization, bundle analysis)

### Out of Scope

- Payment processing (Stripe/Razorpay) — V2; V1 plans manually set via DB `planType` field
- Admin UI for plan management — V1 plans set directly in DB; admin UI is V2
- Mobile native app — web-first, mobile later
- Real-time chat between seekers and recruiters — high complexity, not core to V1
- Video resume uploads — storage cost, deferred to V2
- AI-generated cover letters or job descriptions — deferred to V2
- Multi-language / i18n — deferred to V2

## Context

- **Brand color:** `#5c54e6` (primary throughout all UI)
- **Plan tiers:** FREE → STARTER → GROWTH → ENTERPRISE. Features gated per phase; plans stored as `planType` enum on user/recruiter record in DB. No payment processing in V1 — admin sets manually.
- **Wizard mandatory steps:** Steps 1 (situation + experience level) and 2 (role + years + skills) must be completed before entering the seeker feed. Steps 3 (resume), 4 (preferences), and 5 (completion screen) are skippable.
- **Matching formula:** `matchScore = (|seeker.skills ∩ job.requiredSkills|) / |job.requiredSkills| × 100` — integer 0–100. Cached in Redis with 15-min TTL per seeker×job pair. Cache invalidated when seeker updates skills or job updates required skills.
- **Apply types:** INTERNAL (cover letter captured in DB) vs EXTERNAL (redirect to external URL with UTM `?ref=hiretivo&utm_source=hiretivo&utm_medium=job_board`).
- **Application pipeline:** 6 stages — APPLIED → REVIEWING → INTERVIEW → OFFER → HIRED / REJECTED. Email sent via Resend at each transition.
- **Geo-pricing:** Detect country from `CF-IPCountry` header (Vercel edge) or IP geolocation. India → INR pricing; all others → USD.
- **Google Calendar:** OAuth tokens encrypted at rest (AES-256 via `CALENDAR_ENCRYPTION_KEY` env var) before storing in DB.
- **Skills seed:** 80+ skills across 6 categories (Engineering, Design, Marketing, Data, DevOps, Product). Skills are global shared entities — both seekers and jobs reference them.
- **Codebase pattern:** Each feature lives in `src/modules/<feature>/` with its own components, types, hooks. API routes in `src/app/api/`. Server actions in `src/lib/actions/` or co-located in modules.

## Constraints

- **UI Immutability:** All UI components are pre-built — never redesign, only connect. If a prop is missing from a component, add it; don't restructure the component tree.
- **Tech Stack:** Fixed — Next.js 14 App Router, TypeScript strict, Prisma + Neon PostgreSQL, Auth.js v5, Cloudflare R2, Upstash Redis, Resend, Vercel. No new infrastructure.
- **TypeScript:** Strict mode. No `any`. All API responses typed. Zod schemas for all inputs.
- **No Payments V1:** Plan tiers visible everywhere but Stripe/Razorpay integration is explicitly out of scope. Show upgrade prompts; no checkout flow.
- **Deployment:** Vercel — no Docker, no self-hosted infra.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| UI pre-built via Stitch, backend wired separately | Faster iteration; design is frozen | — Pending |
| Redis cache for match scores (15-min TTL) | Matching is O(n×m) — cache prevents re-computation on every page load | — Pending |
| Plans manually assigned in V1 (no Stripe) | Launch faster; validate plan tiers before building billing | — Pending |
| Auth.js v5 (beta) over stable v4 | App Router compatibility; v4 has edge runtime issues | — Pending |
| Neon PostgreSQL (serverless) | Scales to zero; Vercel-native; no connection pool management | — Pending |
| Google Calendar OAuth with encrypted tokens | Meet link creation requires full OAuth; security requirement for stored credentials | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after Phase 6 completion*
