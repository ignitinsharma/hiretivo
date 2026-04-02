---
phase: 01-auth-onboarding
plan: "02"
subsystem: auth
tags: [registration, api-route, credentials, bcrypt, prisma]
dependency_graph:
  requires: []
  provides: [POST /api/auth/register, seeker-register-flow, recruiter-register-flow]
  affects: [auth-credentials-flow, onboarding-redirect]
tech_stack:
  added: []
  patterns: [next-app-router-route-handler, fetch-then-signin, bcrypt-12-rounds]
key_files:
  created:
    - src/app/api/auth/register/route.ts
  modified:
    - src/app/(auth)/seeker/register/page.tsx
    - src/app/(auth)/recruiter/register/page.tsx
decisions:
  - "bcrypt salt rounds set to 12 — good security/latency balance on Vercel"
  - "409 status for duplicate email — distinct from 400 validation error"
  - "companyName not stored in register route — deferred to Plan 05 RecruiterProfile creation"
  - "Email verification not triggered here — deferred to Plan 03"
  - "router.refresh() called after push to ensure session state updates"
metrics:
  duration: 84s
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_changed: 3
requirements_met: [AUTH-01, AUTH-02, AUTH-03]
---

# Phase 01 Plan 02: Register API Route and Page Integration Summary

Register API route and page integration wiring for both seeker and recruiter registration flows using fetch-then-signIn pattern with bcrypt password hashing.

## What Was Built

**Task 1: POST /api/auth/register route** (`dffeb5e`)

Created `src/app/api/auth/register/route.ts` — a Next.js App Router route handler that:
- Validates request body with `registerSchema` (400 on invalid input with field errors)
- Checks for duplicate email via `prisma.user.findUnique`, returns 409 if found
- Hashes password with `bcrypt.hash(password, 12)`
- Creates User record via `prisma.user.create` with email, name, passwordHash, role
- Returns 201 with `{ id, email, role }` on success
- Catches unexpected errors, logs them, returns 500

**Task 2: Register page onSubmit updates** (`bc2b6b0`)

Updated `onSubmit` in both register pages to use the two-step registration flow:
1. POST to `/api/auth/register` — creates the User row
2. On success, call `signIn("credentials")` — logs in the new user
3. On success, push to role-specific onboarding (`/seeker/onboarding` or `/recruiter/onboarding`)

Error handling added:
- 409 → specific "email already exists" toast
- Other non-ok → generic error from `err.error` field
- signIn failure → specific "created but sign-in failed" message with login prompt

JSX, imports (except internal), component structure, and styles were not modified.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the register API creates real User rows in the database. The flow is fully wired end-to-end.

## Self-Check

**Created files exist:**
- `src/app/api/auth/register/route.ts` — FOUND

**Commits exist:**
- `dffeb5e` — FOUND (feat(01-02): create POST /api/auth/register route)
- `bc2b6b0` — FOUND (feat(01-02): update register pages to call /api/auth/register before signIn)

## Self-Check: PASSED
