# Hiretivo

## What This Is

A skills-based remote job portal where seekers find jobs matched to their skills and recruiters hire remote talent efficiently. Like Instahyre — skill matching drives everything. Two user types: Job Seekers and Recruiters.

## Core Value

Skill-based matching must work reliably — match score = (seeker skills intersection job required skills) / job required skills x 100. Everything else builds on this mechanic.

## Requirements

### Validated

<!-- Shipped and confirmed valuable (v1.0). -->

- Auth & onboarding (email/password, Google OAuth, role-based registration, recruiter onboarding wizard)
- Job posting (create, edit, manage jobs with skills tagging)
- Matching engine & feed (skill-based match scoring, seeker recommendations)
- Applications & recruiter dashboard (apply flow, applicant explorer, status tracking)
- Homepage, pricing page, and navigation
- Interview scheduling

### Active

<!-- Current scope — v1.1 milestone. -->

- [ ] Payment system for recruiter plan purchases
- [ ] Recruiter dashboard fixes (active jobs count, dynamic sidebar, skeletons)
- [ ] Recruiter settings restructure (Profile/Security/Billing only)
- [ ] Auth guards (homepage for non-logged-in only, redirect to dashboard)
- [ ] Seeker dashboard dynamic data (Profile Strength, Quick Stats, hide applied jobs)
- [ ] Seeker settings (profile update, change password, remove dead flows)
- [ ] Seeker engagement features (match explainer, digest email, skill gap tracker)
- [ ] Recruiter intelligence features (AI ranking, analytics, boost job)

### Validated in Phase 08

- Job unpublish/republish flow (JOB-01)
- Remove notifications globally (CLN-01)
- Bug fixes: onboarding redirect, resume NoSuchKey, drawer width (BUG-01, BUG-02, BUG-03)
- Dead feature cleanup: 2FA, export data removed (CLN-02)
- Prisma schema migrated for v1.1 (stripeCustomerId, digestEnabled, UNPUBLISHED status)

### Out of Scope

<!-- Explicit boundaries. -->

- Real-time chat — high complexity, not core to job matching
- Mobile app — web-first approach
- 2FA — deferred, not needed for v1.1
- Export data — removed from all flows
- Notification system (in-app or push) — removed entirely for now
- Talent Pool feature — deferred from recruiter flow

## Context

- Stack: Next.js 14+ App Router, TypeScript, Prisma, Neon PostgreSQL, Auth.js v5, shadcn/ui, TailwindCSS
- Payments: Need to integrate Stripe or similar for recruiter plan purchases
- Email: Resend already in stack — used for weekly match digest
- Storage: Cloudflare R2 for resume storage (NoSuchKey bug fixed in Phase 08 — signed URLs regenerated server-side with null safety)
- Hosting: Vercel
- v1.0 shipped all core flows — this milestone polishes and monetizes

## Constraints

- **Stack**: Must follow CLAUDE.md rules — no deviations from established stack
- **UI**: shadcn/ui components only, TailwindCSS, Lucide React icons
- **Quality**: DRY code per Section 15 of CLAUDE.md — data arrays + .map(), named className constants
- **Auth**: Auth.js v5 for all auth flows, role checks in middleware + API routes

## Current Milestone: v1.1 Platform Polish, Payments & Engagement

**Goal:** Fix dashboard bugs, make all UI dynamic with real data, add payment system for recruiters, restructure settings for both roles, add seeker/recruiter engagement features, and remove dead flows (notifications, 2FA, export data).

**Target features:**
- Payment integration for recruiter plans
- Recruiter dashboard/sidebar fixes + dynamic data
- Settings restructure (both roles)
- Job unpublish/republish + auth guards
- Seeker engagement (match explainer, digest email, skill gap tracker)
- Recruiter intelligence (AI ranking, analytics, boost job)
- Bug fixes (onboarding, resume viewer, drawer size)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Skill-based matching as core mechanic | Differentiates from generic job boards | Good |
| Remove notifications entirely | Not needed for v1.1, reduces scope | Done — Phase 08 |
| Unpublish instead of archive naming | More intuitive for job status (Active/Unpublished/Deleted) | Done — Phase 08 |
| Boost Job respects matching | Pinned jobs only shown to skill-matched seekers | Pending |
| Billing for recruiters only | Seekers use platform free, recruiters pay for plans | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after Phase 08 completion*
