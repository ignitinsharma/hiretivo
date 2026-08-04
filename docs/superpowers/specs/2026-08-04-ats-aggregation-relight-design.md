# Spec — ATS Aggregation: Re-light the Foundation

## Problem
Hiretivo has a mostly-built ATS job aggregation pipeline that is **switched off**:
- 3 normalizers (Ashby, Greenhouse, Lever) and a full fetcher service exist but no ingestion crons are registered in `vercel.json` (only weekly digest).
- Browse UI (`BrowseJobGrid`) with search, filters, infinite scroll, and job drawer is fully built but `/dashboard/browse` redirects to `/dashboard`; nav shows a "Soon" badge; dashboard shows a "Coming soon" placeholder.
- The homepage is "paste a link" first, not "browse real jobs" first.
- The "Add your own" URL flow uses a **negative blocklist** (`isUnsupportedAtsDomain`) that silently fails on JS-heavy ATS instead of a positive allowlist.

This spec re-lights the foundation: wire ingestion, re-enable browse, switch to an allowlist, and add the three initial browse filters (Location, Experience, Visa sponsorship).

## Market
**US only.** Registry stays focused on US/global remote-first companies using Ashby/Greenhouse/Lever. No Indian employer feed — ATS is not the dominant application channel in India. Indian job seekers applying to global remote roles are served by the existing `locationClass` classification (worldwide/us-only) and region filter.

## Constraints (Vercel Hobby)
- Cron: once per day max (sub-daily requires Pro).
- Function duration: 60s max.
- Memory: 1024MB max.
- No browser runtime (Playwright off the table — deferred to a future infra upgrade).

---

## 1. Ingestion scheduling

### What exists
- `fetchAndAutoClose(source: AtsSource)` — per-source fetch+upsert+stale-close, designed for per-source cron endpoints with +15min/+30min offsets (comment at `ats-job-fetcher.service.ts:183`).
- `cron-lock.ts` — Redis lock prevents concurrent execution for the same source.
- `COMPANY_REGISTRY` — 39 companies: 24 Ashby + 15 Greenhouse + 0 Lever.
- Per-company: 1 API call, capped at 5 most recent jobs, chunked 10-parallel.
- `enrichJobSkills` — LLM skill enrichment for jobs with <3 deterministically-extracted skills (the timing wildcard).

### Changes

**1a. Three daily crons in `vercel.json`** (staggered to avoid overlap and respect 60s limit):
```json
{ "path": "/api/cron/ats-fetch/ashby", "schedule": "0 9 * * *" },
{ "path": "/api/cron/ats-fetch/greenhouse", "schedule": "15 9 * * *" },
{ "path": "/api/cron/ats-fetch/lever", "schedule": "30 9 * * *" }
```
Each cron route calls `fetchAndAutoClose(source)`. Estimated runtime per source: 15-30s (39 companies / 3 sources, 5-job cap, 10-parallel chunks). Well within 60s.

**1b. Three cron route files** (`src/app/api/cron/ats-fetch/[source]/route.ts` or three static files):
- `src/app/api/cron/ats-fetch/ashby/route.ts`
- `src/app/api/cron/ats-fetch/greenhouse/route.ts`
- `src/app/api/cron/ats-fetch/lever/route.ts`
Each: acquire cron-lock → call `fetchAndAutoClose(source)` → release lock → return counters. Auth via `CRON_SECRET` header (Vercel cron sends `Authorization: Bearer {CRON_SECRET}`).

**1c. Admin on-demand trigger** (`POST /api/admin/ats-fetch/:source`):
- Same `fetchAndAutoClose(source)` call, gated by `isAdmin` session check.
- For manual refresh without waiting for the daily cron.

**1d. Skill enrichment safety valve:**
- In `enrichJobSkills`, skip enrichment if the current batch has >20 new jobs needing enrichment. Prevents LLM calls from pushing a single cron run past 60s. Enrichment catches up on the next daily run when the batch is smaller.

**1e. Lever registry:**
- Lever cron runs but fetches 0 jobs (no companies registered). This is intentional — the cron infrastructure is in place; adding Lever companies to `COMPANY_REGISTRY` is a follow-up task when a company list is available.

---

## 2. Re-enable Browse

### Changes

**2a. `/dashboard/browse` page** (`src/app/(app)/dashboard/browse/page.tsx`):
- Remove `redirect("/dashboard")`.
- Render `<BrowseJobGrid />` (already built — search, filters, infinite scroll, job drawer, apply flow).

**2b. Nav "Soon" badge** (`src/components/layout/AppHeader.tsx:33,89`):
- Remove the `isDisabled` check for `/dashboard/browse`.
- Browse jobs becomes a normal clickable nav item.

**2c. Dashboard default** (`src/app/(app)/dashboard/page.tsx`):
- Replace the "Recommended jobs — Coming soon" placeholder section (lines 52-101) with `<BrowseJobGrid />`.
- The "Add your own" dashed card stays as the secondary entry point (paste a URL or description).
- `ApplicationsTable` stays below the feed.

**2d. Homepage** — no change to hero. Browse is accessible via nav and dashboard. The homepage hero ("Paste any job link") remains the public-facing entry point for unauthenticated visitors; browse is the authenticated user's default.

---

## 3. URL allowlist for "Add your own"

### What exists
- `isUnsupportedAtsDomain(url)` in `jd-parser.ts:198` — negative blocklist: blocks Workday, Taleo, SuccessFactors, iCIMS. Everything else passes through, including ATS we can't actually fetch.
- `AddCustomJobModal.tsx` — two tabs: "Paste URL" and "Paste Description". On unsupported URL, currently sets `unsupportedAts` state and shows a warning.

### Changes

**3a. Positive allowlist** in `jd-parser.ts`:
- Replace `isUnsupportedAtsDomain` with `isSupportedAtsDomain(url): boolean`.
- Allowlist of domains we can server-render and fetch:
  - `jobs.ashbyhq.com` (Ashby)
  - `boards.greenhouse.io` (Greenhouse)
  - `jobs.lever.co` (Lever)
- The other 11 "supported" ATS in `AddCustomJobModal` (Paylocity, PinpointHQ, Recruitee, SmartRecruiters, Breezy HR, Rippling, Zoho Recruit, Keka, Freshteam, greytHR, Zimyo) — verify per-source whether posting pages are server-rendered. If yes, add to allowlist. If no (JS-rendered), exclude and rely on paste-description fallback.
- Export `isSupportedAtsDomain` from `jd-parser.ts`; update import in `from-link/route.ts`.

**3b. Graceful fallback in `AddCustomJobModal.tsx`:**
- When URL is not in the allowlist → auto-switch to "Paste Description" tab.
- Show info message: "We can't auto-fetch from this site yet — paste the description and we'll do the rest."
- Keep the SUPPORTED_ATS logo grid as a visual reference (shows which ATS we can auto-fetch).

---

## 4. Filters (assigned at fetch, filterable in UI)

Three filters: **Location**, **Experience**, **Visa sponsorship**.

### 4a. Location — extraction done, UI dropdown broken

| Layer | Status | File |
|---|---|---|
| Extraction | Done — `locationClass` + `workType` classified in normalizers | `ashby/greenhouse/lever.normalizer.ts` |
| DB field | Done — `locationClass: String?`, `workType: WorkType?` | `schema.prisma` |
| Server filter | Done — `feedFilterWhere.locationClass` | `feed/route.ts:136` |
| Zod schema | Done — `locationClass` in `feedFilterSchema` | `match.ts:9` |
| Client type | Done — `locationClass` in `FeedFilters` | `use-feed.ts:14` |
| UI | **Broken** — chip only toggles `locationClass=locationClass` (key string), not an enum value → server returns 400 on enum validation | `FilterChips.tsx:14` |

**No changes to Location itself.** The fix is in the shared `FilterChips` dropdown enhancement (section 4d).

### 4b. Visa sponsorship — 2 small client edits

| Layer | Status | File |
|---|---|---|
| Extraction | Done — `detectVisaSponsorship(description)` | `visa-extractor.ts` |
| DB field | Done — `visaSponsored: Boolean @default(false)` | `schema.prisma:288` |
| Server filter | Done — `feedFilterWhere.visaSponsored = true` | `feed/route.ts:137` |
| Zod schema | Done — `visaSponsored: z.coerce.boolean().optional()` | `match.ts:12` |
| Client type | **Missing** — not in `FeedFilters` | `use-feed.ts` |
| UI | **Missing** — not in `FilterChips` | `FilterChips.tsx` |

**Changes:**
- `src/hooks/use-feed.ts`: add `visaSponsored?: boolean` to `FeedFilters` interface. Add to query key.
- `src/components/shared/FilterChips.tsx`: add `{ key: "visaSponsored", label: "Visa sponsored" }` to `DEFAULT_FILTERS`. Boolean toggle — the existing chip toggle pattern (`handleClick` toggles between `key` and `undefined`) works as-is for boolean filters since the server checks `if (visaSponsored) feedFilterWhere.visaSponsored = true`.

### 4c. Experience — full chain (new)

| Layer | Status | File |
|---|---|---|
| Extraction | **Missing** — field exists but never populated | — |
| DB field | Done — `experienceLevel: String?` | `schema.prisma:266` |
| Server filter | **Missing** — not in `feedFilterWhere` | `feed/route.ts` |
| Zod schema | **Missing** — not in `feedFilterSchema` | `match.ts` |
| Client type | **Missing** — not in `FeedFilters` | `use-feed.ts` |
| UI | **Missing** — not in `FilterChips` | `FilterChips.tsx` |

**Changes:**

**4c-1. New file `src/lib/ats/experience-extractor.ts`** (pattern from `visa-extractor.ts`):
- Export `detectExperienceLevel(title: string, description: string): ExperienceLevel | null`.
- Text-matching on title first (strongest signal), then description:
  - **ENTRY**: "junior", "entry", "entry-level", "new grad", "0-2 years", "1+ years"
  - **MID**: "mid", "intermediate", "2+ years", "3+ years", "4+ years"
  - **SENIOR**: "senior", "sr.", "5+ years", "6+ years", "7+ years"
  - **LEAD**: "lead", "staff", "principal", "8+ years", "10+ years", "manager", "head of"
- Title match takes priority over description match (title is the canonical signal).
- Return `null` if no signal found (job shows with no experience filter assigned).

**4c-2. Enum in `src/constants/enums.ts`:**
```ts
export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}
```
Export `EXPERIENCE_LEVEL_VALUES` array (pattern from `JOB_TYPE_VALUES`).

**4c-3. Normalizers** — call `detectExperienceLevel` in all 3 normalizers at the same insertion point as `detectVisaSponsorship`:
- `ashby.normalizer.ts:63` area
- `greenhouse.normalizer.ts:60` area
- `lever.normalizer.ts:69` area
- Store result in `NormalizedJob.experienceLevel` (field already exists in the interface at `ats-job-fetcher.service.ts:94`).

**4c-4. Zod schema** (`src/lib/validations/match.ts`):
- Add `experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES).optional()` to `feedFilterSchema`.

**4c-5. Server filter** (`src/app/api/seeker/feed/route.ts`):
- Destructure `experienceLevel` from `parsed.data` (line 116 area).
- Add `if (experienceLevel) feedFilterWhere.experienceLevel = experienceLevel;` (after line 137).

**4c-6. Client type** (`src/hooks/use-feed.ts`):
- Add `experienceLevel?: string` to `FeedFilters`. Add to query key.

**4c-7. UI** (`src/components/shared/FilterChips.tsx`):
- Add `{ key: "experienceLevel", label: "Experience", options: ["ENTRY", "MID", "SENIOR", "LEAD"] }` to `DEFAULT_FILTERS`.
- Uses the dropdown enhancement from section 4d.

---

### 4d. FilterChips dropdown enhancement (shared, needed for 4a + 4c)

**Problem:** `FilterChips.tsx` defines `options` in `FilterDef` but `handleClick` ignores it — toggles between `key` (string) and `undefined`. For enum filters (`locationClass`, `experienceLevel`), the client sends `?locationClass=locationClass` which fails Zod enum validation → 400. The `options` field and dropdown chevron icon were intended for a dropdown but never implemented. This was never caught because browse was disabled.

**Changes to `src/components/shared/FilterChips.tsx`:**

1. **When `filter.options` is present → render a dropdown** (Popover from `@/components/ui/popover` if available, else a simple absolute-positioned menu):
   - Clicking the chip opens a menu listing each option.
   - Selecting an option calls `onFilterChange(key, value)` with the actual enum value (e.g., `"SENIOR"`, `"worldwide"`).
   - Selecting the active option again closes the menu without change.
   - Active state: chip shows the selected label (e.g., "Experience: Senior") instead of just "Experience".

2. **When `filter.options` is absent → keep existing binary toggle** (for `visaSponsored`, `jobType` if used as toggle):
   - `handleClick` toggles between `key` and `undefined` (current behavior, unchanged).

3. **Update `onFilterChange` call site in `BrowseJobGrid.tsx`** — `handleFilterChange(key, value)` already accepts `string | undefined`, so no change needed there. The value just needs to be the real enum string, not the key.

---

## 5. Verification

### Ingestion
- Run `fetchAndAutoClose('ashby')` manually via admin trigger → confirm jobs populate in DB with `visaSponsored` and `experienceLevel` assigned.
- Check Vercel cron logs: each source completes in <60s, no overlaps (cron-lock works).

### Browse
- `/dashboard/browse` renders `BrowseJobGrid` with real jobs, match scores, infinite scroll.
- Filters work: Location (existing), Visa sponsored (new chip), Experience (new chip) — each narrows the feed correctly.
- Job drawer opens, apply flow works (creates application, generates resume, redirects to tracker).
- Mobile layout at ~390px: grid collapses to 1 column, filters scroll horizontally, search is full-width.

### URL allowlist
- Paste a Greenhouse/Ashby/Lever URL → fetch works, preview shows extracted details.
- Paste a Workday/Taleo URL → auto-switches to "Paste Description" tab with info message.
- Paste a non-job URL → same fallback.

### Type/lint
- `pnpm exec tsc --noEmit` — no errors.
- `pnpm lint` — no errors.

---

## Reused (nothing new to build)
- `fetchAndAutoClose(source)` — existing per-source fetch function.
- `cron-lock.ts` — existing Redis lock.
- `BrowseJobGrid` — existing browse UI with search, filters, grid, drawer.
- `useFeed` hook + `/api/seeker/feed` — existing feed API with match scoring.
- `detectVisaSponsorship()` — existing visa extraction.
- `FilterChips` — existing filter chip bar with toggle pattern.
- `feedFilterSchema` — existing Zod filter schema (extended, not replaced).

## Out of scope (follow-up specs)
- More ATS normalizers (SmartRecruiters, Recruitee, PinpointHQ, etc.) — each needs a public job-board API.
- Lever company registry population (no companies registered yet).
- Browse UX polish (job detail page, save/dismiss UI, personalization surface).
- Auto-apply engine (approval-gated ATS-API submission).
- Browser automation for JS-heavy ATS (Workday, Taleo, iCIMS) — requires infra upgrade beyond Hobby.
