# Requirements: Hiretivo

**Defined:** 2026-04-14
**Core Value:** Skill-based matching must work reliably — match score = (seeker skills ∩ job required skills) / job required skills × 100

## v1.1 Requirements

Requirements for milestone v1.1: Platform Polish, Payments & Engagement. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Recruiter can navigate from onboarding "Setup Complete" to dashboard (fix stuck button)
- [ ] **BUG-02**: Recruiter can view applicant resume without NoSuchKey error (fix R2 storage)
- [ ] **BUG-03**: Applicant side drawer displays at wider width for better readability
- [ ] **BUG-04**: Recruiter dashboard displays correct active job count and stats

### Payments & Billing

- [ ] **PAY-01**: Recruiter can purchase PRO plan via Stripe Checkout; Enterprise routes to contact sales
- [ ] **PAY-02**: Recruiter can manage billing (cancel, update payment) via Stripe Customer Portal
- [ ] **PAY-03**: Recruiter can view current plan, expiry date, and subscription status in Billing settings tab
- [ ] **PAY-04**: Stripe webhooks automatically sync subscription status to User.plan field

### Recruiter Dashboard & Sidebar

- [ ] **DASH-01**: Recruiter sidebar shows real-time job and applicant counts, without Talent Pool/Analytics/Settings links
- [ ] **DASH-02**: Recruiter dashboard displays live stats (active jobs, applications, avg match score)
- [ ] **DASH-03**: Recruiter dashboard shows real application trend chart (last 30 days) using shadcn Chart
- [ ] **DASH-04**: All data-fetching areas show shadcn Skeleton loaders while loading

### Job Management

- [ ] **JOB-01**: Recruiter can unpublish a job (hides from feed) and republish it (returns to feed)
- [ ] **JOB-02**: Analytics page (/recruiter/analytics) is removed
- [ ] **JOB-03**: Grid/list view toggle and filter section removed from active jobs page

### Settings & Auth

- [ ] **SET-01**: Recruiter settings has 3 tabs only: Profile (incl. company), Security, Billing
- [ ] **SET-02**: Recruiter can change password from Security tab
- [ ] **SET-03**: Recruiter can delete account from Security tab (with confirmation + Stripe cancellation)
- [ ] **SET-04**: Seeker settings has profile update flow (resume upload, all profile fields)
- [ ] **SET-05**: Seeker can change password from settings
- [ ] **SET-06**: Seeker settings has no 2FA, export data, or notification options
- [ ] **AUTH-01**: Logged-in users (both roles) are redirected to their dashboard from homepage
- [ ] **AUTH-02**: Header shows avatar dropdown with sign-out option (not in sidebar)

### Seeker Dashboard

- [ ] **SKR-01**: Seeker dashboard shows real profile completeness score (dynamic Profile Strength)
- [ ] **SKR-02**: Seeker dashboard shows real applied/viewed/interviews counts (dynamic Quick Stats)
- [ ] **SKR-03**: Jobs user already applied to are hidden from dashboard recommendations
- [ ] **SKR-04**: Seeker nav header is bolder, Settings tab removed (only Jobs + Applied Jobs)

### Seeker Engagement (New)

- [ ] **ENG-01**: Seeker sees which skills are missing on low-match jobs ("You need Docker and AWS")
- [ ] **ENG-02**: Seeker receives weekly email digest with top matched jobs via Resend
- [ ] **ENG-03**: Seeker dashboard shows skill gap tracker widget (missing skills across matched jobs)

### Recruiter Intelligence (New)

- [ ] **INT-01**: Recruiter sees AI-generated one-line summary per candidate in applicant drawer
- [ ] **INT-02**: Recruiter sees real analytics (views/job, apply rate, top skills, avg match score)
- [ ] **INT-03**: Recruiter can boost a job to pin it at top of matched seeker feeds for 7 days

### Cleanup

- [ ] **CLN-01**: All notification flows and bell icon removed from both seeker and recruiter
- [ ] **CLN-02**: 2FA and export data features removed from all settings pages

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Real-time chat between recruiter and seeker
- **ADV-02**: Mobile app (React Native)
- **ADV-03**: Two-factor authentication (2FA)
- **ADV-04**: Data export functionality
- **ADV-05**: In-app notification system (push + bell)
- **ADV-06**: Talent Pool feature for recruiter saved candidates

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to job matching value |
| Mobile app | Web-first approach, defer to v2+ |
| 2FA | Complexity vs. value tradeoff, defer to v2 |
| Data export | Low priority, removed from all flows |
| Notification system | Removed entirely — email digest replaces passive notifications |
| Talent Pool | Deferred from recruiter flow |
| Embedded payment forms | Using Stripe Checkout (redirect) — no need for custom card input UI |
| LangChain / complex AI chains | Overkill for single-prompt candidate summaries |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 8 | Pending |
| BUG-02 | Phase 8 | Pending |
| BUG-03 | Phase 8 | Pending |
| BUG-04 | Phase 9 | Pending |
| PAY-01 | Phase 11 | Pending |
| PAY-02 | Phase 11 | Pending |
| PAY-03 | Phase 11 | Pending |
| PAY-04 | Phase 11 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-02 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-04 | Phase 9 | Pending |
| JOB-01 | Phase 8 | Pending |
| JOB-02 | Phase 9 | Pending |
| JOB-03 | Phase 9 | Pending |
| SET-01 | Phase 10 | Pending |
| SET-02 | Phase 10 | Pending |
| SET-03 | Phase 10 | Pending |
| SET-04 | Phase 10 | Pending |
| SET-05 | Phase 10 | Pending |
| SET-06 | Phase 10 | Pending |
| AUTH-01 | Phase 10 | Pending |
| AUTH-02 | Phase 10 | Pending |
| SKR-01 | Phase 12 | Pending |
| SKR-02 | Phase 12 | Pending |
| SKR-03 | Phase 12 | Pending |
| SKR-04 | Phase 12 | Pending |
| ENG-01 | Phase 12 | Pending |
| ENG-02 | Phase 12 | Pending |
| ENG-03 | Phase 12 | Pending |
| INT-01 | Phase 13 | Pending |
| INT-02 | Phase 13 | Pending |
| INT-03 | Phase 13 | Pending |
| CLN-01 | Phase 8 | Pending |
| CLN-02 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after roadmap creation*
