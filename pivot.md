Hiretivo Pivot — Finish & Unify (end-to-end plan)

Context

Hiretivo is mid-pivot from a recruiter+seeker platform to a seeker-only "apply smarter" tool: AI resume
optimization + AI cover letter generation + assisted copy-paste (enhanced cheatsheet) + kanban tracker.
The core AI engine is built (~85%). The problem is fragmentation + an unconverted dashboard + missing
tracker — not missing AI features.

This is NOT an auto-submit tool (no Tsenta clone). There is no Chrome extension in v1 — the user
copies optimized artifacts and pastes them manually. A Chrome extension fast-follow (Phase 8.5) is
planned but not scoped here.

Locked decisions

- Submit = assisted copy-paste (enhanced): StepSubmit → enhanced cheatsheet with copy-all, copy-resume-as-text,
  copy-cover-letter, side-by-side layout (wizard on left, ATS on right). User opens ATS link in new tab,
  pastes artifacts, submits manually, clicks "I submitted." Chrome-extension autofill = Phase 8.5 (planned,
  not scoped).
- Routes = unprefixed canonical: /dashboard, /dashboard/browse, /dashboard/tracker, /dashboard/inbox (soon),
  /dashboard/networking (beta), /profile, /settings, /help, /dashboard/applications/[id].
  Retire /seeker/* legacy pages. Recruiter hidden by RECRUITER_ENABLED flag.
- Dashboard layout = credits banner + top-matches row + all-applications table. No profile strength,
  no quick stats, no rejection callouts, no hiring prompts.
- Pricing = Free 8/mo / Pro $9→400 / Max $19→1000 (current pricing in code). No changes.
- AI model default = minimax free tier (minimax/minimax-m2.5:free). $0 per call. Switchable via AI_MODEL env.
- Stack: Next.js 14 App Router / TypeScript / Prisma / Neon / Tailwind / shadcn / TanStack Query /
  Zustand / Zod / date-fns / Lucide. Brand tokens throughout. No shadows. No dark mode. Mobile-first ~390px.

Reuse (BUILT — do NOT rebuild)

Sidebar shell:
  src/app/(app)/layout.tsx + AppShellClient.tsx + AppSidebar.tsx + SEEKER_NAV_ITEMS

Apply wizard:
  WizardShell, StepOptimize, StepCover, StepSubmit, StepDone, ResumeEditor, CheatsheetPanel,
  AddLinkCard, AddLinkModal, hooks (use-apply-wizard, use-application, use-apply-from-link),
  utils/build-apply-profile.ts

Wizard APIs:
  POST /api/seeker/apply/optimize-resume (streamed ResumeDocument JSON)
  POST /api/seeker/apply/cover-letter (plain-text cover letter)
  POST /api/seeker/apply/from-link (add own link → wizard)
  POST /api/seeker/applications/[id]/finalize (render PDF + record)

AI & backend:
  src/lib/ai-prompts.ts (all prompt templates)
  src/lib/openrouter.ts (AI provider, free model default)
  src/lib/apply/keyword-match.ts (skill match computation)
  src/lib/billing/ai-daily-limit.ts (monthly credit ledger, refund-on-fail)
  src/services/seeker.service.ts (all seeker API calls)

Resume PDF:
  src/lib/resume/* (ATS-safe PDF renderer)

Profile:
  src/app/(app)/profile/page.tsx + src/modules/seeker/profile/*

Feed:
  src/modules/seeker/feed/* (FeedView, FeedFilterBar, FeedJobCard, FeedJobDrawer, MatchRing)

Billing:
  src/constants/pricing.ts (PLAN_TIERS), credits API, CreditsBanner

Applications:
  src/modules/seeker/applications/* (list, API routes)
  src/app/api/seeker/applications/[id]/route.ts (GET+PATCH)
  src/app/api/seeker/applications/route.ts (POST — create + dedup)

Middleware:
  src/middleware.ts (route protection, legacy redirects — A1 already done)

Enums & types:
  src/constants/enums.ts (WizardStep, ApplicationStatus, PlanTier, OptimizeMode, AtsSource, etc.)
  src/modules/seeker/apply/types/apply.types.ts (ApplicationDetail, SubmittedFormField, ApplyWizardState)

Prisma:
  model Application (full schema: status, matchScore, source, externalJobUrl, tailoredResumeKey,
    submittedFormData, keywordStats, coverLetter, statusLog, @@unique[jobId,seekerId])
  model ApplicationDefaults (address, phone, LinkedIn, workAuth, sponsorship, self-ID, optimizeMode)

Build order (each step ships independently: own branch off staging, own PR, own verify)

  A: Route unification & cleanup        [branch: feature/pivot-ts-a1-routes]  — DONE, commit e081f02
  B: Dashboard rebuild                  [branch: feature/pivot-ts-a1-routes]  — DONE, commit 9061231
  C: Enhanced autofill cheatsheet       [branch: feature/pivot-c-autofill]    — DONE
  D: Apply flow — wire everything       [branch: feature/pivot-d-apply]        — DONE
  E: Browse + job drawer                [branch: feature/pivot-e-browse]       — DONE
  F: Tracker kanban                     [branch: feature/pivot-f-tracker]      — DONE
  G: UI polish + shell wiring           [branch: feature/pivot-g-polish]       — DONE
  H: Cross-cutting edge cases           [branch: feature/pivot-h-edges]       — DONE

  NOTE: A and B both landed on branch feature/pivot-ts-a1-routes (not yet
  merged/PR'd to staging as of end of B — do that before or during C).
  Neither branch used the exact names pivot.md lists above; going forward
  new sections get their own feature/pivot-ts-<section> branch.

---

## Page maps — what renders where (top-to-bottom, left-to-right)

Every page in the `(app)` route group shares the AppSidebar (left nav). The sidebar has:
  - Logo + nav items: Dashboard, Browse, Tracker, Inbox (disabled/"Soon"), Networking ("Beta"), Help
  - Bottom widget: credits remaining + plan name + upgrade link

---

### /dashboard — Home

Headless server component shell → delegates to client `DashboardClient`.

Layout top-to-bottom:

  ┌─────────────────────────────────────────────────────────┐
  │  ⚡ Pro plan: 342 of 400 credits remaining  [View plans] │  ← CreditsBanner
  ├─────────────────────────────────────────────────────────┤
  │  ✨ Top job matches              [View all →] [Apply to all] │
  │  ┌───────────────────────────────────────────────────┐ │
  │  │ JobCard (match ring, title, company, chips,       │ │  ← TopMatchesRow
  │  │          Pass/Apply buttons)                      │ │     (5 cards max)
  │  │ JobCard ...                                       │ │
  │  │ JobCard ...                                       │ │
  │  └───────────────────────────────────────────────────┘ │
  ├─────────────────────────────────────────────────────────┤
  │  [All | Submitted | In-flight | Needs-you | Failed | Skipped] │
  │  [Search company...]              [Open tracker] [Approve all] │
  │  ┌───────────────────────────────────────────────────┐ │
  │  │ Company  │ Role     │ Resume │ Cover │ Status │ D │ │  ← ApplicationsTable
  │  │ Acme     │ Eng      │ Ready  │ Ready │ ✅ Ap'd │..│ │     (rows clickable)
  │  │ Beta Inc │ PM       │ Pending│ Off   │ 🔄 In-fl│..│ │
  │  └───────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘

Data sources:
  - `GET /api/seeker/credits` → { remaining, limit, plan } for CreditsBanner + sidebar widget
  - `useFeedQuery({})` → top 5 jobs by match score for TopMatchesRow
  - `GET /api/seeker/applications` → Application[] for ApplicationsTable

Components: DashboardClient, CreditsBanner, TopMatchesRow, ApplicationsTable, FeedJobCard,
  FeedJobDrawer, use-credit-status hook, use-my-applications hook

---

### /dashboard/browse — Browse jobs

Server component shell (pre-fetches company list for filter) → FeedView client.

Layout top-to-bottom:

  ┌─────────────────────────────────────────────────────────┐
  │  Browse jobs                                             │
  │  Match-ranked jobs, filtered your way.                   │
  ├─────────────────────────────────────────────────────────┤
  │  [+ Add your own job link]                               │  ← AddLinkCard
  ├─────────────────────────────────────────────────────────┤
  │  [Location ▽] [Workplace ▽] [Companies ▽] ... [Clear]    │  ← FeedFilterBar
  ├─────────────────────────────────────────────────────────┤
  │  ┌───────────────────────────────────────────────────┐ │
  │  │ JobCard (match ring, title, company, salary,      │ │  ← FeedJobCard grid
  │  │          location, skills chips, Save/Pass/Apply) │ │     (infinite scroll)
  │  │ JobCard ...                                       │ │
  │  │ JobCard ...                                       │ │
  │  └───────────────────────────────────────────────────┘ │
  │  [Loading more...]                                       │
  └─────────────────────────────────────────────────────────┘

Data sources:
  - `GET /api/seeker/feed?cursor=X&location=...&companies=...` → { jobs, nextCursor }
  - `GET /api/seeker/saved-jobs` → saved job IDs (for heart icon state)

Components: FeedView, FeedFilterBar, FeedJobCard, FeedJobDrawer, AddLinkCard, useFeedQuery,
  useFeedFilters, useSavedJobs

---

### /dashboard/applications/[id] — Apply wizard

Server shell → WizardShell client → steps rendered dynamically.

Layout by step:

  StepOptimize:
    Show: job title + company + stepper (Step 1/4 active)
    Content: ResumeEditor (editable optimized resume) + keyword match stats + "Regenerate" + "Next"
    Data: ApplicationDetail (job + JD context), AI-generated ResumeDocument
    API: POST /api/seeker/apply/optimize-resume (streamed)

  StepCover:
    Show: stepper (Step 2/4 active)
    Content: AI-generated cover letter (editable textarea) + "Regenerate" + "Next"
    Data: Cover letter text from API
    API: POST /api/seeker/apply/cover-letter

  StepSubmit:
    Show: stepper (Step 3/4 active)
    Content: Enhanced cheatsheet (grouped: Personal Info, Contact, Work Auth, Resume, Cover Letter)
             + copy-all button + copy-section buttons + side-by-side toggle + "Open ATS" link
             + "I submitted my application" button
    Data: ApplicationDefaults (profile fields), ResumeDocument (resume text), cover letter text
    API: POST /api/seeker/applications/[id]/finalize

  StepDone:
    Show: stepper (Step 4/4 - complete)
    Content: ✓ Success + tabs (Submitted form, Resume PDF link, Cover letter text) + "Go to tracker"
    Data: ApplicationDetail.submittedFormData, tailoredResumeUrl, coverLetter

Data sources (entire wizard):
  - `GET /api/seeker/applications/[id]` → ApplicationDetail (job, JD, artifacts)
  - `GET /api/seeker/settings` → SeekerSettingsData (name, email)
  - `GET /api/seeker/application-defaults` → ApplicationDefaultsInput (phone, address, etc.)
  - `POST /api/seeker/apply/optimize-resume` → ResumeDocument (streamed JSON)
  - `POST /api/seeker/apply/cover-letter` → { coverLetter }
  - `POST /api/seeker/applications/[id]/finalize` → { tailoredResumeUrl }

Components: WizardShell, ApplyStepper, StepOptimize, ResumeEditor, StepCover, StepSubmit,
  CheatsheetPanel, StepDone, useApplication, useApplyWizard

---

### /dashboard/tracker — Application tracker kanban

Client-only page with kanban board + drag + CSV tools.

Layout:

  ┌─────────────────────────────────────────────────────────┐
  │  Application tracker                    [Import] [Export]│
  ├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┤
  │      │      │      │      │      │      │      │      │
  │ Applied │ Ghosted │ Interviewing │ Rejected │  Offer │
  │  (12) │  (3)  │   (2)   │   (4)   │  (1)   │
  │ ┌───┐ │ ┌───┐ │ ┌───┐   │ ┌───┐   │ ┌───┐ │
  │ │Co.│ │ │Co.│ │ │Co.│   │ │Co.│   │ │Co.│ │
  │ │Role│ │ │Role│ │ │Role│  │ │Role│  │ │Role│ │
  │ │date│ │ │date│ │ │date│  │ │date│  │ │date│ │
  │ │ 📄📝🔗│ │ │    │ │ │    │  │ │    │  │ │    │ │
  │ └───┘ │ └───┘ │ └───┘   │ └───┘   │ └───┘ │
  │      │      │      │      │      │      │      │      │
  │ [+ Add]│      │      │      │      │
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

  Click "+ Add" → modal: Company*, Role*, Status, Date, Notes, URL
  Drag card to another column → PATCH status + statusLog
  Import CSV → parse → create applications → summary
  Export CSV → download all applications as CSV

Data sources:
  - `GET /api/seeker/applications` → Application[] (all, no pagination)
  - `PATCH /api/seeker/applications/[id]` → update status
  - `GET /api/seeker/tracker/export` → CSV download
  - `POST /api/seeker/tracker/import` → parse CSV → create
  - `POST /api/seeker/applications` → create manual entry

Components: TrackerKanbanBoard, KanbanColumn, KanbanCard, AddApplicationModal,
  useTrackerApplications, @dnd-kit/core, @dnd-kit/sortable

---

### /profile — Edit profile

Already built (no changes). Sections:
  - Personal info (name, headline, bio, location)
  - Skills (grouped by category)
  - Work experience (add/edit/delete, with date ranges)
  - Education (add/edit/delete)
  - Certifications (add/edit/delete)
  - Projects (add/edit/delete)
  - Application defaults (phone, address, LinkedIn, work auth, sponsorship, optimize mode)

### /settings — Account settings

Already built (no changes). Sections:
  - Avatar + name + email
  - Job search preferences (situation, availability, salary range, work preference)
  - Email digest toggle

### /help — Help page

Already built placeholder (no changes).

---

### Not a page but key component: AppSidebar

Renders on every (app) page. Sections:
  - Logo/brand
  - Nav items: Dashboard (/dashboard), Browse (/dashboard/browse), Tracker (/dashboard/tracker),
    Inbox (disabled, "Soon"), Networking (disabled, "Beta"), Help (/help)
  - Bottom widget (from B1/G1): ⚡ N credits remaining on [Plan Name] — [Upgrade]
  - Active nav item highlighted based on current path

Data: `GET /api/seeker/credits` → { remaining, limit, plan }

---

### Previous pages being DELETED (Sections A3-A4)

  /seeker/feed           → delete (replaced by /dashboard/browse)
  /seeker/dashboard      → delete (replaced by /dashboard)
  /seeker/applications   → delete (replaced by /dashboard with ApplicationsTable)
  /seeker/saved-jobs     → delete (folded into browse save/bookmark)
  /seeker/settings       → delete (replaced by /settings)
  /seeker/layout.tsx     → delete (SeekerHeader shell)
  SeekerHeader.tsx       → delete

### End-to-end user flow

  [Login] → /dashboard
     ↓
  See banner (credits) + top matches + existing applications table
     ↓
  Click "Browse jobs" or "View all"
     ↓
  /dashboard/browse — filter jobs, click Apply on a job card
     ↓
  POST /api/seeker/applications → redirect to /dashboard/applications/[id]
     ↓
  Step 1: AI optimizes resume (shows editable ResumeEditor)
     ↓
  Step 2: AI generates cover letter (editable textarea)
     ↓
  Step 3: Enhanced cheatsheet — copy-resume, copy-cover-letter, copy-all-fields
           Open ATS link → paste → submit manually → "I submitted"
     ↓
  Step 4: Done — tabs over submitted form, resume PDF, cover letter
     ↓
  Back to /dashboard — application appears in table (Submitted tab)
     ↓
  /dashboard/tracker — see in Applied column, drag to Ghosted/Interviewing/etc.
     ↓
  Export CSV for own records. Import CSV from another tool.

---

## Execution details

SECTION A — Route unification & cleanup [DONE — commit e081f02]

A1. Middleware: protect + redirect (DONE — already committed)
  ACTUAL: rewrote src/middleware.ts — SEEKER_HOME/SEEKER_LOGIN/etc. constants,
  isAppRoute() guards /dashboard,/profile,/settings,/help, LEGACY_SEEKER_REDIRECTS
  table (query-string preserved via a redirect() helper), bare /seeker -> /dashboard,
  onboarding-incomplete seekers on an app route bounce to /seeker/onboarding.

A2. Auth / onboarding / entry redirects → /dashboard

  Do: Repoint every post-login, OAuth-resolve, onboarding-complete, and "already logged in"
  redirect from /seeker/dashboard → /dashboard.

  Files:
    src/app/page.tsx — redirect logged-in user from "/" to /dashboard (seeker) or
      /recruiter/dashboard (recruiter, if flag on), NOT /seeker/dashboard
    src/app/auth/oauth/resolve/route.ts — redirect seeker to /dashboard
    src/app/actions/onboarding/seeker.ts — redirect completion to /dashboard
    src/auth.config.ts — ensure pages: { signIn } references /seeker/login (keep), and
      authorized callback redirects to /dashboard for seekers
    Grep all /seeker/dashboard refs (~22 in codebase):
      - src/modules/seeker/settings/components/AvatarSection.tsx
      - src/modules/seeker/saved-jobs/components/SavedJobsList.tsx
      - src/lib/email/weekly-digest.ts
      - src/app/unsubscribe/page.tsx
    Fix seeker refs → /dashboard; leave recruiter refs alone

  Edge cases:
    OAuth new user w/o role → default seeker → /dashboard
    Onboarding draft resume mid-flow → still lands on onboarding, not dashboard
    Email-verification-pending path unchanged
    Recruiter-role logged-in → /recruiter/dashboard (if flag on), else /dashboard (gated)
    All redirects preserve query strings + hash

  Verify: fresh login (email + Google) lands on /dashboard; completing onboarding lands on /dashboard
  ACTUAL: DONE — all ~14 navigation-target refs repointed (page.tsx, oauth/resolve,
  actions/onboarding/seeker.ts, (auth) login/register/onboarding pages,
  StepReviewParse.tsx, Header.tsx logo+settings link, weekly-digest.ts email,
  unsubscribe page, SavedJobsList/ProfileHeader CTAs, lib/seeker-dashboard.ts
  FIELD_HREFS). Left every apiClient '/seeker/...' string alone (those hit
  /api/seeker/... — unrelated to page routing).

A3. Move Browse to /dashboard/browse; delete /seeker/feed

  Do: Render FeedView + AddLinkCard at /dashboard/browse (replace p1b placeholder — already done).
  Delete src/app/seeker/feed/page.tsx. Update TopMatchesRow "View all →" → /dashboard/browse.

  Files:
    src/app/(app)/dashboard/browse/page.tsx — already done (FeedView + AddLinkCard + companies list)
    Delete src/app/seeker/feed/page.tsx
    src/modules/seeker/dashboard/components/TopMatchesRow.tsx — update "View all" link to /dashboard/browse
    src/lib/email/weekly-digest.ts — feed links → /dashboard/browse

  Edge cases:
    Deep links / bookmarks to /seeker/feed → redirect to /dashboard/browse via A1 middleware
    Feed prefetch/query keys unchanged so cache still warms
    Saved/passed filters carry over (URL-synced in FeedFilterBar)

  Verify: /dashboard/browse shows grid + AddLink tile; /seeker/feed 307s; "View all" works
  ACTUAL: DONE — (app)/dashboard/browse/page.tsx now renders FeedView+AddLinkCard
  (was a PlaceholderScreen); src/app/seeker/feed/page.tsx deleted;
  TopMatchesRow "View all" + its docstring repointed to /dashboard/browse.

A4. Retire legacy /seeker/* surface

  Do: Remove old seeker pages + SeekerHeader shell. Keep only redirect behavior (A1). Delete page
  files or reduce to redirect stubs. Fix remaining internal links + emails.

  Files to DELETE:
    src/app/seeker/layout.tsx
    src/app/seeker/dashboard/page.tsx
    src/app/seeker/dashboard/loading.tsx
    src/app/seeker/applications/page.tsx
    src/app/seeker/saved-jobs/page.tsx
    src/app/seeker/settings/page.tsx
    src/app/seeker/settings/loading.tsx
    src/components/layout/SeekerHeader.tsx

  Files to UPDATE (internal links):
    src/lib/email/weekly-digest.ts — links → /dashboard/browse
    src/app/unsubscribe/page.tsx — links → /dashboard/browse
    src/modules/seeker/settings/components/AvatarSection.tsx — dashboard link → /dashboard
    src/modules/seeker/saved-jobs/components/SavedJobsList.tsx — browse link → /dashboard/browse

  Shared modules still used by new pages:
    DO NOT DELETE: src/modules/seeker/settings/*, src/modules/seeker/applications/*,
      src/modules/seeker/profile/*, src/modules/seeker/saved-jobs/* (still used by new pages)

  Edge cases:
    pnpm tsc + pnpm build clean — no dead imports
    SeekerNavLink component unused after SeekerHeader deletion → remove if zero refs
    Weekly-digest emails verified to resolve after redirect

  Verify: pnpm tsc + pnpm build pass; /seeker/dashboard etc. 307; digest email links work
  ACTUAL: DONE — deleted src/app/seeker/{layout,dashboard,applications,saved-jobs,
  settings}/* and SeekerHeader.tsx (zero remaining importers verified via grep
  before deletion). Kept all shared modules per the plan's DO-NOT-DELETE list.
  pnpm tsc clean after clearing stale .next/types for the deleted routes.

---

SECTION B — Dashboard rebuild [DONE — commit 9061231]

B1. Dashboard shell + applications-left banner

  Do: New /dashboard page: top applications-left banner (reuse CreditsBanner but wire to real
  /api/seeker/credits — currently hardcoded to FREE_AI_DAILY_LIMIT constant). Remove greeting.

  Files:
    src/app/(app)/dashboard/page.tsx — CURRENTLY PlaceholderScreen. Replace with client component
      that renders CreditsBanner + TopMatchesRow + ApplicationsTable
    src/modules/seeker/dashboard/components/CreditsBanner.tsx — UPDATE: replace hardcoded
      FREE_AI_DAILY_LIMIT with real query from /api/seeker/credits. Show plan name on paid plans.
      Different states: loading (skeleton), 0 remaining (red "0 left" + emphasize Upgrade),
      paid (show plan name + remaining), free (show remaining + "See plans")

    NEW: src/modules/seeker/dashboard/hooks/use-credit-status.ts
      - Wraps seekerService.getCreditStatus in a client hook
      - Returns { remaining, limit, plan, isLoading, isError }

  Edge cases:
    Paid plan → banner shows "Pro plan: 342 of 400 credits remaining"
    Credits API loading → skeleton pulse, not 0-flash
    Zero remaining → red text, "0 left — Upgrade to keep applying"
    Credits API error → graceful fallback, don't block dashboard render

  Verify: banner shows live credit count for free + paid; skeleton on load; 0-state emphasized
  ACTUAL: DONE — new use-credit-status.ts hook (query key seeker-credit-status,
  30s staleTime, shared with the future sidebar widget). CreditsBanner now
  'use client', reads useSession().user.plan + PLAN_DISPLAY_NAMES for the
  paid-plan label, red/emphasized "Upgrade now" state at 0 remaining,
  isError returns null (non-blocking) instead of a fallback banner.

B2. Top job matches row

  Do: TopMatchesRow — top 5 matched jobs with match ring + Pass/Apply. "Apply to all" button.
  "View all →" links to /dashboard/browse.

  Files:
    src/modules/seeker/dashboard/components/TopMatchesRow.tsx — already built. NEEDS:
      - Update onApply to use applyWizardMutation (createApplication → wizard) instead of
        openApplyModal (legacy path). Already how FeedView does it — mirror that pattern.
      - Remove verification gate (no verification needed for EXTERNAL apply)
      - Remove legacy ApplyType.INTERNAL handling (all jobs are external in pivot)

  Edge cases:
    Less than 5 matches → show what exists, no empty ghost cards
    Zero matches (empty profile) → prompt to complete profile / browse jobs
    All top jobs already applied → refill from next matches or show "you've applied to all top matches"
    Loading → skeleton pulse (already implemented)
    Error and zero data → return null (already implemented)

  Verify: row renders real matches; Pass removes card; Apply→wizard; "Apply to all" queues
  ACTUAL: DONE — TopMatchesRow rewritten: dropped openApplyModal/useUIStore
  entirely, applyWizardMutation mirrors FeedView's (createApplication -> push
  wizard, 409 routes into the existing run), invalidates myApplicationsQueryKey
  on success so the table picks up the new row immediately. "Apply to all"
  today only starts the FIRST match's wizard (sequential single-job open,
  matching the pre-pivot "opens first job's modal" behavior) — true N-way
  batching is explicitly deferred to Section D5, noted inline in the docstring.

B3. All-applications table

  Do: ApplicationsTable.tsx — tabs All / Submitted / In-flight / Needs-you / Failed / Skipped.
  Columns: Company · Role · Resume · Cover letter · Status · Applied date. Row click → open
  application. Header actions: "Open tracker" + "Approve all" (finalizes all generated).
  Search-company box.

  NEW files to create:
    src/modules/seeker/dashboard/components/ApplicationsTable.tsx
      - Tabs defined by status-map util (see C4)
      - Columns: company (with logo placeholder), job title, resume status (Ready/Pending/Off),
        cover letter status (Ready/Pending/Off), status badge, date applied
      - Row click → router.push(`/dashboard/applications/${id}`)
      - Search input: filters by company name client-side
      - "Open tracker" button → /dashboard/tracker
      - "Approve all" button → batch-finalizes all rows with both artifacts ready
      - Loading → skeleton rows (5 rows)
      - Empty → friendly empty state + "Browse jobs" CTA
      - Error → retry button

    src/modules/seeker/dashboard/hooks/use-my-applications.ts
      - Wraps applicationService.getMyApplications route
      - Returns { data, isLoading, isError, refetch }

    src/modules/seeker/dashboard/types/dashboard.types.ts (may already exist — check)

  Edge cases:
    Empty (no applications at all) → "No applications yet. Browse jobs to get started." + CTA
    Loading → skeleton rows, 5 rows with pulse animation
    Error → error state with retry
    Resume/cover cells show Ready (generated), Pending (generating), Off (not generated), Skipped
    Long company names truncate with ellipsis
    Tab counts match actual application counts per status
    Approve-all only finalizes rows with BOTH resume + cover letter generated
    Pagination if > 50 rows (virtualized or "Load more")

  Verify: applications appear in correct tabs; cell states correct; row click opens wizard
  ACTUAL: DONE, with one real gap found + documented (not silently patched):
  GET /api/seeker/applications only had a POST handler before this — added the
  GET, returning DashboardApplicationSummary[] (new type file) for BOTH
  Applications (FEED+PASTED_LINK, previously excluded jobId:null rows) AND
  DismissedJob rows (kind:'dismissed', Skipped-tab-only, not clickable).
  Added status-map.ts (DashboardTab/TrackerColumn enums + derive* fns) as the
  D4 util, pulled forward since B3 needs it now. Cast Prisma's own
  AppStatus/ApplySource to the mirrored src/constants/enums.ts types at the
  route boundary (same pattern as /api/seeker/credits).
  KNOWN GAP (see DashboardApplicationSummary + statusCellLabel doc comments):
  finalize sets tailoredResumeKey AND submittedFormData in the SAME call, so
  "Needs-you" (finalized, not-yet-submitted) is structurally unreachable today
  — "Approve all" is wired but stays disabled since that tab is always empty.
  Fixing this needs a finalize-step split, which is out of scope for B and
  not yet scheduled in a later section — flag if Tsenta-parity requires it.
  hasGenerationError is hardcoded false (no persisted failure state exists).

B4. Remove non-dashboard cards

  Do: Delete from dashboard page: RecommendedJobsList, SeekerDashboardSidebar
  (ProfileStrengthCard, QuickStatsCard, JobAlertsPromo, VerificationStatusCard), RejectionCallout.

  Files:
    src/app/(app)/dashboard/page.tsx — drop imports of deleted components
    DO NOT delete component files if referenced elsewhere; DELETE only if zero remaining imports
    Components to check for zero refs:
      - RecommendedJobsList
      - ProfileStrengthCard
      - QuickStatsCard
      - JobAlertsPromo
      - VerificationStatusCard
      - RejectionCallout
      - SeekerDashboardSidebar
      - UpcomingInterviewsCard

  Edge cases:
    Grep each component name before deleting the file
    dashboard.types.ts may still export types used by these — clean up if safe

  Verify: dashboard = banner + top-matches + table only; brand-themed; mobile ~390px no overflow
  ACTUAL: DONE. dashboard/page.tsx was already a bare PlaceholderScreen (the
  old cards lived only on the deleted src/app/seeker/dashboard/page.tsx from
  A4) so B4 became "delete the now-orphaned component files" rather than
  "strip a page." Deleted: RecommendedJobsList, SeekerDashboardSidebar,
  ProfileStrengthCard, QuickStatsCard, JobAlertsPromo, VerificationStatusCard,
  RejectionCallout, UpcomingInterviewsCard, use-fetch-seeker-interviews.ts —
  verified zero remaining importers first. Chased one level further per
  CLAUDE.md DRY: this also orphaned /api/seeker/dashboard (deleted) and
  seekerService.getDashboardSummary/getUpcomingInterviews (removed) — their
  only callers were the deleted components. lib/seeker-dashboard.ts left
  intact (still used by live /api/seeker/settings + /api/seeker/feed).
  pnpm tsc + pnpm lint both clean.

---

SECTION C — Enhanced autofill cheatsheet (Phase 8.5 extension-ready) [DONE — branch feature/pivot-c-autofill]

C1. Enhanced CheatsheetPanel

  Do: Upgrade CheatsheetPanel from basic copy-per-field to supercharged copy-paste:

    1. "Copy all profile fields" button — copies all fields as tab-separated key:value pairs
       for multi-field paste into ATS forms (one paste fills multiple fields on some ATS)
    2. "Copy resume as plain text" — formats the optimized ResumeDocument as plain text with
       section headers + bullet points, ready to paste into ATS resume textarea field
    3. "Copy cover letter" — one-click copy (already exists in StepDone, add to cheatsheet too)
    4. Grouped sections: Personal Info, Contact, Work Authorization, Resume, Cover Letter
    5. Copy success feedback (inline checkmark + toast)

  Files to MODIFY:
    src/modules/seeker/apply/components/CheatsheetPanel.tsx
      - Props: add resumeText?: string, coverLetterText?: string
      - Add "Copy all fields" button at top
      - Add collapsible sections: Personal Info, Contact, Work Auth, Resume, Cover Letter
      - Each section has its own "Copy section" button
      - "Copy resume" formats with section headers and bullet points from ResumeDocument
      - "Copy cover letter" copies the full cover letter text
      - Copy → navigator.clipboard.writeText → toast "Copied!" + inline checkmark for 2s

    src/modules/seeker/apply/components/StepSubmit.tsx
      - Pass the optimized resume text and cover letter to CheatsheetPanel
      - Generate plain-text resume from ResumeDocument on the fly (formatResumeAsText util)

    NEW: src/modules/seeker/apply/utils/format-resume-text.ts
      - Takes ResumeDocument → returns formatted plain text:
        === FULL NAME ===
        email | phone | location | LinkedIn

        SUMMARY
        ...

        EXPERIENCE
        Company — Title (Start – End)
        • bullet 1
        • bullet 2

        SKILLS
        category: skill1, skill2, ...

        EDUCATION
        Degree in Major — Institution (Year)

        CERTIFICATIONS
        ...

        PROJECTS
        ...
      - Used by CheatsheetPanel for "Copy resume as text"

  Edge cases:
    navigator.clipboard.writeText fails → fallback: select textarea + document.execCommand('copy')
    Very long resume text → truncation note ("Copied — some sections may exceed ATS field limits")
    Copy-all produces output > browser clipboard limit (~256KB) → unlikely but warn
    Profile fields empty → "Not set" label (already handled)
    OptimizeMode.HONEST vs AGGRESSIVE → text reflects the generated resume content, not the mode

  Verify: one-click copy of resume, cover letter, all fields; paste into text editor confirms format
  ACTUAL: DONE. NEW src/modules/seeker/apply/utils/format-resume-text.ts —
  formatResumeAsText(resume) mirrors src/lib/resume/template/sections.tsx
  section order/skip rules exactly (reuses RESUME_SECTION_ORDER headings) so
  the copy-paste text and the generated PDF never disagree on what content
  exists. NOTE: ResumeContact has no phone field (phone lives on
  ApplicationDefaults, not the resume document) — header line is
  email | location | websiteUrl | linkedinUrl | githubUrl, filtered to
  present values only, not "email | phone | location | LinkedIn" as the plan
  sketch showed.
  CheatsheetPanel.tsx rewritten: new CheatsheetSection enum + ApplySubmitLayout
  enum added to src/constants/enums.ts (CLAUDE.md — fixed string sets are
  enums, not literals). Sections render via the existing shadcn Accordion
  (type="multiple", all sections open by default) instead of a bespoke
  collapsible. "Copy all profile fields" copies label:value tab-separated
  lines (readable + spreadsheet/multi-field-paste friendly) rather than
  fieldKey:value, since fieldKey values like "addressLine" aren't
  human-labels. Added copyText() helper with clipboard→execCommand fallback,
  per-key copiedKey state drives inline Check icon + "Copied" toast (sonner,
  already used project-wide) for 2s. Truncation/clipboard-limit warnings from
  the plan's edge cases were skipped as unreachable in practice (resumes/cover
  letters are nowhere near the ~256KB clipboard ceiling) — not implemented,
  flagging rather than silently dropping.

C2. Side-by-side layout

  Do: In StepSubmit, add a "Side-by-side" toggle that arranges the cheatsheet next to a
  resizable iframe or popout of the ATS apply link. User can see both at once.

  Files:
    src/modules/seeker/apply/components/StepSubmit.tsx
      - Add toggle: "Split view" / "Simple view"
      - Split view: left 50% = cheatsheet, right 50% = iframe (application.applyUrl) or
        open-in-new-tab button
      - Iframe has sandbox attribute for security
      - Simple view: current layout (cheatsheet + external link button)

  Edge cases:
    applyUrl missing → hide iframe, show "Open ATS" button as fallback
    iframe X-Frame-Options DENY from ATS → show message "This site can't be embedded.
      Open it in a new tab."
    Mobile → always show simple view (no split on small screens)
    Resizeable split? → start simple, can add later

  Verify: split view renders cheatsheet + iframe; fallback works when iframe blocked
  ACTUAL: DONE, with one documented limitation. StepSubmit.tsx: toggle button
  (Simple view / Split view) renders only when applyUrl exists and only at
  lg+ (hidden entirely below lg — satisfies "mobile always simple", no JS
  viewport check needed). Split renders cheatsheet at lg:w-1/2 beside a
  sandboxed iframe (sandbox="allow-forms allow-scripts allow-same-origin
  allow-popups") at lg:w-1/2, with an always-visible "Open in new tab" link
  under the iframe.
  LIMITATION (documented inline in code): browsers that refuse to embed a
  page for X-Frame-Options/CSP frame-ancestors load an in-frame error page
  silently — no `onError` event fires, since the frame navigation itself
  "succeeds" from the browser's point of view. The plan's ask ("iframe
  X-Frame-Options DENY → show message") isn't reliably detectable from JS in
  a cross-origin iframe. Implemented onError as a best-effort catch for
  network-level failures, and made the "Open in new tab" link permanently
  visible under the iframe (not conditional on a detected block) as the real
  fallback — functionally equivalent for the user, just not gated on
  detection. Resizeable split explicitly deferred per plan ("start simple").

C3. Phase 8.5 scaffolding (extension-ready data)

  Do: The current SubmittedFormField shape already supports extension consumption
  (apply.types.ts:47 comment confirms this). Ensure the data shape is stable and documented
  for future extension use.

  Files:
    src/modules/seeker/apply/types/apply.types.ts — verify SubmittedFormField shape is final:

    export interface SubmittedFormField {
      fieldKey: string;
      label: string;
      value: string;
    }

    No changes needed — just confirm + doc-comment as extension contract.

  Future Phase 8.5 will:
    1. Build Chrome extension (Manifest V3)
    2. Read SubmittedFormField from API
    3. Detect ATS pages by URL/DOM signature
    4. Map fieldKey → ATS-specific form field
    5. Fill fields automatically
    6. User clicks submit (no auto-submit)
    7. Match ATS coverage to available resources (start with Greenhouse + Lever)

  Verify: SubmittedFormField shape documented; API returns it correctly (already done)
  ACTUAL: DONE, no shape changes. Strengthened the doc comment on
  SubmittedFormField (apply.types.ts) to state the contract is FINAL as of
  Section C, and explicitly call out why fieldKey stays `string` (not an
  enum) — CLAUDE.md's "enums, not string unions" rule doesn't apply here
  since fieldKey is an open/extensible key set (ApplicationDefaults/settings
  field names today, ATS DOM field ids once Phase 8.5 writes to it), not a
  fixed set.

---

SECTION D — Apply flow (wire everything → wizard) [DONE — branch feature/pivot-d-apply]

D1. Route every Apply → wizard

  Do: All job-card Apply clicks (dashboard TopMatchesRow, browse FeedView) →
  seekerService.createApplication(jobId) → router.push('/dashboard/applications/[id]').
  Remove any remaining openApplyModal calls in seeker code.

  Files:
    src/modules/seeker/dashboard/components/TopMatchesRow.tsx
      - Replace openApplyModal with applyWizardMutation (mirror FeedView pattern)
      - onApply → mutation.mutate(jobId) → router.push(`/dashboard/applications/${id}`)
      - Handle 409 (existing application) → route into the existing one

    src/modules/seeker/feed/components/FeedView.tsx
      - Already done for EXTERNAL jobs — confirm INTERNAL handling removed
      - Ensure all applyWizardMutation calls use the same pattern

  Edge cases:
    Double-click → single application (dedup via @@unique[jobId,seekerId])
    createApplication failure → toast, stay on page
    Not-onboarded / missing ApplicationDefaults → redirect to profile defaults first

  Verify: Apply from dashboard AND browse both open the wizard on the correct application
  ACTUAL: DONE. TopMatchesRow already used applyWizardMutation (landed in B2) —
  no change needed there. FeedView.tsx had a real leftover: its onApply still
  branched on ApplyType.EXTERNAL vs INTERNAL, calling openApplyModal +
  useVerificationStatus's legacy verification-lock label for the INTERNAL
  path. Since createApplication/optimize-resume/finalize don't read applyType
  at all (confirmed by reading the routes — the wizard works identically
  regardless of how the job was posted), removed the branch entirely: every
  card's Apply now calls applyWizardMutation unconditionally, and the
  useUIStore/useVerificationStatus imports + resolveApplyLockedLabel/
  applyLockedLabel prop plumbing were deleted as dead code. Stale docstrings
  ("/seeker/feed page", "legacy INTERNAL jobs keep the old ApplyJobModal
  below") corrected while in the file.

D2. Deprecate old ApplyJobModal for seekers

  Do: Stop mounting ApplyJobModal/external-confirm for seeker flows. Keep code dormant
  (not deleted) in case recruiter re-enables.

  Files:
    src/components/shared/ApplyJobModal.tsx — leave intact
    Remove its mount from seeker layouts/pages (check use-ui-store for openApplyModal calls)

  Edge cases:
    grep — no seeker caller of openApplyModal remains
    Recruiter flag-on path untouched

  Verify: grep "openApplyModal" returns 0 seeker calls; recruiter calls unchanged
  ACTUAL: DONE, with two things found beyond the plan's own file list.
  (1) src/modules/seeker/saved-jobs/components/SavedJobsList.tsx was dead
  code — zero importers anywhere in src/ (its page, /seeker/saved-jobs, was
  already deleted in A4; saved-jobs was "folded into browse save/bookmark"
  per the plan, but this component itself was never removed). It still
  called openApplyModal. Deleted the file entirely (verified zero references
  first) rather than leaving an orphaned seeker openApplyModal caller sitting
  in the tree.
  (2) grep still finds openApplyModal in
  src/modules/jobs/components/JobDetailHeader.tsx and JobDetailSidebar.tsx —
  these back /jobs/[id], a standalone public job-detail page (own
  Header/Footer, not the (app) shell) that isn't in pivot.md's page map or
  A4's retirement list. Left untouched as out of scope for D — it's not a
  "seeker layout/page" in the (app)-shell sense this section targets. Flagging
  in case /jobs/[id] should be formally retired or reconciled in a later
  section (G or H).
  Remaining callers after this: JobDetailHeader.tsx, JobDetailSidebar.tsx
  (out of scope, above) and ApplyJobModal.tsx/use-ui-store.ts themselves
  (the modal's own definition, left intact per the plan).

D3. Applied/passed jobs leave Browse

  Do: Feed excludes jobs with an existing Application (any status) and DismissedJob (pass).
  Verify feed API already filters; extend query if not.

  Files:
    src/app/api/seeker/feed/route.ts — verify WHERE clause excludes:
      - Jobs where Application exists for this seekerId
      - Jobs where DismissedJob exists for this seekerId
    Feed query hook — verify filters sent correctly

  Edge cases:
    Un-passing / re-showing (if supported) restores card
    Pasted-link apps don't affect feed (they don't have a jobId)
    Applied job still viewable from applications table/tracker

  Verify: apply or pass → card gone from browse next load; appears in table
  ACTUAL: DONE, no code changes — already correct. Read
  src/app/api/seeker/feed/route.ts in full: both the "recent" flow and the
  "matched jobs" flow build appliedJobIds from Application.findMany({jobId})
  (any status, since Application has no separate "withdrawn" state — every
  row counts) and dismissedJobIds from DismissedJob.findMany, then exclude
  both from every WHERE clause (`id: {notIn: [...appliedJobIds,
  ...dismissedJobIds]}` for the DB-level recent-jobs query, and an equivalent
  `.filter()` for the cached matched-jobs list). appliedJobIds already filters
  out null jobId (PASTED_LINK rows) before building the Set, satisfying the
  "pasted-link apps don't affect feed" edge case. Nothing to build for D3.

D4. Status ↔ tab/tracker mapping util

  Do: Single source-of-truth util mapping Application (status + finalized?) → dashboard tab
  AND tracker column.

  Status mapping rules:

    Is finalized?                         | Tab            | Tracker column
    ---------------------------------------|----------------|-----------------
    No, tailoredResumeKey is null          | In-flight      | (not shown yet)
    Yes, but no submittedFormData          | Needs-you      | Applied
    Yes, with submittedFormData            | Submitted      | Applied
    Finalized + status=APPLIED/GHOSTED     | Submitted      | Applied / Ghosted
    Finalized + status=REVIEWING           | Submitted      | Reviewing
    Finalized + status=INTERVIEW           | Submitted      | Interviewing
    Finalized + status=OFFER/HIRED         | Submitted      | Offer / Hired
    Finalized + status=REJECTED            | Submitted      | Rejected
    Generation/render error                | Failed         | (not shown)
    Passed (DismissedJob)                  | Skipped        | (not shown)

  NEW file:
    src/modules/seeker/applications/utils/status-map.ts
      - deriveDashboardTab(application): string — returns tab id
      - deriveTrackerColumn(application): string — returns column id
      - TRACKER_COLUMNS constant: ["Applied", "Ghosted", "Interviewing", "Rejected", "Offer"]
      - DASHBOARD_TABS constant: ["all", "submitted", "in-flight", "needs-you", "failed", "skipped"]

  Edge cases:
    Unknown/legacy status → "all" tab
    Enum labels display nicely (REVIEWING → "Reviewing", INTERVIEW → "Interviewing")

  Verify: every status renders in exactly one tab + one tracker column
  ACTUAL: DONE — pulled forward in B3 as documented there. Confirmed
  src/modules/seeker/applications/utils/status-map.ts matches this spec
  exactly (DashboardTab/TrackerColumn enums, DASHBOARD_TABS/TRACKER_COLUMNS
  constants, deriveDashboardTab/deriveTrackerColumn) and is already the sole
  source ApplicationsTable.tsx uses. No changes needed for D4.

D5. Apply to all N

  Do: Create applications for top-N (bounded by remaining credits), batch-generate resume+cover
  (1 credit each), land them in Needs-you. "Approve all" finalizes generated ones.

  Files:
    src/modules/seeker/dashboard/components/TopMatchesRow.tsx
      - Apply-to-all button → calls createApplication for each top match
      - If remaining credits < N → generate only what's affordable
      - Show toast: "Queued 3 of 5 applications (out of credits)"

    src/modules/seeker/dashboard/components/ApplicationsTable.tsx
      - Approve-all button → batch-finalizes all rows where resume+cover are ready
      - Partial failures → failed rows show error, others proceed

  Edge cases:
    Remaining credits < N → generate only affordable count, tell user
    Partial failures → isolated per-row (Failed tab)
    Duplicates → skipped (caught by @@unique constraint)
    Long-running → progress indicator; user can navigate away (background queue)
    Approve-all only finalizes rows with both artifacts ready

  Verify: Apply-to-all respects quota; Approve-all finalizes; failures isolated per-row
  ACTUAL: DONE, but required fixing a real structural gap B3 had already
  flagged rather than building on top of it (CLAUDE.md bug-fix standard:
  root-cause first). B3's KNOWN GAP said Needs-you was "structurally
  unreachable" because finalize set tailoredResumeKey AND submittedFormData
  in the same call — confirmed by reading the finalize route: it was one
  atomic write with a schema that REQUIRED all three of resume/coverLetter/
  submittedFormData. Apply-to-all as specced (land in Needs-you, no
  submittedFormData yet) was impossible against that contract, so fixed the
  contract itself instead of working around it:
    - finalizeApplicationSchema (lib/validations/application.schema.ts): all
      three fields now optional.
    - POST /api/seeker/applications/[id]/finalize: now two independent steps
      in one route — a render step (needs `resume`, only runs if
      tailoredResumeKey is still null; renders+stores the PDF, saves
      tailoredResumeKey + coverLetter) and a submit step (needs
      submittedFormData; sets it + status + appends statusLog). Either can
      run alone or both together in one call. Rejects 400 if neither step's
      precondition is met (no resume on first call, or a second call with no
      submittedFormData against an already-rendered row).
    - StepSubmit's existing single call (resume+coverLetter+submittedFormData
      together, first time) is byte-for-byte the same request shape as
      before — both steps just fire in the same call, so manual apply is
      unaffected. Confirmed via full read of StepSubmit/StepOptimize/
      StepCover/WizardShell before touching anything.
  Extracted src/modules/seeker/apply/utils/build-submitted-form-rows.ts
  (CLAUDE.md 2+ rule) from StepSubmit's inline `rows` builder so
  ApplicationsTable's Approve-all constructs the identical SubmittedFormField
  set from settings + application-defaults.
  NEW src/modules/seeker/dashboard/utils/batch-apply.ts:
  loadBatchApplyProfileContext() (fetches settings/certifications/projects/
  optimize-mode once per batch run) + generateApplicationArtifacts(job, ctx)
  (createApplication [409-safe] → optimizeResume → generateCoverLetter →
  finalize with resume+coverLetter only, isolates any failure into a
  {success:false, error} result rather than throwing). requiredSkills/
  preferredSkills are omitted from the AI calls — optimize-resume already
  falls back to extracting them from the JD when absent (read the route to
  confirm), so batch apply doesn't need JobListItem to carry them.
  TopMatchesRow's "Apply to all": reads remaining credits via the existing
  useCreditStatus hook, caps the queue to `min(topMatches, remaining)`, runs
  generateApplicationArtifacts SEQUENTIALLY (not parallel — optimize-resume
  and cover-letter each have their own 5/min rate limiter, and
  createApplication+finalize share a 10/min write limiter; TOP_MATCHES_COUNT
  is 5, so a full sequential batch sits right at those ceilings — parallel
  would blow through them), then toasts a "Queued X of N (M skipped — out of
  credits)" / per-failure summary and invalidates both credit-status query
  keys (there are two — seeker-credits and seeker-credit-status, pre-existing
  duplication not introduced here) plus the applications list.
  ApplicationsTable's "Approve all": now actually wired (previously a
  permanently-disabled no-op per B3's gap). Fetches settings +
  application-defaults (query-gated on needsYouRows.length>0), builds one
  submittedFormData snapshot, POSTs it to every Needs-you row's finalize in
  parallel, isolates per-row failures, invalidates the applications list, and
  the button is enabled exactly when needsYouRows.length>0 (now genuinely
  reachable).
  BUG FOUND + FIXED (surfaced by Needs-you becoming reachable): the
  ApplicationsTable "Cover letter" column read `row.hasSubmittedForm` instead
  of a cover-letter-specific flag — harmless while Needs-you was always
  empty (every visible row was either pre-finalize, where both showed "Off",
  or fully submitted, where both showed "Ready"), but wrong the moment a
  Needs-you row exists (cover letter is genuinely drafted and persisted via
  StepCover's PATCH — see use-application flow — well before
  submittedFormData is ever set). Added `hasCoverLetter: boolean` to
  DashboardApplicationSummary, selected `coverLetter: true` in GET
  /api/seeker/applications and derived `app.coverLetter !== null`, and
  pointed the column at it.
  Deviation from the plan's file list: plan named only TopMatchesRow.tsx and
  ApplicationsTable.tsx for D5. Actually touched (beyond those two): the
  finalize schema + route, seeker.service.ts's finalizeApplication payload
  type, StepSubmit.tsx (refactored to the extracted util, no behavior
  change), GET /api/seeker/applications route + DashboardApplicationSummary
  type (the hasCoverLetter fix), plus two new util files. All changes are
  additive/backward-compatible — no existing call site's behavior changed
  except the Cover-letter column now showing correct data.
  NOT implemented: a true "long-running, navigate-away-safe background
  queue" — Apply-to-all runs synchronously in the browser tab for the
  duration of the mutation (a few seconds per job × up to 5 jobs); closing
  the tab mid-batch stops it, already-generated jobs stay generated. Flagging
  per the plan's edge case ("user can navigate away") — a real background
  queue would need a server-side job runner, out of scope here.

D6. Section verify (integration)

  Verify: dashboard + browse apply → wizard → optimize → cover → enhanced copy-paste submit →
  "I applied" → Done; job leaves browse; row moves In-flight→Needs-you→Submitted; tracker reflects
  ACTUAL: pnpm tsc --noEmit, pnpm lint, pnpm build all clean. Verification was
  code-level trace-through (read every touched route + component end to end,
  confirmed request/response shapes match at each boundary, confirmed the
  finalize route's two-step branches cover every call site's actual payload)
  rather than a live browser session — no seeker test credentials available
  in this session, and a real run would spend real AI credits + write rows
  against the shared staging DB (per project convention, DB1 is
  local+staging). Flagging explicitly rather than claiming a live pass:
  someone with a seeker login should click through Apply-to-all → Approve-all
  once on staging before this merges to main. Tracker (Section F) doesn't
  exist yet, so "tracker reflects" isn't checkable until then — the
  underlying data (deriveTrackerColumn) is verified correct via D4's util,
  just not through an actual kanban UI.

---

SECTION E — Browse + job drawer [DONE — branch feature/pivot-e-browse]

E1. Browse page layout (mostly done)

  Do: /dashboard/browse = FeedFilterBar (built) + AddLinkCard (built) + FeedJobCard grid
  (built) + infinite scroll (built) + "Saved N" count.

  Files:
    src/app/(app)/dashboard/browse/page.tsx — already done
    src/modules/seeker/feed/* — already built

  Edge cases (verify but no changes needed):
    No results for filters → empty state + Clear
    Filter state URL-synced (shareable/back-button) — verify
    Loading skeleton grid — verify
    Companies multiselect large list → search within — verify

  Verify: filters narrow correctly; URL reflects filters; empty state
  ACTUAL: Mostly verified as-is, with two real gaps fixed (not just
  documented) and one cosmetic deviation left alone.
  VERIFIED, no changes: empty-state ("No jobs match these filters" +
  "Clear filters" button, only shown when activeCount>0 — FeedView.tsx)
  correct. Filter state fully URL-synced via useFeedFilters
  (useRouter/useSearchParams/usePathname, router.replace with query string) —
  shareable/back-button-safe. Loading state shows 4 pulsing placeholder cards
  (FeedView.tsx) — a real skeleton, not spinner-only/blank.
  DEVIATION (left as-is): layout is `flex flex-col gap-5` (single-column
  list), not a CSS grid. Mobile-first single column is the correct call per
  CLAUDE.md's mobile-first rule and matches FeedJobCard's wide card design —
  not treating this as a bug.
  GAP FIXED #1 — "Saved N" count didn't exist at all (grep confirmed zero
  count/label text anywhere in the feed module; useSavedJobs() was called
  only to build the isSaved Set, never surfaced as a number). Added a
  "N saved jobs" / "No saved jobs yet" line above the job list in
  FeedView.tsx, reading pagination.total from the existing useSavedJobs()
  call (already fetched, zero new requests).
  GAP FIXED #2 — companies multiselect (FeedFilterBar.tsx) had no
  search-within-list despite the page fetching up to 200 distinct companies
  server-side (browse/page.tsx `take: 200`) — the popover was a bare
  unfiltered checkbox list. Added a client-side search Input inside the
  popover (only rendered when companies.length > 8, to avoid useless UI for
  small lists), filtering the visible list case-insensitively; added a
  "No companies match "x"" empty state for the filtered-to-zero case.

E2. Job detail drawer

  Do: FeedJobDrawer — full JD, meta (location/type/education/experience), highlighting of
  searched terms, View original posting, Not interested, Save, Apply → wizard.

  Files:
    src/modules/seeker/feed/components/FeedJobDrawer.tsx — already built

  Edge cases (verify):
    Missing JD/salary/education → hide row, don't render blanks
    External URL missing → hide "View original"
    Very long JD → scroll within drawer
    Apply from drawer → same wizard path

  Verify: drawer opens with full JD; Apply→wizard; Save/Pass persist
  ACTUAL: NOT "already built" as pivot.md assumed — verification found the
  drawer was a fundamentally different component than spec'd, requiring a
  real rebuild (CLAUDE.md bug-fix standard: root-cause first, fix the
  source). Read the pre-existing FeedJobDrawer.tsx (85 lines) end to end:
  it delegated its entire body to JobDetailSidebar (a "Quick Apply" widget
  built for the standalone public /jobs/[id] page), which meant: (1) no JD
  text rendered anywhere — description was fetched in JobDetailResponse but
  never read; (2) no search-term highlighting (nothing to highlight, and no
  highlight util existed in the codebase); (3) no dedicated JD scroll
  container — only the whole Sheet had overflow-y-auto; (4) most seriously,
  Apply called JobDetailSidebar's `openApplyModal` (useUIStore) →
  legacy ApplyJobModal → `applicationService.applyToJob` directly — NOT the
  wizard mutation (createApplication → router.push to
  /dashboard/applications/[id]) that Section D explicitly wired everywhere
  else and documented as "ApplyJobModal is no longer mounted on any seeker
  surface" (D2's own ACTUAL note, contradicted by this file); (5) no "Not
  interested"/Pass action existed in the drawer at all. Save was the one
  correct piece (JobDetailSidebar's SaveJobButton used the same
  useSaveJob/useUnsaveJob hooks as the cards).
  Also found in passing: GET /api/jobs/[id] queries `job.location` from
  Prisma but never returned it in the response, and JobDetailResponse.job's
  type didn't declare it — so even a correct drawer couldn't have shown
  location without this. Fixed at the source: added `location: job.location`
  to the route's response and to the type (src/app/api/jobs/[id]/route.ts,
  src/modules/jobs/types/job.types.ts).
  REBUILT FeedJobDrawer.tsx: renders data.job.description in a dedicated
  `max-h-[50vh] overflow-y-auto` block (whitespace-pre-wrap) — long JD now
  scrolls within that block, not just the whole Sheet. Meta facts
  (location/workType, jobType, experienceLevel, category) render via a
  data-array `.map()` (CLAUDE.md DRY) and are individually omitted when
  falsy — nothing renders as a blank row. Salary renders as a Badge only
  when salaryMin or salaryMax is present (formatSalaryRange/formatEnumLabel
  reused from src/lib/home-page-utils.ts — CLAUDE.md "check first", no new
  formatters). Added `highlightMatches()` (co-located in the same file,
  single-use) wrapping case-insensitive matches of the active feed search
  term in `<mark>`; wired via a new `searchTerm` prop sourced from
  useFeedFilters().filters.search in FeedView. "View original posting" kept
  unchanged (already correctly gated on externalApplyUrl). Apply/Save/Not
  interested are now props (onApply/onToggleSave/onPass +
  isSaved/isSaving/isDismissing) supplied by the parent — FeedJobDrawer no
  longer owns any mutation itself, mirroring the existing FeedJobCard
  prop-drilling pattern so there's exactly one save/pass/apply
  implementation per parent, not a duplicate inside the drawer.
  DEVIATION from the plan's file list: FeedJobDrawer.tsx is mounted from two
  parents (FeedView.tsx on /dashboard/browse, and TopMatchesRow.tsx on
  /dashboard), not one — pivot.md's page maps only mention it under Browse.
  Both call sites needed their props updated to satisfy the new interface;
  TopMatchesRow has no search filter, so it omits `searchTerm` (defaults to
  no highlighting, correct — there's nothing to highlight against on the
  dashboard). Missed this at first (TypeScript caught it immediately —
  `tsc --noEmit` failed on TopMatchesRow.tsx until fixed).
  NOT implemented: "education" as a meta field — grep + schema read confirm
  the Job model has no education column at all (fields are jobType,
  workType, salaryMin/Max, experienceLevel, category, location — no
  education). Not fabricating a field that doesn't exist in the data model;
  flagging in case a future section adds job-level education data.
  pnpm tsc --noEmit, pnpm lint, pnpm build all clean after the rebuild.

---

SECTION F — Tracker kanban (the only unbuilt feature) [DONE — branch feature/pivot-f-tracker]

F1. Kanban board

  Do: /dashboard/tracker — columns: Applied · Ghosted · Interviewing · Rejected · Offer
  (labels via D4 util). Cards = company + role + quick actions (open app, resume, cover,
  posting) + applied date. Header: Import CSV / Export CSV / Add application.
  Empty-state: "No applications yet."

  NEW files:
    src/app/(app)/dashboard/tracker/page.tsx — replace PlaceholderScreen with client
      component that renders TrackerKanbanBoard

    src/modules/seeker/tracker/components/TrackerKanbanBoard.tsx
      - 5 columns: Applied, Ghosted, Interviewing, Rejected, Offer
      - Each column: header with status name + count, list of cards
      - Card: company name, job title, date applied, quick action icons
        (open resume PDF, open cover letter, open job posting, open application wizard)
      - Loading → skeleton (5 columns × 2 skeleton cards each)
      - Empty → "No applications yet" + "Browse jobs" CTA
      - Error → retry

    src/modules/seeker/tracker/hooks/use-tracker-applications.ts
      - Fetches ALL seeker applications (no pagination needed — seekers typically
        have < 100 active apps)
      - Returns grouped by status

    src/modules/seeker/tracker/types/tracker.types.ts
      - TrackerCard, TrackerColumn interfaces

  Edge cases:
    Empty column → "No applications" (not hidden — shows the column exists)
    Only FEED apps have posting link; PASTED_LINK use externalJobUrl
    Manual entries (CSV import) may have neither
    Loading skeleton rows per column
    Error state with retry

  Verify: apps land in correct columns based on status; cards show company/role/date
  ACTUAL: DONE, with one real structural gap found and fixed at the root
  rather than patched (CLAUDE.md bug-fix standard). The plan's own edge case
  ("Manual entries (CSV import) may have neither [resume/cover/posting]")
  assumed manual/imported rows would already show up on the tracker — but
  deriveTrackerColumn (D4) returns null for any row that isn't
  `isFinalized`, and manual/imported rows never go through the wizard, so
  they'd be structurally invisible on the kanban forever (same class of bug
  B3 hit with Needs-you). Root-caused instead of working around it:
    - Added ApplySource.MANUAL to prisma/schema.prisma's ApplySource enum
      (mirrored in src/constants/enums.ts) — a third origin alongside
      FEED/PASTED_LINK for rows with no Job and no AI artifacts, ever.
      DEVIATION: `prisma migrate dev` failed with a shadow-DB auth error
      (P1000) — the SHADOW_DATABASE_URL credentials in .env.local are stale,
      a gap this project's own memory already flagged ("follow-ups: shadow
      DB for migrate dev" from the DB-adoption pass). Worked around by
      hand-writing the migration SQL (`ALTER TYPE "ApplySource" ADD VALUE
      'MANUAL'`) into prisma/migrations/20260705120000_p6_manual_apply_source/
      and applying it with `prisma migrate deploy` (which only replays
      migration files against the real DB — no shadow DB involved), then
      `prisma generate`. Someone should still fix the shadow DB credentials;
      this isn't a substitute for that, just how F stayed unblocked.
    - Added `isManualEntry?: boolean` to StatusMappableApplication
      (status-map.ts): deriveDashboardTab now maps a manual/imported row
      straight to DashboardTab.SUBMITTED (it represents an application the
      seeker already submitted outside the tool — there's no "in-flight AI
      wizard" state for it), and deriveTrackerColumn's `!isFinalized` guard
      is now `!isFinalized && !isManualEntry` so these rows reach the
      column switch instead of returning null.
    - DashboardApplicationSummary gained `isManualEntry: boolean` (derived
      from `source === ApplySource.MANUAL` in GET /api/seeker/applications)
      and `notes: string | null` (Application.notes was already a schema
      field, just never selected/returned before — needed for both the
      tracker card and CSV export's Notes column).
  NEW src/lib/applications/create-manual-application.ts: `createManualApplication`
  (inserts one ApplySource.MANUAL row: companyName/jobTitle land on
  externalCompanyName/externalTitle exactly like a PASTED_LINK row — no
  schema field addition needed beyond the enum) + `loadExistingApplicationDedupKeys`
  (builds company+role / externalJobUrl sets across the seeker's EXISTING
  applications, any source, so a manual add can't duplicate an existing FEED
  application by the same company+role text either). Shared by both the
  manual-add branch of POST /api/seeker/applications and the F3 CSV import
  route (2+ rule).
  NEW src/lib/applications/resolve-application-company.ts: extracted the
  company-name-resolution function that GET /api/seeker/applications already
  had inline, so GET .../tracker/export could reuse it instead of a third
  copy (2+ rule) — GET /api/seeker/applications now imports it instead of
  its own local copy; behavior unchanged.
  Extended POST /api/seeker/applications (src/app/api/seeker/applications/route.ts):
  branches on `"jobId" in body` — absent means the manual-entry shape
  (new `manualApplicationSchema` in application.schema.ts: companyName +
  jobTitle required, status/appliedAt/notes/externalJobUrl optional).
  Duplicate manual entry → 409 (matching the existing wizard-branch 409
  convention), not a silent skip — the plan didn't specify single-add
  duplicate behavior, but skip-silently would look like the click did
  nothing.
  Components: TrackerKanbanBoard.tsx (header + loading/error/empty-all
  states + DndContext, orchestration only), KanbanColumn.tsx (droppable
  zone, always renders "No applications" when empty per the plan's edge
  case), KanbanCard.tsx (draggable card + quick-action icons + three-dot
  status dropdown — see F2 for why the dropdown lives here, not just on
  mobile). Quick actions: resume PDF and cover letter aren't in the list
  summary (only isFinalized/hasCoverLetter booleans are, per B3's original
  design), so both fetch the full ApplicationDetail on click
  (seekerService.getApplication) rather than eagerly signing every row's
  resume URL on every tracker load; job-posting uses applyUrl already in the
  row (no extra fetch); reopen-wizard is shown only when
  `jobId !== null || source === PASTED_LINK` (a MANUAL row with no
  externalJobUrl would 404 the wizard's own GET route, so the icon is
  omitted rather than linking to a dead end — not in the plan's edge-case
  list, found while wiring the icon).
  Loading skeleton is exactly 5 columns × 2 pulse cards as specced. Empty
  state distinguishes "zero tracker-eligible applications anywhere" (single
  centered Inbox+CTA block, mirrors ApplicationsTable's empty state) from
  "this one column has zero cards but others don't" (per-column "No
  applications" text, never hidden) — the plan's two empty-state edge cases
  read as the same requirement but are actually different UI states; both
  implemented.
  NOT implemented from the plan's file list: tracker.types.ts's TrackerCard
  is a type alias for DashboardApplicationSummary, not a new parallel
  interface — the tracker kanban and the dashboard table already consume
  the identical GET /api/seeker/applications list (see D4/B3), just grouped
  differently, so a duplicate shape would only drift out of sync with zero
  benefit. TrackerColumnData is the one real new type (column + its cards).

F2. Drag-to-change status

  Do: @dnd-kit drag between columns → PATCH /api/seeker/applications/[id] (exists) →
  append statusLog entry (timestamp + from/to).

  Files:
    src/modules/seeker/tracker/components/TrackerKanbanBoard.tsx
      - Add @dnd-kit/core + @dnd-kit/sortable
      - Drag overlay shows card being dragged
      - On drop → PATCH application status + append to statusLog
      - Optimistic update → rollback on failure

    src/app/api/seeker/applications/[id]/route.ts
      - Extend PATCH to accept status + append to statusLog array
      - statusLog shape: [{ from: AppStatus, to: AppStatus, timestamp: ISO }]

  Edge cases:
    Optimistic update + rollback on PATCH failure
    Concurrent edits — last-write-wins (acceptable for single-user)
    Drag to same column = no-op
    Mobile: drag is hard → add status dropdown fallback on card (three-dot menu)

  Verify: drag persists across reload; statusLog records transition; mobile fallback works
  ACTUAL: DONE. patchApplicationSchema's `status` field widened from
  `z.literal(ApplicationStatus.APPLIED)` to `z.enum(APPLICATION_STATUS_VALUES)`
  — the wizard's own PATCH calls still only ever send APPLIED (unchanged
  behavior for them), but the schema now also accepts the tracker's drag
  writes. PATCH /api/seeker/applications/[id] now selects the row's current
  `status`+`statusLog` before updating: if the incoming `status` differs
  from the current value, appends `{from, to, timestamp: new
  Date().toISOString()}` to the existing Json array; a same-value write (or
  no `status` field at all) touches `statusLog` not at all — same-column
  drops are genuinely no-ops on the log, not just no-ops in the UI.
  NEW `TRACKER_COLUMN_DROP_STATUS` in status-map.ts (reverse of
  deriveTrackerColumn's switch): which single ApplicationStatus to write for
  each of the 5 columns. DEVIATION (documented inline in the util, called
  out here since it's a real, deliberate lossy mapping): INTERVIEWING can
  represent either REVIEWING or INTERVIEW under deriveTrackerColumn, and
  OFFER can represent either OFFER or HIRED — but a drop has to pick one
  concrete status to write. Chose the more literal member of each pair
  (INTERVIEW, OFFER) rather than trying to preserve whichever the row had
  before (which would need extra state the drag payload doesn't carry).
  A seeker who was specifically in REVIEWING or HIRED and drags the card
  anywhere and back will land on INTERVIEW/OFFER, not their original
  sub-status — acceptable since the tracker's 5 columns are the whole
  granularity the UI exposes; the plan's own D4 spec already collapsed
  these pairs into one column each.
  TrackerKanbanBoard's drag: DndContext + PointerSensor with an 8px
  activation distance (so a plain click on a card's icon buttons doesn't
  get eaten as a drag start — confirmed by testing that icon `onClick`s
  fire correctly with `onPointerDown` stopPropagation on the buttons/dropdown
  trigger). onDragEnd resolves the source column from
  `event.active.data.current.column` (set when each card mounts inside its
  KanbanColumn) and the target from `event.over.id` (the droppable column's
  id) — same-column drops are filtered before the mutation even fires.
  Optimistic update: `useMutation` with `onMutate` snapshotting +
  rewriting the shared `myApplicationsQueryKey` cache (same key
  ApplicationsTable/dashboard already use — a status change here refreshes
  the dashboard table too), `onError` rolling back to the snapshot +
  toasting, `onSettled` invalidating to reconcile with the server's
  statusLog. Mobile fallback: the three-dot dropdown (all 5 columns, current
  one disabled) renders unconditionally on every card, not gated behind a
  viewport check — simpler than a media-query branch and still satisfies
  "add a fallback for mobile" since it's always available, just more useful
  there where drag is unreliable. DEVIATION from the plan's file list:
  the plan named `@dnd-kit/sortable` alongside `@dnd-kit/core`, but cards
  change which COLUMN they're in, not their order within one — plain
  `useDraggable`/`useDroppable` from `@dnd-kit/core` covers that fully, so
  `@dnd-kit/sortable` was installed, found unused, and removed again
  (`pnpm remove`) rather than left as dead weight. Re-add it if a later
  section wants intra-column reordering (not spec'd here).

F3. CSV import/export + manual add

  Do: Export GET /api/seeker/tracker/export (all apps → CSV). Import POST /api/seeker/tracker/import
  (CSV → create applications, dedup). "Add application" modal for manual entry.

  NEW files:
    src/app/api/seeker/tracker/export/route.ts
      - GET: fetch all seeker applications → CSV with columns:
        Company, Role, Status, Applied Date, Notes, Job URL
      - Rate-limited (5/minute per user)

    src/app/api/seeker/tracker/import/route.ts
      - POST: parse CSV → validate each row → create Application for valid rows
      - Dedup by (company + role) or (externalJobUrl)
      - Return summary: { created: N, skipped: N, errors: [{ row, reason }] }
      - Rate-limited (3/minute per user)

    src/modules/seeker/tracker/components/AddApplicationModal.tsx
      - Manual entry modal: Company, Role, Status (dropdown), Date (date picker), Notes, URL
      - All fields optional except Company + Role
      - On submit → POST /api/seeker/applications (reuse existing route, but allow
        create without jobId for manual entries — may need route extension)

  Edge cases:
    Malformed CSV → row-level errors, partial import summary
    Duplicate rows (same company+role) → skipped, reported in summary
    Huge file (> 1MB) → reject upfront
    Manual entry without job → minimal fields; no AI artifacts
    Export escapes commas/newlines/quotes properly
    Export with no applications → empty CSV with headers only

  Verify: export→edit→import round-trips; bad rows reported with line numbers; manual add appears
  ACTUAL: DONE, no external CSV library added — hand-rolled
  src/lib/csv.ts (`buildCsv`/`toCsvRow`/`parseCsv`), an RFC-4180-ish
  quote/escape implementation (commas, embedded quotes doubled, CRLF row
  joins on export; a small char-by-char state machine on import that
  handles quoted fields containing commas/newlines). CLAUDE.md's "check
  first" — no papaparse or similar was already in package.json, and the
  format is simple enough not to warrant a new dependency.
  Export (GET /api/seeker/tracker/export): only `kind: 'application'` rows
  — DismissedJob/passed rows are deliberately excluded (not in the plan's
  edge cases, decided here) since they were never actually applied to and
  have no company/role/status worth exporting. Status column exports the
  RAW ApplicationStatus value (e.g. "INTERVIEW"), not the tracker's
  collapsed column label ("Interviewing") — this is what makes
  export→import round-trip byte-exact instead of lossy through the
  INTERVIEWING/OFFER collapse F2 documents. Reuses the extracted
  `resolveApplicationCompany` (see F1) for the Company column.
  Import (POST /api/seeker/tracker/import): body is `{csv: string}` JSON,
  not multipart — the modal reads the File client-side via `FileReader`
  and posts the text, which is simpler than wiring `multipart/form-data`
  parsing into a route and works identically for a client with a real
  `<input type="file">`. 1MB cap enforced via zod's `.max()` on the string
  length (server-side; the plan's "reject upfront" edge case) — the file
  input has no client-side pre-check, so a >1MB file still round-trips to
  the server before being rejected with a clear 400, which is an accepted
  (undocumented-until-now) UX gap for a personal-tracker CSV that's
  realistically never anywhere near 1MB.
  Row semantics (not fully specified by the plan, decided here): a row
  missing Company or Role, an unrecognized Status value, an unparseable
  Applied Date, or a non-http(s) Job URL all go to `errors` (with a
  1-indexed row number where row 1 = the header, matching what a
  spreadsheet app displays) and are not created. A row that matches an
  existing application (company+role case-insensitively, or externalJobUrl)
  counts toward `skipped`, not `errors` — it's expected/correct behavior,
  not a malformed row. Blank Status defaults to APPLIED; blank Date
  defaults to "now" (Application.createdAt's own default) rather than
  erroring, since both are optional per the plan's manual-entry spec.
  Rows are inserted sequentially inside the route (not `Promise.all`),
  documented inline: the in-memory dedup sets from
  `loadExistingApplicationDedupKeys` are mutated after each successful
  insert so row 5 of a CSV can correctly dedup against row 2 of the SAME
  import — running them in parallel would race that mutation and let
  duplicate rows within one CSV both get created.
  AddApplicationModal.tsx: Company/Role required (button disabled
  otherwise), Status/Date/Notes/URL optional, matching the plan. DEVIATION:
  used a plain native `<input type="date">` instead of the shadcn
  Calendar+Popover combo already in the codebase — no existing form in this
  codebase used Calendar+Popover for a plain optional date field, and the
  native control is simpler, mobile-native, and needs no extra state
  wiring; flagging in case there's a preference for the Calendar component
  everywhere for visual consistency. Status dropdown reuses
  TRACKER_COLUMN_LABELS/TRACKER_COLUMNS (the tracker-column vocabulary the
  seeker already sees on the board) rather than exposing the raw
  7-member ApplicationStatus enum — converted to a concrete status via
  TRACKER_COLUMN_DROP_STATUS at submit time, same mapping F2's drag uses,
  so "what status does picking 'Interviewing' actually write" is answered
  identically in both places.
  POST /api/seeker/applications (extended, not new): branches on whether
  the body has a `jobId` key at all. Manual entries hit the new
  `manualApplicationSchema` (application.schema.ts) and
  `createManualApplication` (see F1's ACTUAL) — confirming the plan's own
  "may need route extension" hedge was correct.

---

SECTION G — UI polish + shell wiring [DONE — branch feature/pivot-g-polish]

G1. Live sidebar bottom widget

  Do: Wire applications-left + Upgrade widget to /api/seeker/credits. Nav badges: Inbox "soon"
  (disabled link), Networking "beta".

  Files:
    src/components/layout/AppSidebar.tsx
      - Add credits widget in sidebar bottom (reuse the credit status hook from B1)
      - Show remaining credits + plan name
      - "Upgrade" link → /pricing
      - Inbox nav item: show "Soon" badge, link disabled (or href = "#")
      - Networking nav item: show "Beta" badge

  Edge cases:
    Loading → skeleton pulse for widget
    Paid plan → "Pro plan: 234 left"
    Zero remaining → "0 left" with emphasized "Upgrade"
    Credits API error → hide widget (non-critical)

  Verify: widget matches banner numbers; badges render; Inbox not clickable
  ACTUAL: NOT "still hardcoded" as the task brief assumed — verification found
  the sidebar widget, nav badges, and disabled-Inbox link were already fully
  built (AppSidebar.tsx is a generic config-driven shell with badge/disabled
  support per NavItem; AppShellClient.tsx's SidebarCreditsSlot + CreditsWidget
  already rendered a live plan+credits bar with an Upgrade→/pricing link).
  What verification found wrong and fixed at the root instead:
    - REAL BUG: SidebarCreditsSlot read `useCredits()` (src/hooks/use-credits.ts,
      query key `seeker-credits`) — a SEPARATE hook/cache from
      `useCreditStatus()` (query key `seeker-credit-status`) that CreditsBanner
      uses and that this task's brief explicitly named as the source of
      truth. This is the exact "two credit-status query keys" duplication D5's
      ACTUAL already flagged as pre-existing. Fixed by repointing
      SidebarCreditsSlot to `useCreditStatus` — sidebar and banner now read
      the identical cache and can't disagree or go stale independently.
      NOT done: consolidating the other 4 remaining `useCredits` callers
      (StepCover, StepOptimize, PlansSection, TopMatchesRow) onto
      `useCreditStatus` too — out of scope for a sidebar-widget task and
      touches the wizard's credit-gating logic; flagging so a later pass can
      finish the consolidation D5 already called out.
    - Loading state previously faked a 0/1 bar (isLoading ? 0 : ... falling
      back to 0 credits of 1 total) instead of a real skeleton — briefly
      flashed "0 left" on every mount. Added `CreditsWidgetSkeleton`
      (CreditsWidget.tsx) matching both sidebar states' exact footprint (no
      layout shift) and switched SidebarCreditsSlot to render it on
      `isLoading` instead of faking data.
    - Credits API error previously still rendered the widget with the same
      faked 0/1 bar (looked like "you have zero credits" on a fetch failure,
      not "widget hidden"). SidebarCreditsSlot now returns `null` on
      `isError || !data`, matching CreditsBanner's own non-critical/hide
      behavior exactly.
    - Zero-remaining was NOT emphasized at all (same neutral card as any
      other count). CreditsWidget now switches to the brand-danger border/
      text/progress-fill treatment (mirrors CreditsBanner's `isExhausted`
      styling) and the button label changes to "Upgrade now" when
      `creditsLeft <= 0`, for both expanded and collapsed (icon-only) states.
  Nav badge text tightened from "coming soon"/"beta" to "Soon"/"Beta"
  (src/constants/nav.ts) to match the task brief's literal wording — cosmetic
  only, the sidebar already uppercases badge text via CSS so the rendered
  pill looked identical either way. Inbox was already a disabled `<span>`
  (not a `<Link href="#">`) when `item.disabled` is true — genuinely
  non-navigating, no dead-end href needed.
  pnpm tsc --noEmit, pnpm lint, pnpm build all clean.

G2. Inbox + Networking stubs

  Do: Keep coming-soon placeholder pages (no build).

  Files:
    src/app/(app)/dashboard/inbox/page.tsx — already a placeholder (verify)
    src/app/(app)/dashboard/networking/page.tsx — already a placeholder (verify)

  Verify: pages render placeholder; no console errors; nav badges correct
  ACTUAL: VERIFIED, no changes. Both are clean `PlaceholderScreen` stubs
  (icon + tag + title + description, no client state, no data fetching, no
  effects) — nothing that could throw at runtime. Nav badges verified correct
  per G1 (Inbox="Soon"+disabled, Networking="Beta"+enabled link).

G3. Brand-theme ditto pass

  Do: Pass across dashboard/browse/tracker/profile/wizard: brand tokens (no purple/indigo/hex),
  no shadows (borders), rounded-lg/xl, mobile-first ~390px.

  Files: All UI components in dashboard, browse, tracker, wizard, profile
  Check: no shadow-*, no arbitrary hex colors, no rounded-full on cards/inputs, no dark mode

  Edge cases:
    Dark mode leftovers in any component
    Arbitrary hex values in className
    shadow-* classes on cards/modals/buttons

  Verify: visual pass at 390px + desktop; grep no banned classes in touched files;
  pnpm tsc + pnpm build clean
  ACTUAL: DONE. Grepped shadow-*, arbitrary #hex, rounded-full, dark:*, and
  legacy purple/indigo/slate-gray classes across every in-scope directory:
  src/modules/seeker/{dashboard,feed,apply,tracker,profile}, src/app/(app)/
  {dashboard,profile}, src/components/layout — including the new F tracker
  components (KanbanCard, KanbanColumn, TrackerKanbanBoard,
  AddApplicationModal). Zero hits in all of those directories except one
  legitimate `rounded-full` loading spinner (FeedView.tsx, a spinner ring —
  not a card/input, the rule's actual target per CLAUDE.md's own NEVER-table
  example).
  GAP FOUND + FIXED (one level further than the file list, per CLAUDE.md's
  "check first"/DRY habit): src/components/shared/PaidFeatureModal.tsx isn't
  under any of the swept directories but IS imported by three in-scope
  wizard/dashboard components (StepOptimize.tsx, StepCover.tsx,
  TopMatchesRow.tsx) as the seeker out-of-credits upsell (Section H's "Out of
  credits" gate) — had `text-[#868685]` (arbitrary hex). Fixed to
  `text-brand-foreground-muted` (the token table's designated muted-text
  color, closest visual match).
  FOUND, NOT FIXED (flagging rather than silently leaving or scope-creeping):
  PaidFeatureModal's hardcoded `PRO_FEATURES` list ("Schedule Interviews",
  "Talent Pool Access", "10 Active Job Posts") is recruiter-oriented copy
  that renders unconditionally regardless of caller — so a seeker who runs
  out of AI credits and triggers this modal from StepOptimize/StepCover/
  TopMatchesRow sees recruiter feature bullets, not seeker ones. This is a
  content/UX bug, not a styling violation, so out of scope for a "brand-theme
  pass" — real fix needs either a seeker-specific feature list or plumbing
  the list through `openPaidFeatureModal`'s existing title/description
  params, a product-copy decision better made explicitly than guessed here.
  Everything else in components/shared with shadow-*/hex/rounded-full/slate
  hits (Header, Footer, PublicRecruiterDropdown, PublicMobileNavMenu,
  RecruiterSidebar, ApplyJobModal, ComingSoonPage, FakeJobCard,
  ExternalApplyConfirmationDialog) confirmed via grep to have zero importers
  from any dashboard/browse/tracker/profile/wizard component — public
  marketing pages, the recruiter surface, or ApplyJobModal's D2-documented
  dormant/unmounted state. Left untouched as genuinely out of this section's
  scope.
  pnpm tsc --noEmit, pnpm lint, pnpm build all clean.

---

SECTION H — Cross-cutting edge cases (verify as a final gate) [DONE — branch feature/pivot-h-edges]

- Out of credits: block BEFORE creating an application (on Apply click) → upsell modal.
  Apply-to-all stops at remaining quota, reports how many queued of N.
  ACTUAL: REAL GAP FOUND + FIXED. "Apply to all" already blocked before
  creating anything (`handleApplyToAll` in TopMatchesRow), but the single-job
  Apply button on every job card (TopMatchesRow AND FeedView, both the card
  and the drawer) called `applyWizardMutation.mutate(jobId)` directly with
  zero credit check — it always created the Application row, and the actual
  block only happened one step later inside the wizard (StepOptimize's Phase-8
  hard gate). At 0 credits this created a real orphaned In-flight row per job
  clicked, forever stuck since generation could never succeed. Added
  `handleApply(jobId)` in both TopMatchesRow.tsx and FeedView.tsx — checks
  `creditStatus.remaining <= 0` and opens `PaidFeatureModal` BEFORE calling
  `applyWizardMutation.mutate`, matching `handleApplyToAll`'s existing pattern
  exactly. Re-applying to a job with an EXISTING application still works
  regardless of credits (the mutation's own 409-routes-to-existing-id handling
  is untouched) — the gate only blocks creating a brand-new row.
- Duplicate apply: unique [jobId,seekerId] / [seekerId,externalJobUrl] → open existing
  application, never error (409 → route into existing id — already handled).
  ACTUAL: VERIFIED, no changes — confirmed via code read of both
  applyWizardMutation onError handlers (TopMatchesRow + FeedView): 409 with an
  echoed id routes into the existing application instead of erroring.
- Abandoned wizard: app sits In-flight/Needs-you; re-open resumes:
  finalized → StepDone; else regenerate from stored keywordStats (resume is
  regeneration via AI, user can edit in ResumeEditor before proceeding).
  ACTUAL: REAL BUG FOUND + FIXED (the whole reason this is a "final gate"
  section, not a rubber stamp). WizardShell's re-open effect jumped straight
  to StepDone whenever `data.tailoredResumeKey` was set — but per D4/F1's own
  status contract, a "Needs-you" application (landed there via Apply-to-all/
  D5's partial finalize: resume+cover generated, NOT yet submitted) has
  `tailoredResumeKey` set too. Reopening one rendered a false "Application
  recorded" ✓ success screen (StepDone) over a permanently-empty "Submitted
  form" tab — the seeker would believe they'd applied when they never saw the
  cheatsheet or clicked "I submitted." This was reachable both from the
  dashboard table (row click → wizard route, any row) and the tracker
  (Needs-you rows land in the tracker's Applied column too — deriveTrackerColumn
  only checks isFinalized, not hasSubmittedForm — and F1's reopen-wizard card
  icon routes into the same broken path).
  FIX (root cause, not a patch): narrowed WizardShell's jump condition to
  `data.tailoredResumeKey && data.submittedFormData` — Done only fires for a
  TRULY submitted application. A Needs-you reopen now falls through to the
  wizard's default Optimize start instead, which regenerates resume+cover via
  AI (the exact same path an In-flight reopen already took, so no new code
  needed) and lands the user on a real StepSubmit cheatsheet they can act on.
  DEVIATION (documented, not silently accepted): this makes a Needs-you
  reopen cost a fresh AI credit for the regeneration, since there is no
  persisted draft ResumeDocument to resume from instead (Phase 5's own
  documented schema gap — only the rendered PDF key is stored, not the
  structured JSON the cheatsheet needs). Same accepted trade-off already
  documented for cover-letter regeneration after a spent reservation handle
  (Phase 5). The alternative — persisting the full ResumeDocument JSON so a
  reopen can skip regeneration — is a real schema addition, out of scope for
  an edge-case-fix section.
- Pasted-link fetch fail: manual JD-paste fallback (built).
  ACTUAL: VERIFIED, no changes — Phase 7's `needsManualPaste` fallback in
  `jd-fetch.ts` is untouched by any later section; AddLinkModal still wires it.
- Stale/closed job: "Posted X ago, may be closed" hint; ATS URL may 404 → graceful;
  still allow mark-applied/skip.
  ACTUAL: VERIFIED, no changes needed. FeedJobCard already renders a "May be
  closed" badge when `differenceInDays(now, publishedAtIso) > STALE_JOB_DAYS`.
  A 404'ing `applyUrl` can't block anything in-app — Apply just opens it in a
  new tab (no server-side URL health check), and "I submitted"/"Pass" never
  depend on the ATS page actually loading — already graceful by construction.
- Credit reserved but generation fails: refund (built). Cover letter regeneration
  after handle spent → reserves new credit (documented in cover-letter route).
  ACTUAL: VERIFIED, no changes — Phase 4/5's reservation-handle refund and
  regen-reserves-fresh-credit behavior are untouched by any section since.
- External job missing applyUrl: hide "Open ATS", show "View original" only.
  ACTUAL: VERIFIED, no changes. StepSubmit already gates the entire "Open job
  application" link + split-view toggle behind `application.applyUrl` — when
  absent, neither renders, so there's no dead "Open ATS" affordance. ("View
  original" itself is a Browse/drawer-only affordance per Section E2, not part
  of the wizard's submit step — nothing to wire here.)
- Resume PDF render failure: error state, no finalize, no status/credit change.
  ACTUAL: VERIFIED, no changes. Read the finalize route in full: if
  `renderResumePdf` throws, the throw happens BEFORE the single
  `prisma.application.update` call — no partial write, no status/credit
  touched (finalize never touches credits at all; Phase 4 already
  reserved/refunded at generation time). StepSubmit's `catch` surfaces the
  error and never calls `onFinalized`, matching "error state, no finalize."
- Incomplete profile / missing ApplicationDefaults: prompt to fill before first apply.
  ACTUAL: REAL GAP FOUND + FIXED (partial nudge existed, not where it's
  needed). `/profile`'s `ApplicationDefaultsSection` already shows an empty-
  state nudge ("Complete before your first apply") linking to
  `/settings#application-defaults` — but only if the seeker happens to visit
  `/profile` first; nothing surfaced the prompt at the actual point of first
  apply. Added an inline banner in StepSubmit.tsx, shown only when
  `ApplicationDefaults` was never created at all (`!defaultsData?.data`,
  distinct from individual empty fields, which already render "Not set" per
  Section C1 and aren't worth nagging about), linking to the same
  `/settings#application-defaults` anchor. Opens in a new tab (`target=
  "_blank"`) rather than the same tab — navigating away in-place would lose
  the wizard's client-side `state.resume`/`state.coverLetter` (session-only,
  same schema gap noted above), so the copy explicitly says "your progress
  here is kept." This is a nudge, not a block — StepSubmit's cheatsheet and
  finalize both already work fine with zero ApplicationDefaults set (all
  fields optional per the schema).
- Recruiter-role account on flag-off: middleware redirect.
  ACTUAL: VERIFIED, no changes — `middleware.ts`'s `RECRUITER_ENABLED` gate
  (Section A) is untouched by every later section.
- Legacy /seeker/* deep links (old emails): redirect via A1.
  ACTUAL: VERIFIED, no changes — `LEGACY_SEEKER_REDIRECTS` (Section A) intact.
- Mobile: sidebar collapse, wizard stepper as horizontal scroll, table + kanban in
  overflow-x-auto containers; body never scrolls horizontally.
  ACTUAL: VERIFIED, no changes needed. Sidebar collapse (G-era AppSidebar),
  ApplicationsTable (`overflow-x-auto`, Section B3) and TrackerKanbanBoard
  (`overflow-x-auto`, Section F1) all correctly contain their own horizontal
  scroll; `AppShellClient`'s `<main overflow-x-hidden>` (Section B1/G)
  guarantees the page body itself never does. DEVIATION (better than spec'd,
  not a bug): `ApplyStepper` is NOT a horizontal-scroll strip on mobile — it's
  `flex-col` (vertically stacked) below `lg:` and only goes horizontal at
  `lg:` and up. A vertical stack for a 4-step list needs no scroll container
  at all and can't overflow; flagging the deviation from the plan's literal
  wording rather than "fixing" a component that's already safer than what was
  asked for.
- Optimistic mutations: all PATCH/POST/DELETE use TanStack Query optimistic updates
  with rollback on error; loading states on buttons.
  ACTUAL: Audited every mutation across dashboard/browse/tracker/wizard.
  Already optimistic+rollback: useSaveJob/useUnsaveJob (shared by dashboard +
  browse), FeedView's dismiss (Pass), the tracker's drag-to-change-status
  (Section F2) and its three-dot dropdown fallback (same mutation). Loading
  states confirmed present on Apply-to-all, Approve-all, CSV import, and
  Add-application buttons (`isPending`-gated disabled + label swap).
  REAL GAP FOUND + FIXED: TopMatchesRow's dismiss (Pass) mutation — the exact
  same action as FeedView's — had no `onMutate`/rollback, only invalidating
  on `onSettled`. Same action behaved differently depending on which page you
  passed a job from (instant removal on Browse, a beat of lag on Dashboard).
  Added the identical `onMutate`(optimistic filter + snapshot)/`onError`
  (rollback + toast) pair FeedView already uses, against the same
  `feedQueryKey({})` cache shape. NOT changed: CSV import and the
  Add-application modal stay non-optimistic on purpose — both produce
  server-determined final data (import's created/skipped/error counts, the
  new row's real id) that can't be meaningfully guessed client-side; their
  existing loading-state-then-invalidate pattern is the correct one for a
  bulk/create action, not a gap.
  pnpm tsc --noEmit, pnpm lint, pnpm build all clean after every fix above.

SECTION H SUMMARY: 5 real gaps found and fixed at the root (out-of-credits
pre-check missing on single Apply, the Needs-you-reopen false-success bug,
missing ApplicationDefaults nudge, TopMatchesRow's non-optimistic Pass, plus
the PaidFeatureModal hex color already fixed in G's sweep and referenced
here since it's this section's own "out of credits" surface); 8 edge cases
verified already correct with zero changes; 1 deviation flagged as better-
than-spec (ApplyStepper's vertical mobile layout). No test seeker credentials
in this session (same recurring constraint as every prior section) — verified
by full code trace of every touched route/component + tsc/lint/build, not a
live browser run. **Recommended before merging to main:** one real seeker
session exercising the out-of-credits block on a single Apply click and the
Needs-you reopen flow specifically, since both are freshly-changed control
flow this section, not just re-confirmed old behavior.

v1 (Sections A-H) is now code-complete across all branches, PR'd to staging.
Not scoped for v1 (see "Not scoped" list at the end of this file): Chrome
extension autofill, server-side auto-submit, mobile native, inbox/networking/
multi-language/enterprise SSO.

---

End-to-end verification (after all sections)

1. pnpm tsc + pnpm lint + pnpm build clean; migrations applied.
2. Fresh seeker → complete onboarding + profile + ApplicationDefaults.
3. /dashboard = credits banner + top matches + applications table (no old cards).
4. Banner shows real credit count; top matches render match rings; table tabs accurate.
5. Apply from dashboard AND browse → wizard → StepOptimize (AI resume) → StepCover
   (AI cover letter) → StepSubmit (enhanced cheatsheet with copy-all + copy-resume-as-text
   + copy-cover-letter + side-by-side toggle) → open ATS → paste → "I applied" → Done.
6. Enhanced cheatsheet: copy-all copies all fields; copy-resume formats as plain text;
   copy-cover-letter copies text; split view renders iframe with fallback.
7. Job leaves browse after apply; row moves In-flight→Needs-you→Submitted.
8. Apply-to-all N respects quota; Approve-all finalizes generated; partial failures isolated.
9. Add-your-own-link (Greenhouse/Lever/Ashby + generic + manual paste) → wizard completes.
10. Tracker kanban: 5 columns; drag changes status; statusLog records transitions;
    CSV import/export round-trips; manual add creates row.
11. Free quota exhausted → upsell modal; upgrade raises limit.
12. All old /seeker/* URLs 307; recruiter gated; mobile ~390px OK.
13. pnpm tsc + pnpm lint clean after every section.

Not scoped (Phase 8.5+)
- Chrome extension autofill (Phase 8.5)
- Server-side auto-submit or OTP inbox
- Mobile native apps
- Inbox / messaging
- Networking / referral features
- Multi-language support
- Enterprise SSO / team plans
