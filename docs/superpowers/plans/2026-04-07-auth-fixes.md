# Auth Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the seeker onboarding resume upload crash, wire logout for both seeker and recruiter, and redirect logged-in users away from `/` and login/register pages.

**Architecture:** Three independent fixes touching a server action (FormData serialization), a zustand store (partialize), two layout components (logout wiring), and middleware (redirect rules). No new abstractions — pure targeted changes.

**Tech Stack:** Next.js 14 App Router, Auth.js v5, Zustand with persist, shadcn/ui, next-auth/react `signOut`

---

## File Map

| File | Change |
|---|---|
| `src/app/actions/onboarding/seeker.ts` | `saveStep3` accepts `FormData` instead of plain object |
| `src/modules/seeker-onboarding/components/StepResume.tsx` | `handleContinue` builds `FormData` before calling action |
| `src/store/use-seeker-onboarding-store.ts` | Add `partialize` to persist config to exclude `File` from localStorage |
| `src/components/ui/dropdown-menu.tsx` | New — install shadcn dropdown-menu component |
| `src/components/layout/SeekerHeader.tsx` | Replace static avatar+chevron with `DropdownMenu` (Settings + Sign Out) |
| `src/components/layout/RecruiterSidebar.tsx` | Wire `signOut` to existing Sign Out button |
| `middleware.ts` | Add redirect rules: `/` for logged-in users; login/register for already-authenticated users |

---

## Task 1: Fix `saveStep3` — accept FormData

**Files:**
- Modify: `src/app/actions/onboarding/seeker.ts`

- [ ] **Step 1: Update `saveStep3` signature and file extraction**

Replace the existing `saveStep3` function (lines 82–108) with:

```typescript
// --- Step 3: Resume (upload to R2, store key in DB) ---
// Step 3 is skippable so null values are valid.
// Accepts FormData so the File object is transferred correctly across
// the server action boundary (plain object props cannot carry File).
export async function saveStep3(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const resumeFile = formData.get('resumeFile') as File | null;
  let resumeKey: string | null = null;

  if (resumeFile && resumeFile.size > 0) {
    const key = R2_KEYS.resume(session.user.id);
    await uploadFile(resumeFile, key);
    resumeKey = key;
  }

  await prisma.seekerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      resumeKey,
    },
    update: {
      resumeKey,
    },
  });

  return { success: true };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors on `seeker.ts` (there may be a type error in `StepResume.tsx` since it still passes a plain object — that's fixed in Task 2).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/onboarding/seeker.ts
git commit -m "fix(onboarding): saveStep3 accepts FormData for File serialization"
```

---

## Task 2: Fix `StepResume` — pass FormData to server action

**Files:**
- Modify: `src/modules/seeker-onboarding/components/StepResume.tsx`

- [ ] **Step 1: Update `handleContinue` to build FormData**

Replace the existing `handleContinue` function (lines 90–100):

```typescript
const handleContinue = async () => {
  const formData = new FormData();
  if (step3.resume?.file) {
    formData.append('resumeFile', step3.resume.file);
  }

  const result = await saveStep3(formData);

  if (!result.success) {
    console.error("[StepResume] saveStep3 failed:", result.error);
  }

  onNext();
};
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`pnpm dev`), go to `/seeker/onboarding`, complete Steps 1 & 2, upload a PDF on Step 3, click Continue. Expected: no crash, wizard advances to Step 4.

- [ ] **Step 4: Commit**

```bash
git add src/modules/seeker-onboarding/components/StepResume.tsx
git commit -m "fix(onboarding): pass FormData to saveStep3 instead of plain File prop"
```

---

## Task 3: Fix zustand persist — exclude `File` from localStorage

**Files:**
- Modify: `src/store/use-seeker-onboarding-store.ts`

**Context:** The `persist` middleware JSON-serializes the entire store to localStorage. `step3.resume.file` is a `File` object — not JSON-serializable. `partialize` lets us strip it before writing.

- [ ] **Step 1: Add `partialize` to the persist config**

Replace the persist options block (currently just `{ name: 'hiretivo-seeker-onboarding' }`) with:

```typescript
{
  name: 'hiretivo-seeker-onboarding',
  partialize: (state: SeekerOnboardingState) => ({
    ...state,
    step3: {
      ...state.step3,
      resume: state.step3.resume
        ? { ...state.step3.resume, file: null }
        : null,
    },
  }),
}
```

The full `persist(...)` call after the change:

```typescript
export const useSeekerOnboardingStore = create<SeekerOnboardingState>()(
  persist(
    (set, get) => ({
      // ... all existing state and actions unchanged ...
    }),
    {
      name: 'hiretivo-seeker-onboarding',
      partialize: (state: SeekerOnboardingState) => ({
        ...state,
        step3: {
          ...state.step3,
          resume: state.step3.resume
            ? { ...state.step3.resume, file: null }
            : null,
        },
      }),
    }
  )
);
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Manual verification**

Open DevTools → Application → Local Storage → `hiretivo-seeker-onboarding`. After uploading a resume on Step 3, confirm the stored JSON has `"file": null` (not a File object or error).

- [ ] **Step 4: Commit**

```bash
git add src/store/use-seeker-onboarding-store.ts
git commit -m "fix(store): exclude File object from zustand persist serialization"
```

---

## Task 4: Install shadcn dropdown-menu component

**Files:**
- Create: `src/components/ui/dropdown-menu.tsx`

- [ ] **Step 1: Add the component**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm dlx shadcn@latest add dropdown-menu
```

Expected: `src/components/ui/dropdown-menu.tsx` created, no errors.

- [ ] **Step 2: Verify it exists**

```bash
ls /Users/nitinsharma/Documents/personal/hiretivo/src/components/ui/dropdown-menu.tsx
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/dropdown-menu.tsx
git commit -m "chore: add shadcn dropdown-menu component"
```

---

## Task 5: Wire SeekerHeader — avatar dropdown with Settings + Sign Out

**Files:**
- Modify: `src/components/layout/SeekerHeader.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { SEEKER_NAV_ITEMS } from '@/constants/nav';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SeekerHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
            H
          </div>
          <h2 className="text-slate-900 text-xl font-extrabold tracking-tight">
            Hiretivo
          </h2>
        </div>

        <nav className="hidden md:flex flex-1 justify-center gap-8">
          {SEEKER_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-medium text-sm transition-colors',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-slate-600 hover:text-primary'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="icon-ghost" size="icon-sm" className="bg-slate-100 rounded-xl">
            <Bell className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative cursor-pointer flex items-center gap-2 group outline-none">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-transparent transition-all group-hover:border-primary">
                    NS
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link
                    href="/seeker/settings"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`pnpm dev`), navigate to `/seeker/dashboard`. Click the avatar — dropdown should open with "Settings" and "Sign Out". Click "Sign Out" — should redirect to `/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/SeekerHeader.tsx
git commit -m "feat(seeker): add avatar dropdown with Settings and Sign Out"
```

---

## Task 6: Wire RecruiterSidebar — connect Sign Out button to signOut

**Files:**
- Modify: `src/components/layout/RecruiterSidebar.tsx`

- [ ] **Step 1: Add signOut import**

At the top of the file, add the import after the existing imports:

```typescript
import { signOut } from 'next-auth/react';
```

- [ ] **Step 2: Wire the Sign Out button**

Find the Sign Out button near the bottom of `RecruiterSidebarInner` (currently has no `onClick`):

```tsx
{/* Sign Out */}
<div className="border-t border-slate-200">
  <button
    className={cn(
      'w-full flex items-center gap-3 py-4 px-6 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors',
      collapsed && 'justify-center px-0'
    )}
  >
    <LogOut className="w-5 h-5 shrink-0" />
    {!collapsed && <span>Sign Out</span>}
  </button>
</div>
```

Replace with:

```tsx
{/* Sign Out */}
<div className="border-t border-slate-200">
  <button
    onClick={() => signOut({ callbackUrl: '/' })}
    className={cn(
      'w-full flex items-center gap-3 py-4 px-6 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors',
      collapsed && 'justify-center px-0'
    )}
  >
    <LogOut className="w-5 h-5 shrink-0" />
    {!collapsed && <span>Sign Out</span>}
  </button>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles clean**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Navigate to `/recruiter/dashboard`. Click "Sign Out" in the sidebar. Expected: redirected to `/`.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/RecruiterSidebar.tsx
git commit -m "feat(recruiter): wire Sign Out button to signOut"
```

---

## Task 7: Middleware — auth-based redirects for `/` and login/register pages

**Files:**
- Modify: `middleware.ts`

**Context:** Two new redirect rules:
1. Logged-in user at `/` → their dashboard
2. Logged-in user at a login/register page → their dashboard

Both are added before any of the existing seeker/recruiter route logic.

- [ ] **Step 1: Replace the full `middleware.ts`**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Use Node.js runtime — Prisma not supported in Edge Runtime
export const runtime = "nodejs";

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Routes that need NO guard (public, auth pages, API, static) ──
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/(public)") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublicRoute) {
    // Redirect logged-in users away from the landing page to their dashboard
    if (session?.user && pathname === "/") {
      const dest =
        session.user.role === "RECRUITER"
          ? "/recruiter/dashboard"
          : "/seeker/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Auth-only routes (login, register, onboarding — accessible to authenticated users)
  const isLoginOrRegister =
    pathname.startsWith("/seeker/login") ||
    pathname.startsWith("/seeker/register") ||
    pathname.startsWith("/recruiter/login") ||
    pathname.startsWith("/recruiter/register");

  const isAuthRoute =
    isLoginOrRegister ||
    pathname.startsWith("/seeker/onboarding") ||
    pathname.startsWith("/recruiter/onboarding");

  // ── Unauthenticated: redirect to appropriate login ──
  if (!session?.user) {
    if (pathname.startsWith("/seeker/")) {
      return NextResponse.redirect(new URL("/seeker/login", req.url));
    }
    if (pathname.startsWith("/recruiter/")) {
      return NextResponse.redirect(new URL("/recruiter/login", req.url));
    }
    return NextResponse.next();
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  const emailVerified = session.user.emailVerified;

  // ── Redirect logged-in users away from login/register pages ──
  if (isLoginOrRegister) {
    const dest =
      userRole === "RECRUITER"
        ? "/recruiter/dashboard"
        : "/seeker/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── Allow onboarding routes for authenticated users (any role) ──
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // ── Seeker routes ──
  if (pathname.startsWith("/seeker/")) {
    // Wrong role: RECRUITER trying to access seeker routes
    if (userRole !== "SEEKER") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
    }

    // Check Steps 1+2 completion (per D-08)
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId },
      select: { situation: true, primaryRole: true },
    });

    const isOnboarded =
      seekerProfile?.situation != null && seekerProfile?.primaryRole != null;

    if (!isOnboarded) {
      return NextResponse.redirect(new URL("/seeker/onboarding", req.url));
    }

    // Email verification gate for /seeker/dashboard only (per D-03)
    if (pathname.startsWith("/seeker/dashboard") && !emailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email-pending", req.url));
    }

    return NextResponse.next();
  }

  // ── Recruiter routes ──
  if (pathname.startsWith("/recruiter/")) {
    // Wrong role: SEEKER trying to access recruiter routes
    if (userRole !== "RECRUITER") {
      return NextResponse.redirect(new URL("/seeker/dashboard", req.url));
    }

    // Check RecruiterProfile exists (per D-08)
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!recruiterProfile) {
      return NextResponse.redirect(new URL("/recruiter/onboarding", req.url));
    }

    // Email verification gate for /recruiter/dashboard only (per D-03)
    if (pathname.startsWith("/recruiter/dashboard") && !emailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email-pending", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

// Match all non-static routes
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /Users/nitinsharma/Documents/personal/hiretivo && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Manual smoke tests — all four redirect rules**

Start dev server (`pnpm dev`).

| Scenario | URL | Expected |
|---|---|---|
| Logged in as SEEKER | `/` | Redirects to `/seeker/dashboard` |
| Logged in as RECRUITER | `/` | Redirects to `/recruiter/dashboard` |
| Logged in as SEEKER | `/seeker/login` | Redirects to `/seeker/dashboard` |
| Logged in as RECRUITER | `/recruiter/login` | Redirects to `/recruiter/dashboard` |
| Not logged in | `/seeker/dashboard` | Redirects to `/seeker/login` |
| Not logged in | `/` | Renders landing page (no redirect) |

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(middleware): redirect logged-in users away from / and login/register pages"
```
