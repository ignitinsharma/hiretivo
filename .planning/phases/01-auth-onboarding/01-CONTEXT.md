# Phase 1: Auth & Onboarding - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire authentication, email verification, seeker wizard persistence, recruiter onboarding, and route guards. All UI pages and Zustand stores are pre-built — no UI changes. Only backend logic: API routes, server actions, middleware, DB schema migration, and session wiring.

</domain>

<decisions>
## Implementation Decisions

### Registration Mechanism
- **D-01:** Credentials signup via POST `/api/auth/register` — dedicated API route creates user (hash password, set role), client calls `signIn('credentials')` immediately after, then redirects to role-specific onboarding. No extra login step.
- **D-02:** Google OAuth role assignment via post-OAuth role selection screen — after Google callback, redirect to a role-selection page before routing to onboarding. Role stored on User record at that point.

### Email Verification
- **D-03:** Soft gate — user proceeds to onboarding immediately after signup. Email verification is gated at the feed/dashboard level (not at onboarding). Resend sends verification email right after signup. Unverified users can complete onboarding but cannot access `/seeker/jobs` or `/recruiter/dashboard` until `emailVerified` is set.

### Wizard Persistence
- **D-04:** Per-step server action — each wizard step's "Next" triggers a server action that upserts `SeekerProfile`. Steps 1+2 completion visible in DB; middleware gates the feed on this. User can resume if they close the tab.
- **D-05:** Migrate `SeekerProfile` schema to add missing wizard fields: `situation`, `primaryRole`, `salaryMin`, `salaryMax`, `currency`, `availability`. Clean columns, queryable by the matching engine later.
- **D-06:** Recruiter onboarding also persisted via server action on completion — creates `RecruiterProfile` with `companyName`, `website`, `bio`. If schema is missing `companySize`, add it.

### Middleware & Route Guards
- **D-07:** Use `export { auth as middleware }` from `auth.ts` as base, extended with role + onboarding checks in `middleware.ts`. Auth.js v5 official pattern.
- **D-08:** Guard conditions:
  - `/seeker/*` (except `/seeker/onboarding`): must be authenticated + `SEEKER` role + Steps 1+2 complete (SeekerProfile exists with non-null `situation` and `primaryRole`).
  - `/recruiter/*` (except `/recruiter/onboarding`): must be authenticated + `RECRUITER` role + `RecruiterProfile` exists.
  - `/seeker/onboarding`, `/recruiter/onboarding`: auth only (no completion check).
  - Public routes, auth routes, Google OAuth role-selection: unauthenticated access allowed.
  - Redirect: wrong role → appropriate dashboard; not authed → login; not onboarded → onboarding.

### Profile Completeness
- **D-09:** `profileCompleteness` score computed from filled wizard fields. Formula: count of non-null fields across Steps 1–4 / total wizard fields × 100. Not stored in DB — computed on read (or cached in session after onboarding completion).

### Claude's Discretion
- Password hashing implementation (bcryptjs salt rounds)
- VerificationToken generation strategy (crypto.randomUUID or short token)
- Exact email template content for verification email
- Profile completeness exact field weighting
- Error response shapes for `/api/auth/register`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth & Schema
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-09 acceptance criteria
- `prisma/schema.prisma` — User, SeekerProfile, RecruiterProfile, VerificationToken, Account models (must understand before planning migration)
- `src/auth.ts` — Auth.js v5 config (providers, JWT callbacks, session callbacks) — extend, don't replace
- `src/lib/validations/auth.ts` — Existing Zod schemas for login and register

### Onboarding UI (connect, don't modify)
- `src/modules/seeker-onboarding/components/SeekerOnboardingContainer.tsx` — Wizard orchestration, step routing
- `src/store/use-seeker-onboarding-store.ts` — All wizard state fields; server actions must mirror this shape
- `src/modules/onboarding/components/OnboardingContainer.tsx` — Recruiter onboarding container

### Existing Pages (connect, don't modify)
- `src/app/(auth)/seeker/register/page.tsx` — Currently calls signIn() directly; needs to call /api/auth/register first
- `src/app/(auth)/recruiter/register/page.tsx` — Same pattern as seeker register
- `src/app/(auth)/seeker/onboarding/page.tsx` — Renders SeekerOnboardingContainer
- `src/app/(auth)/recruiter/onboarding/page.tsx` — Renders OnboardingContainer

### Project Constraints
- `.planning/PROJECT.md` §Critical Constraint — DO NOT modify existing UI components

[No external ADRs — requirements fully captured in decisions above and REQUIREMENTS.md]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/auth.ts` — `auth`, `signIn`, `signOut`, `handlers` already exported; use `auth()` in server components/actions for session
- `src/lib/prisma.ts` — Prisma client singleton; use in server actions and API routes
- `src/lib/validations/auth.ts` — `seekerRegisterSchema`, `recruiterRegisterSchema`, `loginSchema` ready to use for input validation in register route
- `src/store/use-seeker-onboarding-store.ts` — Zustand store with full step data shape; server action signatures should mirror step interfaces from `src/modules/seeker-onboarding/types/seeker-onboarding.types.ts`
- `bcryptjs` — already installed; use for password hashing in register route
- `resend` — already configured in `src/lib/` area; use for verification email

### Established Patterns
- Server actions: `"use server"` files, import `auth()` for session, import `prisma` for DB writes, return `{ success, error }` shape
- Zod validation: validate inputs at entry point, return typed errors
- Enum imports: use `src/constants/enums.ts` mirrors of Prisma enums in UI code; in server code, import directly from `@prisma/client`
- Toast notifications: `sonner` toast already used in register pages — don't add new toast libraries

### Integration Points
- Register pages (`/seeker/register`, `/recruiter/register`) → `/api/auth/register` POST → `signIn('credentials')` → redirect to onboarding
- Google OAuth callback → role-selection page (new route needed: `/auth/select-role`) → set role on User → redirect to onboarding
- Wizard steps → server actions (`saveWizardStep1`, `saveWizardStep2`, etc.) → upsert SeekerProfile → Zustand store already manages local state
- `middleware.ts` → `auth()` → check session role + onboarding fields → Next response redirect
- Verification link → `/api/auth/verify-email?token=...` → mark `emailVerified` on User → redirect to dashboard

</code_context>

<specifics>
## Specific Ideas

- Google OAuth role selection is intentional (not just inferring from URL) — this handles edge cases where user bookmarks or shares an OAuth link
- Soft email verification gate: unverified users land on a "please verify your email" banner in the dashboard, not a hard block screen
- SeekerProfile schema migration is part of this phase — planner should include a Prisma migration task

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-auth-onboarding*
*Context gathered: 2026-04-01*
