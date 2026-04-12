# Auth Protection Fix — Design Specification

**Date:** 2026-04-12  
**Status:** Approved  
**Author:** Qwen Code + User

---

## Problem Statement

Unauthenticated users can access protected routes (`/seeker/*`, `/recruiter/*`) both via:
1. Direct URL entry (e.g., typing `/seeker/dashboard` in browser)
2. Clicking navigation links within the app

This indicates the middleware auth gate is not executing correctly.

---

## Root Cause Analysis

### Bug 1: Incorrect Runtime Configuration
```ts
// middleware.ts line 7
export const runtime = "nodejs"; // ❌ WRONG
```

**Impact:** Next.js middleware is designed to run on Edge Runtime. Forcing `nodejs` runtime breaks middleware execution in development and preview modes, causing it to silently skip auth checks.

### Bug 2: Virtual Route Group Matching
```ts
// middleware.ts line 18
pathname.startsWith("/(public)") // ❌ NEVER MATCHES
```

**Impact:** Route groups like `(public)` are virtual in Next.js — the URL path never includes the parentheses. Routes inside `/(public)/about` resolve to `/about`, not `/(public)/about`. This check never matches, so public routes fall through to the unauthenticated block.

### Bug 3: Missing Public Routes
Routes `/feed/*` and `/onboarding/*` exist at root level but aren't in the public route list. They fall through to unprotected territory.

### Bug 4: Prisma Edge Compatibility
Middleware uses `@prisma/client` which isn't Edge-compatible. Need `@prisma/client/edge` for Edge Runtime.

---

## Architecture

### Three-Layer Protection Model

```
┌─────────────────────────────────────────────────┐
│ Layer 1: Middleware (Edge Runtime)              │
│ - Primary auth gate                             │
│ - Runs before page renders                      │
│ - Handles redirects server-side                 │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│ Layer 2: Layout Server Components               │
│ - Defense in depth                              │
│ - Re-verifies auth() before rendering children  │
│ - Catches edge cases where middleware fails     │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│ Layer 3: AuthRedirectToast (Client)             │
│ - Shows feedback when user lands on error page  │
│ - Handles ?authError=forbidden query param      │
│ - Already exists, no changes needed             │
└─────────────────────────────────────────────────┘
```

---

## Implementation Details

### File 1: `middleware.ts`

**Changes:**

```diff
- export const runtime = "nodejs";
+ // REMOVED — Use Edge Runtime (default)

- import { prisma } from "@/lib/prisma";
+ import { PrismaClient } from "@prisma/client/edge";
+ 
+ const prisma = new PrismaClient();

- pathname.startsWith("/(public)") ||
+ // REMOVED — route groups are virtual, URLs don't include parentheses
+ pathname.startsWith("/about") ||
+ pathname.startsWith("/feed") ||
+ pathname.startsWith("/onboarding") ||

+ // Better error handling for DB queries
+ try {
+   const seekerProfile = await prisma.seekerProfile.findUnique(...);
+ } catch (error) {
+   console.error("Middleware DB check failed:", error);
+   return NextResponse.next(); // Fail open, not block all traffic
+ }
```

**Route Matching Logic (Corrected):**

```ts
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
```

### File 2: `src/app/seeker/layout.tsx`

**Changes:**

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";

export default async function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // No session → redirect to login
  if (!session?.user) {
    redirect("/seeker/login");
  }

  // Wrong role → redirect with error
  if (session.user.role !== UserRole.SEEKER) {
    redirect("/seeker/dashboard?authError=forbidden");
  }

  // Incomplete onboarding → redirect to onboarding
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { situation: true, primaryRole: true },
  });

  const isOnboarded =
    seekerProfile?.situation != null && seekerProfile?.primaryRole != null;

  if (!isOnboarded) {
    redirect("/seeker/onboarding");
  }

  // All checks passed → render layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <AuthRedirectToast />
      <SeekerHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
```

### File 3: `src/app/recruiter/layout.tsx`

**Changes:**

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // No session → redirect to login
  if (!session?.user) {
    redirect("/recruiter/login");
  }

  // Wrong role → redirect with error
  if (session.user.role !== UserRole.RECRUITER) {
    redirect("/recruiter/dashboard?authError=forbidden");
  }

  // Incomplete onboarding → redirect to onboarding
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!recruiterProfile) {
    redirect("/recruiter/onboarding");
  }

  // All checks passed → render layout
  return (
    <ReactQueryProvider>
      <RecruiterSidebarProvider>
        <AuthRedirectToast />
        {children}
        <PostJobModal />
      </RecruiterSidebarProvider>
    </ReactQueryProvider>
  );
}
```

---

## Security Considerations

1. **Defense in Depth:** Even if middleware fails, layout guards catch unauthorized access
2. **Fail-Open Strategy:** Middleware DB errors allow request through (better to show page than block all traffic)
3. **No Client-Side Secrets:** Session never exposed to client; all checks server-side
4. **Role Isolation:** Cross-role access blocked at both middleware and layout layers
5. **Onboarding Enforcement:** Users cannot skip onboarding steps

---

## Testing Strategy

### Manual Test Cases

| Test | Expected Result |
|---|---|
| Visit `/seeker/dashboard` while logged out | Redirect to `/seeker/login` |
| Visit `/recruiter/dashboard` while logged out | Redirect to `/recruiter/login` |
| Logged-in seeker visits `/recruiter/jobs` | Redirect to `/seeker/dashboard?authError=forbidden` |
| Logged-in recruiter visits `/seeker/applications` | Redirect to `/recruiter/dashboard?authError=forbidden` |
| New user (incomplete onboarding) visits `/seeker/dashboard` | Redirect to `/seeker/onboarding` |
| New recruiter (no profile) visits `/recruiter/jobs` | Redirect to `/recruiter/onboarding` |
| Unverified email user visits `/seeker/dashboard` | Redirect to `/auth/verify-email-pending` |
| Unverified email user visits `/seeker/settings` | Page loads (no email gate) |
| Visit `/about` while logged out | Page loads (public route) |
| Visit `/jobs` while logged out | Page loads (public route) |
| Logged-in user visits `/` | Redirect to their dashboard |

### Automated Tests (Post-Implementation)

- E2E test: Unauthenticated access blocks protected routes
- E2E test: Role-based access control works correctly
- E2E test: Onboarding redirect flow works
- Unit test: Middleware route matching logic

---

## Deployment Checklist

- [ ] Remove `export const runtime = "nodejs"` from middleware.ts
- [ ] Install `@prisma/client/edge` if not already present
- [ ] Update middleware to use Edge-compatible Prisma client
- [ ] Fix route matching logic (remove `/(public)` checks)
- [ ] Add `/feed` and `/onboarding` to public routes
- [ ] Add auth guards to seeker layout
- [ ] Add auth guards to recruiter layout
- [ ] Test all manual test cases locally
- [ ] Verify no regressions in existing auth flows
- [ ] Deploy to Vercel preview
- [ ] Test production-like environment
- [ ] Merge to main

---

## Rollback Plan

If issues arise post-deployment:

1. Revert middleware.ts changes (restore `nodejs` runtime)
2. Remove layout auth guards (restore original layouts)
3. Previous behavior restored (broken but familiar protection)

---

## Future Improvements (Out of Scope)

- Add automated E2E tests for auth flows
- Move onboarding checks to reusable utility function
- Add rate limiting to login/register endpoints
- Implement session timeout with warning
- Add "remember me" functionality
