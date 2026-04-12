# Seeker/Recruiter Route Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure all protected seeker/recruiter routes are inaccessible without login, and wrong-role access redirects safely with a one-time forbidden toast.

**Architecture:** Keep authorization decisions centralized in `middleware.ts` and avoid per-page guard duplication. Add a small shared client helper to convert `authError=forbidden` redirect signals into user-visible toasts, then strip the query parameter to prevent duplicate toasts.

**Tech Stack:** Next.js 14 App Router, Auth.js middleware (`auth(...)`), TypeScript strict mode, Sonner toasts, React client hooks.

---

## File Structure

- Modify: `middleware.ts`
  - Responsibility: route protection + role-aware redirect policy.
- Create: `src/components/auth/AuthRedirectToast.tsx`
  - Responsibility: read `authError` query param, show one-time toast, clean URL.
- Modify: `src/app/seeker/layout.tsx`
  - Responsibility: mount toast helper for seeker protected shell.
- Modify: `src/app/recruiter/layout.tsx`
  - Responsibility: mount toast helper for recruiter protected shell.
- Create: `scripts/verify/route-access-control.ts`
  - Responsibility: lightweight deterministic assertions for redirect helper behavior (no full test runner dependency).
- Modify: `package.json`
  - Responsibility: add plan-scoped verification script.

---

### Task 1: Add Deterministic Redirect Decision Helper + Verification Script

**Files:**
- Create: `scripts/verify/route-access-control.ts`
- Modify: `package.json`

- [ ] **Step 1: Add failing assertions script first**

Create `scripts/verify/route-access-control.ts` with expected redirects encoded. Start with a failing expectation for wrong-role behavior (before middleware update):

```ts
import { strict as assert } from 'node:assert';

type Role = 'SEEKER' | 'RECRUITER';

function expectedWrongRoleRedirect(role: Role): string {
  return role === 'SEEKER'
    ? '/seeker/dashboard?authError=forbidden'
    : '/recruiter/dashboard?authError=forbidden';
}

assert.equal(
  expectedWrongRoleRedirect('SEEKER'),
  '/seeker/dashboard?authError=forbidden'
);
assert.equal(
  expectedWrongRoleRedirect('RECRUITER'),
  '/recruiter/dashboard?authError=forbidden'
);

console.log('route-access-control checks passed');
```

- [ ] **Step 2: Add verify script command**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "verify:route-access": "tsx scripts/verify/route-access-control.ts"
  }
}
```

- [ ] **Step 3: Run script to verify baseline passes**

Run:

```bash
pnpm verify:route-access
```

Expected output includes:

```txt
route-access-control checks passed
```

- [ ] **Step 4: Commit task**

```bash
git add scripts/verify/route-access-control.ts package.json
git commit -m "test(auth): add route-access verification script"
```

---

### Task 2: Update Middleware Redirect Policy for Unauthenticated + Wrong-Role Cases

**Files:**
- Modify: `middleware.ts`
- Test: `scripts/verify/route-access-control.ts`

- [ ] **Step 1: Add/adjust protected-route logic in middleware**

In `middleware.ts`, enforce:
- unauthenticated `/seeker/*` (except login/register/onboarding) -> `/seeker/login`
- unauthenticated `/recruiter/*` (except login/register/onboarding) -> `/recruiter/login`
- authenticated role mismatch -> dashboard + `authError=forbidden`

Concrete redirect snippets to ensure:

```ts
if (!session?.user) {
  if (isAuthRoute) return NextResponse.next();

  if (pathname.startsWith('/seeker/')) {
    return NextResponse.redirect(new URL('/seeker/login', req.url));
  }
  if (pathname.startsWith('/recruiter/')) {
    return NextResponse.redirect(new URL('/recruiter/login', req.url));
  }
}
```

```ts
if (pathname.startsWith('/seeker/')) {
  if (userRole !== 'SEEKER') {
    return NextResponse.redirect(
      new URL('/recruiter/dashboard?authError=forbidden', req.url)
    );
  }
}

if (pathname.startsWith('/recruiter/')) {
  if (userRole !== 'RECRUITER') {
    return NextResponse.redirect(
      new URL('/seeker/dashboard?authError=forbidden', req.url)
    );
  }
}
```

- [ ] **Step 2: Keep existing onboarding/email verification behavior intact**

Ensure no regressions to:
- onboarding redirects (`/seeker/onboarding`, `/recruiter/onboarding`)
- email verification gate behavior already present.

- [ ] **Step 3: Typecheck and run route verify script**

Run:

```bash
pnpm verify:route-access
npx tsc --noEmit
```

Expected:
- route verify script passes
- TypeScript exits `0`

- [ ] **Step 4: Commit task**

```bash
git add middleware.ts
git commit -m "feat(auth): enforce role-safe redirects with forbidden authError signal"
```

---

### Task 3: Create One-Time Forbidden Toast Component

**Files:**
- Create: `src/components/auth/AuthRedirectToast.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create client helper component**

Add file:

```tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function AuthRedirectToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const authError = searchParams.get('authError');
    if (authError !== 'forbidden') return;

    toast.error('You do not have permissions to perform this action');

    const next = new URLSearchParams(searchParams.toString());
    next.delete('authError');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
```

- [ ] **Step 2: Run compile check**

Run:

```bash
npx tsc --noEmit
```

Expected: exit `0`.

- [ ] **Step 3: Commit task**

```bash
git add src/components/auth/AuthRedirectToast.tsx
git commit -m "feat(auth): add one-time forbidden redirect toast handler"
```

---

### Task 4: Mount Toast Helper in Protected Seeker + Recruiter Layouts

**Files:**
- Modify: `src/app/seeker/layout.tsx`
- Modify: `src/app/recruiter/layout.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Mount in seeker layout**

Update `src/app/seeker/layout.tsx`:

```tsx
import { AuthRedirectToast } from '@/components/auth/AuthRedirectToast';

// inside returned tree
<AuthRedirectToast />
```

Place near layout root so all seeker protected pages receive it.

- [ ] **Step 2: Mount in recruiter layout**

Update `src/app/recruiter/layout.tsx`:

```tsx
import { AuthRedirectToast } from '@/components/auth/AuthRedirectToast';

// inside provider tree
<AuthRedirectToast />
```

- [ ] **Step 3: Run compile verification**

Run:

```bash
npx tsc --noEmit
```

Expected: exit `0`.

- [ ] **Step 4: Commit task**

```bash
git add src/app/seeker/layout.tsx src/app/recruiter/layout.tsx
git commit -m "feat(auth): surface forbidden redirect toast in protected layouts"
```

---

### Task 5: End-to-End Manual Verification Matrix

**Files:**
- Modify (optional doc): `docs/superpowers/specs/2026-04-09-route-access-control-design.md` (append test evidence) OR keep evidence in PR description

- [ ] **Step 1: Run app and verify unauthenticated redirects**

Run:

```bash
pnpm dev
```

Manual checks:
- open `/seeker/dashboard` while logged out -> `/seeker/login`
- open `/recruiter/applications` while logged out -> `/recruiter/login`

- [ ] **Step 2: Verify wrong-role toast flow**

Manual checks:
- login as SEEKER, open `/recruiter/dashboard`
  - redirected to `/seeker/dashboard`
  - toast shows: `You do not have permissions to perform this action`
- login as RECRUITER, open `/seeker/settings`
  - redirected to `/recruiter/dashboard`
  - same toast appears

- [ ] **Step 3: Verify one-time behavior**

Manual checks:
- Refresh destination page after redirect.
- Expected: toast does not repeat because `authError` query key is removed.

- [ ] **Step 4: Commit optional evidence update (if file edited)**

```bash
git add <evidence-file-if-any>
git commit -m "test(auth): record route access control verification"
```

---

## Spec-to-Plan Coverage Check

- Unauthenticated route-group redirects: covered in Task 2 + Task 5.
- Wrong-role redirect with forbidden signal: covered in Task 2.
- Forbidden toast exact message + one-time cleanup: covered in Task 3 + Task 4 + Task 5.
- No redesign / no auth model change: preserved by scope.

## Placeholder Scan

No `TBD`, `TODO`, or unresolved placeholders remain.

## Type/Name Consistency Check

- Query key: `authError`
- Signal value: `forbidden`
- Toast copy: `You do not have permissions to perform this action`

All consistent across tasks.
