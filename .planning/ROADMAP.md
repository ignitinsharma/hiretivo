# Roadmap: Hiretivo

## Overview

Hiretivo is pivoting from a generic skills-based job board to a **verified Indian engineer talent marketplace for US/EU startups**. Phases 0–8 delivered the job board foundation. Phases 9–12 deliver the pivot product (Pivot v2) on branch `feature/pivot-v2`.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions

- [x] **Phase 0: Setup** - Foundation stack, Prisma, Auth.js, external services, and shadcn setup.
- [ ] **Phase 1: Auth & Onboarding** - Signup, signin, verification, role onboarding, middleware, and profile completeness.
- [ ] **Phase 2: Job Posting** - Job posting APIs/UI, skills, recruiter jobs list, and free plan gate.
- [ ] **Phase 3: Matching + Feed** - Match scoring, Redis caching, seeker feed, public jobs, job detail, and login modal.
- [ ] **Phase 4: Applications + Dashboard** - Applications, recruiter dashboard, external redirects, status pipeline, and email notifications.
- [ ] **Phase 5: Public Pages + Pricing** - Homepage, pricing, company profile, and navigation.
- [ ] **Phase 6: Interview Scheduling** - Calendar/interview scheduling foundations.
- [ ] **Phase 7: Polish** - Error pages, skeletons, toasts, SEO, rate limiting, cron, and accessibility.
- [ ] **Phase 8: Paid Workflows & Account Completion** - Talent pool, paid gates, interview scheduling, external application confirmation, saved jobs, profile/resume/avatar/password/settings completion, and recruiter nav cleanup.

## Pivot v2 — Verified Talent Marketplace

- [ ] **Phase 9: Verification System** - Clean-slate schema (remove old models, add new enums/models), engineer verification flow (Phase B), admin review queue, engineer dashboard status, apply gate, onboarding Step 4 USD salary/timezone/availability, legacy cleanup.
- [x] **Phase 10: Talent Pool & Public Profiles** - Public engineer profile `/e/[slug]`, talent pool browse with blur/unlock/quota UI, recruiter saved engineers, homepage rebuild, pricing page rebuild (FREE/STARTER/GROWTH/SCALE), nav update, billing plan access rewrite. (completed 2026-05-16)
- [x] **Phase 11: Job Match & Notifications** - Weighted job match formula (skills 50%/salary 20%/experience 15%/timezone 10%/availability 5%), VERIFIED-only apply gate, job match notifications cron replacing seeker-digest, RECRUITER_INITIATED application flow. (completed 2026-05-16)
- [x] **Phase 12: AI Review & Feedback** - AI GitHub analysis (Claude Haiku via OpenRouter) on admin open, employer feedback form `/feedback/[token]`, FeedbackRequest model, Hiretivo Score auto-recalc after feedback, pipeline kanban view. (completed 2026-05-16)

## Phase Details

### Phase 8: Paid Workflows & Account Completion
**Goal**: Complete paid recruiter workflows and account management flows end to end so recruiters can upgrade for talent/search/interviews and seekers can save/apply/update their profile without broken settings surfaces.
**Depends on**: Phase 4 partial application/dashboard work, Phase 5 billing/pricing, Phase 6 partial interview APIs/settings.
**Requirements**: [PAID-01, PAID-02, PAID-03, PAID-04, TAL-01, TAL-02, TAL-03, TAL-04, INT-01, INT-02, INT-03, INT-04, EXT-01, EXT-02, EXT-03, EXT-04, SAVE-01, SAVE-02, SAVE-03, SAVE-04, PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08, PROF-09, PROF-10, UI-01, UI-02, UI-03]
**Success Criteria** (what must be TRUE):
  1. Free-plan recruiters see locked paid feature affordances and a shared upgrade modal, while Pro/Enterprise recruiters can access talent pool and interview scheduling.
  2. Talent pool uses real seeker profiles, supports search/filtering, and shows profile/email/resume details for recruiter review/contact.
  3. External job applications can be confirmed by seekers and counted in recruiter dashboards/application lists.
  4. Seekers can save jobs, view saved jobs, apply later, update settings/profile/skills/resume/avatar/password, and no longer see seeker upgrade/delete-account flows.
  5. Recruiters can update company/recruiter settings, view current plan, upgrade, and use settings/talent pages without the recruiter navbar or notification icon.
**Plans**: 5 plans

Plans:
- [x] 08-01: Schema, shared services, paid gate foundation, and upload/reset primitives
- [x] 08-02: Recruiter talent pool, talent profile, and contact flow
- [x] 08-03: Interview scheduling and external application confirmation
- [x] 08-04: Seeker saved jobs and seeker settings/profile completion
- [x] 08-05: Recruiter settings, layout cleanup, billing display, and integration verification

### Phase 9: Verification System
**Goal**: Ship the clean-slate schema and end-to-end engineer verification flow so engineers can submit for review, admins can approve/reject with structured reasons, and verified engineers see the blue ✓ badge with their Hiretivo Score. Unverified engineers cannot apply — they see a "Get Verified to Apply" CTA.
**Depends on**: Phase 8 (auth, onboarding, existing schema foundation on staging)
**Requirements**: [PIVS-01, PIVS-02, PIVS-03, PIVS-04, PIVS-05, PIVS-06, PIVS-07, PIVS-08, PIVS-09, PIVS-10, PIVS-11, PIVS-12, PIVS-13, PIVS-14, PIVS-15]
**Branch**: feature/pivot-v2
**Success Criteria** (what must be TRUE):
  1. Schema is clean-slate: BoostedJob/DismissedJob/SavedJob removed; VerificationStatus/ApplicationSource/ContractType enums added; PlanTier replaced (FREE/STARTER/GROWTH/SCALE); all new models (VerificationReview, EngineerUnlock, EmployerFeedback, SavedEngineer, BlockedRecruiter, FeedbackRequest) pushed to Neon.
  2. Engineers can complete Phase B verification (GitHub URL → bio/projects → video URL → profile slug → submit); status set to PENDING; admin gets email.
  3. Admin can open `/admin/verification` queue and approve (with score) or reject (with structured reasons + reapply window); emails auto-sent; status transitions correct.
  4. Engineer dashboard shows correct status card for each VerificationStatus state including countdown for REJECTED.
  5. Apply button on job listings replaced with "Get Verified to Apply →" for unverified/rejected engineers.
  6. Onboarding Step 4 captures USD salary min/max, timezone overlap hours, availability date.
  7. All legacy files (boost, early-access, admin jobs, SavedJob references) removed.
**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — Schema clean slate (remove BoostedJob/SavedJob/DismissedJob, update PlanTier, add 3 new enums + 6 new models + new fields), update TS enums/pricing/billing constants, delete legacy files, disable seeker-digest
- [x] 09-02-PLAN.md — Onboarding Step 4 (USD salary/timezone/availableFrom) + all 5 engineer API routes (verification GET+POST, check-slug, github-scan stub, public-consent, data-export)
- [x] 09-03-PLAN.md — All 3 admin verification API routes (queue, detail/IN_REVIEW, approve/reject) + stale cron + email templates (approval + rejection) + middleware route protection
- [x] 09-04-PLAN.md — Phase B verification multi-step UI (/seeker/verification) + engineer dashboard VerificationStatusCard (all 5 states) + ProfilePublicConsentModal
- [x] 09-05-PLAN.md — Admin verification queue page + admin review page (/admin/verification/[id]) + ApplyButton gate update + GDPR settings buttons

### Phase 10: Talent Pool & Public Profiles
**Goal**: Recruiters can browse verified engineers (blurred), unlock profiles using quota, save engineers, and schedule interviews. Public engineer profiles live at `/e/[slug]`. Homepage, pricing, and nav rebuilt for talent marketplace positioning.
**Depends on**: Phase 9 (VerificationStatus, EngineerUnlock, SavedEngineer, profileSlug schema)
**Requirements**: [PIVT-01, PIVT-02, PIVT-03, PIVT-04, PIVT-05, PIVT-06, PIVT-07, PIVT-08, PIVT-09, PIVT-10]
**Branch**: feature/pivot-v2
**Success Criteria** (what must be TRUE):
  1. Talent pool shows VERIFIED+profilePublic engineers with blurred name (first + last initial), Hiretivo Score, skills, salary range, timezone, availability.
  2. FREE recruiters see upgrade modal on unlock attempt; paid recruiters deduct 1 quota credit and see full PII (name, email, GitHub, LinkedIn).
  3. Unlock is atomic (DB transaction); idempotent; quota counts only source='talent_pool' within billing period.
  4. Public profile `/e/[slug]` returns 404 unless VERIFIED + profilePublic=true + hiddenUntil not active; shows full name, score, skills, bio, projects, salary range (no email/GitHub/LinkedIn on public page).
  5. Recruiters can save engineers (no quota) and view saved list at `/recruiter/saved`.
  6. Homepage, pricing (4-tier), and nav reflect talent marketplace positioning.
  7. Billing plan access rewritten for FREE/STARTER/GROWTH/SCALE with unlock quotas.
**Plans**: TBD

### Phase 11: Job Match & Notifications
**Goal**: Replace existing match score with weighted formula, gate apply on VERIFIED status, send job-match notifications to verified engineers, and handle RECRUITER_INITIATED application flow from talent pool.
**Depends on**: Phase 9 (VerificationStatus), Phase 10 (talent pool unlock/invite)
**Requirements**: [PIVM-01, PIVM-02, PIVM-03, PIVM-04, PIVM-05]
**Branch**: feature/pivot-v2
**Success Criteria** (what must be TRUE):
  1. computeMatchScore replaced with weighted formula: skills(50%) + salary(20%) + experience(15%) + timezone(10%) + availability(5%); null fields trigger weight renormalization.
  2. POST /api/applications rejects non-VERIFIED engineers with 403; VERIFIED engineers bypass resume requirement; auto-creates EngineerUnlock(source=application_auto).
  3. seeker-digest cron deleted; new job-match-notification cron at `/api/cron/job-match-notification` notifies VERIFIED engineers of new matching jobs using weighted score.
  4. RECRUITER_INITIATED application (from talent pool invite) creates Application(source=RECRUITER_INITIATED) and sends engineer email.
  5. Seeker dashboard shows "Recruiter Invites" tab separate from "My Applications".
**Plans**: TBD

### Phase 12: AI Review & Feedback
**Goal**: Reduce admin review time to ~45 seconds with AI pre-fill (Claude Haiku via OpenRouter), collect structured employer feedback after HIRED applications, and auto-recalc Hiretivo Score incorporating feedback.
**Depends on**: Phase 9 (VerificationReview, VerificationStatus), Phase 11 (HIRED status trigger)
**Requirements**: [PIVAI-01, PIVAI-02, PIVAI-03, PIVAI-04, PIVAI-05]
**Branch**: feature/pivot-v2
**Success Criteria** (what must be TRUE):
  1. Admin opening `/admin/verification/[id]` triggers GitHub scan (Claude Haiku via OpenRouter); pre-fills rejection reasons and score with confidence indicator.
  2. Employer feedback form at `/feedback/[token]` (no login) accepts 1–5 rating + optional comment; token is single-use signed JWT with FeedbackRequest DB record.
  3. FeedbackRequest generated only when Application.status=HIRED + 90 days elapsed + by job-owning recruiter.
  4. Hiretivo Score auto-recalcs: scoreGiven×0.85 + (avgRating/5×100)×0.15 using VerificationReview.scoreGiven.
  5. Admin can override AI recommendation; override logged in VerificationReview.aiSummary for EU AI Act audit trail.
**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md — AI GitHub scan API + GITHUB_ANALYSIS_PROMPT + admin review UI with AI pre-fill and override logging
- [x] 12-02-PLAN.md — FeedbackRequest cron + /feedback/[token] form + POST /api/feedback/employer + score recalc
- [x] 12-03-PLAN.md — Recruiter pipeline kanban at /recruiter/pipeline (6 columns, click-to-move)

## v1.1 — Trust & Conversion

- [x] **Phase 13: Real-time Availability Signal** - Engineer seeking status toggle (Actively Looking / Open to Offers / Not Looking); colored dot on talent pool cards; recruiter filter; stops wasted outreach. (completed 2026-05-26)
- [ ] **Phase 14: Recruiter Analytics Dashboard** - Hiring funnel metrics tab on /recruiter/pipeline (Unlocked→Responded→Interviewed→Hired); conversion %, avg days per stage, credits used vs quota; drives FREE→paid upgrades.
- [ ] **Phase 15: Company Verification** - Domain-email auto-verification (Level 1) + LinkedIn URL + work email admin review (Level 2); "Verified Company ✓" badge on job cards and detail page; fixes trust asymmetry.

### Phase 13: Real-time Availability Signal
**Goal**: Engineers set a seeking status visible to recruiters on talent pool cards, filtering, and public profiles — stopping wasted recruiter outreach on passive candidates.
**Depends on**: Phase 10 (talent pool cards, /api/recruiter/talent route), Phase 9 (User model, engineer settings)
**Requirements**: [AVAIL-01, AVAIL-02, AVAIL-03, AVAIL-04, AVAIL-05]
**Branch**: feat/pivot-2.0
**Success Criteria** (what must be TRUE):
  1. `SeekingStatus` enum (ACTIVELY_LOOKING, OPEN_TO_OFFERS, NOT_LOOKING) added to Prisma schema and `User` model with default OPEN_TO_OFFERS; migration applied.
  2. Engineer settings page has a 3-state toggle (colored: green/yellow/gray) that persists seekingStatus via PATCH /api/seeker/settings.
  3. Talent pool cards show colored availability dot (green=actively, yellow=open, gray=not looking) next to engineer name.
  4. Talent pool page has filter (All / Actively Looking / Open to Offers) that passes seekingStatus query param to /api/recruiter/talent; NOT_LOOKING engineers still appear (unlike hiddenUntil) but can be filtered out.
  5. Public engineer profile /e/[slug] displays availability status label below name.
**Plans**: TBD

### Phase 14: Recruiter Analytics Dashboard
**Goal**: Add a hiring funnel analytics tab to /recruiter/pipeline so recruiters see ROI (credits spent → hires) and are motivated to upgrade from FREE to paid plans.
**Depends on**: Phase 12 (pipeline kanban at /recruiter/pipeline), Phase 10 (EngineerUnlock model), Phase 11 (Application model with source/status)
**Requirements**: [ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-05]
**Branch**: feat/pivot-2.0
**Success Criteria** (what must be TRUE):
  1. /recruiter/pipeline has two tabs: "Pipeline" (existing kanban) and "Analytics" (new).
  2. Analytics tab shows funnel: Unlocked → Applied/Invited → Interviewing → Offered → Hired — with count and conversion % at each stage.
  3. ~~Analytics tab shows avg days per stage~~ — DROPPED per D-03 (no per-stage timestamps in Application model; no ApplicationStatusHistory added).
  4. Analytics tab shows credits used (EngineerUnlock count in billing period) vs quota remaining (from plan tier).
  5. Analytics tab shows top 5 skills across unlocked engineers (to guide job requirements).
  6. All data fetched via GET /api/recruiter/analytics (new route); rate-limited with dataFetchRateLimiter (30/min); no new schema required.
**Plans**: 3 plans

Plans:
- [ ] 14-01-PLAN.md — Restore plan-access.ts (fix PRO/ENTERPRISE → STARTER/GROWTH/SCALE), restore 5 deleted pipeline files, add Pipeline+Analytics tab container
- [ ] 14-02-PLAN.md — Analytics types + GET /api/recruiter/analytics route (funnel groupBy, credits/quota, top 5 skills) + TanStack Query hook
- [ ] 14-03-PLAN.md — AnalyticsTab UI (funnel cards, credits, top skills, FREE-plan lock overlay) wired into pipeline page

### Phase 15: Company Verification
**Goal**: Fix the trust asymmetry where engineers are hard-verified but any recruiter can post jobs with a Gmail. Show "Verified Company ✓" badge on job cards and detail pages so engineers trust the posting.
**Depends on**: Phase 8 (RecruiterProfile model, recruiter settings), Phase 9 (admin panel foundation)
**Requirements**: [CMPV-01, CMPV-02, CMPV-03, CMPV-04, CMPV-05, CMPV-06]
**Branch**: feat/pivot-2.0
**Success Criteria** (what must be TRUE):
  1. RecruiterProfile schema extended with: companyVerified Boolean @default(false), companyVerifiedAt DateTime?, companyLinkedInUrl String?, companyWorkEmail String?; migration applied.
  2. Level 1 auto-verification: POST /api/recruiter/verify-company checks if recruiter email domain matches companyWebsite domain (e.g. nitin@stripe.com + stripe.com) → sets companyVerified=true immediately.
  3. Level 2 manual verification: if email is freemail (Gmail/Yahoo/Hotmail/Outlook/Proton) → recruiter prompted to submit companyLinkedInUrl + companyWorkEmail → admin review queue.
  4. Recruiter settings page has a "Company Verification" section showing current status + Level 1 auto-check result + Level 2 submission form (if applicable).
  5. Job cards (JobCard.tsx), job detail page (/jobs/[id]), and talent pool recruiter info show "Verified Company ✓" green badge or "Unverified" gray badge.
  6. Admin panel has a pending company verifications list at /admin/companies where admin can approve/reject Level 2 submissions.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Setup | 1/1 | Complete | 2026-03-21 |
| 1. Auth & Onboarding | 0/TBD | In progress | - |
| 2. Job Posting | 0/TBD | Not started | - |
| 3. Matching + Feed | 0/TBD | Not started | - |
| 4. Applications + Dashboard | 0/TBD | Not started | - |
| 5. Public Pages + Pricing | 0/TBD | Not started | - |
| 6. Interview Scheduling | 0/TBD | Not started | - |
| 7. Polish | 0/TBD | Not started | - |
| 8. Paid Workflows & Account Completion | 5/5 | Complete | 2026-04-26 |
| 9. Verification System (Pivot v2) | 0/5 | Not started | - |
| 10. Talent Pool & Public Profiles (Pivot v2) | 5/5 | Complete    | 2026-05-16 |
| 11. Job Match & Notifications (Pivot v2) | 3/3 | Complete    | 2026-05-16 |
| 12. AI Review & Feedback (Pivot v2) | 3/3 | Complete    | 2026-05-16 |
| 13. Real-time Availability Signal (v1.1) | 5/5 | Complete    | 2026-05-26 |
| 14. Recruiter Analytics Dashboard (v1.1) | 0/TBD | Not started | - |
| 15. Company Verification (v1.1) | 0/TBD | Not started | - |
