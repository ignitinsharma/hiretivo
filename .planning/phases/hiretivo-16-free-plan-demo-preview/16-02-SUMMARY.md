---
phase: 16-free-plan-demo-preview
plan: 02
subsystem: recruiter-talent-ui
tags: [demo-cards, free-plan-gate, upgrade-modal, ui-components]
dependency_graph:
  requires: []
  provides:
    - DemoEngineerCard (src/modules/recruiter/talent/components/DemoEngineerCard.tsx)
    - TalentUpgradeModal (src/modules/recruiter/talent/components/TalentUpgradeModal.tsx)
  affects:
    - plan-03 (TalentPoolClient wiring)
tech_stack:
  added: []
  patterns:
    - shadcn Dialog for upgrade modal
    - DemoEngineerProfile type from demo-engineers constants
    - onUpgrade callback prop pattern for modal trigger
key_files:
  created:
    - src/modules/recruiter/talent/components/DemoEngineerCard.tsx
    - src/modules/recruiter/talent/components/TalentUpgradeModal.tsx
    - src/constants/demo-engineers.ts (stub — matches Plan 01 spec exactly)
  modified: []
decisions:
  - DemoEngineerCard uses full name visible per D-02 (contrast incentive vs blurred real cards)
  - Preview chip (text-xs, bg-brand-surface, border-brand-border) per D-03
  - Unlock Now button fires onUpgrade callback — no profile dialog, no email/save per D-08
  - TalentUpgradeModal uses shadcn Dialog (not custom overlay) per D-07
  - UPGRADE_TIERS constant drives tier grid — no repeated JSX per CLAUDE.md
  - engineerTeaser optional prop personalizes modal copy for specific engineer context
  - demo-engineers.ts stub created (Rule 3) to enable TypeScript compilation in parallel worktree
metrics:
  duration: ~8 minutes
  completed: 2026-06-01
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 16 Plan 02: Demo Engineer Card + Upgrade Modal Summary

**One-liner:** DemoEngineerCard with Preview chip and Unlock Now CTA, plus TalentUpgradeModal with 3-tier shadcn Dialog and direct checkout links — both self-contained for Plan 03 wiring.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create DemoEngineerCard component | 02da751 | src/modules/recruiter/talent/components/DemoEngineerCard.tsx |
| 2 | Create TalentUpgradeModal component | 7889742 | src/modules/recruiter/talent/components/TalentUpgradeModal.tsx |
| — | Rule 3 auto-fix: demo-engineers.ts stub | 50d0531 | src/constants/demo-engineers.ts |

## What Was Built

### DemoEngineerCard (`src/modules/recruiter/talent/components/DemoEngineerCard.tsx`)

Renders a single FREE-plan demo engineer card that is visually consistent with the existing TalentCard in TalentPoolClient.tsx, with these intentional differences:

- **Preview chip** — `text-xs bg-brand-surface border-brand-border` in top-right corner (per D-03)
- **Full name visible** — `profile.name` shown clearly (per D-02; contrast with blurred real cards)
- **hiretivoScore badge** — `{score}/100` with bg-brand-surface pill
- **Seeking status dot** — green for ACTIVELY_LOOKING, yellow for OPEN_TO_OFFERS
- **Skills grid** — up to 4 visible, remainder collapsed to `+N`
- **Meta grid** — salary, availability, yearsExperience, timezoneOverlap (2-column)
- **Unlock Now CTA** — fires `onUpgrade()` callback (opens TalentUpgradeModal, not TalentProfileDialog)
- No email button, no save button (per D-08)

Props: `{ profile: DemoEngineerProfile; onUpgrade: () => void }`

### TalentUpgradeModal (`src/modules/recruiter/talent/components/TalentUpgradeModal.tsx`)

shadcn Dialog upgrade modal triggered when FREE-plan recruiters click Unlock Now on demo cards, Unlock Profile on real blurred cards, or the disabled search bar:

- **3 pricing tiers** (Starter $199/10 unlocks, Growth $399/30 unlocks, Scale $799/unlimited) rendered from `UPGRADE_TIERS` constant array — no JSX repetition
- **Tier CTA hrefs** — `/api/billing/checkout?plan=STARTER`, `/api/billing/checkout?plan=GROWTH`, `/api/billing/checkout?plan=SCALE`
- **Highlighted tier** — Starter is highlighted with `border-brand-primary bg-brand-surface`
- **engineerTeaser prop** — optional string personalizes description ("Upgrade to reveal full profile for...")
- **See all plans →** secondary link to `/pricing` (closes modal on click)

Props: `{ open: boolean; onOpenChange: (open: boolean) => void; engineerTeaser?: string }`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created demo-engineers.ts stub for parallel TypeScript compilation**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `DemoEngineerCard.tsx` imports `DemoEngineerProfile` from `@/constants/demo-engineers` which is created by Plan 01 (running in parallel). With `demo-engineers.ts` absent, `tsc --noEmit` produced `TS2307: Cannot find module` for DemoEngineerCard.
- **Fix:** Created `src/constants/demo-engineers.ts` with the exact interface and all 6 profiles from `16-CONTEXT.md` specifics section. This matches Plan 01's expected output exactly — no conflict on merge.
- **Files modified:** `src/constants/demo-engineers.ts` (new)
- **Commit:** 50d0531

## Known Stubs

None — both components are fully wired to their prop interfaces. The `demo-engineers.ts` file contains complete data matching the spec (not a placeholder stub for display purposes).

Note: `demo-engineers.ts` may be superseded by Plan 01's version on merge; both are identical per the CONTEXT.md spec.

## Threat Flags

No new threat surface introduced. Checkout hrefs are client-side navigation only — `/api/billing/checkout` is server-auth-gated (T-16-04, accepted in plan threat model). engineerTeaser is optional display text from static/public data (T-16-05, accepted).

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/modules/recruiter/talent/components/DemoEngineerCard.tsx | FOUND |
| src/modules/recruiter/talent/components/TalentUpgradeModal.tsx | FOUND |
| src/constants/demo-engineers.ts | FOUND |
| commit 02da751 (DemoEngineerCard) | FOUND |
| commit 7889742 (TalentUpgradeModal) | FOUND |
| commit 50d0531 (demo-engineers stub) | FOUND |
