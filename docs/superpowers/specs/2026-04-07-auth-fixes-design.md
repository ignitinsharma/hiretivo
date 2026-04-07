# Design: Auth Fixes — Resume Upload Crash, Logout, Auth Redirects

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

Three independent fixes that address crashes and missing auth behaviors:

1. **StepResume crash** — `saveStep3` receives a `File` object as a plain server action prop, which Next.js cannot serialize. Also, the zustand persist store tries to write a `File` to localStorage, which crashes.
2. **Logout not wired** — RecruiterSidebar has a Sign Out button with no handler. SeekerHeader has no logout at all (avatar with chevron but no dropdown).
3. **No auth-based redirects** — Logged-in users can hit `/` and login/register pages without being redirected to their dashboard.

---

## Fix 1: StepResume Crash

### Root causes

- `saveStep3({ resumeFile: file })` passes a `File` object as a plain JSON-serialized server action argument. Next.js only supports `File` in server actions when wrapped in `FormData`. This crashes on Continue.
- The zustand `persist` middleware serializes the full store to localStorage. `step3.resume.file` is a `File` object, which is not JSON-serializable, causing silent failure or crash on hydration.

### Changes

**`src/app/actions/onboarding/seeker.ts`**
- Change `saveStep3` signature from `{ resumeFile: File | null }` to `formData: FormData`
- Extract file with `const resumeFile = formData.get('resumeFile') as File | null`
- Rest of logic unchanged (null check, R2 upload, prisma upsert)

**`src/modules/seeker-onboarding/components/StepResume.tsx`**
- `handleContinue`: build `FormData`, append file if present, pass to `saveStep3(formData)`
- Remove the old plain-object call

**`src/store/use-seeker-onboarding-store.ts`**
- Add `partialize` to the `persist` config that strips `step3.resume.file` before writing to localStorage (keep all other fields including resume metadata — name, size, type, key, url)

---

## Fix 2: Logout

### Changes

**`src/components/layout/SeekerHeader.tsx`**
- Replace the static avatar + chevron `div` with a shadcn `DropdownMenu`
- Trigger: the existing avatar circle + chevron
- Menu items:
  - "Settings" → `Link` to `/seeker/settings`
  - Separator
  - "Sign Out" → `signOut({ callbackUrl: "/" })` from `next-auth/react`

**`src/components/layout/RecruiterSidebar.tsx`**
- Add `onClick={() => signOut({ callbackUrl: "/" })}` to the existing "Sign Out" button (UI already present)
- Import `signOut` from `next-auth/react`

---

## Fix 3: Auth-Based Redirects

### Rules

| Visitor state | URL | Action |
|---|---|---|
| Logged in (SEEKER) | `/` | Redirect to `/seeker/dashboard` |
| Logged in (RECRUITER) | `/` | Redirect to `/recruiter/dashboard` |
| Logged in (SEEKER) | `/seeker/login` or `/seeker/register` | Redirect to `/seeker/dashboard` |
| Logged in (RECRUITER) | `/recruiter/login` or `/recruiter/register` | Redirect to `/recruiter/dashboard` |
| Not logged in | Protected routes | Already handled (redirect to login) |

### Changes

**`middleware.ts`**
- **Landing page rule**: At the start of the public-route handler, before `return NextResponse.next()`, add: if `session?.user` exists and `pathname === "/"`, redirect based on `session.user.role`
- **Login/register rule**: In the `isAuthRoute` block (currently just returns next), add: if `session?.user` exists and the route is a login or register page, redirect to their dashboard

---

## Out of Scope

- Onboarding redirect handling (already handled by middleware's profile check)
- Seeker `/onboarding` redirect when already onboarded (existing behavior unchanged)
- Any UI redesign of the header or sidebar
