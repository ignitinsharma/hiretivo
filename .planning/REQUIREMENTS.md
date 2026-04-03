# Requirements: Hiretivo

**Defined:** 2026-04-01
**Core Value:** Seekers see only the jobs they match — match score drives every surface, from feed ranking to per-skill breakdowns, creating a signal-rich experience that generic job boards can't offer.

## v1.0 Requirements

All requirements for milestone v1.0 — Full Hiretivo V1 Launch Build. Every requirement is backend/logic wiring only; all UI is pre-built and must not be modified.

### Authentication & Onboarding

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign up / sign in with Google OAuth
- [x] **AUTH-03**: User selects role (SEEKER or RECRUITER) during signup
- [x] **AUTH-04**: User receives verification email via Resend after signup
- [x] **AUTH-05**: User can verify email via link
- [x] **AUTH-06**: Seeker can complete 5-step onboarding wizard (Steps 1–2 mandatory: situation/experience + role/years/skills; Steps 3–5 skippable: resume upload, job preferences, completion screen)
- [x] **AUTH-07**: Recruiter can complete company onboarding (name, size, website, description)
- [x] **AUTH-08**: Middleware enforces role-based route access (seeker vs recruiter routes separated)
- [x] **AUTH-09**: Profile completeness score computed from filled wizard fields

### Job Posting

- [ ] **JOBS-01**: 80+ skills seeded to DB across 6 categories (Engineering, Design, Marketing, Data, DevOps, Product, add other section as well so other then these category also can post their)
- [ ] **JOBS-02**: Recruiter can create a job posting (title, rich text description, skills multi-select, apply type internal/external, salary, location)
- [ ] **JOBS-03**: Recruiter can edit own job posting
- [ ] **JOBS-04**: Recruiter can delete own job posting
- [ ] **JOBS-05**: Recruiter can toggle job active/inactive
- [ ] **JOBS-06**: Recruiter can view My Jobs list with status management
- [ ] **JOBS-07**: FREE plan gate enforces 1 active job limit server-side

### Matching Engine & Feed

- [ ] **MATCH-01**: System computes matchScore = (|seeker.skills ∩ job.requiredSkills|) / |job.requiredSkills| × 100 (integer 0–100)
- [ ] **MATCH-02**: Match scores cached in Redis with 15-min TTL per seeker×job pair
- [ ] **MATCH-03**: Cache invalidated when seeker updates skills or job updates required skills
- [ ] **MATCH-04**: Seeker feed shows only matched jobs, sorted by score descending
- [ ] **MATCH-05**: Feed supports filtering
- [ ] **MATCH-06**: Job detail shows per-skill match breakdown for authenticated seeker
- [ ] **MATCH-07**: Public job listings show match scores locked (login/upgrade prompt for unauthenticated users)
- [ ] **MATCH-08**: LoginModal triggers on unauthenticated apply attempt

### Applications & Recruiter Dashboard

- [ ] **APPL-01**: Seeker can submit internal application with cover letter (text input)
- [ ] **APPL-02**: External apply click-through tracked with UTM params (?ref=hiretivo&utm_source=hiretivo&utm_medium=job_board)
- [ ] **APPL-03**: Seeker can view My Applications page with status timeline
- [ ] **APPL-04**: Recruiter dashboard shows stats bar, candidate table, and 480px side drawer
- [ ] **APPL-05**: Application pipeline has 6 stages: APPLIED → REVIEWING → INTERVIEW → OFFER → HIRED / REJECTED
- [ ] **APPL-06**: Recruiter can move application through pipeline stages
- [ ] **APPL-07**: Resend email notification sent at each application status change
- [ ] **APPL-08**: FREE plan blurs applicants 21+ in recruiter view

### Homepage, Pricing & Nav

- [ ] **HOME-01**: Homepage sections wired with real data (job counts, seeker stats, featured jobs)
- [ ] **HOME-02**: Pricing page Monthly/Annual toggle wired
- [ ] **HOME-03**: Pricing page detects geo via CF-IPCountry header (INR for India, USD otherwise)
- [ ] **HOME-04**: Nav shows correct variant by auth state (public / seeker / recruiter)

### Interview Scheduling

- [ ] **SCHED-01**: Recruiter can connect Google Calendar via OAuth
- [ ] **SCHED-02**: Calendar OAuth tokens stored encrypted at rest (AES-256 via CALENDAR_ENCRYPTION_KEY)
- [ ] **SCHED-03**: Availability API returns free/busy slots for next 14 days
- [ ] **SCHED-04**: Recruiter can schedule interview with Google Meet link creation
- [ ] **SCHED-05**: Recruiter can reschedule an interview
- [ ] **SCHED-06**: Recruiter or Seeker can cancel an interview
- [ ] **SCHED-07**: Scheduling features gated to GROWTH+ plan
- [ ] **SCHED-08**: Calendar page shows Coming Soon state when plan is insufficient
- [ ] **SCHED-09**: Settings page has 4 tabs (profile, notifications, calendar, security) wired

### Polish & Pre-Launch

- [ ] **POLISH-01**: Custom 404 and 500 error pages wired
- [ ] **POLISH-02**: Loading skeletons on all async surfaces
- [ ] **POLISH-03**: Sonner toasts wired for all user actions (success/error/info)
- [ ] **POLISH-04**: SEO meta + Open Graph tags on all public-facing pages
- [ ] **POLISH-05**: Rate limiting on all public API routes
- [ ] **POLISH-06**: Daily cron job sends stale job nudge emails to recruiters with jobs inactive > 30 days
- [ ] **POLISH-07**: Terms of Service and Privacy Policy placeholder pages wired
- [ ] **POLISH-08**: Accessibility audit (keyboard nav, ARIA labels, color contrast)
- [ ] **POLISH-09**: Performance optimization (image optimization, bundle analysis)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing (Stripe/Razorpay) | V2 — plans manually set via DB `planType` field in V1 |
| Admin UI for plan management | V2 — plans set directly in DB in V1 |
| Mobile native app | Web-first, mobile later |
| Real-time chat (seeker ↔ recruiter) | High complexity, not core to V1 |
| Video resume uploads | Storage cost, deferred to V2 |
| AI-generated cover letters or job descriptions | Deferred to V2 |
| Multi-language / i18n | Deferred to V2 |
| UI component redesign | All UI pre-built via Stitch — only wire logic |

## Traceability

| Requirement | Phase | Phase Name | Status |
|-------------|-------|------------|--------|
| AUTH-01 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-02 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-03 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-04 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-05 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-06 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-07 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-08 | Phase 1 | Auth & Onboarding | Pending |
| AUTH-09 | Phase 1 | Auth & Onboarding | Pending |
| JOBS-01 | Phase 2 | Job Posting | Pending |
| JOBS-02 | Phase 2 | Job Posting | Pending |
| JOBS-03 | Phase 2 | Job Posting | Pending |
| JOBS-04 | Phase 2 | Job Posting | Pending |
| JOBS-05 | Phase 2 | Job Posting | Pending |
| JOBS-06 | Phase 2 | Job Posting | Pending |
| JOBS-07 | Phase 2 | Job Posting | Pending |
| MATCH-01 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-02 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-03 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-04 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-05 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-06 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-07 | Phase 3 | Matching Engine & Feed | Pending |
| MATCH-08 | Phase 3 | Matching Engine & Feed | Pending |
| APPL-01 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-02 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-03 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-04 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-05 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-06 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-07 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| APPL-08 | Phase 4 | Applications & Recruiter Dashboard | Pending |
| HOME-01 | Phase 5 | Homepage, Pricing & Nav | Pending |
| HOME-02 | Phase 5 | Homepage, Pricing & Nav | Pending |
| HOME-03 | Phase 5 | Homepage, Pricing & Nav | Pending |
| HOME-04 | Phase 5 | Homepage, Pricing & Nav | Pending |
| SCHED-01 | Phase 6 | Interview Scheduling | Pending |
| SCHED-02 | Phase 6 | Interview Scheduling | Pending |
| SCHED-03 | Phase 6 | Interview Scheduling | Pending |
| SCHED-04 | Phase 6 | Interview Scheduling | Pending |
| SCHED-05 | Phase 6 | Interview Scheduling | Pending |
| SCHED-06 | Phase 6 | Interview Scheduling | Pending |
| SCHED-07 | Phase 6 | Interview Scheduling | Pending |
| SCHED-08 | Phase 6 | Interview Scheduling | Pending |
| SCHED-09 | Phase 6 | Interview Scheduling | Pending |
| POLISH-01 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-02 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-03 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-04 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-05 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-06 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-07 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-08 | Phase 7 | Polish & Pre-Launch | Pending |
| POLISH-09 | Phase 7 | Polish & Pre-Launch | Pending |

**Coverage:**
- v1.0 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 — traceability updated with phase names after roadmap creation*
