# Phase 10: Settings Restructure & Auth Guards - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure both recruiter and seeker settings pages to relevant tabs/sections only, wire all forms to real APIs, add delete account flow for both roles, redirect logged-in users from homepage to their dashboard, and verify header avatar dropdown with sign-out works correctly. Payments billing UI is Phase 11.

Requirements: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, AUTH-01, AUTH-02

</domain>

<decisions>
## Implementation Decisions

### Recruiter Settings Tabs
- **D-01:** Remove Company tab from SETTINGS_TABS — Profile tab already has companyName and bio fields. Result: 3 tabs only (Profile, Security, Billing) per SET-01.
- **D-02:** Billing tab keeps "Coming soon" placeholder — Phase 11 builds real billing UI with Stripe. No wasted work.
- **D-03:** Security tab already has working change password flow using `/api/auth/change-password` — no changes needed to password logic.
- **D-04:** Add delete account section to recruiter Security tab (below change password form).

### Seeker Settings Structure
- **D-05:** Keep sidebar-with-anchor-links layout (not tabs). Remove BillingSection and Export Data from DangerZone. Seeker settings = Personal Info section + Password/Security section + Delete Account only.
- **D-06:** Profile section shows all onboarding fields: name, email (read-only with verified badge), headline, situation, primaryRole, salaryMin/salaryMax, currency, availability, skills, resume upload. All fields come from User + SeekerProfile models.
- **D-07:** Remove 2FA toggle from PasswordSecuritySection entirely (already a dead feature per Phase 08 CLN-02).
- **D-08:** Refactor PasswordSecuritySection to match recruiter SecurityTabContent pattern: shadcn `Input` components, `useForm` + `zodResolver` with `ChangePasswordSchema`, `useMutation` calling `/api/auth/change-password`. Replace `any` types and `console.log`.

### Seeker Settings API
- **D-09:** Create `/api/seeker/settings` with GET (returns User + SeekerProfile fields) and PATCH (updates both). Mirror recruiter `/api/recruiter/settings` pattern exactly: auth check, role check, rate limiting, Zod validation.
- **D-10:** Zod schema for seeker settings update goes in `src/lib/validations/seeker.schema.ts` (not in interview.schema.ts where recruiter schemas currently live).

### Delete Account Flow
- **D-11:** Type-to-confirm dialog using shadcn AlertDialog. User types "DELETE" to confirm. No password confirmation (won't work for OAuth-only accounts).
- **D-12:** Soft delete — add `deletedAt` (DateTime?) to User model via Prisma migration. Set `deletedAt` to now, anonymize PII (name → "Deleted User", email → `deleted-{id}@hiretivo.invalid`), keep related data intact for other party's integrity.
- **D-13:** Recruiter delete account also cancels Stripe subscription if `stripeCustomerId` exists — call Stripe API to cancel before soft-deleting. Handle gracefully if Stripe call fails (still proceed with deletion, log the error).
- **D-14:** Create `/api/auth/delete-account` endpoint (or server action) — shared by both roles. POST method, validates auth, performs soft delete + anonymization.

### Homepage Auth Redirect
- **D-15:** Server-component redirect in `src/app/page.tsx` — call `auth()` at top of `Home()`. If session exists, call `redirect()` from `next/navigation` to `/seeker/dashboard` or `/recruiter/dashboard` based on role. No middleware needed.
- **D-16:** This is a simple 3-line addition: import `auth` + `redirect`, check session, redirect. No architecture changes.

### Avatar Handling
- **D-17:** Remove "Change Avatar" button and "Change photo"/"Remove" buttons from both settings pages. Show initials circle from user's name only. Avatar upload is deferred — not worth the R2 + cropping complexity for v1.1.

### Header Avatar Dropdown (Verification Only)
- **D-18:** `Header.tsx` already implements avatar dropdown with Settings link + Sign Out for both roles. Verify it works correctly in production — no changes expected. This is a verification task, not an implementation task.

### Claude's Discretion
- Exact Zod schema shape for seeker settings (which fields are required vs optional)
- Resume upload field naming and validation rules
- Skeleton loader layout for seeker settings loading state
- Delete account dialog copy (warning text, confirmation instructions)
- Whether to add a `User.status` enum field or just rely on `deletedAt` for soft delete

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Recruiter Settings (modify)
- `src/app/recruiter/settings/page.tsx` — Full recruiter settings page with 4 tabs; merge to 3 tabs
- `src/app/api/recruiter/settings/route.ts` — GET + PATCH recruiter settings API (pattern to mirror for seeker)
- `src/lib/validations/interview.schema.ts` — `RecruiterProfileSettingsSchema`, `ChangePasswordSchema` (used by both roles)

### Seeker Settings (rebuild)
- `src/app/seeker/settings/page.tsx` — Seeker settings page with sidebar layout (keep structure, wire to API)
- `src/modules/seeker/settings/components/PersonalInfoSection.tsx` — Hardcoded mock, needs full rewrite with real data
- `src/modules/seeker/settings/components/PasswordSecuritySection.tsx` — Refactor to match recruiter pattern, remove 2FA
- `src/modules/seeker/settings/components/SettingsSidebar.tsx` — Update to remove Billing link
- `src/modules/seeker/settings/components/DangerZoneSection.tsx` — Remove Export Data, keep Delete Account
- `src/modules/seeker/settings/components/BillingSection.tsx` — DELETE this file entirely

### Auth & Password
- `src/app/api/auth/change-password/route.ts` — Working change password API for both roles
- `src/components/layout/SignOutButton.tsx` — Sign out button component

### Header & Navigation
- `src/components/layout/Header.tsx` — Server Component with auth-aware avatar dropdown (verify, don't modify)
- `src/components/layout/SeekerHeader.tsx` — Client component with avatar dropdown (may need to verify)
- `src/components/layout/RecruiterHeader.tsx` — Recruiter page header (not the main nav)
- `src/constants/nav.ts` — SEEKER_NAV_ITEMS, RECRUITER_NAV_ITEMS arrays

### Homepage
- `src/app/page.tsx` — Homepage Server Component; add auth redirect at top

### Schema
- `prisma/schema.prisma` — User, SeekerProfile, RecruiterProfile models (need `deletedAt` field migration)

### Prior Phase Context
- `.planning/phases/01-auth-onboarding/01-CONTEXT.md` — Auth patterns, session shape, middleware approach
- `.planning/phases/05-homepage-pricing-nav/05-CONTEXT.md` — Header as Server Component, nav variants
- `.planning/phases/08-bug-fixes-schema-foundation-cleanup/8-CONTEXT.md` — Schema changes, notification removal, CLN-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `/api/auth/change-password` route — Works for both roles (checks session.user.id, bcrypt compare, hash new password). Seeker password section should call this same endpoint.
- `/api/recruiter/settings` route — Pattern to mirror for seeker: auth check → role check → rate limit → Zod validate → Prisma update → return
- `ChangePasswordSchema` in interview.schema.ts — Already validates currentPassword, newPassword, confirmPassword with match check
- `RecruiterProfileSettingsSchema` — Pattern for how settings schemas work (name, company fields)
- `SeekerProfile` model has all onboarding fields: situation, primaryRole, salaryMin, salaryMax, currency, availability, headline, skills (JSON), resumeUrl

### Established Patterns
- Server Component `auth()` call at page level (Header.tsx, homepage)
- TanStack Query `useQuery` + `useMutation` in client components for settings
- React Hook Form + `zodResolver` for all form validation
- shadcn Input/Textarea/Skeleton for form elements
- Rate limiting with `createRateLimiter` on all API routes
- Toast notifications via `sonner` for success/error feedback

### Integration Points
- Seeker settings page → NEW `/api/seeker/settings` endpoint → Prisma (User + SeekerProfile)
- Delete account → NEW `/api/auth/delete-account` → Prisma (soft delete User) + Stripe API (cancel if recruiter)
- Homepage `page.tsx` → `auth()` → `redirect()` based on role
- Recruiter settings → existing `/api/recruiter/settings` (remove Company tab, add delete account)
- Header avatar dropdown → already wired (verify only)

### Key Observations
- Seeker settings components use raw `<input>` elements (not shadcn) — need to migrate to `<Input>` from `@/components/ui/input`
- `PersonalInfoSection` has hardcoded "Alex Rivera" defaults — must load from API
- `PasswordSecuritySection` uses `useForm` without zodResolver and has `any` types — full refactor needed
- `BillingSection.tsx` should be deleted entirely (seekers don't pay)
- The `ChangePasswordSchema` lives in `interview.schema.ts` — this is a misnomer. Planner should note this but not relocate it in this phase to avoid breaking changes.
- Recruiter `RecruiterHeader` component is a page-level header (shows title + subtitle), NOT the main nav. The main nav is `Header.tsx`.

</code_context>

<specifics>
## Specific Ideas

- Seeker settings should feel like a comprehensive profile editor — all the fields from onboarding, editable in one scrollable page
- Delete account type-to-confirm pattern: "Type DELETE to confirm" — simple and effective
- Soft delete keeps data for the other party — recruiter's applicants can still see that they applied, seekers can see past applications
- Homepage redirect is just 3 lines in the existing Server Component — no new files needed
- Remove avatar buttons from both settings pages — initials-only is fine for v1.1

</specifics>

<deferred>
## Deferred Ideas

- Avatar upload to R2 with image cropping — complex feature, defer to v2
- Real billing tab content — Phase 11 (Payments Integration)
- Seeker billing section (showing free plan card) — not needed, seekers don't pay
- Middleware-based auth guards — not needed, server-component redirect is simpler and already established
- Schema relocation (interview.schema.ts → proper naming) — avoid breaking changes in this phase

</deferred>

---

*Phase: 10-settings-restructure-auth-guards*
*Context gathered: 2026-04-16*
