# Auth Protection Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix authentication protection so unauthenticated users cannot access seeker/recruiter dashboard pages.

**Architecture:** Three-layer protection: (1) Fixed Edge Runtime middleware as primary gate, (2) Layout-level server component auth guards as defense in depth, (3) Existing AuthRedirectToast for user feedback.

**Tech Stack:** Next.js 14 App Router, Auth.js v5, Prisma Edge Client, TypeScript

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `middleware.ts` | **Modify** | Primary auth gate — fix runtime, route matching, Edge Prisma |
| `src/lib/prisma-edge.ts` | **Create** | Edge-compatible Prisma client export |
| `src/app/seeker/layout.tsx` | **Modify** | Add server-side auth verification |
| `src/app/recruiter/layout.tsx` | **Modify** | Add server-side auth verification |
| `src/components/auth/AuthGuard.tsx` | **Create** | Reusable server-side auth guard component (DRY) |

**Decision:** Instead of duplicating auth logic in both layouts, I'll create a shared `AuthGuard` component that both layouts use. This follows DRY principle and keeps layouts clean.

---

### Task 1: Create Edge-Compatible Prisma Client

**Files:**
- Create: `src/lib/prisma-edge.ts`

- [ ] **Step 1: Create Edge Prisma client export**

The middleware needs an Edge-compatible Prisma client. The existing `src/lib/prisma.ts` uses `@prisma/adapter-pg` which requires Node.js. We'll create a separate Edge client using `@prisma/client/edge`.

```ts
// src/lib/prisma-edge.ts
import { PrismaClient } from "@prisma/client/edge";

const globalForPrisma = globalThis as unknown as {
  prismaEdge: PrismaClient | undefined;
};

export const prismaEdge =
  globalForPrisma.prismaEdge ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaEdge = prismaEdge;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prisma-edge.ts
git commit -m "feat(auth): add Edge-compatible Prisma client for middleware"
```

---

### Task 2: Create Reusable AuthGuard Component

**Files:**
- Create: `src/components/auth/AuthGuard.tsx`
- Test: Manual browser testing (no unit test framework exists)

- [ ] **Step 1: Create AuthGuard server component**

This component performs server-side auth verification and redirects unauthenticated users. Both seeker and recruiter layouts will use it.

```tsx
// src/components/auth/AuthGuard.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/constants/enums";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  loginPath: string;
  onboardingPath: string;
  fallbackDashboard: string;
}

export async function AuthGuard({
  children,
  requiredRole,
  loginPath,
  onboardingPath,
  fallbackDashboard,
}: AuthGuardProps) {
  const session = await auth();

  // No session → redirect to login
  if (!session?.user) {
    redirect(loginPath);
  }

  // Wrong role → redirect to their dashboard with error
  if (session.user.role !== requiredRole) {
    redirect(`${fallbackDashboard}?authError=forbidden`);
  }

  // Check onboarding completeness
  const isOnboarded = await checkOnboarding(session.user.id, requiredRole);

  if (!isOnboarded) {
    redirect(onboardingPath);
  }

  return <>{children}</>;
}

async function checkOnboarding(
  userId: string,
  role: UserRole
): Promise<boolean> {
  if (role === "SEEKER") {
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId },
      select: { situation: true, primaryRole: true },
    });
    return seekerProfile?.situation != null && seekerProfile?.primaryRole != null;
  }

  // RECRUITER
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return recruiterProfile != null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/AuthGuard.tsx
git commit -m "feat(auth): create reusable server-side AuthGuard component"
```

---

### Task 3: Update Seeker Layout to Use AuthGuard

**Files:**
- Modify: `src/app/seeker/layout.tsx`

- [ ] **Step 1: Update seeker layout to wrap children with AuthGuard**

The layout becomes a thin wrapper that delegates auth to AuthGuard and renders UI structure.

```tsx
// src/app/seeker/layout.tsx
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { SeekerHeader } from "@/components/layout/SeekerHeader";
import { UserRole } from "@/constants/enums";

export default function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      requiredRole={UserRole.SEEKER}
      loginPath="/seeker/login"
      onboardingPath="/seeker/onboarding"
      fallbackDashboard="/seeker/dashboard"
    >
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <AuthRedirectToast />
        <SeekerHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/seeker/layout.tsx
git commit -m "feat(auth): add AuthGuard to seeker layout"
```

---

### Task 4: Update Recruiter Layout to Use AuthGuard

**Files:**
- Modify: `src/app/recruiter/layout.tsx`

- [ ] **Step 1: Update recruiter layout to wrap children with AuthGuard**

Same pattern as seeker layout, preserving existing providers and sidebar.

```tsx
// src/app/recruiter/layout.tsx
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRedirectToast } from "@/components/auth/AuthRedirectToast";
import { RecruiterSidebarProvider } from "@/components/layout/RecruiterSidebar";
import { PostJobModal } from "@/modules/recruiter/jobs/components/PostJobModal";
import { ReactQueryProvider } from "@/providers/query-provider";
import { UserRole } from "@/constants/enums";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      requiredRole={UserRole.RECRUITER}
      loginPath="/recruiter/login"
      onboardingPath="/recruiter/onboarding"
      fallbackDashboard="/recruiter/dashboard"
    >
      <ReactQueryProvider>
        <RecruiterSidebarProvider>
          <AuthRedirectToast />
          {children}
          <PostJobModal />
        </RecruiterSidebarProvider>
      </ReactQueryProvider>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/recruiter/layout.tsx
git commit -m "feat(auth): add AuthGuard to recruiter layout"
```

---

### Task 5: Fix Middleware Runtime and Route Matching

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Fix middleware.ts with all identified bugs**

Changes:
1. Remove `export const runtime = "nodejs"`
2. Import Edge Prisma client
3. Fix route matching (remove `/(public)` check)
4. Add `/feed` and `/onboarding` to public routes
5. Add error handling for DB queries

```ts
// middleware.ts — COMPLETE REPLACEMENT
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prismaEdge as prisma } from "@/lib/prisma-edge";

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Routes that need NO guard (public, auth pages, API, static) ──
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/onboarding") ||
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
    // Allow unauthenticated access to login, register, and onboarding routes
    if (isAuthRoute) return NextResponse.next();
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
      return NextResponse.redirect(
        new URL("/recruiter/dashboard?authError=forbidden", req.url)
      );
    }

    // Check Steps 1+2 completion (per D-08)
    try {
      const seekerProfile = await prisma.seekerProfile.findUnique({
        where: { userId },
        select: { situation: true, primaryRole: true },
      });

      const isOnboarded =
        seekerProfile?.situation != null && seekerProfile?.primaryRole != null;

      if (!isOnboarded) {
        return NextResponse.redirect(new URL("/seeker/onboarding", req.url));
      }
    } catch (error) {
      console.error("Middleware DB check failed (seeker):", error);
      // Fail open — allow request through to avoid blocking all traffic
      return NextResponse.next();
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
      return NextResponse.redirect(
        new URL("/seeker/dashboard?authError=forbidden", req.url)
      );
    }

    // Check RecruiterProfile exists (per D-08)
    try {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!recruiterProfile) {
        return NextResponse.redirect(new URL("/recruiter/onboarding", req.url));
      }
    } catch (error) {
      console.error("Middleware DB check failed (recruiter):", error);
      // Fail open — allow request through to avoid blocking all traffic
      return NextResponse.next();
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

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "fix(auth): fix middleware runtime, route matching, and Edge Prisma"
```

---

### Task 6: Manual Testing — Authentication Protection

**Files:**
- No code changes — manual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test unauthenticated access to protected routes**

Open an incognito browser window (no active session) and test:

| URL | Expected Behavior |
|---|---|
| `http://localhost:3000/seeker/dashboard` | Redirects to `/seeker/login` |
| `http://localhost:3000/seeker/applications` | Redirects to `/seeker/login` |
| `http://localhost:3000/seeker/settings` | Redirects to `/seeker/login` |
| `http://localhost:3000/recruiter/dashboard` | Redirects to `/recruiter/login` |
| `http://localhost:3000/recruiter/jobs` | Redirects to `/recruiter/login` |
| `http://localhost:3000/recruiter/applications` | Redirects to `/recruiter/login` |

- [ ] **Step 3: Test public routes remain accessible**

| URL | Expected Behavior |
|---|---|
| `http://localhost:3000/` | Loads landing page |
| `http://localhost:3000/about` | Loads about page |
| `http://localhost:3000/jobs` | Loads jobs listing |
| `http://localhost:3000/companies` | Loads companies page |
| `http://localhost:3000/feed` | Loads feed page |

- [ ] **Step 4: Test login pages redirect authenticated users**

1. Log in as a seeker
2. Visit `/seeker/login` → should redirect to `/seeker/dashboard`
3. Visit `/recruiter/dashboard` → should redirect to `/seeker/dashboard?authError=forbidden`

4. Log out, log in as a recruiter
5. Visit `/recruiter/login` → should redirect to `/recruiter/dashboard`
6. Visit `/seeker/dashboard` → should redirect to `/recruiter/dashboard?authError=forbidden`

- [ ] **Step 5: Verify AuthRedirectToast shows on forbidden redirects**

When redirected with `?authError=forbidden`, a toast notification should appear saying the user doesn't have permission.

- [ ] **Step 6: Test onboarding redirects**

1. Create a new seeker account (or delete their profile data in DB)
2. Visit `/seeker/dashboard` → should redirect to `/seeker/onboarding`

3. Create a new recruiter account (or delete their profile data in DB)
4. Visit `/recruiter/jobs` → should redirect to `/recruiter/onboarding`

- [ ] **Step 7: Test email verification gate**

1. Log in as a user with `emailVerified = null`
2. Visit `/seeker/dashboard` → should redirect to `/auth/verify-email-pending`
3. Visit `/seeker/settings` → should load normally (no email gate)

---

### Task 7: Verify No Regressions in Existing Auth Flows

**Files:**
- No code changes — manual verification

- [ ] **Step 1: Test complete auth lifecycle**

1. **Register new seeker** → Complete onboarding → Land on dashboard
2. **Register new recruiter** → Complete onboarding → Land on dashboard
3. **Login existing user** → Lands on correct dashboard
4. **Logout** → Session cleared, redirected to login
5. **Google OAuth login** → Redirects to role selection for new users, dashboard for existing
6. **Password reset flow** → Works end-to-end

- [ ] **Step 2: Test API route protection**

Verify API routes still check auth independently:

1. Call `GET /api/jobs` without auth → returns 401
2. Call `POST /api/jobs` as seeker → returns 403
3. Call `GET /api/applications` as recruiter → returns 403

- [ ] **Step 3: Test server actions**

1. Submit onboarding form → succeeds and redirects correctly
2. Submit job creation as seeker → blocked with 403
3. Submit application without login → shows login modal

- [ ] **Step 4: Final commit if all tests pass**

```bash
git commit --allow-empty -m "test(auth): verify auth protection works correctly — all manual tests pass"
```

---

### Task 8: Update Project Documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-04-12-auth-protection-fix-design.md` (update status)
- Create: `docs/superpowers/plans/2026-04-12-auth-protection-fix-plan.md` (this file)

- [ ] **Step 1: Mark design doc as implemented**

Edit `docs/superpowers/specs/2026-04-12-auth-protection-fix-design.md`, change the status line:

```diff
- **Status:** Approved
+ **Status:** Implemented
```

- [ ] **Step 2: Commit documentation updates**

```bash
git add docs/
git commit -m "docs(auth): update auth protection fix design and plan status"
```

---

## Post-Implementation Notes

### If Prisma Edge Client Fails

If `@prisma/client/edge` causes import errors:

1. Run `pnpm add @prisma/client@latest`
2. Run `pnpm db:generate` to regenerate Edge client
3. If still failing, fallback: remove `prismaEdge` import from middleware, skip onboarding checks in middleware, keep them only in layout AuthGuard (uses Node Prisma)

### Performance Considerations

- Middleware now makes DB queries on every `/seeker/*` and `/recruiter/*` request
- Layout AuthGuard makes additional DB queries
- This is acceptable for current scale; consider caching session state in JWT or Upstash Redis at 10k+ daily active users

### Future Improvements (Out of Scope)

- Extract onboarding check logic into shared utility
- Add E2E tests with Playwright
- Implement session timeout with client-side warning
- Cache onboarding status in JWT to avoid repeated DB queries

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec Requirement | Task |
|---|---|
| Remove `nodejs` runtime from middleware | Task 5 |
| Fix `/(public)` route matching | Task 5 |
| Add `/feed` and `/onboarding` to public routes | Task 5 |
| Use Edge-compatible Prisma in middleware | Task 1 + Task 5 |
| Add error handling for DB failures | Task 5 |
| Add auth guards to seeker layout | Task 3 |
| Add auth guards to recruiter layout | Task 4 |
| Three-layer protection model | Tasks 1-5 |
| Manual test cases | Task 6 |
| Regression testing | Task 7 |

✅ All spec requirements covered.

### 2. Placeholder Scan

Searched plan for: "TBD", "TODO", "implement later", "add validation", "handle edge cases", "similar to".

✅ No placeholders found. Every step contains complete code and commands.

### 3. Type Consistency

- `UserRole.SEEKER` and `UserRole.RECRUITER` — imported from `@/constants/enums` ✅
- `auth()` — imported from `@/auth` ✅
- `redirect` — from `next/navigation` ✅
- `prisma` in AuthGuard — uses `@/lib/prisma` (Node client, fine for server components) ✅
- `prismaEdge` in middleware — uses `@/lib/prisma-edge` (Edge client) ✅
- Props interfaces — all typed, no `any` ✅

✅ Type signatures consistent across all tasks.

---

Plan is complete and ready for execution.
