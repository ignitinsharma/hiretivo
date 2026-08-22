# Browse → Drawer → Eager Resume — Tasks

> Branch: `feature/browse-eager-resume` from `staging`. Work task-by-task. Progress: Task 0 ✅ DONE … Task 15 ✅ DONE — Task 16 per-job Saved Jobs (no Apply All) pending.
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

#### TASK 5 — Job Lifecycle — `60d` Close + `48h` Unseen + `30d` Hard Delete (watch ATS, not blind age) — Hobby-safe ✅ DONE
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

#### TASK 6 — Job Type Policy — Remote + On-site, Tech-first Categories ✅ DONE (no code)
*   Keep `workType: REMOTE/HYBRID/ONSITE` `src/constants/enums.ts:131` + `locationClass: worldwide/us-only/emea/india/onsite` `line 139` — supports your ask "both remote-specific and in-country on-site" — expose both via `FilterChips` dropdowns
*   Phase 1 keep `meetsQualityBar` `src/lib/ats/filters.ts` as tech/product/design filter — required because `matchScore = (seeker ∩ job)/job` `CLAUDE.md:1.1` uses tech `Skill` catalogue `src/lib/ai/skill-catalog-extractor.ts`; non-tech jobs would get `score 0` and be excluded from matched feed `src/app/api/seeker/feed/route.ts:221`, only visible in `recentOffset` hybrid tail `line 143` with `0%` confusion
*   Phase 2 (later) — expand `Skill` catalogue for non-tech or show all categories with category pill and no match badge — don't onboard every type day one
*   Verify: feed contains both `REMOTE` and `ONSITE` with location badge `LOCATION_BADGE` `src/app/api/seeker/feed/route.ts:16`, category field `Job.category` indexed

---

#### TASK 7 — Rate Limits, Quotas, Verification Gates (edge coverage) ✅ DONE (no code, reuse existing)
*   Confirm every route has limiter: `applyRateLimiter` per IP for writes `POST /api/applications/route.ts:56`, `dataFetchRateLimiter` for reads `GET /api/applications:182` + `feedRateLimiter` `src/app/api/seeker/feed/route.ts:52`, `writeRateLimiter` per user `line 70`
*   Reuse `GenerationQuota` `prisma/schema.prisma:414` monthly counters — `tailorResume` already checks `quota_exceeded` `run-application-generation.ts:93` — map to `PaidFeatureModal` via `useUIStore.openPaidFeatureModal`
*   `touchLastActive` throttled 1h `src/lib/touch-last-active.ts` already in `GET /api/applications:180`, `GET /api/seeker/feed:95`, `GET /api/seeker/dashboard:23` — keeps `activeSeekers30d` accurate for admin stats
*   Verify: `401` unauth, `403` non-SEEKER or UNVERIFIED, `429` Rate limited, `409/422` handled in UI with toasts

---

#### TASK 8 — Verification Checklist (end-to-end, no code in this task) ✅ DONE (tsc/lint verified, manual pending deploy)
*   Run `pnpm exec tsc --noEmit` — zero errors
*   Run `pnpm lint` — zero errors in touched files
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

---

#### TASK 9 — Browse = All jobs (fix empty browse, Recommended stays matched) ✅ DONE
*   Create `GET /api/seeker/browse` `src/app/api/seeker/browse/route.ts` — every `OPEN` job ordered `publishedAt desc` (cursor base64 `{publishedAt,id}`), filterable by `jobType/workType/locationClass/visaSponsored/experienceLevel/q` (same `feedFilterSchema`), excludes `applied/dismissed` only, computes `matchScore` ad-hoc via `JobMatch` but **not filtered** — Browse shows all kinds, search works (Tsenta pattern)
*   Create `useBrowse` `src/hooks/use-browse.ts` infinite query `["browse", q, ...filters]` → `seekerService.getBrowseFeed` `/api/seeker/browse`, `PAGE_SIZE 10`, `stale 30s`
*   Add `seekerService.getBrowseFeed` `src/services/seeker.service.ts` alongside `getFeed`
*   Wire `BrowseJobGrid.tsx:29` `useBrowse` instead of `useFeed` — `Browse` now shows all `OPEN` regardless of `JobMatch` (fixes `No jobs found matching your criteria` when seeker has 0 skills), while `RecommendedJobsList.tsx` keeps `useFeed` matched flow (`/dashboard` Recommended stays skill-matched)
*   Rate limit `browseRateLimiter 30/min`, `touchLastActive`, `401/403/429` gates, cursor `publishedAt+id` pagination, `totalCount` for header
*   Verify: `/dashboard` shows matched only, `/dashboard/browse` shows all OPEN (even with 0 skills) + search/filters 200, `tsc` clean

---

#### TASK 10 — Dashboard: one row only (Tsenta Top job matches) ✅ DONE
*   Change `src/app/(app)/dashboard/page.tsx:44` `BrowseJobGrid` on dashboard to single-row horizontal scroll: wrap in `overflow-x-auto flex gap-4 pb-2 snap-x` with `scrollbar-none`, limit fetched `limit=5` (`useFeed({limit:5})` or `useBrowse` variant), no `Load more`, no grid multi-row
*   Keep `FreePlanBanner` + `ResumeParseBanner` + `ApplicationsTable` below; one row sits between them as before but now `Top job matches` header with `Browse jobs` link

---

#### TASK 11 — Card: random pastel palette + skeleton (Tsenta Image 2/3) ✅ DONE
*   Create `src/lib/jobs/pastel-colors.ts` with 5 reused pastels `["#E6F0FF","#E6FFF4","#F3E8FF","#FFF9E6","#FFE6E6"]` (blue/green/purple/yellow/pink) — `index % 5` deterministic, not random per render
*   New variant `PastelJobCard` (or `variant="pastel"` on `SeekerJobBaseCard.tsx:42` / `JobCard.tsx:56`) with pastel `bgColor` class, top `location • 4 days ago` + `77% MATCH` ring top-right, middle title + 3-4 skill pills, bottom `companyLogo+name` + `Pass (ghost pill) | Apply (black pill)`; Keep existing white `SeekerJobBaseCard` for detail use, pastel for Dashboard row + Browse grid (reuse)
*   Dashboard row uses pastel cards, Browse grid uses same pastel variant (reused palette) per your “add your own color choices … will be applied to browse jobs page too”
*   Skeleton `Image 2` parity: `src/components/shared/JobCardSkeleton.tsx` or `BrowseJobGrid` `isLoading` gray pill blocks matching pastel card shape (top line + circle, title block, 3 pills, footer logo+2 pills) — currently `Skeleton h-64` generic is replaced
*   Verify: ~390px row scrolls horizontally (no wrap), pastel reuse `i%5` stable across reloads with same order, `0% MATCH` still renders but pastel ensures `0%` not stark white

---

#### TASK 12 — Drawer: Apply button placement + description bullets ✅ DONE
*   `src/components/shared/JobDrawer.tsx:91` footer re-layout per Figma `Image 4/5`: bottom bar `border-t` with `left: View original posting (ghost + ExternalLink)` + `center: bookmark Save` + `right: Apply (black pill, w-auto, not hidden behind Chat widget)` — fix `z-index`/`pb` so `Apply` not under `Chat`; keep `Pass/Not Interested` row above or inside card as `Pass/Apply` pair — mirror Figma `Pass | Apply` bottom-right
*   Content: `DESCRIPTION` section bullet points — split `job.description` by `\n•|-` or new helper `splitDescriptionBullets(description): string[]` `src/lib/jobs/format-description.ts` — render important points as `<ul class="list-disc ml-4 space-y-1 text-sm">` with bold/regular per bullet; skills section unchanged (top pill row) — `SeekerJobBaseCard` facts already show `location/workType`
*   Keep `Cancel` as sheet close (X top-right); keep skills pill row at top

---

#### TASK 13 — Gate: replace verification with plan/tokens (no Get Verified) ✅ DONE
*   Remove `useVerificationStatus` gate from `JobDrawer.tsx:22` + `BrowseJobGrid.tsx:24` `hiretivo` checks + `POST /api/applications/ensure` `VerificationStatus.VERIFIED` gate `line 80`; keep `MasterResume` check
*   Use `useGenerationQuota()` `src/hooks/use-generation-quota.ts` — `allowed/limit/used/plan` — if `!allowed` or `plan===FREE && used>=limit` → `Apply` becomes `Upgrade Plan` (primary disabled with `Tooltip` “Upgrade plan” on hover) or swaps label to `Upgrade Plan` that opens `useUIStore.openPaidFeatureModal` (like `ResumeParseBanner` does); when `allowed` → normal `Apply/Generate Resume`
*   Update `ensure` route to check quota via `canGenerate`/`getQuota` instead of verification; map `quota_exceeded` to `PaidFeatureModal`
*   Remove `Get verified to generate` strings from drawer + `applyLockedLabel` logic

---

#### TASK 14 — Flow: Apply opens drawer, drawer Apply generates + removes card + infinite scroll ✅ DONE
*   `RecommendedJobsList.tsx` + `BrowseJobGrid.tsx` card `Apply` click: currently `handleApply` does `applyToJob→generate→redirect`; change to `onClick: setDrawerJobId(job.id)` — open drawer only (no generation yet)
*   Drawer `Apply` click: `ensureApplication(jobId)` → `generateResume(appId)` background (no redirect), toast `in progress` → `done` (already wired via `useApplicationStatus`), create `Application` with `pipelineStage:NOT_APPLIED` (so `All Applications` already works), then **optimistically remove** card from its source list: `queryClient.setQueryData(["browse"], remove id)` + `queryClient.setQueryData(["jobs"], remove id)` for Browse, and `queryClient.setQueryData(["jobs"], ...)` / `["seeker-dashboard-summary"]` for Recommended — so card disappears from that view instantly
*   If out of tokens → don't call `ensure`, show `Upgrade Plan` per Task 13

---

#### TASK 15 — Browse infinite scroll (replace Load more button) ✅ DONE

---

#### TASK 16 — Saved Jobs: per-job Apply only, handling lots (no Apply All) — pending
*   **CTA on Browse top:** `BrowseJobGrid.tsx` header right gap (`Filters + 44 jobs found` row) add `Bookmark Save Jobs (N)` `bg-white border-brand-border` + amber badge `N` from `useSavedJobs:1` `pages.flatMap length`; click → `openSavedJobsModal(true)` (if `src/app/**/saved/page.tsx` exists later, route will be added — modal is default)
*   **Modal `SavedJobsModal` (Image 2 minus Apply All):** `Dialog max-h-[85vh] sm:max-w-2xl rounded-xl p-0` with `DialogTitle sr-only Saved Jobs` (fixes `DialogContent requires a DialogTitle`) + header `Bookmark amber Save Jobs • N job(s) saved • X`; body `max-h-[50vh] overflow-y-auto` list of saved rows — pastel mint `bg-[#E6FFF4] index%5` variant with per-row right `Apply` black pill only (no global `Apply All`), plus row actions `→` (open `JobDrawer`), `↗` (`window.open externalApplyUrl`), `Bookmark orange` (unsave via `useUnsaveJob`); footer sticky `text Saved jobs are automatically removed when you apply…` plus when `N>10` right `View all saved jobs →` link to `/dashboard/saved`
*   **Page for lots `src/app/(app)/dashboard/saved/page.tsx`:** route `/(app)/dashboard/saved` header `Saved Jobs • N • Search company…` (`q` input) reusing same `GET /api/seeker/saved-jobs?cursor&limit=10&q` infinite query `["saved-jobs"]` already built; handles lots via `IntersectionObserver sentinel 400px` like `Browse` (`limit 10` + `nextCursor {createdAt,id}`), `PastelCardSkeleton w-full` while `isFetchingNextPage`; same per-row `Apply` calls `ensure→generate` → `toast in progress/done` → optimistic `remove from saved` via `setQueryData(["saved-jobs"])`; no batch
*   **Wire Save:** fix `JobDrawer center Save` no-op `JobDrawer.tsx:167` → `handleToggleSave(jobId)` using `savedJobIds.has(id)` `useSavedJobs` → `useSaveJob/useUnsaveJob` with `isSaving` spinner + `fill-current` orange when saved; same for `PastelJobCard Bookmark` on `Browse`/`TopJobRow` + `BrowseGrid onPass` already uses `dismissJob`; empty `N=0` → `No saved jobs yet — bookmark from Browse` + `Browse jobs →` link
*   **Fixes bundled:** add `DialogTitle sr-only` to `AddCustomJobModal` + new `SavedJobsModal` + `Apply` modal (fixes pasted `DialogContent requires a DialogTitle` warn); unify `DialogContent className="max-h-[85vh] sm:max-w-lg rounded-xl border border-brand-border bg-white p-6 overflow-y-auto"` across modals (Apply + Add Your Job); unify `AddYourOwnLinkCard` `p-4 flex-1 gap-3` with `PastelJobCard` height
*   `BrowseJobGrid.tsx:141` `Load more jobs` button → `IntersectionObserver` sentinel `src/modules/seeker/dashboard/components/RecommendedJobsList.tsx:169` pattern: `useRef sentinel` + `useEffect` `IntersectionObserver(rootMargin 400px)` → `fetchNextPage()` when `intersecting && hasNextPage && !isFetchingNextPage`
*   Keep button as hidden fallback (`sr-only` while `hasNextPage`), show `Loader2` spinner when `isFetchingNextPage`
*   Reuse same sentinel for future `Dashboard` one-row? Dashboard one-row has fixed 5, no scroll needed
*   Verify: scroll to bottom auto-loads next `10` `publishedAt` page, no click needed, `tsc` clean, 390px single column still loads on scroll
