# Requirements: Hiretivo

**Defined:** 2026-04-25
**Core Value:** Recruiters and seekers must reliably connect through skills-first matching, with paid recruiter features gated clearly and profile data kept accurate.

## v1 Requirements

### Recruiter Paid Features

- [ ] **PAID-01**: Free-plan recruiters see lock icons on paid recruiter features and cannot use them without upgrading.
- [ ] **PAID-02**: Clicking a locked recruiter feature opens one shared upgrade modal with a blurred/dim overlay and plan upgrade actions.
- [ ] **PAID-03**: Pro and Enterprise recruiters can access paid recruiter features without the upgrade modal.
- [ ] **PAID-04**: Recruiter settings billing section shows current plan and an upgrade plan button.

### Talent Pool

- [ ] **TAL-01**: Pro and Enterprise recruiters can search the talent pool by name, role, skills, location, and availability.
- [ ] **TAL-02**: Talent pool results are populated from real seeker profiles and skills, not hardcoded mock candidates.
- [ ] **TAL-03**: Recruiters can open a talent profile and view bio, profile details, email, skills, resume availability, and application-relevant details.
- [ ] **TAL-04**: Recruiters can mail talent directly from the talent profile using the visible email or a `mailto:` action.

### Interview Scheduling

- [ ] **INT-01**: Pro and Enterprise recruiters can schedule interviews from Hiretivo for candidates/applicants.
- [ ] **INT-02**: Interview scheduling creates an `Interview` record linked to application, recruiter, and seeker.
- [ ] **INT-03**: Interview scheduling sends an email to the seeker through Resend.
- [ ] **INT-04**: Free-plan recruiters are blocked from scheduling interviews and shown the paid upgrade modal.

### External Applications

- [ ] **EXT-01**: External apply jobs redirect seekers to the external site through the existing redirect flow.
- [ ] **EXT-02**: After external redirect, logged-in seekers can confirm whether they applied.
- [ ] **EXT-03**: Confirmed external applications create or update an `Application` record and count in recruiter dashboards.
- [ ] **EXT-04**: Recruiter application lists and stats include confirmed external applications.

### Seeker Saved Jobs

- [ ] **SAVE-01**: Logged-in seekers can save a job from job cards/details.
- [ ] **SAVE-02**: Seekers can view saved jobs from a dedicated saved jobs surface.
- [ ] **SAVE-03**: Seekers can remove saved jobs.
- [ ] **SAVE-04**: Seekers can apply to saved jobs later and the saved state remains stable.

### Profile, Resume, Avatar, and Account Settings

- [ ] **PROF-01**: Seekers can update all onboarding profile fields from settings.
- [ ] **PROF-02**: Seekers can update skills from settings and matching cache is invalidated after skill changes.
- [ ] **PROF-03**: Seekers can upload or replace resume from settings.
- [ ] **PROF-04**: Seekers and recruiters can upload avatars/logos through a working R2-backed flow.
- [ ] **PROF-05**: Users without an uploaded image display a circular initials avatar using first and last initials, or the first name/company initial when only one name exists.
- [ ] **PROF-06**: Seekers can update password from account settings.
- [ ] **PROF-07**: Seekers and recruiters can reset password by email link.
- [ ] **PROF-08**: Profile completeness/improvement is shown on seeker dashboard when required profile pieces are missing.
- [ ] **PROF-09**: Seeker account removal/deletion flow is removed from the UI and API surface for now.
- [ ] **PROF-10**: Recruiters can update company details and recruiter profile details from settings.

### Navigation and UI Consistency

- [ ] **UI-01**: `/recruiter/settings` and `/recruiter/talent` do not show the recruiter navbar/header or notification icon.
- [ ] **UI-02**: Dropdown, popover, dialog, and modal behavior uses shadcn reusable components consistently.
- [ ] **UI-03**: New UI follows `DESIGN.md` colors, typography, radii, button animations, and modal overlay rules.

## Pivot v2 Requirements — Verified Talent Marketplace

### Phase 9: Verification System (PIVS)

- [ ] **PIVS-01**: Schema clean slate — remove BoostedJob, DismissedJob, SavedJob models; replace PlanTier PRO/ENTERPRISE with STARTER/GROWTH/SCALE; add VerificationStatus, ApplicationSource, ContractType enums.
- [ ] **PIVS-02**: Add all new Prisma models: VerificationReview, EngineerUnlock, EmployerFeedback, SavedEngineer, BlockedRecruiter, FeedbackRequest; add new fields to User, SeekerProfile, Job, Application per PIVOT.md §4.
- [ ] **PIVS-03**: Onboarding Phase A Step 4 captures USD salary min/max, timezone overlap hours (0–16), and availableFrom date; persists to User model via saveStep4 server action.
- [ ] **PIVS-04**: Engineer can complete Phase B verification flow: Step 1 GitHub URL (with scan spinner + all edge-case states), Step 2 bio + top 3 projects, Step 3 video URL (optional), Step 4 profile slug picker (real-time uniqueness check, reserved words blocked).
- [ ] **PIVS-05**: On verification submit: verificationStatus=PENDING, profileSlug reserved, admin email sent, engineer sees "Under review — 48hrs" confirmation.
- [x] **PIVS-06**: Admin queue at `/admin/verification` shows PENDING/IN_REVIEW submissions with FIFO order; IN_REVIEW items stale after 2hrs auto-revert to PENDING via cron + lazy check on queue load.
- [x] **PIVS-07**: Admin approve flow: enter score (0–100), click Send → verificationStatus=VERIFIED, hiretivoScore=scoreGiven, approval email sent with [Make Profile Public →] CTA.
- [x] **PIVS-08**: Admin reject flow: multi-select rejection reasons (15 predefined), optional note, select reapply window (30/60/90 days) → verificationStatus=REJECTED, reapplyAfter set, rejection email sent.
- [ ] **PIVS-09**: Engineer dashboard shows correct status card for all 5 VerificationStatus states (NOT_SUBMITTED, PENDING, IN_REVIEW, VERIFIED×2, REJECTED) including countdown for REJECTED reapplyAfter.
- [ ] **PIVS-10**: Apply button on job listings replaced with role-specific CTAs based on verificationStatus: VERIFIED=Apply, UNVERIFIED/REJECTED="Get Verified to Apply →", PENDING/IN_REVIEW=disabled "Verification in progress".
- [ ] **PIVS-11**: GDPR/DPDP minimum: "Request account deletion" button in settings → email admin; "Download my data" → JSON export of profile/applications/unlock log; AI decision notice in verification status card.
- [ ] **PIVS-12**: Legacy cleanup — delete boost, early-access, admin-jobs files; disable/delete seeker-digest cron; remove company pages; remove PRO/ENTERPRISE references from billing constants.
- [x] **PIVS-13**: All new API routes rate-limited per CLAUDE.md rules (auth 10/min, write 5/min, read 30/min).
- [ ] **PIVS-14**: `/api/engineer/check-slug` GET endpoint with debounce-friendly design; reserved words list enforced server-side; returns `{ available: boolean, suggestion?: string }`.
- [ ] **PIVS-15**: profilePublic consent flow: after VERIFIED email, engineer clicks [Make Profile Public →] → profilePublic=true, profilePublicConsentAt=now(); consent modal shows required disclosure text from PIVOT.md §15.

### Phase 10: Talent Pool & Public Profiles (PIVT)

- [ ] **PIVT-01**: Talent pool API `/api/recruiter/talent` returns only VERIFIED+profilePublic engineers; locked card shows first name + last initial, Hiretivo Score, skills, salary range, timezone, availability; full PII hidden.
- [ ] **PIVT-02**: Unlock flow: FREE plan → upgrade modal; paid plan with quota → deduct 1 credit atomically (transaction + idempotent); returns full PII (name, email, GitHub, LinkedIn).
- [ ] **PIVT-03**: Public profile `/e/[slug]` returns 404 unless verificationStatus=VERIFIED + profilePublic=true + hiddenUntil not active; shows full name, score, skills, bio, projects, salary range (no email/GitHub/LinkedIn on public page).
- [ ] **PIVT-04**: Save/unsave engineer (no quota) at `/api/recruiter/talent/[id]/save`; saved list at `/recruiter/saved`.
- [ ] **PIVT-05**: Interview invite from talent pool: POST `/api/recruiter/talent/[id]/invite` → EngineerUnlock(source=talent_pool) if not exists + Application(source=RECRUITER_INITIATED) + engineer email.
- [ ] **PIVT-06**: Engineer unlock notification: email to engineer on every EngineerUnlock creation ("Acme Inc viewed your profile"); source-aware copy.
- [ ] **PIVT-07**: Billing plan access rewritten: FREE=0 unlocks/0 jobs, STARTER=10 unlocks/2 jobs, GROWTH=30 unlocks/unlimited, SCALE=unlimited; `canAccessTalentPool`, `getUnlockQuota`, `canPostJob` helpers.
- [ ] **PIVT-08**: Homepage rebuilt as talent marketplace (recruiter + engineer elevator pitches, 3 pillars); pricing page rebuilt with 4-tier structure.
- [ ] **PIVT-09**: Nav updated to talent marketplace links; BlockedRecruiter flow in engineer settings (shows domains that unlocked, allows block).
- [ ] **PIVT-10**: hiddenUntil toggle in engineer settings; sets hiddenUntil=future date → removes from talent pool + public profile 404; active applications unaffected.

### Phase 11: Job Match & Notifications (PIVM)

- [ ] **PIVM-01**: `computeMatchScore` replaced with `computeWeightedJobMatch`: skills(50%) + salary(20%) + experience(15%) + timezone(10%) + availability(5%); null fields trigger weight renormalization.
- [ ] **PIVM-02**: `computeBestJobMatchForEngineer` returns highest match score across recruiter's open jobs; used in talent pool card display.
- [ ] **PIVM-03**: POST `/api/applications` rejects non-VERIFIED engineers with 403; VERIFIED engineers bypass resume requirement; auto-creates EngineerUnlock(source=application_auto).
- [ ] **PIVM-04**: seeker-digest cron deleted; new job-match-notification cron at `/api/cron/job-match-notification` notifies VERIFIED engineers of new matching jobs using weighted score.
- [ ] **PIVM-05**: Seeker dashboard shows "Recruiter Invites" tab (source=RECRUITER_INITIATED) separate from "My Applications" tab.

### Phase 12: AI Review & Feedback (PIVAI)

- [ ] **PIVAI-01**: Admin opening `/admin/verification/[id]` triggers POST `/api/engineer/github-scan` → Claude Haiku via OpenRouter; result pre-fills rejection reasons and score; confidence shown; scan fail → manual form fallback.
- [ ] **PIVAI-02**: Employer feedback form at `/feedback/[token]` (no login required); JWT token validates engineerId/recruiterId/jobId/exp; FeedbackRequest.usedAt set on submit (one-use).
- [ ] **PIVAI-03**: FeedbackRequest generated only when Application.status transitions to HIRED + 90 days elapsed + by job-owning recruiter; feedbackRequestId FK enforces one feedback per request.
- [ ] **PIVAI-04**: Hiretivo Score recalc on feedback submit: newScore = VerificationReview.scoreGiven×0.85 + (avgRating/5×100)×0.15.
- [ ] **PIVAI-05**: Admin override of AI recommendation logged in VerificationReview.aiSummary.overrideReason (EU AI Act audit trail).

## v2 Requirements

### Notifications

- **NOTF-01**: Recruiters receive in-app notifications.
- **NOTF-02**: Seekers receive in-app notifications for application and interview changes.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Seeker paid plan upgrade | User explicitly requested removal of seeker upgrade flow for now. |
| In-app notification center | User said there is no notification flow yet; hide notification icon instead. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAID-01 | Phase 8 | Pending |
| PAID-02 | Phase 8 | Pending |
| PAID-03 | Phase 8 | Pending |
| PAID-04 | Phase 8 | Pending |
| TAL-01 | Phase 8 | Pending |
| TAL-02 | Phase 8 | Pending |
| TAL-03 | Phase 8 | Pending |
| TAL-04 | Phase 8 | Pending |
| TAL-05 | Phase 8 | Pending |
| INT-01 | Phase 8 | Pending |
| INT-02 | Phase 8 | Pending |
| INT-03 | Phase 8 | Pending |
| INT-04 | Phase 8 | Pending |
| EXT-01 | Phase 8 | Pending |
| EXT-02 | Phase 8 | Pending |
| EXT-03 | Phase 8 | Pending |
| EXT-04 | Phase 8 | Pending |
| SAVE-01 | Phase 8 | Pending |
| SAVE-02 | Phase 8 | Pending |
| SAVE-03 | Phase 8 | Pending |
| SAVE-04 | Phase 8 | Pending |
| PROF-01 | Phase 8 | Pending |
| PROF-02 | Phase 8 | Pending |
| PROF-03 | Phase 8 | Pending |
| PROF-04 | Phase 8 | Pending |
| PROF-05 | Phase 8 | Pending |
| PROF-06 | Phase 8 | Pending |
| PROF-07 | Phase 8 | Pending |
| PROF-08 | Phase 8 | Pending |
| PROF-09 | Phase 8 | Pending |
| PROF-10 | Phase 8 | Pending |
| UI-01 | Phase 8 | Pending |
| UI-02 | Phase 8 | Pending |
| UI-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after Phase 8 scope capture*
