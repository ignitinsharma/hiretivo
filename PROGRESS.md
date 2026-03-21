# Hiretivo — Build Progress
Last updated: 2026-03-21  |  Current: Phase 1 — Auth & Onboarding

## Phase 0 — Setup     [x] Done
- [x] Next.js project created
- [x] All packages installed
- [x] Prisma schema + migration (SQL in `prisma/migrations`; apply with real `DATABASE_URL`)
- [x] Auth.js v5 configured
- [x] R2 client working
- [x] Redis client working
- [x] Resend working

## Phase 1 — Auth & Onboarding     [ ]
- [ ] Signup page + API
- [ ] Signin page
- [ ] Email verification
- [ ] Seeker onboarding (5 steps)
- [ ] Recruiter onboarding
- [ ] Middleware
- [ ] Profile completeness

## Phase 2 — Job Posting     [ ]
- [ ] Skills seeded (80+)
- [ ] Post a Job form
- [ ] Job API (create/edit/delete/status)
- [ ] My Jobs list page
- [ ] Free plan gate

## Phase 3 — Matching + Feed     [ ]
- [ ] computeMatchForSeeker
- [ ] computeMatchForJob
- [ ] Redis cache
- [ ] Feed API + page
- [ ] Job detail (seeker)
- [ ] Public job listings
- [ ] LoginModal

## Phase 4 — Applications + Dashboard     [ ]
- [ ] Apply modal (internal)
- [ ] Click tracking (external)
- [ ] My Applications page
- [ ] Recruiter dashboard (stats+list+drawer)
- [ ] Status pipeline
- [ ] Email notifications

## Phase 5 — Public Pages + Pricing     [ ]
- [ ] Homepage
- [ ] Pricing page (USD+INR)
- [ ] PublicNav, SeekerNav, RecruiterNav

## Phase 6 — Interview Scheduling     [ ]
- [ ] Google Calendar OAuth
- [ ] Settings page
- [ ] Slot picker
- [ ] Create interview + Meet
- [ ] Reschedule + Cancel
- [ ] Coming Soon calendar page

## Phase 7 — Polish     [ ]
- [ ] 404 + 500 pages
- [ ] Loading skeletons
- [ ] Sonner toasts
- [ ] SEO meta tags
- [ ] Rate limiting
- [ ] Cron job
- [ ] Accessibility pass

## Blockers
- `pnpm prisma migrate dev` needs a reachable Postgres (`DATABASE_URL`). Initial migration SQL is committed; run `pnpm prisma migrate deploy` (or `migrate dev`) once Neon is wired.

## Decisions
- Prisma ORM v7: DB URL in `prisma.config.ts`; runtime client uses `@prisma/adapter-pg` + connection string.
- ESLint pinned to 8.x + `eslint-config-next@14.2.35` to match Next 14 (`next lint` + ESLint 10 were incompatible).