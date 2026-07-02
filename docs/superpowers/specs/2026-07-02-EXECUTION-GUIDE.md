# Pivot Execution Guide — Developer Playbook

**Date:** 2026-07-02 · **Status:** live document — update the Status Table on every phase completion.
**Companions:** `2026-07-01-apply-faster-pivot-design.md` (WHY/WHAT) · `2026-07-01-pivot-DATA-MODEL.md` (schema canon) · `../plans/2026-07-01-p*.md` (per-phase HOW).

This is the layer above the plans: how any session (fresh chat included) picks up a phase, where code physically goes, how to refactor safely, and what to do when reality diverges from a plan.

---

## A. New-Chat Kickoff Protocol

### A1. The kickoff prompt (paste into a fresh chat, replace `{PHASE}`)

```
Execute pivot Phase {PHASE} for Hiretivo.

Read in this order before any code:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md  (this playbook + status table)
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md  (decisions)
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md  (schema canon — wins over any plan)
4. docs/superpowers/plans/2026-07-01-{PHASE}-*.md  (the plan to execute)
5. CLAUDE.md (repo rules) + memory note project_pivot_v3_apply_tool

Then: confirm dependency phases are MERGED to staging (spine below), branch per the
plan, and execute task-by-task — one commit per task, flip the plan checkboxes,
run the plan's verify commands. Stop and ask only on destructive ops or scope changes.
On completion run section F (Definition of Done).
```

Valid `{PHASE}` values: `p1a` `p1b` `p1c` `p2` `p3a` `p3b` `p3c` `p4` `p5` `p6` `p7` `p8`.

### A2. Resume mid-phase (context died / new chat picks up a started phase)

1. `git branch --show-current` + `git log --oneline staging..HEAD` → what's committed (ground truth).
2. Open the phase plan → first unchecked `- [ ]` box = next step. Checked boxes must match commits; if they disagree, trust git and fix the boxes.
3. Read memory `project_pivot_v3_apply_tool` status line.
4. `git status` — uncommitted work in progress? Finish or stash per the current task.
5. Continue from the first unchecked step. Never restart a phase from scratch.

### A3. Session rules (non-negotiable)

- One commit per task; message `feat(pivot): <task>` + trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Flip the plan's checkbox in the same breath as the commit.
- NEVER push `main`/`staging`; PRs target `staging`.
- New pivot docs must be `git add -f`'d (docs/ is gitignored — see incident note in memory).
- Verify = `pnpm tsc --noEmit` + `pnpm eslint <files>` + manual browse at ~390px & desktop. No test-framework scaffolding unless the plan says so.
- Update memory status + the Status Table (section E) at phase end.

---

## B. Code-Placement Map — "where does this code go?"

### B1. Decision table

| You are writing… | It goes in… | Rule |
|---|---|---|
| Domain UI used by ONE module | `src/modules/seeker/{domain}/components/` | domain = `feed` `apply` `tracker` `profile` |
| UI used by 2+ modules | `src/components/shared/` | 2+ rule; never duplicate |
| Layout (sidebar, headers, shells) | `src/components/layout/` | e.g. `AppSidebar.tsx` |
| shadcn base | `src/components/ui/` | NEVER customize |
| Query/mutation hooks | `src/modules/seeker/{domain}/hooks/use-*.ts` | TanStack keys `['feed',filters]` `['application',id]` `['credits']` |
| Module types | `src/modules/seeker/{domain}/types/*.types.ts` | e.g. `ResumeDocument` in `profile/types/` |
| Pure logic / services | `src/lib/{area}/` | `lib/resume/render.ts` `lib/apply/jd-fetch.ts` `lib/crypto/field-crypto.ts` |
| Billing/quota logic | `src/lib/billing/` | extend `ai-daily-limit.ts` pattern |
| API routes | `src/app/api/seeker/{resource}/route.ts` | auth→role→rate-limit→Zod→`{data}`/`{error}` shape |
| Pages (seeker shell) | `src/app/(app)/…` | `/dashboard` `/profile` `/settings` (Phase 1b group) |
| Enums (any fixed string set) | `src/constants/enums.ts` (+ prisma if persisted) | DB enums synced TS↔Prisma, same members/casing |
| Zod schemas | `src/lib/validations/*.schema.ts` | validate client AND server |
| Feature flags | `src/constants/flags.ts` | `NEXT_PUBLIC_*` env, default off |
| Constants/config | `src/constants/*.ts` | e.g. `billing.ts` nav.ts |

### B2. Path ownership per phase (collision guard)

| Phase | Owns (creates/modifies) |
|---|---|
| 1a | `constants/flags.ts` · `middleware.ts` · `layout/Header.tsx` · `auth/select-role` |
| 1b | `layout/AppSidebar.tsx` · `constants/nav.ts` · `app/(app)/**` stubs |
| 1c | `modules/seeker-onboarding/**` · parse route · `lib` PDF-text extraction |
| 2 | `modules/seeker/feed/**` · `api/seeker/feed` |
| 3a | `prisma/schema.prisma` (Certification, ApplicationDefaults, enums) · `constants/enums.ts` |
| 3b | `lib/resume/**` · `modules/seeker/profile/types/` · `lib/r2.ts` keys |
| 3c | `modules/seeker/profile/**` · `app/(app)/profile` · `lib/validations/profile*` · `lib/crypto/field-crypto.ts` |
| 4 | `lib/ai-prompts.ts` · `lib/billing/ai-*` · `api/seeker/apply/{optimize-resume,cover-letter}` |
| 5 | `prisma` (Application ext) · `modules/seeker/apply/**` · `api/seeker/applications/**` · `(app)/dashboard/applications/[id]` |
| 6 | `modules/seeker/tracker/**` · `api/seeker/tracker/**` |
| 7 | `lib/apply/jd-fetch.ts` · `api/seeker/apply/from-link` |
| 8 | `constants/billing.ts` · `lib/billing/plan-access.ts` · pricing page · sidebar widget wiring |

Two phases touching the same file (e.g. `enums.ts`, `schema.prisma`) = fine sequentially, never in parallel branches.

---

## C. Refactor Flow — changing existing code safely

1. **CHECK FIRST** (Golden Rule 1): search `services/ lib/ modules/*/ components/shared/ app/api/` for an existing implementation. Exists → use/extend. Only build if absent.
2. **Generalize, don't fork** — the `RecruiterSidebar → AppSidebar` pattern: extract a config-driven shared component, keep the old one compiling (flag-hidden), never copy-paste a variant.
3. **Shared-contract changes** (e.g. `jobId` → nullable, return-shape changes): run the cross-feature audit BEFORE committing —
   `grep -rn "<symbol>" src --include=*.ts --include=*.tsx` → list every consumer in the PR description → fix each for the new contract (no non-null assertions, no guard-only patches). This is the CLAUDE.md bug-fix standard applied to refactors.
4. **Migrations:** additive only; never edit an applied migration; one `migrate dev --name p{phase}_<desc>` per phase on DB1; `prisma validate` first; P2022 later = drift → see D-cases. DATA-MODEL doc is canon for every model/enum — plans marked RECONCILE (p3a, p3c) must copy from it verbatim.
5. **Renames/moves:** update all imports in the same commit; `pnpm tsc --noEmit` is the gate.
6. **Legacy pivot surfaces** (old `/seeker/*` pages, verified-engineer flow, recruiter code): leave compiling, gate or bypass, retire in a dedicated later cleanup phase — not opportunistically.

---

## D. Developer Cases — when reality diverges

| Case | Do this |
|---|---|
| **Plan contradicts real code** (file moved, API differs, already built) | Code reality wins. Adapt, note a `> DEVIATION:` line in the plan at that task, keep going. Big contradiction (design invalid) → stop, discuss. |
| **Plan conflicts with DATA-MODEL** | DATA-MODEL wins for schema, always (esp. p3a/p3c reconcile banners). |
| **Dependency phase not merged** | Don't build on unmerged branches. Either wait for the PR or branch off the dependency branch and note the PR must retarget after it merges. Default: stop and flag. |
| **Bug discovered mid-phase, in scope** | Root-cause fix inside the phase, own commit `fix(pivot): …`. |
| **Bug discovered, out of scope** | Don't chase it. Note in PR description + memory; separate `fix/*` branch later. Exception: it blocks the phase → fix minimally, flag loudly. |
| **Verify fails (tsc/lint/browse)** | Never commit red. Fix within the task. Can't fix → revert step, mark task blocked in plan, report. |
| **Migration fails / P2022 drift** | Stop. Don't force-reset anything. Check `migrate status` on DB1, reconcile per memory `project_db_schema_workflow`, ask if destructive action would be needed. |
| **Context death mid-task** | Committed work survives; uncommitted may be lost. Resume via A2; redo the partial step. Prefer ending sessions at task boundaries (commit = save point). |
| **Merge conflict with staging** | Rebase feature branch on fresh staging (`git fetch && git rebase origin/staging`), re-verify, force-push the feature branch only. |
| **New doc/plan created** | `git add -f` it (docs/ gitignored) + commit. Untracked docs are wipeable — proven 2026-07-01. |
| **Scope creep temptation** | YAGNI. Note the idea in memory/backlog, stay in the phase's plan. |
| **AI/spend limits hit** | Work inline (no subagents), stop at a clean task boundary, record state in plan + memory. |

---

## E. Status Table — LIVE (update on every phase completion)

| Phase | Plan | Code | PR | Notes |
|---|---|---|---|---|
| 1a flags-gate | ✅ | ✅ 5 commits (`acf5ba0..deb8128` + mobile-nav fix) | ✅ pushed | on `feature/pivot-p1a-flags-gate`; browse-verify found+fixed ungated `PublicMobileNavMenu.tsx` recruiter items |
| 1b shell | ✅ | ✅ 9 commits (`4bfe7d7..6a8147d`) | — | on `feature/pivot-p1b-shell`; deviation — renamed unused-per-plan `SEEKER_NAV_ITEMS`→`LEGACY_SEEKER_HEADER_ITEMS` (still consumed by legacy SeekerHeader/Header); browse-verify found+fixed mobile sidebar clipping (`AppSidebar` not `lg:`-gated) |
| 1c onboarding | ✅ | ✅ 11 commits (`bb416f2..911799a`) | — | on `feature/pivot-p1c-onboarding`; adds `unpdf`+`mammoth`; `PROGRESSIVE_ONBOARDING` flag; browse-verify found+fixed IDOR in `saveParsedProfile` (client-controlled `resumeKey` — now validated against `resumes/${userId}/` prefix) |
| 2 feed | ✅ | ✅ 8 commits (`81da21d..75e0dfd`) | — | on `feature/pivot-p2-feed`; adds `MatchRing` shared component + `applyQueue` Zustand seam (Phase 5); deviation — no `cmdk`, built companies multiselect with existing `Popover`+`Checkbox`; deviation — full authenticated browse walkthrough not done (no test seeker creds this session, auto-mode denied a DB password reset without explicit confirm); tsc+eslint clean repo-wide, auth-gating confirmed via 401s |
| 3a schema | ✅ ⚠️ reconcile banner | ✅ 6 commits (`6519c88..1324b71`) | pending | on `feature/pivot-p3a-schema`; used DATA-MODEL verbatim over plan's drifted enum/model shapes; had to fix `prisma.config.ts` — Prisma 7 moved `shadowDatabaseUrl` out of `schema.prisma` datasource block; migration additive-only (2 enums, 2 tables, 2 indexes, 2 FKs), applied to DB1; contradiction flagged for 3c — DATA-MODEL types self-ID fields as enum columns but its own PII note says "encrypt at rest", can't do both as-is |
| 3b pdf | ✅ | ✅ 8 commits (`add3fb1..dcb0abb`) | pending | on `feature/pivot-p3b-pdf`; adds `@react-pdf/renderer`; `render.tsx`/`ResumeTemplate.tsx`/`sections.tsx` need explicit `import React` (tsconfig `jsx:"preserve"` + `tsx`/esbuild classic transform, unlike Next's automatic runtime); ATS proof via `pnpm resume:smoke` + `unpdf` text-layer extraction (single-column, in-order, real text confirmed) — no PDF viewer available in this session; deviation — Task 8 unit tests skipped per explicit user instruction |
| 3c profile | ✅ ⚠️ reconcile banner | — | — | builds `field-crypto.ts` |
| 4 ai | ✅ | — | — | model benchmark task inside |
| 5 wizard | ✅ | — | — | migration + jobId nullable audit |
| 6 tracker | ✅ | — | — | adds `@dnd-kit/*` |
| 7 link | ✅ | — | — | |
| 8 pricing | ✅ | — | — | v1 complete when merged |
| 8.5 extension | plan later (just-in-time) | — | — | fast-follow |

**Execution spine (merge order):** 1a → 1b → 1c → 2 → 3a → 3b → 3c → 4 → 5 → (6 ∥ 7) → 8 → 8.5

---

## F. Definition of Done (per phase)

- [ ] All plan tasks checked; every task = one commit on the phase branch
- [ ] `pnpm tsc --noEmit` + `pnpm eslint` clean; migration applied cleanly (schema phases)
- [ ] Manual browse of every touched screen at ~390px + desktop; loading/error/empty verified where data fetches
- [ ] No `console.log`, no `TODO`, doc-comments on every new fn/route/component
- [ ] Deviations noted in plan; plan file committed (`git add -f`)
- [ ] Status Table (section E) row updated + memory `project_pivot_v3_apply_tool` status line updated
- [ ] Pushed + PR → `staging` with summary, deviations, and consumer-audit list (if shared contracts changed)
- [ ] Next phase named in the PR description
