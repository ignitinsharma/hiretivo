# Phase 10: Settings Restructure & Auth Guards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 10-settings-restructure-auth-guards
**Areas discussed:** Seeker settings structure & fields, Recruiter settings tab merge, Delete account flow, Homepage auth redirect, Avatar upload, Seeker settings API

---

## Seeker Settings Structure & Fields

| Option | Description | Selected |
|--------|-------------|----------|
| All onboarding fields + resume | Show name, email, headline, situation, primaryRole, salary range, availability, skills, resume upload | ✓ |
| Core identity only | Name, email, headline, location, website only | |
| Same as current + wire API | Keep PersonalInfoSection fields, just wire to API | |

**User's choice:** All onboarding fields + resume
**Notes:** SeekerProfile has many fields from onboarding that should all be editable

### Seeker Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Keep sidebar + anchor links | Works well for scrollable forms with many fields | ✓ |
| Switch to tab-based layout | Match recruiter settings style | |

**User's choice:** Keep sidebar + anchor links

### Seeker Dead Section Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Remove Billing + Export Data | Billing gone, DangerZone only has Delete Account | ✓ |
| Keep minimal Free Plan card | Replace billing with "You're on Free plan" card | |

**User's choice:** Remove both Billing + Export Data

---

## Recruiter Settings Tab Merge

| Option | Description | Selected |
|--------|-------------|----------|
| Just remove Company tab | Profile already has companyName + bio | ✓ |
| Merge + add company fields | Add website, companySize, industry, logo from onboarding | |

**User's choice:** Just remove Company tab

### Billing Tab

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Coming Soon placeholder | Phase 11 builds real billing | ✓ |
| Show basic plan info | Read User.planType, display plan name | |

**User's choice:** Keep Coming Soon placeholder

---

## Delete Account Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Type-to-confirm dialog | AlertDialog, type "DELETE" to confirm | ✓ |
| Password confirmation | Ask for current password | |
| Two-step: confirm + type email | Two dialogs for maximum safety | |

**User's choice:** Type-to-confirm dialog

### Delete Data Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete — mark inactive | Add deletedAt, anonymize PII, keep relations | ✓ |
| Hard delete everything | Cascade delete all related data | |
| Soft delete + anonymize relations | Replace names with "Deleted User", unpublish jobs | |

**User's choice:** Soft delete — mark user inactive

---

## Homepage Auth Redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Server-component redirect in page.tsx | Call auth() + redirect() at top of Home() | ✓ |
| Middleware-based redirect | Create middleware.ts to intercept / | |
| Client-side redirect in Header | Redirect effect in Header component | |

**User's choice:** Server-component redirect in page.tsx

---

## Avatar Upload

| Option | Description | Selected |
|--------|-------------|----------|
| Remove avatar button | Show initials only, defer upload to v2 | ✓ |
| Implement avatar upload | Wire R2 + image cropping | |
| Disable with tooltip | Show button but mark "Coming soon" | |

**User's choice:** Remove avatar button

---

## Seeker Settings API

| Option | Description | Selected |
|--------|-------------|----------|
| Single endpoint GET+PATCH | Mirror recruiter /api/recruiter/settings | ✓ |
| Separate profile + password endpoints | /api/seeker/profile + /api/auth/change-password | |

**User's choice:** Single endpoint GET+PATCH

---

## Claude's Discretion

- Seeker password form refactored to match recruiter pattern (shadcn Input, zodResolver, useMutation)
- Zod schema placement for seeker settings
- Skeleton loader layouts
- Delete account dialog copy
- Soft delete field choice (deletedAt vs status enum)

## Deferred Ideas

- Avatar upload to R2 — deferred to v2
- Billing tab content — Phase 11
- Schema file renaming — avoid breaking changes
