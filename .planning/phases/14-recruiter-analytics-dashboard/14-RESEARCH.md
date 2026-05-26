# Phase 14: Recruiter Analytics Dashboard - Research

**Researched:** 2026-05-27
**Domain:** Recruiter analytics UI, Prisma aggregation, Recharts, git file restoration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Restore the 4 deleted pipeline files from git history (commits `361d05b` + `c04dfde`):
  - `src/app/recruiter/pipeline/page.tsx`
  - `src/app/recruiter/pipeline/PipelineBoard.tsx`
  - `src/app/recruiter/pipeline/PipelineCard.tsx`
  - `src/app/api/recruiter/pipeline/route.ts`
  - `src/app/api/recruiter/application/[id]/status/route.ts`
- **D-02:** Restore as-is (no kanban redesign). Verify they work, then add Analytics tab on top.
- **D-03:** Skip avg days per stage entirely. Application model has no per-stage timestamps. Show funnel counts + conversion % only. No `ApplicationStatusHistory` schema addition.
- **D-04:** All-time scope. Aggregate all applications for the recruiter regardless of date. No date range filter.
- **D-05:** Analytics tab visible to all plan tiers but FREE plan sees a locked state with upgrade CTA — same Phase 8 paid gate pattern used for talent pool and interview scheduling.
- **D-06 (Claude's discretion):** Funnel stage mapping: Unlocked = EngineerUnlock count, Applied = APPLIED, Reviewing = REVIEWING, Interviewing = INTERVIEW, Offered = OFFER, Hired = HIRED. Conversion % = stage_count / previous_stage_count × 100.
- **D-07:** New `GET /api/recruiter/analytics` route (not namespaced under jobs). Returns: funnel stages with counts + conversion %, credits used, credits remaining, top 5 skills. Rate-limited with existing `dataFetchRateLimiter` (30/min).
- **D-08 (Claude's discretion):** Reuse Recharts (already installed, used in `JobAnalyticsTab.tsx`). No new charting library.
- **D-09 (Claude's discretion):** Credits used = `EngineerUnlock.count` for `recruiterId = session.user.id`. Quota remaining = plan tier limit minus credits used. Plan tier from session or RecruiterProfile.
- **D-10 (Claude's discretion):** Top 5 skills = most frequent skill strings across EngineerUnlock → User → SeekerProfile → SeekerSkill join for this recruiter.

### Claude's Discretion

- D-06: Funnel stage mapping (above)
- D-08: Recharts reuse (above)
- D-09: Credits/quota computation (above)
- D-10: Top skills join path (above)

### Deferred Ideas (OUT OF SCOPE)

- Avg days per stage — requires `ApplicationStatusHistory` table; deferred to a future analytics enhancement phase
- Date range selector (30d / 90d / All-time) — deferred; all-time sufficient for v1
- Per-job analytics on the pipeline page — already exists at `/recruiter/jobs/[id]` analytics tab
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLT-01 | `/recruiter/pipeline` has two tabs: "Pipeline" (existing kanban) and "Analytics" (new) | Tabs component pattern confirmed in `src/components/ui/tabs.tsx`; restored pipeline page becomes tab container; see Tab Pattern section |
| ANLT-02 | Analytics tab shows funnel: Unlocked → Applied → Reviewing → Interviewing → Offered → Hired with count and conversion % at each stage | Prisma `groupBy`/multi-count pattern confirmed; EngineerUnlock + Application models have all required fields; see Funnel Query section |
| ANLT-03 | Analytics tab shows avg days per stage — **DROPPED per D-03** | Skipped per CONTEXT.md D-03 decision; no ApplicationStatusHistory model exists |
| ANLT-04 | Analytics tab shows credits used vs quota remaining (from plan tier) | `getUnlockQuota()` exists in git history with STARTER=10/GROWTH=30/SCALE=null; plan on `User.plan` (PlanTier enum); see Credits section |
| ANLT-05 | Analytics tab shows top 5 skills across unlocked engineers | EngineerUnlock → User → SeekerProfile → SeekerSkill → Skill join confirmed viable; see Top Skills Query section |
</phase_requirements>

---

## Summary

Phase 14 has two work streams. First, restore five pipeline kanban files that were accidentally deleted in commit `8ffde15` during the Phase 13 merge — they still exist in git history at commits `361d05b` (UI files) and `c04dfde` (API routes). Second, add an Analytics tab alongside the restored Pipeline kanban on `/recruiter/pipeline`, backed by a new `GET /api/recruiter/analytics` route.

The analytics tab shows: (a) a hiring funnel with counts + conversion % derived from `EngineerUnlock` and `Application` status groups, (b) credits used vs. quota remaining based on `EngineerUnlock.count` and the `getUnlockQuota()` plan-tier function, and (c) top 5 skills from the unlocked engineer pool. FREE plan sees a locked overlay with upgrade CTA — this exact pattern already exists in `TalentPoolClient.tsx` as an inline locked overlay and can be adapted.

A critical pre-existing issue: `src/lib/billing/plan-access.ts` currently exports an old `PRO`/`ENTERPRISE` version that does NOT match the actual Prisma schema (`FREE/STARTER/GROWTH/SCALE`). The correct version with `canAccessTalentPool`/`getUnlockQuota` exists in git history at commit `0943b4f`. The plan MUST restore `plan-access.ts` to the correct version as a prerequisite before any plan-gate checks will work.

**Primary recommendation:** Restore plan-access.ts from git history first, then restore pipeline kanban files, then build the Analytics tab with a single Prisma parallel-query aggregation route.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 14+ | Page/route framework | Already in use |
| Prisma ORM | 7.5.0 | Postgres aggregation queries | Already in use; `groupBy` + `count` confirmed |
| Recharts | ^3.8.1 | Funnel/bar chart rendering | Already installed; used in `JobAnalyticsTab.tsx` |
| TanStack Query | ^5.90.21 | Client-side data fetching + caching | Already in use; `staleTime: 5 * 60 * 1000` for analytics |
| shadcn/ui Tabs | Already installed | Tab UI primitive | Used in `src/app/recruiter/jobs/[id]/page.tsx` |
| `@/components/ui/chart` | Already installed | `ChartContainer`/`ChartTooltip` wrappers | Used in `JobAnalyticsTab.tsx` |
| `dataFetchRateLimiter` | Already in `src/lib/rate-limit.ts` | 30/min rate limit | Locked in D-07 |

[VERIFIED: codebase grep + package.json]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Already installed | Date formatting in cards | CLAUDE.md mandates date-fns for all date ops |
| Zod | Already installed | Route param validation | All API routes use Zod for input validation |
| Auth.js v5 | Already installed | Session + plan check | `session.user.plan` carries `PlanTier` string |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts BarChart for funnel | Custom HTML funnel bars | Recharts is already wired — no new dep needed |
| Inline locked overlay | `PaidFeatureModal` (Zustand store) | Inline overlay (TalentPoolClient pattern) is simpler for a tab; modal pattern is for button click gates |

**Installation:** No new packages needed. All dependencies already present.

---

## Critical Pre-existing Issue: plan-access.ts Mismatch

[VERIFIED: codebase grep + git show]

**Current state:** `src/lib/billing/plan-access.ts` references `PlanTier.PRO` and `PlanTier.ENTERPRISE`, which do NOT exist in `@/constants/enums.ts` (`PlanTier` has `FREE/STARTER/GROWTH/SCALE`). This causes TS errors at compile time:

```
src/lib/billing/plan-access.ts: Property 'PRO' does not exist on type 'typeof PlanTier'
src/lib/billing/plan-access.ts: Property 'ENTERPRISE' does not exist on type 'typeof PlanTier'
src/app/api/recruiter/talent/route.ts: Module has no exported member 'canAccessTalentPool'
```

**Root cause:** The correct version of `plan-access.ts` was built in Phase 10 (commit `0943b4f`) but the current file is an older version from Phase 8 that was never overwritten.

**Correct version (from commit `0943b4f`):**

```typescript
// Source: git show 0943b4f:src/lib/billing/plan-access.ts
export function canAccessTalentPool(plan: PlanTier | string | null | undefined): boolean {
  return plan === PlanTier.STARTER || plan === PlanTier.GROWTH || plan === PlanTier.SCALE;
}

export function getUnlockQuota(plan: PlanTier | string | null | undefined): number | null {
  const quotas: Record<string, number | null> = {
    FREE: 0,
    STARTER: 10,
    GROWTH: 30,
    SCALE: null,  // unlimited
  };
  return quotas[plan as string] ?? 0;
}
```

**Phase 14 plan MUST restore `plan-access.ts` first** using `git show 0943b4f:src/lib/billing/plan-access.ts` to rewrite the file.

---

## Architecture Patterns

### Recommended File Structure for Phase 14

```
src/app/recruiter/pipeline/
├── page.tsx                          ← restored from 361d05b; refactored into tab container
├── PipelineBoard.tsx                 ← restored from 361d05b
├── PipelineCard.tsx                  ← restored from 361d05b
└── AnalyticsTab.tsx                  ← NEW client component

src/app/api/recruiter/
├── pipeline/route.ts                 ← restored from c04dfde
├── application/[id]/status/route.ts  ← restored from c04dfde
└── analytics/route.ts                ← NEW

src/modules/recruiter/analytics/
├── types/
│   └── analytics.types.ts            ← NEW (RecruiterAnalyticsResponse type)
└── queries/
    └── use-fetch-recruiter-analytics.ts  ← NEW TanStack Query hook
```

### Pattern 1: Git Restore for Deleted Files

**What:** Use `git restore --source=<commit> --staged --worktree <path>` to recover deleted files.

**Commands:**

```bash
# Restore UI files from commit 361d05b
git restore --source=361d05b --staged --worktree src/app/recruiter/pipeline/page.tsx
git restore --source=361d05b --staged --worktree src/app/recruiter/pipeline/PipelineBoard.tsx
git restore --source=361d05b --staged --worktree src/app/recruiter/pipeline/PipelineCard.tsx

# Restore API routes from commit c04dfde
git restore --source=c04dfde --staged --worktree src/app/api/recruiter/pipeline/route.ts

# Bracket-path files need quotes in shell:
git restore --source=c04dfde --staged --worktree "src/app/api/recruiter/application/[id]/status/route.ts"
```

[VERIFIED: test-restored `page.tsx` in this session; confirmed bracket path requires quoting]

**After restore:** Unstage all restored files immediately so only your edits go into feature commits:

```bash
git restore --staged src/app/recruiter/pipeline/page.tsx
git restore --staged src/app/recruiter/pipeline/PipelineBoard.tsx
# etc.
```

### Pattern 2: Tab Container on Restored page.tsx

**What:** The restored `page.tsx` is a simple server component. Wrap `<PipelineBoard />` in a `<Tabs>` structure and add an `<AnalyticsTab />` client island.

```typescript
// Source: src/app/recruiter/jobs/[id]/page.tsx — existing tab pattern
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineBoard } from './PipelineBoard'
import { AnalyticsTab } from './AnalyticsTab'

export default async function PipelinePage() {
  const session = await auth()
  const isFreePlan = session?.user?.plan === PlanTier.FREE

  return (
    <div className="w-full p-8 space-y-6">
      {/* header ... */}
      <Tabs defaultValue="pipeline">
        <TabsList className="mb-6">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline">
          <PipelineBoard />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab isFreePlan={isFreePlan} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

[VERIFIED: codebase pattern from `/recruiter/jobs/[id]/page.tsx`]

### Pattern 3: Analytics API Route Structure

**What:** New route at `GET /api/recruiter/analytics`. Auth → role check → rate limit → parallel Prisma queries → typed response.

```typescript
// Source: modeled on src/app/api/recruiter/jobs/[id]/analytics/route.ts
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== UserRole.RECRUITER) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { success } = await dataFetchRateLimiter.limit(session.user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const recruiterId = session.user.id

  const [unlockedCount, statusGroups, unlocksWithSkills, recruiterPlan] = await Promise.all([
    // ANLT-02: Total unlocks (top of funnel)
    prisma.engineerUnlock.count({ where: { recruiterId } }),
    // ANLT-02: Application status breakdown
    prisma.application.groupBy({
      by: ['status'],
      where: { job: { recruiterId } },
      _count: { _all: true },
    }),
    // ANLT-05: Top skills via unlock → seeker → skills join
    prisma.engineerUnlock.findMany({
      where: { recruiterId },
      select: {
        engineer: {
          select: {
            seekerProfile: {
              select: { skills: { select: { skill: { select: { name: true } } } } }
            }
          }
        }
      }
    }),
    // ANLT-04: Plan tier for quota
    prisma.user.findUnique({
      where: { id: recruiterId },
      select: { plan: true, subscription: { select: { currentPeriodStart: true } } }
    }),
  ])

  // Build funnel
  const statusMap = new Map(statusGroups.map(g => [g.status, g._count._all]))
  const appliedCount = statusMap.get('APPLIED') ?? 0
  // ... build stages, compute conversion %

  // Quota (ANLT-04)
  const totalQuota = getUnlockQuota(recruiterPlan?.plan)
  const periodStart = recruiterPlan?.subscription?.currentPeriodStart
    ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const creditsUsed = await prisma.engineerUnlock.count({
    where: { recruiterId, source: 'talent_pool', unlockedAt: { gte: periodStart } }
  })
  const creditsRemaining = totalQuota === null ? null : Math.max(0, totalQuota - creditsUsed)

  // Top skills (ANLT-05)
  // ... frequency map over unlocksWithSkills

  return NextResponse.json({ data: analytics }, { status: 200 })
}
```

[VERIFIED: pattern from existing analytics route; Prisma groupBy confirmed in Prisma docs]

### Pattern 4: FREE Plan Locked State (Inline Overlay)

**What:** For Analytics tab, FREE plan sees the tab but clicking it shows a locked overlay. Use the same inline overlay pattern as `TalentPoolClient.tsx` — NOT the `PaidFeatureModal` (which is for button clicks, not tab content).

```typescript
// Source: src/modules/recruiter/talent/components/TalentPoolClient.tsx — inline locked overlay
function AnalyticsLockedOverlay() {
  return (
    <div className="rounded-xl border border-brand-border bg-white/95 p-8 text-center backdrop-blur">
      <Lock className="mx-auto h-8 w-8 text-brand-foreground-muted mb-4" />
      <p className="font-semibold text-brand-foreground">Analytics requires a paid plan</p>
      <p className="mt-2 text-sm text-brand-foreground-muted">
        Upgrade to STARTER, GROWTH, or SCALE to see your hiring funnel.
      </p>
      <Button asChild variant="primary" className="mt-6">
        <a href="/pricing">View Plans</a>
      </Button>
    </div>
  )
}

export function AnalyticsTab({ isFreePlan }: { isFreePlan: boolean }) {
  if (isFreePlan) return <AnalyticsLockedOverlay />
  // ... rest of analytics UI
}
```

[VERIFIED: pattern from TalentPoolClient.tsx free plan overlay at line 55-96]

### Pattern 5: Funnel Stage Type Shape

**What:** Response type for the analytics API — funnel stages with counts and conversion %, credits, top skills.

```typescript
// NEW: src/modules/recruiter/analytics/types/analytics.types.ts
export interface FunnelStage {
  key: string           // 'unlocked' | 'applied' | 'reviewing' | 'interview' | 'offer' | 'hired'
  label: string         // Display name
  count: number
  conversionPct: number | null  // null for first stage (no previous)
}

export interface RecruiterAnalyticsResponse {
  funnel: FunnelStage[]
  creditsUsed: number
  creditsRemaining: number | null   // null = unlimited (SCALE plan)
  totalQuota: number | null         // null = unlimited
  topSkills: string[]               // top 5 by frequency
}
```

### Anti-Patterns to Avoid

- **Separate SQL for each funnel stage:** Use `prisma.application.groupBy` (one query, multiple results) not 5 separate `prisma.application.count` calls — the existing `/api/recruiter/applications/stats` makes this mistake with 5 parallel counts; `groupBy` is cleaner for analytics.
- **Importing `PricingTierId` or `RecruiterPaidFeature` from `@/constants/enums`:** These types do NOT exist there (pre-existing TS error). Do not add new code that imports them. Use `PlanTier` instead.
- **Calling `canAccessRecruiterPaidFeature` for plan gate:** The current function checks `PRO`/`ENTERPRISE` which do not exist. Use `canAccessTalentPool` (after restoring plan-access.ts) or inline `plan !== PlanTier.FREE` check.
- **Using `PlanTier.PRO`:** Does not exist in enums. Use `PlanTier.STARTER`, `PlanTier.GROWTH`, `PlanTier.SCALE`.
- **Wrapping PipelineBoard in "use client" page:** `page.tsx` is a server component — pass `isFreePlan` as prop to `AnalyticsTab` (client component). Do not make page a client component just for the plan check.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom Redis counter | `dataFetchRateLimiter` from `src/lib/rate-limit.ts` | Already configured at 30/min |
| Stage label display | Custom switch | `getStageLabel()` from `src/lib/application-pipeline.ts` | Returns "Under Review", "Offer Received", etc. |
| Plan quota lookup | Inline ternary | `getUnlockQuota(plan)` after restoring `plan-access.ts` | Handles all 4 tiers including null for SCALE |
| Date formatting | `new Date().toLocaleString()` | `date-fns format()` | CLAUDE.md rule |
| Chart primitives | Raw SVG | `ChartContainer`/`ChartTooltip` from `@/components/ui/chart` | Already wired with shadcn theme |
| Tab UI | Custom div-based tabs | `Tabs/TabsList/TabsTrigger/TabsContent` from `@/components/ui/tabs` | Accessible, already used on pipeline adjacent page |

---

## Common Pitfalls

### Pitfall 1: Bracket Path Quoting in Shell

**What goes wrong:** `git restore` fails with "no matches found" for `src/app/api/recruiter/application/[id]/status/route.ts` because the shell glob-expands `[id]`.
**Why it happens:** Zsh treats `[` as glob start.
**How to avoid:** Always quote bracket paths in shell commands: `"src/app/api/recruiter/application/[id]/status/route.ts"`
**Warning signs:** Exit code 1 with "no matches found" error.

### Pitfall 2: plan-access.ts Using Wrong PlanTier Values

**What goes wrong:** `canAccessTalentPool` and `getUnlockQuota` are missing from `plan-access.ts`; the file has `PRO`/`ENTERPRISE` which TS rejects.
**Why it happens:** Phase 13 merge appears to have kept the Phase 8 version of `plan-access.ts` instead of the Phase 10 version.
**How to avoid:** Restore `plan-access.ts` from commit `0943b4f` as Wave 0 first task. Verify `canAccessTalentPool` and `getUnlockQuota` are exported before writing any analytics gate code.
**Warning signs:** TS errors `Property 'PRO' does not exist on type 'typeof PlanTier'`.

### Pitfall 3: Counting All Unlocks vs. Billing-Period Unlocks

**What goes wrong:** `creditsUsed` returns 50 for a STARTER plan (which has a 10/mo quota) because it counts all-time unlocks instead of current period.
**Why it happens:** `EngineerUnlock.unlockedAt` is not filtered by `currentPeriodStart` by default.
**How to avoid:** For credits used, filter by `unlockedAt: { gte: periodStart }` where `periodStart = subscription.currentPeriodStart ?? first of current month`. The funnel stage counts (ANLT-02) should be all-time per D-04; only the credits counter needs period filtering.
**Warning signs:** `creditsUsed` exceeds `totalQuota` for plans that clearly haven't exhausted them.

### Pitfall 4: groupBy Returns Empty Array (No Applications)

**What goes wrong:** `prisma.application.groupBy` returns `[]` when recruiter has no applications — code then tries to read `.status` and crashes.
**Why it happens:** groupBy correctly returns empty array for no matching rows.
**How to avoid:** Use `statusMap.get(status) ?? 0` for each stage; never assume groupBy result has all 6 statuses present.

### Pitfall 5: Conversion % Divide by Zero

**What goes wrong:** `stage_count / previous_stage_count` throws when `previous_stage_count === 0`.
**Why it happens:** Funnel has no "unlocked" engineers yet (new recruiter).
**How to avoid:** Return `null` for conversion % when previous stage count is 0; render as `"—"` in UI.

### Pitfall 6: AnalyticsTab Fetching Data on FREE Plan

**What goes wrong:** TanStack Query fires the analytics fetch even though FREE plan shows locked overlay — wasted API call, possible 403 response.
**How to avoid:** Pass `isFreePlan` to the hook and use `enabled: !isFreePlan` in `useQuery` options.

---

## Code Examples

### Funnel Stage Computation

```typescript
// Source: git show 0943b4f (unlock route quota logic) — adapted for funnel
const FUNNEL_STAGES = [
  { key: 'unlocked', label: 'Unlocked' },
  { key: 'applied',  label: 'Applied' },
  { key: 'reviewing',label: 'Reviewing' },
  { key: 'interview',label: 'Interviewing' },
  { key: 'offer',    label: 'Offered' },
  { key: 'hired',    label: 'Hired' },
] as const

// D-06: statusMap from prisma.application.groupBy
const statusMap = new Map(statusGroups.map(g => [g.status, g._count._all]))
const rawCounts = [
  unlockedCount,
  statusMap.get('APPLIED') ?? 0,
  statusMap.get('REVIEWING') ?? 0,
  statusMap.get('INTERVIEW') ?? 0,
  statusMap.get('OFFER') ?? 0,
  statusMap.get('HIRED') ?? 0,
]

const funnel: FunnelStage[] = FUNNEL_STAGES.map((stage, i) => ({
  key: stage.key,
  label: stage.label,
  count: rawCounts[i] ?? 0,
  conversionPct: i === 0 || (rawCounts[i - 1] ?? 0) === 0
    ? null
    : Math.round(((rawCounts[i] ?? 0) / (rawCounts[i - 1] ?? 1)) * 100),
}))
```

### Top Skills Aggregation

```typescript
// Source: pattern from src/app/api/recruiter/jobs/[id]/analytics/route.ts line 106-117
const skillFrequency = new Map<string, number>()
for (const unlock of unlocksWithSkills) {
  const skills = unlock.engineer?.seekerProfile?.skills ?? []
  for (const s of skills) {
    const name = s.skill.name
    skillFrequency.set(name, (skillFrequency.get(name) ?? 0) + 1)
  }
}
const topSkills = Array.from(skillFrequency.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name]) => name)
```

### TanStack Query Hook

```typescript
// Source: pattern from src/modules/recruiter/jobs/queries/use-fetch-analytics.ts
'use client'
import { useQuery } from '@tanstack/react-query'

export function useRecruiterAnalytics(enabled = true) {
  return useQuery({
    queryKey: ['recruiter-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/recruiter/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const json = await res.json()
      return json.data as RecruiterAnalyticsResponse
    },
    staleTime: 5 * 60 * 1000,  // analytics fine to cache 5 min
    enabled,                    // disabled for FREE plan
  })
}
```

---

## Runtime State Inventory

> Not applicable — this is not a rename/refactor/migration phase.

---

## Environment Availability

> This phase is purely code changes using existing dependencies. No external tools beyond the standard Next.js dev server are required.

Step 2.6: SKIPPED — no new external dependencies identified. All required tools (Recharts, Prisma, TanStack Query, Upstash Redis, shadcn Tabs) are already installed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `PlanTier.PRO`/`ENTERPRISE` plan checks | `PlanTier.STARTER`/`GROWTH`/`SCALE` | Phase 10 Pivot v2 | plan-access.ts must be restored to Phase 10 version |
| Separate `prisma.application.count` per status | `prisma.application.groupBy` | Phase 12 analytics work | One query returns all status counts |
| `canAccessRecruiterPaidFeature` (Phase 8) | `canAccessTalentPool` (Phase 10) | Phase 10 Pivot v2 | Correct function must be exported from plan-access.ts |

**Deprecated/outdated:**
- `canAccessRecruiterPaidFeature(plan)`: Checks for `PRO`/`ENTERPRISE` which do not exist in current schema. Do not use in Phase 14.
- `RecruiterPaidFeature` type: Referenced in `use-ui-store.ts` and `plan-access.ts` imports but not exported from enums.ts. Do not import.
- `PricingTierId` enum: Referenced in `pricing.ts` and `billing/checkout/route.ts` but not exported from enums.ts. Do not import.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `src/app/api/recruiter/talent/[id]/unlock/route.ts` was deleted along with other pipeline files but quota logic (billing period) can be read from git history; the analytics route should use the same billing period logic | Credits section | If unlock route still exists somewhere not found, quota logic might differ slightly |
| A2 | `session.user.plan` correctly reflects the `User.plan` PlanTier at request time (set in auth.ts JWT callback) | FREE plan gate | If session plan is stale, FREE recruiters might see analytics briefly; low risk |
| A3 | `Application.job.recruiterId` correctly filters to the authenticated recruiter's jobs only | Funnel query | If recruiter has no jobs, all stage counts return 0 — correct behavior |

---

## Open Questions (RESOLVED)

1. **Stale plan-access.ts — should plan-access.ts restoration be its own plan wave?**
   - What we know: The file is broken with PRO/ENTERPRISE; correct version is in git history at `0943b4f`
   - What's unclear: Whether other Phase 14 consumers (talent route, etc.) break further when plan-access.ts is fixed
   - RESOLVED: Fix plan-access.ts in Wave 0 / Plan 1 immediately; run `npx tsc --noEmit` to confirm pre-existing errors reduce (some may remain from `PricingTierId`/`RecruiterPaidFeature` which are separate issues in pricing.ts and use-ui-store.ts)

2. **`PLAN_TIERS` constant missing from pricing.ts**
   - What we know: `TalentPoolClient.tsx` imports `PLAN_TIERS` from `@/constants/pricing` but it's not defined there — another pre-existing TS error
   - What's unclear: Does this affect Phase 14 at all?
   - RESOLVED: Phase 14 does NOT import `PLAN_TIERS`. Do not add it; flag as separate tech-debt.

3. **Funnel chart type — bar chart or horizontal funnel?**
   - What we know: Recharts is available; `JobAnalyticsTab` uses a vertical bar chart
   - What's unclear: Whether a BarChart with decreasing bars (funnel visualization) or a simple metric card list is better UX
   - RESOLVED: Use metric cards for funnel stages (count + conversion % badge) rather than a BarChart. Recharts funnel chart is available but metric cards are simpler and match the existing `JobAnalyticsTab` pattern.

---

## Security Domain

> `security_enforcement: true` in `.planning/config.json`. ASVS Level 1 applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth()` check → 401 on missing session |
| V3 Session Management | yes | JWT via Auth.js; plan read from session |
| V4 Access Control | yes | `session.user.role !== RECRUITER` → 403 |
| V5 Input Validation | no | GET route with no body; no query params |
| V6 Cryptography | no | No new secrets in this route |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-recruiter data leak | Information Disclosure | `where: { job: { recruiterId: session.user.id } }` on all Application queries; `where: { recruiterId: session.user.id }` on all EngineerUnlock queries |
| Rate limit bypass | Denial of Service | `dataFetchRateLimiter.limit(session.user.id)` — keyed on authenticated user ID not IP |
| FREE plan accessing paid analytics | Elevation of Privilege | `isFreePlan` check at page level; `enabled: !isFreePlan` in TanStack Query hook prevents API call |

---

## Sources

### Primary (HIGH confidence)
- Codebase grep + file reads — all existing code patterns verified in session
- `git show 361d05b`, `c04dfde`, `0943b4f` — pipeline files and correct plan-access.ts confirmed in git history
- `src/app/api/recruiter/jobs/[id]/analytics/route.ts` — analytics API pattern
- `src/modules/recruiter/jobs/components/JobAnalyticsTab.tsx` — Recharts + ChartContainer pattern
- `src/modules/recruiter/talent/components/TalentPoolClient.tsx` — FREE plan inline overlay pattern
- `prisma/schema.prisma` — Application, EngineerUnlock, SeekerSkill, User.plan models confirmed
- `src/lib/billing/plan-access.ts` + `git show 0943b4f:src/lib/billing/plan-access.ts` — confirmed plan-access.ts mismatch and correct version

### Secondary (MEDIUM confidence)
- `src/app/api/recruiter/applications/stats/route.ts` — multi-count pattern (used as negative example; groupBy is better)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Git restoration commands: HIGH — test-verified in session that `git restore --source=361d05b` works and bracket paths need quoting
- plan-access.ts issue: HIGH — confirmed by TypeScript errors and git history diff
- Standard stack: HIGH — verified from package.json and codebase
- Funnel query pattern: HIGH — Prisma groupBy confirmed from existing analytics route pattern
- Quota computation: HIGH — verified from git history of unlock route
- Architecture: HIGH — all patterns verified from existing codebase

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stable codebase; quota constants may shift if pricing changes)
