# Hiretivo

## What This Is

Hiretivo is a skills-based remote job portal for remote hiring, closer to Instahyre than Naukri. Seekers build skill-rich profiles and apply to matching jobs; recruiters post remote roles, review applicants, search paid talent pools, and manage interviews.

## Core Value

Recruiters and seekers must reliably connect through skills-first matching, with paid recruiter features gated clearly and profile data kept accurate.

## Requirements

### Validated

- ✓ Foundation stack selected: Next.js App Router, TypeScript strict, pnpm, shadcn/ui, Tailwind, Prisma, Auth.js v5, R2, Upstash Redis, Resend, Vercel.

### Active

- [ ] Recruiters on paid plans can search, view, and contact talent from a talent pool.
- [ ] Recruiters on paid plans can schedule interviews from Hiretivo.
- [ ] External job applications can be confirmed by seekers and counted in recruiter dashboards.
- [ ] Free-plan recruiters see lock affordances and an upgrade modal before using paid features.
- [ ] Seekers can save jobs, apply later, and manage saved jobs.
- [ ] Seekers can update onboarding profile fields, skills, resume, avatar, and password from settings.
- [ ] Recruiters can update company and recruiter profile data from settings.
- [ ] Avatar upload works for seekers and recruiters, with deterministic initials fallback.

### Out of Scope

- Payment provider replacement — existing billing APIs should be extended, not replaced.
- In-app notifications — recruiter notification icon should be hidden until a notification flow exists.
- Free seeker upgrade flow — seeker billing/upgrade surfaces should be removed for now.

## Context

- Existing code already includes recruiter dashboard, applications, jobs, settings APIs, seeker dashboard/settings, billing checkout/status APIs, R2/Redis/Resend libs, and Prisma models for users, profiles, applications, interviews, jobs, clicks, and boosted jobs.
- Current planning was recovered from root `PROGRESS.md` because `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` were missing.
- User specifically requested paid recruiter feature gates, talent pool, interview scheduling, external apply confirmation, seeker saved jobs/settings, reset/update password, resume/avatar upload, account removal cleanup, recruiter settings, and recruiter layout cleanup.

## Constraints

- **Stack**: Follow `CLAUDE.md` exactly: Next.js 14+ App Router, TypeScript strict, pnpm, shadcn/ui, TailwindCSS, Zustand, TanStack Query, React Hook Form, Zod, Prisma, R2, Upstash, Resend.
- **Design**: Follow `DESIGN.md` exactly: primary indigo `#5952e5`, Inter, shadcn dialogs, no invented colors/patterns.
- **Paid Gates**: Talent pool and interview scheduling are recruiter paid features for `PRO` and `ENTERPRISE`; `FREE` sees locks and upgrade modal.
- **Security**: Protected API routes must validate auth, role, plan tier where relevant, Zod body, and rate limits for sensitive mutations/uploads.
- **Schema**: Prisma schema changes require migration and `pnpm db:generate`; live DB push may require manual Neon connectivity.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build new requested scope as Phase 8 | Existing root progress already names phases 0-7; new work spans multiple prior areas and needs one coordinated paid/account completion phase. | Pending |
| Use shared paid-feature gate modal | Talent pool and interview scheduling need the same lock/upgrade behavior across recruiter pages. | Pending |
| Remove seeker billing/upgrade UI | User explicitly said seeker should not have upgrade plan flow right now. | Pending |

---
*Last updated: 2026-05-27*

## Completed Milestones

- **Phase 10** (2026-05-16): Talent pool public profiles, 4-tier pricing, homepage rebuild.
- **Phase 11** (2026-05-17): Weighted job match formula, VERIFIED-only apply gate, job-match notification cron, seeker dashboard recruiter invites tab.
- **Phase 12** (2026-05-17): AI GitHub scan (Claude Haiku via OpenRouter) for admin review, employer feedback form at /feedback/[token], FeedbackRequest cron for HIRED+90d apps, Hiretivo Score auto-recalc, recruiter pipeline kanban.
- **Phase 13** (2026-05-26): Real-time seeking-status signal — SeekingStatus enum, engineer toggle, recruiter filter+dots, public profile pill.
- **Phase 14** (2026-05-27): Recruiter analytics dashboard — hiring funnel (6 stages, conversion %), credits used vs quota, top 5 skills. FREE plan gated with locked overlay; analytics API with parallel Prisma aggregation, rate-limit, cross-recruiter isolation.
