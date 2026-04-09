# Route Access Control Design (Seeker/Recruiter)

## Summary
Enforce strict protection for private seeker/recruiter routes in middleware with role-aware redirects and a user-facing toast for role mismatch.

Chosen approach: middleware redirect with query-param signal (`authError=forbidden`) and client-side toast display.

## Goals
- Unauthenticated users cannot access protected routes.
- Unauthenticated redirects are route-group specific:
  - `/seeker/*` -> `/seeker/login`
  - `/recruiter/*` -> `/recruiter/login`
- Wrong-role authenticated users are blocked and informed with toast:
  - Message: `You do not have permissions to perform this action`

## Non-Goals
- No new 403 page.
- No redesign of existing auth/login/onboarding pages.
- No auth provider/session model changes.

## Route Policy
### Public/Allowed without login
- `/`
- `/jobs/*` and other existing public routes
- `/seeker/login`, `/seeker/register`, `/seeker/onboarding`
- `/recruiter/login`, `/recruiter/register`, `/recruiter/onboarding`
- `/api/*`, static assets

### Protected
- All other `/seeker/*` routes
- All other `/recruiter/*` routes

## Redirect Behavior
### Unauthenticated user
- Visiting protected `/seeker/*` -> redirect to `/seeker/login`
- Visiting protected `/recruiter/*` -> redirect to `/recruiter/login`

### Authenticated wrong-role user
- SEEKER visiting `/recruiter/*` -> redirect to `/seeker/dashboard?authError=forbidden`
- RECRUITER visiting `/seeker/*` -> redirect to `/recruiter/dashboard?authError=forbidden`

## UX: Forbidden Toast
Add a small client helper component that:
1. Reads `authError` from URL search params.
2. If `authError === 'forbidden'`, shows toast:
   - `You do not have permissions to perform this action`
3. Removes the param via `router.replace(...)` so refresh does not re-toast.

Recommended mount points:
- Seeker protected layout/page root
- Recruiter protected layout/page root

## Components and Files
- `middleware.ts`
  - Keep existing guard structure.
  - Ensure protected-route checks remain centralized.
  - Update wrong-role redirects to append `authError=forbidden`.
- `src/components/auth/AuthRedirectToast.tsx` (new)
  - Client component for one-time toast and query cleanup.
- Mount `AuthRedirectToast` in seeker/recruiter protected shell(s).

## Error Handling
- Missing/invalid `authError` -> no-op.
- If toast system is unavailable temporarily, redirect still succeeds (security behavior unaffected).

## Test Plan
1. Logged out -> `/seeker/dashboard` -> lands on `/seeker/login`.
2. Logged out -> `/recruiter/applications` -> lands on `/recruiter/login`.
3. Logged in as SEEKER -> open `/recruiter/dashboard`:
   - redirected to `/seeker/dashboard`
   - toast appears once with exact message.
4. Logged in as RECRUITER -> open `/seeker/settings`:
   - redirected to `/recruiter/dashboard`
   - toast appears once with exact message.
5. Refresh redirected page:
   - no duplicate forbidden toast.
6. Verify valid same-role navigation remains unaffected.

## Risks and Mitigations
- Risk: repeated toast on refresh/back.
  - Mitigation: immediately remove `authError` from URL after showing toast.
- Risk: inconsistent behavior if mounted only on one side.
  - Mitigation: mount toast helper in both seeker and recruiter protected roots.

## Implementation Notes
- Keep logic in middleware (single source of truth).
- Avoid duplicating role checks in many pages.
- Keep existing onboarding and email-verification gates as-is unless conflicting during implementation.
