# Phase 14: Recruiter Analytics Dashboard — Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 14 adds a hiring funnel analytics tab to `/recruiter/pipeline`. Recruiters see ROI metrics (credits spent → hires) and conversion rates across pipeline stages. FREE plan sees a locked tab with upgrade CTA.

**In scope:**
- Restore deleted pipeline kanban files from git history (PipelineBoard, PipelineCard, page.tsx, API routes)
- Add "Analytics" tab alongside existing "Pipeline" kanban tab
- Funnel counts + conversion % per stage (Unlocked → Applied → Reviewing → Interview → Offer → Hired)
- Credits used (EngineerUnlock count) vs quota remaining (from plan tier)
- Top 5 skills across unlocked engineers
- `GET /api/recruiter/analytics` new route, rate-limited with dataFetchRateLimiter (30/min)
- FREE plan: locked Analytics tab with upgrade modal (Phase 8 paid gate pattern)

**Out of scope:**
- Avg days per stage (dropped — no per-stage timestamp data in Application model)
- Date range filtering / time period selector
- Per-job analytics (that's the existing `/api/recruiter/jobs/[id]/analytics`)

</domain>

<decisions>
## Implementation Decisions

### Pipeline Restoration
- **D-01:** Restore the 4 deleted pipeline files from git history (commits `361d05b` + `c04dfde`):
  - `src/app/recruiter/pipeline/page.tsx`
  - `src/app/recruiter/pipeline/PipelineBoard.tsx`
  - `src/app/recruiter/pipeline/PipelineCard.tsx`
  - `src/app/api/recruiter/pipeline/route.ts`
  - `src/app/api/recruiter/application/[id]/status/route.ts`
- **D-02:** Restore as-is (no kanban redesign). Verify they work, then add Analytics tab on top.

### Avg Days Per Stage
- **D-03:** Skip entirely. Application model has no per-stage timestamps. Show funnel counts + conversion % only. No `ApplicationStatusHistory` schema addition.

### Analytics Time Period
- **D-04:** All-time scope. Aggregate all applications for the recruiter regardless of date. No date range filter.

### FREE Plan Treatment
- **D-05:** Analytics tab visible to all plan tiers but FREE plan sees a locked state with upgrade CTA modal — same Phase 8 paid gate pattern used for talent pool and interview scheduling.

### Funnel Stage Mapping
- **D-06 (Claude's discretion):** Map ROADMAP funnel to actual ApplicationStatus values:
  - Unlocked = EngineerUnlock count for recruiter
  - Applied = APPLIED status count
  - Reviewing = REVIEWING status count
  - Interviewing = INTERVIEW status count
  - Offered = OFFER status count
  - Hired = HIRED status count
  Conversion % at each step = stage_count / previous_stage_count × 100.

### API Route
- **D-07:** New `GET /api/recruiter/analytics` (not namespaced under jobs). Returns: funnel stages with counts + conversion %, credits used, credits remaining, top 5 skills. Rate-limited with existing `dataFetchRateLimiter` (30/min).

### Recharts
- **D-08 (Claude's discretion):** Reuse Recharts (already installed, used in `JobAnalyticsTab.tsx`). No new charting library.

### Credits / Quota
- **D-09 (Claude's discretion):** Credits used = `EngineerUnlock.count` for `recruiterId = session.user.id`. Quota remaining = plan tier limit minus credits used. Plan tier from session or RecruiterProfile.

### Top Skills
- **D-10 (Claude's discretion):** Top 5 skills = most frequent skill strings across EngineerUnlock → User → SeekerProfile → SeekerSkill join for this recruiter.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase dependencies
- `.planning/phases/12-ai-review-feedback/12-VERIFICATION.md` — Confirms pipeline kanban files were built and verified (line 86-89, 134); also shows original API route structure
- `.planning/ROADMAP.md` — Phase 14 success criteria at `### Phase 14: Recruiter Analytics Dashboard`

### Existing patterns to follow
- `src/modules/recruiter/jobs/components/JobAnalyticsTab.tsx` — Existing Recharts-based analytics component pattern to follow
- `src/modules/recruiter/jobs/queries/use-fetch-analytics.ts` — TanStack Query pattern for analytics
- `src/modules/recruiter/jobs/types/analytics.types.ts` — Analytics response type pattern
- `src/app/api/recruiter/jobs/[id]/analytics/route.ts` — Existing analytics API route pattern
- `src/app/api/recruiter/applications/stats/route.ts` — Application stats aggregation pattern
- `src/lib/rate-limit.ts` — `dataFetchRateLimiter` (30/min) — use this for new analytics route
- `src/lib/application-pipeline.ts` — `APPLICATION_STAGE_ORDER`, `getStageLabel` utilities

### Deleted files to restore from git
Restore these exact files from git history (commit `361d05b` + `c04dfde`):
- `src/app/recruiter/pipeline/page.tsx`
- `src/app/recruiter/pipeline/PipelineBoard.tsx`
- `src/app/recruiter/pipeline/PipelineCard.tsx`
- `src/app/api/recruiter/pipeline/route.ts`
- `src/app/api/recruiter/application/[id]/status/route.ts`

### Paid gate pattern
- `.planning/phases/08-paid-workflows-account-completion/08-CONTEXT.md` — Shared upgrade modal pattern for FREE plan gates

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `JobAnalyticsTab.tsx` — Full Recharts bar chart + metric cards pattern, reuse for funnel visualization
- `useFetchAnalytics` + `recruiterService.getJobAnalytics` — TanStack Query pattern for analytics data
- `dataFetchRateLimiter` in `src/lib/rate-limit.ts` — Apply to new `/api/recruiter/analytics` route
- `APPLICATION_STAGE_ORDER` and `getStageLabel` in `src/lib/application-pipeline.ts` — Stage ordering and labels
- Shared upgrade modal from Phase 8 — Apply to FREE plan gate on Analytics tab
- `ChartContainer`, `ChartTooltip` from `@/components/ui/chart` — Already-wired shadcn chart primitives

### Established Patterns
- Analytics API: auth check → role check → rate limit → query → typed response
- TanStack Query with `staleTime: 5 * 60 * 1000` for analytics data
- Metric cards: `bg-white rounded-xl border border-brand-border p-5` pattern
- Tab pattern: use shadcn Tabs component (used elsewhere in recruiter module)

### Integration Points
- New `/recruiter/pipeline` will have two tabs: `Pipeline` (restored kanban) + `Analytics` (new)
- New `GET /api/recruiter/analytics` route lives alongside existing recruiter API routes
- `EngineerUnlock` model → credits used query; plan tier → quota from user/recruiterProfile
- `Application` model grouped by status → funnel counts; `prisma.application.groupBy` or multiple counts

</code_context>

<specifics>
## Specific Ideas

- Funnel should show absolute counts AND conversion % between stages (e.g., "12 Unlocked → 8 Applied (67%)")
- FREE plan: Analytics tab is visible in the tab bar, but clicking it shows lock state — consistent with how talent pool and interview scheduling behave

</specifics>

<deferred>
## Deferred Ideas

- Avg days per stage — requires `ApplicationStatusHistory` table (new schema migration); deferred to a future analytics enhancement phase
- Date range selector (30d / 90d / All-time) — deferred; all-time sufficient for v1
- Per-job analytics on the pipeline page — already exists at `/recruiter/jobs/[id]` analytics tab

</deferred>

---

*Phase: 14-recruiter-analytics-dashboard*
*Context gathered: 2026-05-26*
