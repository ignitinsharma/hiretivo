# Phase 1a — Recruiter Flag + Gate Implementation Plan

> **STATUS: DONE (2026-07-02)** — all 4 tasks + browse verify done on branch `feature/pivot-p1a-flags-gate`, tsc+lint clean. Commits: acf5ba0 (flag), 0fea1b8 (middleware), 5bc3c4a (header), deb8128 (select-role), + fix commit for `PublicMobileNavMenu.tsx` gap found during verify. Pushed, PR → staging.
> Deviation: repo has no `.env.example` (uses gitignored `.env.local`) — flag added to `.env.local`; `flags.ts` defaults false when unset. Header "I'm a recruiter" block was dead code (behind `!session` in a session-only return) — gated anyway.
> (File regenerated 2026-07-02 after docs/ wipe — content identical to original.)

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Hide the recruiter side behind a feature flag and default all new signups to SEEKER, keeping recruiter code/models/APIs intact.

**Architecture:** Add a build-time env flag `NEXT_PUBLIC_RECRUITER_ENABLED`. Gate `/recruiter/*` in middleware when off. Strip recruiter entry points from public UI. Make the OAuth/role flow seeker-only (no role picker) while leaving `set-role` action and recruiter routes callable if the flag is later turned on.

**Tech Stack:** Next.js 14 App Router, Auth.js v5 (`auth.config.ts` + `middleware.ts`), TypeScript strict.

## Global Constraints

- Branch: `staging` pull → `feature/pivot-p1a-flags-gate` → PR into `staging`. Never push main/staging.
- Enums not string unions · path aliases (`@/…`), never `../../../` · brand tokens first · mobile-first · doc-comment every fn/route/component · Zod client+server · handle isLoading/isError/empty/data.
- Verification per project: `pnpm tsc` (no emit) + `pnpm lint` + manual browse. No pytest/TDD scaffolding.
- Recruiter code, models, and API routes MUST remain compilable — gate access, do not delete.

---

### Task 1: Add the recruiter feature flag

**Files:**
- Modify: `.env.local` (add flag line; repo has no `.env.example`)
- Create: `src/constants/flags.ts`

**Interfaces:**
- Produces: `RECRUITER_ENABLED: boolean` — single source of truth for the flag, imported everywhere.

- [x] **Step 1: Create branch**

```bash
git checkout staging && git pull origin staging
git checkout -b feature/pivot-p1a-flags-gate
```

- [x] **Step 2: Add flag to env**

Append to `.env.local`:
```
# Show recruiter side (login/register/dashboard). Default off for seeker-only pivot.
NEXT_PUBLIC_RECRUITER_ENABLED=false
```

- [x] **Step 3: Create `src/constants/flags.ts`**

```ts
/*
 * Feature flags — build-time toggles read from NEXT_PUBLIC_* env.
 *
 * RECRUITER_ENABLED gates the entire recruiter surface (UI entry points +
 * route access) during the seeker-only pivot. When off, recruiter code,
 * Prisma models, and API routes stay intact — they simply become unreachable
 * via routing and hidden in the UI. Flip the env to `true` to restore them.
 *
 * Read as a NEXT_PUBLIC_* var so it is inlined for both server and client
 * bundles; unset resolves to `false` (recruiter hidden by default).
 */
export const RECRUITER_ENABLED =
  process.env.NEXT_PUBLIC_RECRUITER_ENABLED === "true";
```

- [x] **Step 4: Verify + commit**

```bash
pnpm tsc --noEmit
git add src/constants/flags.ts
git commit -m "chore(flags): add RECRUITER_ENABLED feature flag"
```
Expected: `tsc` exits 0. → commit `acf5ba0`

---

### Task 2: Gate `/recruiter/*` in middleware

**Files:**
- Modify: `src/middleware.ts` (add early recruiter gate before the admin gate)

**Interfaces:**
- Consumes: `RECRUITER_ENABLED` from Task 1.
- Produces: any request to `/recruiter/*` redirects to `/seeker/dashboard` when the flag is off (retargeted to `/dashboard` in Phase 1b).

- [x] **Step 1: Import the flag**

```ts
import { RECRUITER_ENABLED } from "@/constants/flags";
```

- [x] **Step 2: Add the gate** — inside `auth((req) => {`, after `const hasKnownRole = …`, BEFORE the admin gate:

```ts
  // --- Recruiter gate (pivot): recruiter surface hidden unless flag on. ---
  // Covers recruiter pages plus its register/login entry points. Recruiter
  // code/models/APIs stay intact — they just become unreachable via routing.
  // Runs before the admin gate; /admin and /recruiter paths are disjoint.
  if (!RECRUITER_ENABLED && pathname.startsWith("/recruiter")) {
    return NextResponse.redirect(new URL("/seeker/dashboard", req.url));
  }
```

- [x] **Step 3: Verify** — `pnpm tsc --noEmit`; manual: `/recruiter/login` + `/recruiter/dashboard` redirect to `/seeker/dashboard`.

- [x] **Step 4: Commit** → `0fea1b8` `feat(pivot): gate /recruiter/* behind RECRUITER_ENABLED`

---

### Task 3: Remove recruiter entry points from public UI

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `RECRUITER_ENABLED`.
- Produces: public header shows no recruiter affordances when the flag is off; recruiter nav still renders for a logged-in recruiter (only reachable if flag on).

- [x] **Step 1: Import flag.** `import { RECRUITER_ENABLED } from "@/constants/flags";`
- [x] **Step 2: Gate `<PublicRecruiterDropdown />`** → `{RECRUITER_ENABLED && <PublicRecruiterDropdown />}`
- [x] **Step 3: Gate the "Verified Engineers" `/recruiter/talent` link** in `{RECRUITER_ENABLED && (…)}`.
- [x] **Step 4: Gate the "I'm a recruiter" `/recruiter/register` link** in `{RECRUITER_ENABLED && (…)}`. (Was dead code — behind `!session` in a session-only return — gated anyway.)
- [x] **Step 5: Verify** — tsc clean; logged-out header shows no recruiter affordances.
- [x] **Step 6: Commit** → `5bc3c4a` `feat(pivot): hide recruiter entry points in public header`

---

### Task 4: Seeker-only OAuth/role default

**Files:**
- Modify: `src/app/auth/select-role/page.tsx`

**Interfaces:**
- Consumes: `RECRUITER_ENABLED`, `setUserRole` server action, `UserRole.SEEKER`.
- Produces: OAuth users with no role are auto-provisioned SEEKER (no picker shown) when the flag is off; picker returns when flag on.

- [x] **Step 1: Inspect role assignment** — `setUserRole` (src/app/actions/auth/set-role.ts) sets role + onboardingStep, returns redirect; new OAuth users have no role until the picker. Auto-resolving the picker is the correct seam.
- [x] **Step 2: Auto-resolve to SEEKER when flag off** — `useEffect` on mount calls `handleSelect(UserRole.SEEKER)` when `!RECRUITER_ENABLED`; render a "Setting up your account…" state instead of the two-button grid; picker (both buttons) renders only when `RECRUITER_ENABLED`. Doc-comment on component explains the pivot behavior.
- [x] **Step 3: Verify** — tsc + eslint clean.
- [x] **Step 4: Commit** → `deb8128` `feat(pivot): default new signups to SEEKER, hide role picker`

- [x] **Manual browse verify** (2026-07-02) — dev server up, verified with gstack browse:
  - `/recruiter/login` and `/recruiter/dashboard` → redirect chain hits `/seeker/dashboard` then (unauthenticated) `/seeker/login`. Correct: recruiter gate fires first per middleware order.
  - `/auth/select-role` renders "Setting up your account…" with no role picker buttons.
  - Header at 390px and 1440px: no recruiter links in the visible bar.
  > DEVIATION (bug found in-scope, fixed): `PublicMobileNavMenu.tsx` (the mobile hamburger dropdown) was never touched by Task 3 and hardcoded its own `PUBLIC_MOBILE_RECRUITER_ITEMS` ("Hire Engineers", "Recruiter Login", "Recruiter Sign Up") plus an ungated "Verified Engineers" entry — all visible at 390px regardless of the flag. Root-caused and fixed: gated both behind `RECRUITER_ENABLED`, matching the `Header.tsx` desktop pattern. `pnpm tsc --noEmit` + `pnpm eslint` clean. Re-verified via browse: mobile menu now shows only How it Works / Pricing / Sign In / Get Verified / Talk to Founder.
- [x] **Push + PR into staging** (2026-07-02)

---

## Tracking & Resume

Flip checkboxes as steps complete; one commit per task. `git log --oneline staging..HEAD` = ground truth. Resume = read checkboxes + git log + memory `project_pivot_v3_apply_tool`.

## On phase completion

Update the status line in `/Users/nitinsharma/.claude/projects/-Users-nitinsharma-Documents-personal-hiretivo/memory/project_pivot_v3_apply_tool.md` (p1a done → next 1b).

## Self-Review

- **Spec coverage:** spec §8 Phase 1a fully covered (flag, gate, hide UI, seeker default). ✅
- **Placeholders:** none.
- **Type consistency:** `RECRUITER_ENABLED: boolean`, `UserRole.SEEKER` enum used consistently.
- **Deferred:** recruiter redirect target `/seeker/dashboard` → retarget to `/dashboard` in Phase 1b.
