---
phase: 14-recruiter-analytics-dashboard
verified: 2026-05-27T00:00:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Paid recruiter Analytics tab end-to-end — funnel, credits, top skills render from real data"
    expected: "Sign in as a RECRUITER on STARTER/GROWTH/SCALE. Visit /recruiter/pipeline, click Analytics. See 6 funnel cards with counts and conversion % (or — for first stage). See Credits card with used + remaining (or Unlimited for SCALE). See Top Skills chips or 'No unlocked engineers yet'. DevTools Network shows exactly one GET /api/recruiter/analytics returning 200."
    why_human: "Requires live Neon DB with real EngineerUnlock/Application/SeekerSkill data. Funnel counts, credit calculations, and top-skill aggregation depend on actual recruiter records that cannot be verified programmatically."
  - test: "FREE plan locked overlay — no network call fired"
    expected: "Sign in as a RECRUITER on FREE plan. Click Analytics tab. See the Lock icon overlay with 'Analytics requires a paid plan' and 'View Plans' button. DevTools Network shows NO call to /api/recruiter/analytics."
    why_human: "Requires a test account with plan=FREE and live session. The hook disabled-flag logic (via component separation pattern) must be confirmed to produce no network request in a real browser."
  - test: "Mobile layout — funnel cards reflow to 2 columns at 390px"
    expected: "At ~390px viewport, the 6 funnel cards are in a 2-column grid. No horizontal overflow. Credits and Top Skills sections are usable."
    why_human: "Responsive layout verification cannot be done programmatically — requires browser DevTools device emulation."
---

# Phase 14: Recruiter Analytics Dashboard Verification Report

**Phase Goal:** Build an Analytics tab on the recruiter pipeline page showing hiring funnel, credits used, and top skills. FREE plan gets a locked overlay.
**Verified:** 2026-05-27T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | plan-access.ts exports canAccessTalentPool and getUnlockQuota with FREE/STARTER/GROWTH/SCALE tiers | VERIFIED | File exists; exports both functions; STARTER:10, GROWTH:30 confirmed; no PRO/ENTERPRISE references |
| 2 | Recruiter can open /recruiter/pipeline and see the restored kanban board | VERIFIED | PipelineBoard.tsx exists (245 lines), PipelineCard.tsx (116 lines), pipeline API route exists with GET handler |
| 3 | /recruiter/pipeline renders a two-tab layout: Pipeline and Analytics | VERIFIED | page.tsx has TabsList, TabsTrigger for "pipeline" and "analytics", server component (no 'use client') |
| 4 | Pipeline API route and application status route exist and compile | VERIFIED | Both files present (route.ts 78 lines); committed in git (76eeefc, 0623b73) |
| 5 | GET /api/recruiter/analytics returns funnel stages with counts + conversion %, credits used/remaining, top 5 skills | VERIFIED | Route implements 6-stage funnel via groupBy, conversionPct null-safe, credits via getUnlockQuota + periodStart, topSkills frequency map |
| 6 | Route is auth-gated (401), RECRUITER-gated (403), rate-limited with dataFetchRateLimiter (429) | VERIFIED | All three guards present and in correct order; keyed on session.user.id per T-14-07 |
| 7 | Analytics tab renders funnel cards, credits, top skills; FREE plan sees locked overlay without firing fetch | VERIFIED | AnalyticsTab (194 lines) with early-return lock overlay for isFreePlan; AnalyticsTabContent separated so hook never called for FREE; funnel rendered via data.funnel.map; credits and topSkills sections present |
| 8 | AnalyticsTab handles isLoading, isError, and empty (!data) states | VERIFIED | All three branches present in AnalyticsTabContent |

**Score:** 8/8 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Analytics tab shows avg days per stage (ANLT-03) | Not deferred — intentionally dropped | D-03 decision: Application model has no per-stage timestamps; ApplicationStatusHistory not added. ROADMAP SC #3 is struck through. No later phase claims this requirement. This is a permanent scope reduction, not a deferral. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/billing/plan-access.ts` | canAccessTalentPool + getUnlockQuota for FREE/STARTER/GROWTH/SCALE | VERIFIED | Both exports present; STARTER:10, GROWTH:30; no PRO/ENTERPRISE |
| `src/app/recruiter/pipeline/page.tsx` | Pipeline page with Tabs container (Pipeline + Analytics) | VERIFIED | Server component with two TabsTriggers; isFreePlan computed server-side; AnalyticsTab wired |
| `src/app/recruiter/pipeline/PipelineBoard.tsx` | Restored kanban board component | VERIFIED | 245 lines; restored from git commit 361d05b |
| `src/app/recruiter/pipeline/PipelineCard.tsx` | Restored kanban card component | VERIFIED | 116 lines; restored from git commit 361d05b |
| `src/app/api/recruiter/pipeline/route.ts` | Restored pipeline GET API | VERIFIED | Contains export async function GET |
| `src/app/api/recruiter/application/[id]/status/route.ts` | Restored application status update API | VERIFIED | 78 lines |
| `src/modules/recruiter/analytics/types/analytics.types.ts` | RecruiterAnalyticsResponse + FunnelStage types | VERIFIED | Both interfaces exported with correct shape including conversionPct: number | null |
| `src/app/api/recruiter/analytics/route.ts` | GET analytics endpoint | VERIFIED | Full implementation with all guards, parallel Prisma queries, typed response |
| `src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts` | TanStack Query hook with enabled flag | VERIFIED | 'use client'; useQuery; queryKey: ['recruiter-analytics']; staleTime: 5min; enabled param |
| `src/app/recruiter/pipeline/AnalyticsTab.tsx` | Analytics tab UI: funnel cards, credits, top skills, FREE lock overlay | VERIFIED | 194 lines; isFreePlan early-return; all three query states handled; no inline styles; no shadows |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/recruiter/pipeline/page.tsx` | PipelineBoard | render inside TabsContent value=pipeline | WIRED | `<PipelineBoard />` inside TabsContent value="pipeline" confirmed |
| `src/app/recruiter/pipeline/page.tsx` | AnalyticsTab | render in TabsContent value=analytics with isFreePlan prop | WIRED | `<AnalyticsTab isFreePlan={isFreePlan} />` inside TabsContent value="analytics" confirmed |
| `src/app/api/recruiter/analytics/route.ts` | prisma.application.groupBy | funnel aggregation | WIRED | groupBy(['status'], where: { job: { recruiterId } }) confirmed |
| `src/app/api/recruiter/analytics/route.ts` | getUnlockQuota | quota lookup from plan-access | WIRED | import + call `getUnlockQuota(recruiterUser?.plan)` confirmed |
| `src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts` | /api/recruiter/analytics | fetch | WIRED | `fetch('/api/recruiter/analytics')` confirmed |
| `src/app/recruiter/pipeline/AnalyticsTab.tsx` | useRecruiterAnalytics | hook call | WIRED | imported and called in AnalyticsTabContent |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AnalyticsTab.tsx` | data.funnel | GET /api/recruiter/analytics → prisma.application.groupBy | Yes — groupBy produces real DB aggregates | FLOWING |
| `AnalyticsTab.tsx` | data.creditsUsed | GET /api/recruiter/analytics → prisma.engineerUnlock.count | Yes — scoped to source='talent_pool' + billing period | FLOWING |
| `AnalyticsTab.tsx` | data.topSkills | GET /api/recruiter/analytics → engineerUnlock.findMany with skills join | Yes — frequency map over real engineer skill graph | FLOWING |
| `page.tsx` → `AnalyticsTab` | isFreePlan | session.user.plan (server-side via auth()) | Yes — derives from JWT session | FLOWING |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Analytics route exports GET handler | `grep "export async function GET" route.ts` | Found | PASS |
| Auth/role/rate-limit guards in correct order | grep for status 401, 403, 429 | All three present | PASS |
| Funnel conversionPct null-safe | `grep "rawCounts[i - 1] === 0"` | Found line 110 | PASS |
| startOfMonth (date-fns) used for billing period | `grep "startOfMonth"` | Found; no raw Date constructor | PASS |
| AnalyticsTab FREE lock does not fire hook | Component split: AnalyticsTab returns early; AnalyticsTabContent in separate function | Confirmed via code structure | PASS |
| No inline styles in AnalyticsTab | `grep "style={{"` | Not found | PASS |
| No shadows in AnalyticsTab | `grep "shadow-"` | Not found | PASS |
| All query states handled | grep isLoading, isError, !data | All three present | PASS |
| End-to-end with real DB data | Requires running app | Not testable programmatically | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ANLT-01 | 14-01, 14-03 | /recruiter/pipeline has two tabs: "Pipeline" and "Analytics" | SATISFIED | TabsTrigger for both values confirmed; AnalyticsTab wired into analytics TabsContent |
| ANLT-02 | 14-02, 14-03 | Analytics tab shows funnel: Unlocked → Applied → Reviewing → Interviewing → Offered → Hired with count and conversion % | SATISFIED | 6-stage STAGES const in route; groupBy + rawCounts; conversionPct null-safe math; FunnelCard renders badge |
| ANLT-03 | None — dropped | Analytics tab shows avg days per stage | DROPPED (D-03) | Permanently dropped per D-03 decision (no ApplicationStatusHistory model); ROADMAP SC #3 struck through; not covered by any later phase |
| ANLT-04 | 14-02, 14-03 | Analytics tab shows credits used vs quota remaining (from plan tier) | SATISFIED | getUnlockQuota → totalQuota; periodStart-scoped creditsUsed count; creditsRemaining = max(0, quota-used); rendered in Credits section |
| ANLT-05 | 14-02, 14-03 | Analytics tab shows top 5 skills across unlocked engineers | SATISFIED | frequency Map over seekerProfile.skills join; sorted desc, sliced to 5; rendered as chips |

**ANLT-03 Disposition:** ANLT-03 ("avg days per stage") was explicitly dropped via design decision D-03, documented in 14-CONTEXT.md and 14-RESEARCH.md. The ROADMAP.md Success Criteria #3 for Phase 14 carries a strikethrough with the rationale: "no per-stage timestamps in Application model; no ApplicationStatusHistory added." No later phase in the roadmap claims this requirement. This is a permanent scope reduction accepted at the project level, not a gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `AnalyticsTab.tsx` | 93 | `useRecruiterAnalytics(!false)` — literal `!false` always evaluates to `true`; `enabled` flag is dead code | Warning | Not an immediate runtime bug (FREE gate is at AnalyticsTab parent level, so AnalyticsTabContent never renders for FREE users). Risk: if AnalyticsTabContent is ever rendered via a new entry point, the hook will fire regardless of plan. Code review CR-02 documents this. |
| `plan-access.ts` | 47 | `canAccessRecruiterPaidFeature` has an allowlist gap (empty string `""` passes both conditions) | Warning | Legacy function; per CR-01 review finding, called in talent route with non-existent PlanTier values, silently denying paid users access to talent detail. Pre-existing issue surfaced by restore, not introduced by phase 14. |
| `PipelineCard.tsx` | ~84 | `new Date(card.appliedAt)` without Invalid Date guard before date-fns format() | Warning | Can throw RangeError and crash the board if appliedAt is malformed. Pre-existing in restored file (WR-01 in review). |

### Human Verification Required

### 1. Paid Recruiter Analytics Tab — Funnel, Credits, Top Skills

**Test:** Sign in as a RECRUITER on a STARTER, GROWTH, or SCALE plan. Visit http://localhost:3000/recruiter/pipeline. Confirm two tabs appear: "Pipeline" and "Analytics". Click "Analytics". Verify: 6 funnel cards (Unlocked, Applied, Reviewing, Interviewing, Offered, Hired) each with a numeric count and a conversion % badge (or "—" for Unlocked). Verify a Credits card shows credits used and either a remaining count or "Unlimited" (for SCALE). Verify a Top Skills section shows skill chips or "No unlocked engineers yet". Open DevTools Network and confirm exactly one GET request to /api/recruiter/analytics returns HTTP 200.

**Expected:** All three sections render with real data from the DB. Exactly one API call with 200 response.

**Why human:** Requires a live Neon DB session with actual EngineerUnlock, Application, and SeekerSkill data for the recruiter account. Funnel counts, credit calculations, and skill frequency depend on real recruiter records that cannot be verified without running the app.

### 2. FREE Plan Locked Overlay — No Network Call

**Test:** Sign in as a RECRUITER on the FREE plan (plan=FREE in the DB). Visit /recruiter/pipeline. Click the "Analytics" tab. Confirm the Lock icon overlay appears with the text "Analytics requires a paid plan" and a "View Plans" button linking to /pricing. Open DevTools Network and confirm zero requests are made to /api/recruiter/analytics.

**Expected:** Locked overlay shown; no network call to the analytics API.

**Why human:** Requires a FREE-plan test account with live session. The component separation pattern (AnalyticsTab early-return before AnalyticsTabContent) must be confirmed in a real browser to ensure no network request is fired.

### 3. Mobile Layout — 390px Viewport

**Test:** With DevTools open on /recruiter/pipeline → Analytics tab, switch to device emulation at 390px width (or use iPhone SE preset). Verify: the 6 funnel cards reflow to a 2-column grid with no horizontal overflow. Credits and Top Skills sections stack vertically and remain usable. No text is cut off.

**Expected:** Mobile-first grid-cols-2 layout is usable; no overflow.

**Why human:** Responsive layout cannot be verified programmatically — requires browser DevTools device emulation.

### Gaps Summary

No gaps blocking goal achievement. All 8 must-have truths are verified at the code level. The phase goal — "Build an Analytics tab on the recruiter pipeline page showing hiring funnel, credits used, and top skills; FREE plan gets a locked overlay" — is structurally complete and wired correctly.

Three human verification items remain for live end-to-end confirmation (paid recruiter data render, FREE plan no-fetch, mobile layout). These are standard user-acceptance checks that cannot be automated without a running application and test accounts.

ANLT-03 (avg days per stage) is a permanent scope reduction, not a gap — documented in ROADMAP.md with a strikethrough and no later-phase coverage.

The code review (14-REVIEW.md) surfaced two warnings worth addressing before the next release: the `!false` dead-code in AnalyticsTabContent (CR-02, non-blocking — FREE gate is correctly enforced at the parent level) and the `canAccessRecruiterPaidFeature` allowlist edge case in `plan-access.ts` (CR-01, pre-existing, affects talent pool detail route not this phase's analytics tab).

---

_Verified: 2026-05-27T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
