# Roadmap: Hiretivo

## Milestones

- 🚧 **v1.0 Full Hiretivo V1 Launch Build** - Phases 1-7 (in progress)
- 📋 **v1.1 Platform Polish, Payments & Engagement** - Phases 8-13 (planned)

## Phases

**Phase Numbering:**
- Phases 1-7: v1.0 milestone (see v1.0 roadmap)
- Phases 8-13: v1.1 milestone (this document)
- Decimal phases (8.1, 9.1, etc.): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 8: Bug Fixes, Schema Foundation & Cleanup** - Fix broken flows, apply schema migrations for v1.1, remove dead features
- [ ] **Phase 9: Recruiter Dashboard & Job Management** - Live dashboard data, dynamic sidebar, remove dead UI pages
- [x] **Phase 10: Settings Restructure & Auth Guards** - Rebuild settings for both roles, auth redirects, header avatar (completed 2026-04-16)
- [x] **Phase 11: Payments Integration** - PRO Stripe checkout, webhooks, customer portal, billing tab, Enterprise contact-sales (completed 2026-04-17)
- [ ] **Phase 12: Seeker Dashboard & Engagement** - Live seeker data, match explainer, skill gap tracker, weekly digest
- [ ] **Phase 13: Recruiter Intelligence** - AI candidate summaries, real analytics, boost job

## Phase Details

### Phase 8: Bug Fixes, Schema Foundation & Cleanup
**Goal**: All known bugs are fixed, Prisma schema is migrated for v1.1 features (Subscription model, BoostedJob model, UNPUBLISHED enum, stripeCustomerId, digestEnabled), and dead features are removed globally
**Depends on**: Phase 7 (v1.0 completion)
**Requirements**: BUG-01, BUG-02, BUG-03, JOB-01, CLN-01, CLN-02
**Success Criteria** (what must be TRUE):
  1. Recruiter can click "Go to Dashboard" on onboarding completion and navigate to their dashboard
  2. Recruiter can open any applicant's resume in the drawer without seeing a NoSuchKey storage error
  3. Applicant side drawer opens at a wider width that is comfortable to read
  4. Notification bell icon and all notification-related UI are gone from both seeker and recruiter layouts
  5. Recruiter can unpublish an active job (hides from seeker feed) and republish it (returns to feed) with correct status transitions
**Plans**: TBD

### Phase 9: Recruiter Dashboard & Job Management
**Goal**: Recruiter dashboard shows real-time data from the database, sidebar reflects actual counts, and dead UI pages/sections are removed
**Depends on**: Phase 8
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, BUG-04, JOB-02, JOB-03
**Success Criteria** (what must be TRUE):
  1. Recruiter dashboard displays correct live stats (active jobs count, total applications, new this week, avg match score) that change when underlying data changes
  2. Recruiter sidebar shows real-time job and applicant counts, with Talent Pool, Analytics, and Settings links removed
  3. Recruiter dashboard shows a real application trend chart (last 30 days) using shadcn Chart component
  4. All data-fetching areas across dashboard and sidebar show skeleton loaders while loading
  5. The /recruiter/analytics page no longer exists, and the grid/list view toggle and filter section are removed from the active jobs page
**Plans**: TBD
**UI hint**: yes

### Phase 10: Settings Restructure & Auth Guards
**Goal**: Both recruiter and seeker settings pages are restructured to relevant tabs only, auth guards redirect logged-in users appropriately, and header navigation is updated
**Depends on**: Phase 8
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Recruiter settings page has exactly 3 tabs -- Profile (including company info), Security, and Billing -- with no Calendar, Notifications, or other dead tabs
  2. Both recruiter and seeker can change their password from their respective Security sections
  3. Both recruiter and seeker can delete their account from Security (with confirmation dialog; recruiter deletion also cancels Stripe subscription if active)
  4. Seeker settings page allows full profile update (resume upload, all profile fields) with no 2FA, export data, or notification options visible
  5. Logged-in users visiting the homepage are redirected to their role-specific dashboard, and the header shows an avatar dropdown with sign-out option
**Plans:** 3/3 plans executed — verification gaps found
Plans:
- [ ] 10-01-PLAN.md — Recruiter settings restructure + backend APIs (schema, seeker settings, delete account)
- [ ] 10-02-PLAN.md — Seeker settings UI rebuild (profile form, password, delete account, remove dead features)
- [ ] 10-03-PLAN.md — Homepage auth redirect + header avatar dropdown verification
**UI hint**: yes

### Phase 11: Payments Integration
**Goal**: Recruiters can purchase and manage subscription plans through Stripe, with billing lifecycle fully synced to the database
**Depends on**: Phase 10
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Success Criteria** (what must be TRUE):
  1. Recruiter can select PRO on the pricing page, complete Stripe Checkout, and return to the app with their plan upgraded; Enterprise routes to contact sales
  2. Recruiter can open Stripe Customer Portal from the Billing settings tab to cancel subscription or update payment method
  3. Recruiter Billing tab displays current plan name, subscription status, period end date, and cancel-at-period-end state from the database
  4. When a subscription is canceled, payment fails, or renews in Stripe, the webhook handler automatically updates User.plan and Subscription records
**Plans:** 4/4 plans executed — human verification required
Plans:
- [x] 11-01-PLAN.md — Stripe foundation, Subscription model, 3-tier pricing page
- [x] 11-02-PLAN.md — Stripe Checkout, Portal, Webhooks, Success page
- [x] 11-03-PLAN.md — Billing tab UI, Delete account Stripe cancellation
- [x] 11-04-PLAN.md — PAY-01 contract alignment gap closure
**UI hint**: yes

### Phase 12: Seeker Dashboard & Engagement
**Goal**: Seeker dashboard displays real data instead of mocks, and new engagement features help seekers understand and improve their skill-match quality
**Depends on**: Phase 9
**Requirements**: SKR-01, SKR-02, SKR-03, SKR-04, ENG-01, ENG-02, ENG-03
**Success Criteria** (what must be TRUE):
  1. Seeker dashboard shows a dynamic profile completeness percentage that updates as profile fields are filled in
  2. Seeker dashboard shows live Quick Stats (applications submitted, jobs viewed, interviews scheduled) from real data
  3. Jobs the seeker has already applied to are hidden from the dashboard recommendation feed
  4. On low-match job cards, the seeker sees exactly which skills they are missing (e.g., "You need Docker and AWS")
  5. Seeker dashboard includes a skill gap tracker widget showing the most-demanded missing skills across their matched jobs
**Plans**: 4 plans
Plans:
- [ ] 12-01-PLAN.md — Seeker dashboard summary contracts + API
- [ ] 12-02-PLAN.md — Feed enrichment, applied-job exclusion, and job-view tracking
- [ ] 12-03-PLAN.md — Weekly digest preference, email delivery, and cron scheduling
- [ ] 12-04-PLAN.md — Seeker dashboard UI wiring and nav polish
**UI hint**: yes

### Phase 13: Recruiter Intelligence
**Goal**: Recruiters have AI-powered candidate insights, real job performance analytics, and the ability to boost jobs to reach more matched seekers
**Depends on**: Phase 11
**Requirements**: INT-01, INT-02, INT-03
**Success Criteria** (what must be TRUE):
  1. Recruiter sees an AI-generated one-line candidate summary in the applicant drawer, available only on PRO or ENTERPRISE plans
  2. Recruiter sees real analytics per job including view count, apply rate, top candidate skills, and average match score
  3. Recruiter can boost a job to pin it at the top of skill-matched seeker feeds for 7 days, paid via a one-time Stripe checkout
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 8.1 (if any) -> 9 -> ... -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 8. Bug Fixes, Schema Foundation & Cleanup | v1.1 | 0/0 | Not started | - |
| 9. Recruiter Dashboard & Job Management | v1.1 | 0/0 | Not started | - |
| 10. Settings Restructure & Auth Guards | v1.1 | 0/0 | Complete    | 2026-04-16 |
| 11. Payments Integration | v1.1 | 4/4 | Human verification required | - |
| 12. Seeker Dashboard & Engagement | v1.1 | 0/0 | Not started | - |
| 13. Recruiter Intelligence | v1.1 | 0/0 | Not started | - |

---
*Roadmap created: 2026-04-14*
*Milestone: v1.1 Platform Polish, Payments & Engagement*
