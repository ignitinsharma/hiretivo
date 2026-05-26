# Phase 14: Recruiter Analytics Dashboard — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 14-recruiter-analytics-dashboard
**Areas discussed:** Pipeline restoration, Avg days per stage, Analytics time period, FREE plan treatment

---

## Pipeline Restoration

| Option | Description | Selected |
|--------|-------------|----------|
| Restore as-is + add analytics tab | git restore the 4 deleted files, verify they work, then add the Analytics tab | ✓ |
| Restore + improve kanban, then add analytics | Restore from git, then improve the kanban before adding analytics | |
| Rebuild pipeline page from scratch | Ignore git history, write fresh pipeline page + kanban, then add analytics tab | |

**User's choice:** Restore as-is + add analytics tab (recommended)
**Notes:** Pipeline kanban files were accidentally deleted during Phase 13 worktree merge (commit `8ffde15`). Original files are in git history at commits `361d05b` (UI) and `c04dfde` (API routes).

---

## Avg Days Per Stage

| Option | Description | Selected |
|--------|-------------|----------|
| Skip avg days per stage entirely | Drop SC-3. Show funnel counts + conversion % only. No schema change. | ✓ |
| Approximate using updatedAt | Show avg days since updatedAt per stage. Inaccurate for retroactively moved cards. | |
| Add ApplicationStatusHistory table | New model tracking every status transition with timestamp. Accurate but schema migration + new write path. | |

**User's choice:** Skip avg days per stage entirely
**Notes:** Application model only has `createdAt` and `updatedAt` — no per-stage timestamps. Inaccurate approximation not worth it. SC-3 dropped from Phase 14 scope.

---

## Analytics Time Period

| Option | Description | Selected |
|--------|-------------|----------|
| All-time | Aggregate all applications for the recruiter regardless of date. | ✓ |
| Rolling 30 days | Only include applications from the last 30 days. | |
| Recruiter-selectable (30d / 90d / All-time) | Dropdown to switch time range. More flexible but adds UI complexity. | |

**User's choice:** All-time (recommended)
**Notes:** Simplest query, most complete picture. Useful especially when recruiter has few total hires.

---

## FREE Plan Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Show full analytics on all plans | Analytics visible to FREE, PRO, ENTERPRISE alike. Upgrade nudge is just a banner below. | |
| Show locked Analytics tab with upgrade CTA | FREE sees the tab, clicking shows lock screen with upgrade modal (Phase 8 pattern). | ✓ |
| Fully hidden tab for FREE plan | FREE recruiters don't see the Analytics tab at all. | |

**User's choice:** Show locked Analytics tab with upgrade CTA (recommended)
**Notes:** Consistent with Phase 8 paid gate pattern for talent pool and interview scheduling. Motivates upgrade from pipeline page.

---

## Claude's Discretion

- Funnel stage mapping: ROADMAP funnel labels → actual ApplicationStatus values
- Recharts for visualization (already installed, used in JobAnalyticsTab.tsx)
- Credits/quota computation from EngineerUnlock count vs plan tier limit
- Top skills JOIN across EngineerUnlock → SeekerProfile → SeekerSkill

## Deferred Ideas

- Avg days per stage — needs `ApplicationStatusHistory` schema (future phase)
- Date range selector — deferred; all-time sufficient for v1
