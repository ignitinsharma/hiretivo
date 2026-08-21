# Browse → Drawer → Eager Resume — Tasks

> Branch: `feature/browse-eager-resume` from `staging`. Work task-by-task. Progress: Task 0 ✅ DONE, Task 1 ✅ DONE (71 companies), Task 2 ✅ DONE (drawer), Task 3 ✅ DONE (ensure), Task 4 ✅ DONE (status poll + download + mark applied), Tasks 5-8 pending.
> Prereq: `2026-08-04-ats-aggregation-relight-plan.md` is covered by Task 0. Browse was disabled (`src/app/(app)/dashboard/browse/page.tsx:3` redirects) — now re-enabled.

---

#### TASK 0 — Relight Foundation (reenable browse, fix feed) — Hobby-safe ✅ DONE
*   Create `src/app/api/cron/ats-fetch/_verify-cron-secret.ts` — verify `Authorization: Bearer {CRON_SECRET}`
*   Create 2 cron routes (Hobby limit = 2 crons max): `src/app/api/cron/ats-fetch/greenhouse/route.ts` (`15 9 * * *`) and `src/app/api/cron/ats-fetch/ashby-lever/route.ts` (`0 9 * * *`) — `ashby-lever` calls `fetchAndAutoClose(Ashby)` then `fetchAndAutoClose(Lever)` sequentially within one 60s invocation (Lever lightest at start, ~25 rows → stays <60s with cap 5 `line 246` + enrichment cap 20). Each acquires `cron-lock` per source → release → JSON counters
*   Update `vercel.json` — 2 crons `0 9 * * *` (ashby-lever) / `15 9 * * *` (greenhouse), remove stale `weekly-digest` — confirms fetching works for **all 70-80 companies** on Hobby without Pro; `ats-cleanup 00:30` (Task 5) runs via GitHub Actions `curl` to avoid 3rd Vercel cron (or piggybacked as tail of greenhouse cron) — also Hobby-safe
*   Add enrichment cap in `src/services/ats-job-fetcher.service.ts:46` `MAX_ENRICHMENTS_PER_RUN=20` + `resetEnrichmentCounter()` per run — prevents 60s Hobby overrun
*   Create `scripts/sync-ats-jobs.ts` manual sync for local verification
*   Fix `src/app/(app)/dashboard/browse/page.tsx:3` — remove `redirect`, render `<BrowseJobGrid />` `src/modules/browse/components/BrowseJobGrid.tsx:16`
*   Fix `src/components/layout/AppHeader.tsx:33,89` — remove `isDisabled` for browse nav, normal Link
*   Replace dashboard placeholder `src/app/(app)/dashboard/page.tsx:52-101` with `<BrowseJobGrid />` (keep `FreePlanBanner`, `ResumeParseBanner`, `ApplicationsTable`)
*   Enhance `src/components/shared/FilterChips.tsx` — dropdown for `options` filters (Location, Experience), binary toggle for `visaSponsored`; add `visaSponsored`, `experienceLevel` chips
*   Wire `ExperienceLevel` enum `src/constants/enums.ts` + `src/lib/ats/experience-extractor.ts` + 3 normalizers `ashby/greenhouse/lever.normalizer.ts:63` + `src/lib/validations/match.ts` + `src/app/api/seeker/feed/route.ts:119/139` + `src/hooks/use-feed.ts:10` / `src/services/seeker.service.ts:39`
*   Switch URL fetch to allowlist `src/lib/ai/jd-parser.ts:191` `isSupportedAtsDomain` (ashby/greenhouse/lever domains) + `AddCustomJobModal.tsx` auto-switch to Paste Description
*   Verify: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm tsx scripts/sync-ats-jobs.ts ashby` and `pnpm tsx scripts/sync-ats-jobs.ts ashby-lever` populates jobs with `visaSponsored`/`experienceLevel`, browse renders feed with match scores at ~390px + desktop — confirm both Hobby crons <60s
*   Note: `ats-job-fetcher.service.ts` confirms 1 fetch/company, cap 5 `line 246`, chunk 10 `line 14`, `max 400 raw → 80-120 after quality filter → 20-40 created/day` — ATS boards are free public JSON (no per-company billing), only Vercel execution seconds — fully covered on Hobby with this 2-cron split

---

#### TASK 1 — Company Registry Expansion — 70-80 US targets (Greenhouse/Lever/Ashby only) ✅ DONE
*   Curate 40 new rows to reach 70-80: ~25 Lever (currently 0) + ~15 Greenhouse, funded startups + scale-ups (validate each `boardToken` live via `fetchLever/Greenhouse/AshbyJobs` before commit — top 5 slice check)
*   Append to `COMPANY_REGISTRY` `src/lib/ats/registry.ts:12` — fields `name, website, ats, boardToken, logoUrl` — keep cap `slice(0,5)` `src/services/ats-job-fetcher.service.ts:246` + chunk 10 `line 14`
*   Document onboarding method in plan: add company = PR to `registry.ts` (code-reviewed); delete/pause = row in `AtsBlocklist` `prisma/schema.prisma:316` — `fetchAndUpsertSource:229` skips `blockedNames`, `closeBlockedCompanyJobs` closes OPEN jobs, no deploy needed
*   Handle edge: duplicate name guard `registry.ts:63`, zero-jobs warn `ats-job-fetcher.service.ts:249`, per-company error `companyErrors` map `line 253` prevents false stale close
*   Verify: `pnpm tsx scripts/sync-ats-jobs.ts lever`, `pnpm tsx scripts/sync-ats-jobs.ts greenhouse` — counts `fetched/created/closed` logged, `tsc --noEmit` clean

---

#### TASK 2 — Drawer UX — `Generate Resume` + `Cancel` (Tsenta screenshot 2 parity) ✅ DONE
*   Modify `src/components/shared/JobDrawer.tsx:27` — keep `Sheet` `sm:max-w-lg`; header title/company + `MatchRing` `line 65`; facts `locationClass/workType/experienceLevel/applicantCount` `src/components/shared/SeekerJobBaseCard.tsx:114`; `skills` + `description` + `missingSkillsHint`
*   Replace footer `View Original + Apply` `JobDrawer.tsx:92-111` with `Cancel (ghost, closes drawer)` + `Generate Resume (primary)` — state machine `idle → GENERATING → READY → FAILED` — when `READY` footer swaps `Generate Resume` → `Download Resume (primary)` + `Open in new tab (secondary)` + `I have applied (ghost)`
*   Keep `BrowseJobGrid.tsx:66` `SearchBar` + `FilterChips` + `JobCard` grid `1/2/3/4 col` `line 92`; card click `handleCardClick:60` opens drawer without triggering generate
*   Gate `Generate Resume` when unauth → show `LoginModal` (browse public per `CLAUDE.md:1.1`) — no generation
*   Gate when `verificationStatus !== VERIFIED` `src/app/api/applications/route.ts:80` — disable button, show `applyLockedLabel` logic `src/modules/seeker/dashboard/components/RecommendedJobsList.tsx:104` (`Get verified to apply` / `Verification pending` / `Fix profile`), keep `Open in new tab` enabled if `externalApplyUrl` exists
*   Gate when no `MasterResume` `src/app/api/applications/[id]/generate/route.ts:37` — disable, toast `Upload resume in Settings` with link to `/settings`
*   Hide `Open in new tab` when `job.externalApplyUrl` null; handle `publishedAt` null → `Recently` `src/app/api/seeker/feed/route.ts:73`
*   Verify: ~390px (footer stacks, facts collapse), `hover:bg-brand-surface`, no shadows/borders per `DESIGN.md:5`, `aria-label` on icon buttons

---

#### TASK 3 — Idempotent Ensure + Eager Background Generation (toast-only, no redirect) ✅ DONE
*   Create `POST /api/applications/ensure` — body `{ jobId }` — steps mirror `POST /api/applications` `src/app/api/applications/route.ts:54` but idempotent:
  *   IP apply limiter `applyRateLimiter:56` + user write limiter `writeRateLimiter:70`
  *   `auth()` `62` → `401`, `SEEKER` role `66` → `403`, `VERIFIED` gate `80` → `403` with actionable message
  *   `prisma.job.findFirst({id:jobId, status:OPEN})` `106` → `404` if closed
  *   Check `Application.findUnique({jobId_seekerId})` `114` — if exists return `{id}` `200` (not `409`), else fetch `SeekerProfile.resumeKey` `131` → `400` if missing, compute `matchScore` from `JobMatch` `141` → `prisma.application.create({jobId, seekerId, status:APPLIED, pipelineStage:NOT_APPLIED, matchScore})` `152` → `{id}` `201`
*   Add `applicationService.ensureApplication(jobId)` `src/services/application.service.ts:28` alongside `applyToJob`
*   In `BrowseJobGrid.tsx:42` `handleGenerate(jobId)` and `JobDrawer.tsx` `onGenerate` — call `ensureApplication` → `generateResume(id)` `src/services/application.service.ts:33` → `POST /api/applications/{id}/generate` `src/app/api/applications/[id]/generate/route.ts:17` which sets `automationStatus:GENERATING, generationStartedAt, runId` `line 73-81` then `dispatchGenerationJob(message, request.url)` `src/lib/generation/dispatch-generation.ts:25` (QStash prod `publishGenerationJob`, inline `runApplicationGeneration` dev)
*   Immediately toast `Resume generation in progress` `sonner`, keep drawer open, allow browsing — store `generatingJobIds: Set<string>` in `use-ui-store.ts` to show spinner on card + disable duplicate `Generate Resume`
*   Handle edge duplicate: if `automationStatus===GENERATING` `route.ts:69` return `202` — treat as success, keep polling, no re-enqueue
*   Handle edge `wordCount<5` `route.ts:65` → `422 jd_too_short` — toast `Job description too short to tailor`
*   Handle edge `quota_exceeded/rate_limited/ai_error` `src/lib/generation/run-application-generation.ts:93` — `FAILED` reason surfaced to status endpoint, drawer shows banner + `PaidFeatureModal` for quota
*   Verify: `tsc --noEmit`, repeat click doesn't double-charge quota, verified vs unverified flows

---

#### TASK 4 — Polling, Download, `Open in new tab` + `I have applied` → Tracker ✅ DONE
*   Create lightweight `GET /api/applications/{id}/status` — `auth` → select `{automationStatus, failureReason, activeVersionId, generationStartedAt}` + call `resolveAutomationStatus` `src/lib/generation/automation-status.ts:21` (stale `GENERATING > GENERATION_TIMEOUT_MS=5m` `line 4` flips to `FAILED`)
*   Create hook `src/hooks/use-application-status.ts` — `useQuery(['app-status',id], statusFetch, {refetchInterval: GENERATING?3000:false})`, pause on `document.visibilitychange` hidden, manual `retry` clears `FAILED`
*   `JobDrawer.tsx` consumes hook — footer `Generate Resume` → `GENERATING` spinner disabled, `READY` → swaps to `Download Resume (primary)` + `Open in new tab (secondary, window.open(externalApplyUrl,'_blank','noopener,noreferrer'))` + `I have applied (ghost)`
*   `Download Resume` → `GET /api/applications/{id}/download` (new) — `prisma.application.findFirst({id,seekerId})` → latest `ResumeVersion.resumeJson` via `activeVersionId` + `enrichWithProfileLinks` `src/app/api/applications/[id]/route.ts:251` merging current `SeekerProfile.linkedinUrl/githubUrl/websiteUrl` → existing PDF renderer (via `styleConfig`) → `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="Resume-{company}-{title}.pdf"` — one click, no preview page
*   `I have applied` → `PATCH /api/applications/{id}` `src/app/api/applications/[id]/route.ts:215` `{action:'mark_applied'}` → sets `automationStatus:SUBMITTED, pipelineStage:APPLIED` → `toast success` → `queryClient.invalidateQueries(['applications'])` → `KanbanBoard.tsx` moves card `NOT_APPLIED → APPLIED`
*   If user generated but never clicked `I have applied` → row stays `NOT_APPLIED` column — per your decision, **no tracker entry in Applied** — not auto-promoted
*   Edge: `externalApplyUrl` opens independently of `READY` — download and external apply are decoupled; `resolveAutomationStatus` timeout shows `Failed — retry` button; `activeVersion` null before first success → Download disabled
*   Verify: poll stops at `READY/FAILED`, download always reflects current `linkedinUrl/githubUrl` without regenerating, tracker move visible at ~390px + desktop

---

#### TASK 5 — Job Lifecycle — `60d` Close + `48h` Unseen + `30d` Hard Delete (watch ATS, not blind age) — Hobby-safe
*   Keep `autoCloseStaleJobs` `src/services/ats-job-fetcher.service.ts:552`:
  *   `lastSeenAt < now-48h` `line 566` → `CLOSED` — authoritative ATS signal (job disappeared from board); scoped per `AtsSource`, skipped for `companyErrors` companies to avoid false close on outage
  *   `publishedAt < now-60d` `line 578` → `CLOSED` — freshness cap even if ATS still lists (zombie evergreen roles); scoped per source, excludes `erroredCompanies`
  *   Both do orphan `JobSkill.deleteMany` + `JobMatch.deleteMany` `line 602` for just-closed ids
*   Create `src/app/api/cron/ats-cleanup/route.ts` `00:30 daily` — triggered via **GitHub Actions** `curl -H "Authorization: Bearer $CRON_SECRET" https://hiretivo.com/api/cron/ats-cleanup` (avoids 3rd Vercel cron, Hobby-safe) or piggybacked as tail of greenhouse cron if you prefer 2 crons only — verify `CRON_SECRET` via shared helper — `prisma.job.deleteMany({ where: { status:CLOSED, closedAt:{lt: subDays(now,30)}, applications:{none:{}} } })` then delete orphan `JobSkill/JobMatch` for those ids — jobs with any `Application` (any tracker stage) never hard-deleted, history preserved
*   Total max life: `60d live + 30d closed = 90d`, or `48h unseen + 30d`
*   Edge: closed job reappears on ATS `ats-job-fetcher.service.ts:352` `companyName|title` lookup → reopens `CLOSED → OPEN`, rewrites `description`, `descriptionHash`, skills, recomputes `JobMatch` `recomputeJobMatchesForJobs:498` — id not duplicated
*   Edge: `CHUNK_SIZE=10`, `cap 5/company`, `lastSeenAt` batch `updateMany` `line 475` only for non-errored `dedupeKeys`
*   Add admin touch `touchLastActive` not needed here — just ATS crons
*   Verify: `pnpm tsx scripts/sync-ats-jobs.ts all` → stale close counts log, `prisma.job.count({where:{status:'CLOSED'}})` before/after cleanup, tracker history still renders

---

#### TASK 6 — Job Type Policy — Remote + On-site, Tech-first Categories
*   Keep `workType: REMOTE/HYBRID/ONSITE` `src/constants/enums.ts:131` + `locationClass: worldwide/us-only/emea/india/onsite` `line 139` — supports your ask "both remote-specific and in-country on-site" — expose both via `FilterChips` dropdowns
*   Phase 1 keep `meetsQualityBar` `src/lib/ats/filters.ts` as tech/product/design filter — required because `matchScore = (seeker ∩ job)/job` `CLAUDE.md:1.1` uses tech `Skill` catalogue `src/lib/ai/skill-catalog-extractor.ts`; non-tech jobs would get `score 0` and be excluded from matched feed `src/app/api/seeker/feed/route.ts:221`, only visible in `recentOffset` hybrid tail `line 143` with `0%` confusion
*   Phase 2 (later) — expand `Skill` catalogue for non-tech or show all categories with category pill and no match badge — don't onboard every type day one
*   Verify: feed contains both `REMOTE` and `ONSITE` with location badge `LOCATION_BADGE` `src/app/api/seeker/feed/route.ts:16`, category field `Job.category` indexed

---

#### TASK 7 — Rate Limits, Quotas, Verification Gates (edge coverage)
*   Confirm every route has limiter: `applyRateLimiter` per IP for writes `POST /api/applications/route.ts:56`, `dataFetchRateLimiter` for reads `GET /api/applications:182` + `feedRateLimiter` `src/app/api/seeker/feed/route.ts:52`, `writeRateLimiter` per user `line 70`
*   Reuse `GenerationQuota` `prisma/schema.prisma:414` monthly counters — `tailorResume` already checks `quota_exceeded` `run-application-generation.ts:93` — map to `PaidFeatureModal` via `useUIStore.openPaidFeatureModal`
*   `touchLastActive` throttled 1h `src/lib/touch-last-active.ts` already in `GET /api/applications:180`, `GET /api/seeker/feed:95`, `GET /api/seeker/dashboard:23` — keeps `activeSeekers30d` accurate for admin stats
*   Verify: `401` unauth, `403` non-SEEKER or UNVERIFIED, `429` Rate limited, `409/422` handled in UI with toasts

---

#### TASK 8 — Verification Checklist (end-to-end, no code in this task)
*   Run `pnpm exec tsc --noEmit` — zero errors
*   Run `pnpm lint` — zero errors in touched files
*   Run `pnpm tsx --test src/lib/__tests__/*.test.ts` — included `jd-parser-allowlist`, `experience-extractor` pass
*   Run `pnpm tsx scripts/sync-ats-jobs.ts ashby` and `lever`/`greenhouse` — each <60s, counts logged
*   Manual `pnpm dev`:
  1. `/dashboard/browse` renders `BrowseJobGrid` with real jobs, match rings, company logos, infinite scroll
  2. Filters `Location/Experience/Visa sponsored` dropdowns send real enum values, network 200 not 400
  3. Drawer opens, unverified disables `Generate Resume`, verified enables it
  4. Click `Generate Resume` → toast `in progress`, browse other jobs, poll spinner, completion toast `done`, `Download Resume` enabled — file downloads with current profile links
  5. `Open in new tab` opens `externalApplyUrl`, `I have applied` moves `NOT_APPLIED → APPLIED` in `KanbanBoard`
  6. Generate-but-not-applied stays `NOT_APPLIED` column — not in `APPLIED`
  7. Mobile 390px: grid 1 col, chips scroll, drawer full-width, footer stacks
*   Check cron logs: Hobby 2-cron stagger 09:00 (ashby-lever) / 09:15 (greenhouse) no overlap via `cron-lock.ts`, `ats-cleanup` via GitHub Actions 00:30 deletes only `CLOSED>30d` without applications, tracker history intact
*   Confirm all 70-80 companies fetched daily on Hobby — no Pro needed, no per-company cost (public ATS JSON), execution ~50s/day total
