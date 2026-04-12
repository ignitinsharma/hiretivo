# Roadmap: Hiretivo

## Overview

Seven phases wire all backend logic, APIs, data fetching, and state management for a fully functional V1 platform. All UI is pre-built via Stitch and must not be touched — every phase is purely backend/logic wiring. The phases follow a natural dependency chain: users must exist before jobs, jobs must exist before matching, matching must exist before applications, and scheduling sits on top of a working application pipeline. Polish runs last when all surfaces are stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Auth & Onboarding** - Wire authentication, email verification, seeker wizard, recruiter onboarding, and route guards (completed 2026-04-02)
- [ ] **Phase 2: Job Posting** - Seed skills DB, wire job CRUD APIs, and enforce FREE plan gate
- [ ] **Phase 3: Matching Engine & Feed** - Implement matchScore algorithm, Redis cache, seeker feed, and public listings
- [ ] **Phase 4: Applications & Recruiter Dashboard** - Wire apply flows, application pipeline, Resend notifications, and blur gate
- [ ] **Phase 5: Homepage, Pricing & Nav** - Connect real data to homepage, wire geo pricing, and auth-aware nav
- [ ] **Phase 6: Interview Scheduling** - Google Calendar OAuth, availability API, Meet link creation, and plan gates
- [ ] **Phase 7: Polish & Pre-Launch** - Error pages, skeletons, toasts, SEO, rate limiting, cron job, and a11y

## Phase Details

### Phase 1: Auth & Onboarding
**Goal**: Users can create accounts, verify email, complete role-specific onboarding, and be routed to the correct experience
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09
**Success Criteria** (what must be TRUE):
  1. A new user can sign up with email/password or Google OAuth and choose SEEKER or RECRUITER role
  2. After signup, the user receives a verification email and can click the link to verify their account
  3. A seeker who completes wizard Steps 1 and 2 can access the job feed; skipping Steps 3-5 is permitted
  4. A recruiter who completes company onboarding can access the recruiter dashboard
  5. Accessing a seeker route as a recruiter (or vice versa) is blocked by middleware and redirected
**Plans**: 7 plans
Plans:
- [ ] 01-PLAN-01.md — Prisma schema migration (SeekerProfile + RecruiterProfile new fields)
- [ ] 01-PLAN-02.md — POST /api/auth/register route + wire register pages
- [ ] 01-PLAN-03.md — Email verification API + Resend integration
- [ ] 01-PLAN-04.md — Seeker wizard server actions (steps 1–4) + wire Steps 1 & 2
- [ ] 01-PLAN-05.md — Recruiter onboarding server action + wire StepCompanyProfile
- [ ] 01-PLAN-06.md — Google OAuth role-selection page + Auth.js signIn callback
- [ ] 01-PLAN-07.md — middleware.ts with auth + role + onboarding guards
**UI hint**: yes

### Phase 2: Job Posting
**Goal**: Recruiters can create, manage, and gate job postings against their plan tier, with skills available for selection
**Depends on**: Phase 1
**Requirements**: JOBS-01, JOBS-02, JOBS-03, JOBS-04, JOBS-05, JOBS-06, JOBS-07
**Success Criteria** (what must be TRUE):
  1. The skills multi-select on the job form is populated with 80+ skills across 7 categories from the DB (Engineering, Design, Marketing, Data, DevOps, Product, Other)
  2. A recruiter can create a job posting with all fields (title, rich text description, skills, apply type, salary, location) and it persists to DB
  3. A recruiter can edit, delete, and toggle active/inactive on any of their own job postings via My Jobs
  4. A FREE plan recruiter who already has 1 active job receives a server-side error when attempting to post a second active job
**Plans**: TBD

### Phase 3: Matching Engine & Feed
**Goal**: Seekers see a personalized feed of matched jobs ranked by score, with per-skill breakdowns and public listings teasing locked scores
**Depends on**: Phase 2
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07, MATCH-08
**Success Criteria** (what must be TRUE):
  1. A seeker's feed shows only jobs where matchScore > 0, sorted highest score first, with scores computed by the formula (|seeker.skills ∩ job.requiredSkills|) / |job.requiredSkills| × 100
  2. Match scores are served from Redis on repeat page loads within 15 minutes; cache is invalidated when seeker updates skills or a job updates its required skills
  3. The job detail page shows a per-skill breakdown indicating which of the seeker's skills match the job's required skills
  4. An unauthenticated visitor viewing a public job listing sees match scores as locked with a login/upgrade prompt
  5. An unauthenticated user who attempts to apply sees the LoginModal instead of the apply flow
**Plans**: TBD
**UI hint**: yes

### Phase 4: Applications & Recruiter Dashboard
**Goal**: Seekers can apply to jobs and track status; recruiters can manage candidates through a 6-stage pipeline with email notifications
**Depends on**: Phase 3
**Requirements**: APPL-01, APPL-02, APPL-03, APPL-04, APPL-05, APPL-06, APPL-07, APPL-08
**Success Criteria** (what must be TRUE):
  1. A seeker can submit an internal application with a cover letter, and the application is saved to DB with status APPLIED
  2. A seeker clicking an external apply link is redirected to the external URL with UTM parameters appended
  3. A seeker's My Applications page shows all their applications with the current stage displayed in a status timeline
  4. A recruiter's dashboard shows the stats bar, candidate table, and opens a 480px side drawer on candidate click
  5. A recruiter can advance an application through all 6 stages; a Resend email is sent to the seeker at each stage transition
  6. A FREE plan recruiter sees applicants beyond position 20 blurred in their candidate view
**Plans**: TBD
**UI hint**: yes

### Phase 5: Homepage, Pricing & Nav
**Goal**: Public-facing pages display real platform data, pricing reflects the visitor's geography, and navigation reflects auth state
**Depends on**: Phase 1
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04
**Success Criteria** (what must be TRUE):
  1. The homepage displays live counts (active jobs, registered seekers) and real featured job listings pulled from DB
  2. A visitor from India sees INR pricing on the pricing page; all other visitors see USD pricing (detected via CF-IPCountry header)
  3. The Monthly/Annual pricing toggle on the pricing page switches displayed prices without a page reload
  4. An unauthenticated visitor sees the public nav; a logged-in seeker sees the seeker nav; a logged-in recruiter sees the recruiter nav
**Plans**: 3 plans
Plans:
- [x] 05-01-PLAN.md — Homepage stats + featured jobs (async Server Component, Prisma queries)
- [x] 05-02-PLAN.md — Pricing geo detection + INR/USD currency prop (CF-IPCountry header, PRICING_CONFIG constant)
- [x] 05-03-PLAN.md — Auth-aware nav (Header converted to async Server Component, NavLink client child)
**UI hint**: yes

### Phase 6: Interview Scheduling
**Goal**: Recruiters on PRO+ plans can manually schedule interviews with Meet links via CandidateDrawer modal, with settings page fully wired
**Depends on**: Phase 4
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09
**Success Criteria** (what must be TRUE):
  1. A recruiter can connect their Google Calendar via OAuth; tokens are stored encrypted (AES-256) in DB (DEFERRED V2)
  2. The availability picker shows only free slots from the recruiter's calendar for the next 14 days (DEFERRED V2)
  3. A recruiter can schedule an interview with manual date/time and optional Meet link from the CandidateDrawer; Resend emails sent to both parties
  4. A recruiter or seeker can reschedule or cancel an existing interview
  5. A recruiter on FREE plan sees a disabled "Schedule Interview" button with upgrade tooltip; server returns 403 for plan gate
  6. The Settings page shows all 4 tabs (profile, notifications, calendar, security) with their data wired
**Plans**: 5 plans
Plans:
- [ ] 06-01-PLAN.md — Prisma schema migration (RecruiterProfile notification boolean fields)
- [ ] 06-02-PLAN.md — Resend email templates (interview lifecycle) + Zod validation schemas
- [ ] 06-03-PLAN.md — Interview CRUD API routes + Settings API + change-password route
- [ ] 06-04-PLAN.md — ScheduleInterviewModal + CandidateDrawer interview section wiring
- [ ] 06-05-PLAN.md — UpcomingInterviewsList real data + Settings page 4-tab wiring
**UI hint**: yes

### Phase 7: Polish & Pre-Launch
**Goal**: The platform handles errors gracefully, every async surface has a skeleton, all actions have toast feedback, and the app meets basic SEO and accessibility standards
**Depends on**: Phase 6
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09
**Success Criteria** (what must be TRUE):
  1. Navigating to a non-existent route shows the custom 404 page; a server crash shows the custom 500 page
  2. Every page with async data shows a skeleton loader while fetching, never a blank/broken layout
  3. Every user action (form submit, status change, delete) triggers a Sonner toast with success, error, or info feedback
  4. All public-facing pages have correct SEO meta and Open Graph tags visible in page source
  5. Rate limiting blocks excessive requests on all public API routes; the daily cron sends nudge emails to recruiters with jobs inactive for 30+ days
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth & Onboarding | 7/7 | Complete   | 2026-04-02 |
| 2. Job Posting | 0/TBD | Not started | - |
| 3. Matching Engine & Feed | 0/TBD | Not started | - |
| 4. Applications & Recruiter Dashboard | 0/TBD | Not started | - |
| 5. Homepage, Pricing & Nav | 0/3 | Not started | - |
| 6. Interview Scheduling | 0/5 | Not started | - |
| 7. Polish & Pre-Launch | 0/TBD | Not started | - |
