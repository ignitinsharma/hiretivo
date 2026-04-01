# Phase 1: Auth & Onboarding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 01-Auth & Onboarding
**Areas discussed:** Registration mechanism, Email verification gating, Wizard step persistence, Middleware & route guard logic

---

## Registration Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Server action + signIn | Server action creates user, calls signIn() immediately | |
| POST /api/auth/register route | Dedicated API route for creation, client then calls signIn() | ✓ |
| Extend Credentials provider | Modify authorize() to handle both login and registration | |

**User's choice:** POST `/api/auth/register` route  
**Notes:** After register succeeds, client auto-calls signIn('credentials') and redirects to onboarding — no separate login step.

### Google OAuth Role Assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Infer from page URL | Role inferred from callbackUrl path (seeker vs recruiter register page) | |
| Post-OAuth role selection screen | Separate role-selection page after Google callback | ✓ |

**User's choice:** Post-OAuth role selection screen  
**Notes:** Handles edge cases; explicit user intent captured for role.

---

## Email Verification Gating

| Option | Description | Selected |
|--------|-------------|----------|
| Soft gate — onboarding first | User proceeds to onboarding; feed/dashboard gated until verified | ✓ |
| Hard gate — verify before onboarding | Must click verification link before starting onboarding | |

**User's choice:** Soft gate  
**Notes:** Verification email sent immediately after signup. Unverified users can complete onboarding but not access the main feed/dashboard.

---

## Wizard Step Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Per-step server action | Each step upserts SeekerProfile; middleware can check progress | ✓ |
| Single save on completion | All data saved on wizard completion | |

**User's choice:** Per-step server action  
**Notes:** Enables resume capability and allows middleware to gate feed on Steps 1+2 completion.

### SeekerProfile Schema Gap

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate schema to add columns | Add situation, primaryRole, salaryMin/Max, currency, availability | ✓ |
| Store extras in JSON column | Single metadata: Json? column for non-core fields | |
| Only save what schema supports | Map to existing fields only, skip missing ones | |

**User's choice:** Migrate schema to add columns  
**Notes:** Clean, queryable, needed for matching engine in Phase 3.

---

## Middleware & Route Guard Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Export auth as middleware + custom checks | Auth.js v5 official pattern, extended in middleware.ts | ✓ |
| Fully custom middleware | Call auth() inside custom NextResponse middleware | |

**User's choice:** Export auth as middleware + custom checks

| Option | Description | Selected |
|--------|-------------|----------|
| Auth + role + onboarding completion | Full guard: seeker feed requires Steps 1+2; recruiter dashboard requires RecruiterProfile | ✓ |
| Auth + role only (no onboarding gate) | Simpler middleware; completion check left to page/layout | |

**User's choice:** Auth + role + onboarding completion  
**Notes:** /seeker/onboarding and /recruiter/onboarding exempt from onboarding completion check.

---

## Claude's Discretion

- Password hashing (bcryptjs salt rounds)
- VerificationToken generation strategy
- Exact verification email template
- Profile completeness field weighting
- Error response shapes for register API

## Deferred Ideas

None.
