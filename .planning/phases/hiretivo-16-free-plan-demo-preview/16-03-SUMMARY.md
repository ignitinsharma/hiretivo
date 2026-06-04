---
phase: 16-free-plan-demo-preview
plan: "03"
subsystem: recruiter-talent-ui
tags: [free-plan, demo-mode, mix-mode, upgrade-modal, talent-pool, tooltip, banner]
dependency_graph:
  requires:
    - Plan 01 (DEMO_ENGINEERS, DEMO_THRESHOLD, isFreePlan, demoCount API fields)
    - Plan 02 (DemoEngineerCard, TalentUpgradeModal components)
  provides:
    - TalentPoolClient with FREE plan demo/mix mode fully wired
  affects:
    - src/modules/recruiter/talent/components/TalentPoolClient.tsx (single file, complete refactor)
tech_stack:
  added: []
  patterns:
    - computeDemoSlices() mix-mode logic (realCount vs DEMO_THRESHOLD)
    - onUnlock optional prop pattern for TalentCard (FREE vs paid branch)
    - TooltipProvider/Tooltip wrapping disabled Input (D-04)
    - upgradeModalOpen + upgradeTeaser state pair with openUpgrade() helper
key_files:
  created: []
  modified:
    - src/modules/recruiter/talent/components/TalentPoolClient.tsx
decisions:
  - "Locked wall (isLocked / TalentForbiddenError path) removed — API now returns 200 for FREE plan with blurred items"
  - "computeDemoSlices() uses talentItems.length (real cards returned) not demoCount — demoCount is for banner copy only"
  - "TalentCard onUnlock prop is undefined for paid plan, triggering View Profile + email button branch"
  - "Empty state only shown for paid plan (talentItems.length === 0 && !isFreePlan) — FREE plan always shows demo cards"
  - "useUIStore and Lock import fully removed — no longer needed after locked wall removal"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-06-01"
  tasks: 1
  files_changed: 1
  files_created: 0
---

# Phase 16 Plan 03: Free Plan Demo Preview — TalentPoolClient Wiring Summary

**One-liner:** TalentPoolClient refactored to wire DemoEngineerCard + TalentUpgradeModal into FREE plan mix-mode grid, replacing the old locked wall with demo cards, disabled search tooltip, and engineer count banner.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor TalentPoolClient.tsx with demo/mix mode | 425066e | src/modules/recruiter/talent/components/TalentPoolClient.tsx |

## What Was Built

### TalentPoolClient.tsx — Complete Refactor

**Locked wall removed:** The `isLocked` / `TalentForbiddenError` early-return block is gone. `Lock` lucide icon, `useUIStore`, and `openPaidFeatureModal` imports are removed.

**New state:**
- `upgradeModalOpen: boolean` — controls TalentUpgradeModal visibility
- `upgradeTeaser: string | undefined` — contextual teaser (engineer name + score + skills) passed to modal

**`openUpgrade(teaser?)` helper:** Single entry point to open TalentUpgradeModal from any trigger point (disabled search, real blurred card, demo card).

**Derived values:**
- `isFreePlan = talentQuery.data?.isFreePlan ?? false`
- `demoCount = talentQuery.data?.demoCount ?? 0`
- `demoSlices = isFreePlan ? computeDemoSlices(talentItems.length) : []`

**`computeDemoSlices(realCount)`:** Mix-mode logic per D-05:
- `realCount >= DEMO_THRESHOLD (6)` → empty array (real pool is large enough, no demos)
- `0 < realCount < 6` → `DEMO_ENGINEERS.slice(0, 6 - realCount)` (pad to fill grid)
- `realCount === 0` → all 6 DEMO_ENGINEERS

**TalentCard — new `onUnlock` prop:**
- `onUnlock` provided → renders "Unlock Profile" button (secondary variant) — FREE plan blurred cards
- `onUnlock` not provided → renders "View Profile" + optional email button — paid plan full cards

**Search bar (D-04):** Wrapped in `TooltipProvider > Tooltip`. When `isFreePlan`:
- `readOnly={true}`, `className` adds `cursor-not-allowed opacity-50`
- `onChange` is no-op (guarded by `!isFreePlan`)
- `onClick` fires `openUpgrade()` with no teaser
- `TooltipContent` shows "Upgrade to search 47+ verified engineers"
- Clear button hidden (only visible when `searchInput && !isFreePlan`)

**Engineer count banner (D-06):** Renders between search bar and grid when `isFreePlan`:
- `demoCount > 0`: `"${demoCount} verified engineer(s) in the pool — upgrade to see them all"`
- `demoCount === 0`: `"India's top verified engineers — be first to discover them"`

**Card grid:** Replaces the previous single-branch grid with:
1. Skeleton (loading state — always 6 skeletons)
2. Error state
3. Empty state — only for paid plan (`talentItems.length === 0 && !isFreePlan`)
4. Mixed grid: real `TalentCard` items first, then `DemoEngineerCard` items from `demoSlices`

**TalentUpgradeModal:** Added before closing `</section>` with `open={upgradeModalOpen}`, `onOpenChange={setUpgradeModalOpen}`, `engineerTeaser={upgradeTeaser}`.

**TalentProfileDialog:** Unchanged — paid plan profile view retained.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria passed.

## Known Stubs

None — all data is live from the API (`isFreePlan`, `demoCount`, `items`) and static constants (`DEMO_ENGINEERS`). No hardcoded placeholder values flow to UI rendering.

## Threat Surface Scan

No new threat surface introduced. Changes are display-only:
- `isFreePlan` flag is display-only; server enforces plan status on every API request.
- Disabled search bar (`readOnly`) is UX only; server rate-limits and plan-gates search results even if bypassed.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/modules/recruiter/talent/components/TalentPoolClient.tsx | FOUND |
| commit 425066e (TalentPoolClient refactor) | FOUND |
| DemoEngineerCard import + usage | FOUND (lines 23, 349) |
| TalentUpgradeModal import + usage | FOUND (lines 25, 372) |
| DEMO_ENGINEERS + DEMO_THRESHOLD imports | FOUND (line 17) |
| isFreePlan + demoCount derived state | FOUND (lines 242–243) |
| Unlock Profile CTA | FOUND (line 149) |
| isLocked / TalentForbiddenError | NOT FOUND (correctly removed) |
| cursor-not-allowed + opacity-50 + readOnly | FOUND (lines 279–280) |
| verified engineer banner text | FOUND (lines 309–310) |
| No shadow class | CONFIRMED |
| No dark: class | CONFIRMED |
| TypeScript: no new errors in plan 03 files | CONFIRMED |
