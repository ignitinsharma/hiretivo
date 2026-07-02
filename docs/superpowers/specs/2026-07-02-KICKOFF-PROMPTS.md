# Pivot Kickoff Prompts — copy/paste, one per phase

**How to use:** open a **fresh chat** for each phase (not a tab of an old one — clean context). Copy that phase's block, paste, send. Do them **in order** (top to bottom). Merge each phase's PR to `staging` before starting the next. After each phase, its status row in `2026-07-02-EXECUTION-GUIDE.md` §E gets updated.

Every block is self-contained — it tells the chat what to read, which skills to use, and the rules.

---

## ▶ p1a — FINISH (verify + ship; code already written)

```
Finish pivot Phase 1a for Hiretivo (code is already committed on branch
feature/pivot-p1a-flags-gate; just verify + ship it).

Read first: docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md and
docs/superpowers/plans/2026-07-01-p1a-flags-gate.md (see its unchecked boxes).

Use skills: superpowers:verification-before-completion, browse (or webapp-testing), commit.

Do: run pnpm tsc + pnpm lint; start dev server and browse-verify —
/recruiter/login and /recruiter/dashboard redirect to /seeker/dashboard,
public header shows no recruiter links at ~390px and desktop, a new signup
auto-lands as SEEKER with no role picker. Then push feature/pivot-p1a-flags-gate
and open a PR into staging (the pivot docs commits ride on this branch — include
them). Update the guide §E status row + memory. Do not start p1b.
```

---

## ▶ p1b — seeker sidebar shell   (needs: p1a merged)

```
Execute pivot Phase p1b for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p1b-shell.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p1a is merged to staging. Branch feature/pivot-p1b-shell off fresh
staging. Execute task-by-task: one commit per task, flip the plan checkboxes,
run the plan's verify commands (pnpm tsc + eslint + browse at 390px/desktop).
Stop only on destructive ops or scope changes. On completion run the guide's
Definition of Done: update §E status row + memory, push, PR into staging.
```

---

## ▶ p1c — onboarding + resume parser   (needs: p1b merged)

```
Execute pivot Phase p1c for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p1c-onboarding.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p1b is merged to staging. Branch feature/pivot-p1c-onboarding off fresh
staging. Execute task-by-task: one commit per task, flip checkboxes, run verify
(pnpm tsc + eslint + browse). Stop only on destructive ops or scope changes.
On completion run Definition of Done: update §E + memory, push, PR into staging.
```

---

## ▶ p2 — match-ranked feed & browse   (needs: p1c merged)

```
Execute pivot Phase p2 for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p2-feed.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p1c is merged to staging. Branch feature/pivot-p2-feed off fresh staging.
Execute task-by-task: one commit per task, flip checkboxes, run verify
(pnpm tsc + eslint + browse). Stop only on destructive ops or scope changes.
On completion run Definition of Done: update §E + memory, push, PR into staging.
```

---

## ▶ p3a — schema migration   (needs: p2 merged)   ⚠️ RECONCILE plan vs DATA-MODEL

```
Execute pivot Phase p3a for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md  (AUTHORITATIVE — this plan's
   enum/model defs drift from it; use the DATA-MODEL versions VERBATIM)
3. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
4. docs/superpowers/plans/2026-07-01-p3a-schema.md  (note its RECONCILE banner)
5. CLAUDE.md  (+ memory notes project_pivot_v3_apply_tool, project_db_schema_workflow)

Use skills: superpowers:executing-plans, verification-before-completion, commit.

Confirm p2 is merged to staging. Branch feature/pivot-p3a-schema off fresh staging.
Use WorkAuthStatus/SelfIdGender/SelfIdAnswer/Certification/ApplicationDefaults exactly
as defined in the DATA-MODEL doc. Additive migration only: pnpm prisma validate then
pnpm prisma migrate dev --name p3a_certification_application_defaults on DB1. One commit
per task, flip checkboxes. Stop on any migration error (do NOT reset). On completion run
Definition of Done: update §E + memory, push, PR into staging.
```

---

## ▶ p3b — ATS-safe PDF renderer   (needs: p3a merged)

```
Execute pivot Phase p3b for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p3b-pdf.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, verification-before-completion, commit.

Confirm p3a is merged to staging. Branch feature/pivot-p3b-pdf off fresh staging.
Execute task-by-task: one commit per task, flip checkboxes, run verify (pnpm tsc +
render a sample PDF and confirm the text is selectable / single-column / ATS-safe).
Stop only on destructive ops or scope changes. On completion run Definition of Done:
update §E + memory, push, PR into staging.
```

---

## ▶ p3c — profile page + edit forms   (needs: p3a + p3b merged)   ⚠️ RECONCILE plan vs DATA-MODEL

```
Execute pivot Phase p3c for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md  (AUTHORITATIVE — use its
   enum/model defs VERBATIM; this plan's versions drift)
3. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
4. docs/superpowers/plans/2026-07-01-p3c-profile.md  (note its RECONCILE banner)
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p3a AND p3b are merged to staging. Branch feature/pivot-p3c-profile off fresh
staging. Execute task-by-task: one commit per task, flip checkboxes, run verify
(pnpm tsc + eslint + browse at 390px/desktop). D&I self-ID fields render US-only.
Stop only on destructive ops or scope changes. On completion run Definition of Done:
update §E + memory, push, PR into staging.
```

---

## ▶ p4 — AI tailoring pipeline   (needs: p3b + p3c merged)

```
Execute pivot Phase p4 for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md  (§6 model economics)
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p4-ai.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, claude-api (for model/pricing reference),
verification-before-completion, commit.

Confirm p3b AND p3c are merged to staging. Branch feature/pivot-p4-ai off fresh staging.
Execute task-by-task: one commit per task, flip checkboxes, run verify (pnpm tsc +
eslint + real-JD smoke on each route). Default model Gemini 2.5 Flash, do the benchmark
task, keep AI_MODEL env-swappable. Stop only on destructive ops or scope changes.
On completion run Definition of Done: update §E + memory, push, PR into staging.
```

---

## ▶ p5 — apply wizard + assisted submit   (needs: p3a + p3b + p4 merged)

```
Execute pivot Phase p5 for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md  (Application extensions — verbatim)
3. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
4. docs/superpowers/plans/2026-07-01-p5-wizard.md
5. CLAUDE.md  (+ memory notes project_pivot_v3_apply_tool, project_db_schema_workflow)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p3a, p3b, p4 are merged to staging. Branch feature/pivot-p5-wizard off fresh
staging. Additive migration for Application (jobId → nullable: run the consumer-audit
task). One commit per task, flip checkboxes, verify (prisma migrate dev + pnpm tsc +
eslint + browse the full wizard). Credit consumed only on finalize success. Stop on
migration errors (no reset) or scope changes. On completion run Definition of Done:
update §E + memory, push, PR into staging.
```

---

## ▶ p6 — application tracker   (needs: p5 merged)

```
Execute pivot Phase p6 for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p6-tracker.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p5 is merged to staging. Branch feature/pivot-p6-tracker off fresh staging.
Execute task-by-task: one commit per task, flip checkboxes, run verify (pnpm tsc +
eslint + browse: drag-status, notes, CSV round-trip). Stop only on destructive ops or
scope changes. On completion run Definition of Done: update §E + memory, push, PR.
```

---

## ▶ p7 — add-your-own-link   (needs: p5 merged; can run parallel to p6)

```
Execute pivot Phase p7 for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md
4. docs/superpowers/plans/2026-07-01-p7-link.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p5 is merged to staging. Branch feature/pivot-p7-link off fresh staging.
Execute task-by-task: one commit per task, flip checkboxes, run verify (pnpm tsc +
eslint + test a real Greenhouse/Lever/Ashby URL AND a blocked URL falling back to
manual paste). Stop only on destructive ops or scope changes. On completion run
Definition of Done: update §E + memory, push, PR into staging.
```

---

## ▶ p8 — AI-credit pricing   (needs: p4 + p5 + p1b merged)   → v1 COMPLETE

```
Execute pivot Phase p8 for Hiretivo.

Read first, in order:
1. docs/superpowers/specs/2026-07-02-EXECUTION-GUIDE.md
2. docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md  (§2 tiers, §6 economics)
3. docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md  (Phase 8: PlanTier Option-A remap)
4. docs/superpowers/plans/2026-07-01-p8-pricing.md
5. CLAUDE.md  (+ memory note project_pivot_v3_apply_tool)

Use skills: superpowers:executing-plans, systematic-debugging (if bugs),
verification-before-completion, browse, commit.

Confirm p4, p5, p1b are merged to staging. Branch feature/pivot-p8-pricing off fresh
staging. CHECK FIRST if p4 already built the monthly credit limiter (reuse, don't
duplicate). Ladder A: FREE 8 / PRO $9-400 / MAX $19-1000, annual = 10x. One commit per
task, flip checkboxes, verify (pnpm tsc + eslint + browse quota wall + simulate Dodo
webhook monthly & annual). Stop on scope changes. On completion run Definition of Done:
update §E + memory (mark "v1 COMPLETE"), push, PR into staging. Then E2E verification
(spec §12) in a new chat.
```

---

### After p8 merges → v1 is live. Then (new chats, just-in-time plans):
- **E2E verification** across all phases (spec §12).
- **p8.5** — Chrome extension autofill (fast-follow). Ask me to write its plan first.
