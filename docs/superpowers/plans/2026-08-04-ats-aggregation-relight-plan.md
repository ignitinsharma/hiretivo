# ATS Aggregation Re-light Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-light the dormant ATS job aggregation pipeline: wire daily ingestion crons for Ashby/Greenhouse/Lever, re-enable the Browse jobs UI, switch from a negative URL blocklist to a positive allowlist, and add three browse filters (Location, Experience, Visa sponsorship) that work end-to-end.

**Architecture:** Ingestion runs as 3 staggered daily Vercel crons (Hobby-safe: one source per cron, ~15-30s each, under the 60s function limit). Jobs are stored in Postgres with `locationClass`, `visaSponsored`, and a new `experienceLevel` field assigned at fetch time. The existing `BrowseJobGrid` + `/api/seeker/feed` serve the feed with filter support. A new `experience-extractor.ts` follows the existing `visa-extractor.ts` pattern. `FilterChips` gets a dropdown enhancement (currently broken — toggles send the key name instead of enum values).

**Tech Stack:** Next.js 14 App Router, Prisma + Neon Postgres, Upstash Redis (cron-lock), Vercel Cron, Zod, TanStack Query, `node:test` (built-in test runner, `tsx --test`).

## Global Constraints

- **Market:** US only — registry stays US/global remote-first companies using Ashby/Greenhouse/Lever. No Indian employer feed.
- **Vercel Hobby:** cron once per day max; function duration 60s max; memory 1024MB max; no browser runtime.
- **Styling:** brand tokens first (`bg-brand-primary`, `text-brand-foreground-muted`, `border-brand-border`), no shadows, no dark mode, no `rounded-full` on inputs/cards, no `font-extrabold`.
- **Types:** never `any`; enums not string unions for fixed value sets; path aliases (`@/...`).
- **Comments:** every function/route/component gets a `/* */` doc block.
- **Git:** never push to main/staging; work on a `feature/` branch; PR targets staging.
- **Test runner:** `node:test` via `tsx --test 'src/lib/__tests__/*.test.ts'`. Tests use `import { describe, it } from 'node:test'` and `import assert from 'node:assert/strict'`.
- **YAGNI:** no admin HTTP route (no admin auth pattern exists in the codebase) — use a local `tsx` script for manual ingestion/verification instead.

---

## File Structure

### New files
- `src/app/api/cron/ats-fetch/ashby/route.ts` — cron endpoint for Ashby ingestion
- `src/app/api/cron/ats-fetch/greenhouse/route.ts` — cron endpoint for Greenhouse ingestion
- `src/app/api/cron/ats-fetch/lever/route.ts` — cron endpoint for Lever ingestion
- `src/app/api/cron/ats-fetch/_verify-cron-secret.ts` — shared helper to verify Vercel cron `Authorization: Bearer` header
- `src/lib/ats/experience-extractor.ts` — `detectExperienceLevel(title, description)` text matcher (pattern from `visa-extractor.ts`)
- `src/lib/__tests__/experience-extractor.test.ts` — tests for the extractor
- `src/lib/__tests__/experience-extractor-config.test.ts` — config test (mirrors `jd-parser-config.test.ts` pattern)
- `scripts/sync-ats-jobs.ts` — local manual ingestion script (replaces planned admin HTTP route; YAGNI)

### Modified files
- `vercel.json` — add 3 ATS cron entries; remove stale `weekly-digest` cron (route file doesn't exist — returns 404 every Monday)
- `src/services/ats-job-fetcher.service.ts` — add enrichment batch cap in `enrichJobSkills`
- `src/app/(app)/dashboard/browse/page.tsx` — remove redirect, render `BrowseJobGrid`
- `src/components/layout/AppHeader.tsx` — remove "Soon" badge / `isDisabled` for Browse
- `src/app/(app)/dashboard/page.tsx` — replace "Coming soon" placeholder with `BrowseJobGrid`
- `src/lib/ai/jd-parser.ts` — replace `isUnsupportedAtsDomain` (blocklist) with `isSupportedAtsDomain` (allowlist)
- `src/app/api/seeker/apply/from-link/route.ts` — update import + error message for allowlist
- `src/components/shared/AddCustomJobModal.tsx` — auto-switch to "Paste Description" tab on unsupported URL
- `src/constants/enums.ts` — add `ExperienceLevel` enum + `EXPERIENCE_LEVEL_VALUES`
- `src/lib/ats/normalizers/ashby.normalizer.ts` — call `detectExperienceLevel`
- `src/lib/ats/normalizers/greenhouse.normalizer.ts` — call `detectExperienceLevel`
- `src/lib/ats/normalizers/lever.normalizer.ts` — call `detectExperienceLevel`
- `src/lib/validations/match.ts` — add `experienceLevel` to `feedFilterSchema`
- `src/app/api/seeker/feed/route.ts` — destructure + apply `experienceLevel` filter
- `src/hooks/use-feed.ts` — add `visaSponsored` + `experienceLevel` to `FeedFilters` and query key
- `src/components/shared/FilterChips.tsx` — dropdown enhancement for enum filters; add Visa + Experience chips

---

## Task 1: Ingestion cron routes + vercel.json + manual script

**Files:**
- Create: `src/app/api/cron/ats-fetch/_verify-cron-secret.ts`
- Create: `src/app/api/cron/ats-fetch/ashby/route.ts`
- Create: `src/app/api/cron/ats-fetch/greenhouse/route.ts`
- Create: `src/app/api/cron/ats-fetch/lever/route.ts`
- Create: `scripts/sync-ats-jobs.ts`
- Modify: `vercel.json`
- Modify: `src/services/ats-job-fetcher.service.ts` (enrichment cap, ~line 40-68)

**Interfaces:**
- Consumes: `fetchAndAutoClose(source: AtsSource)` from `ats-job-fetcher.service.ts:167`, `acquireLock`/`releaseLock` from `src/lib/ats/cron-lock.ts`, `AtsSource` enum from `@/constants/enums`
- Produces: 3 cron endpoints callable by Vercel Cron Scheduler; a local `pnpm tsx scripts/sync-ats-jobs.ts [source]` script

- [ ] **Step 1: Create the shared cron-secret verification helper**

`src/app/api/cron/ats-fetch/_verify-cron-secret.ts`:
```ts
import { NextRequest } from 'next/server';

/*
 * verifyCronSecret
 * Validates the Vercel Cron Authorization header (Bearer {CRON_SECRET}).
 * @returns true if the request is from Vercel Cron, false otherwise.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
```

- [ ] **Step 2: Create the Ashby cron route**

`src/app/api/cron/ats-fetch/ashby/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { acquireLock, releaseLock } from '@/lib/ats/cron-lock';
import { fetchAndAutoClose } from '@/services/ats-job-fetcher.service';
import { AtsSource } from '@/constants/enums';
import { verifyCronSecret } from '../_verify-cron-secret';

/*
 * GET /api/cron/ats-fetch/ashby
 * Vercel Cron endpoint — fetches and upserts Ashby jobs, then auto-closes stale ones.
 * Auth: Bearer {CRON_SECRET} header set by Vercel Cron.
 * Cron-lock prevents concurrent runs of the same source.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lockKey = 'cron:ats-fetch:ashby';
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ skipped: true, reason: 'already running' });
  }

  try {
    const result = await fetchAndAutoClose(AtsSource.ASHBY);
    console.log('[cron:ashby]', result);
    return NextResponse.json(result);
  } finally {
    await releaseLock(lockKey);
  }
}
```

- [ ] **Step 3: Create the Greenhouse cron route**

`src/app/api/cron/ats-fetch/greenhouse/route.ts` — identical to Ashby but with `AtsSource.GREENHOUSE` and lock key `cron:ats-fetch:greenhouse`.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { acquireLock, releaseLock } from '@/lib/ats/cron-lock';
import { fetchAndAutoClose } from '@/services/ats-job-fetcher.service';
import { AtsSource } from '@/constants/enums';
import { verifyCronSecret } from '../_verify-cron-secret';

/*
 * GET /api/cron/ats-fetch/greenhouse
 * Vercel Cron endpoint — fetches and upserts Greenhouse jobs, then auto-closes stale ones.
 * Auth: Bearer {CRON_SECRET} header set by Vercel Cron.
 * Cron-lock prevents concurrent runs of the same source.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lockKey = 'cron:ats-fetch:greenhouse';
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ skipped: true, reason: 'already running' });
  }

  try {
    const result = await fetchAndAutoClose(AtsSource.GREENHOUSE);
    console.log('[cron:greenhouse]', result);
    return NextResponse.json(result);
  } finally {
    await releaseLock(lockKey);
  }
}
```

- [ ] **Step 4: Create the Lever cron route**

`src/app/api/cron/ats-fetch/lever/route.ts` — identical pattern, `AtsSource.LEVER`, lock key `cron:ats-fetch:lever`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { acquireLock, releaseLock } from '@/lib/ats/cron-lock';
import { fetchAndAutoClose } from '@/services/ats-job-fetcher.service';
import { AtsSource } from '@/constants/enums';
import { verifyCronSecret } from '../_verify-cron-secret';

/*
 * GET /api/cron/ats-fetch/lever
 * Vercel Cron endpoint — fetches and upserts Lever jobs, then auto-closes stale ones.
 * Auth: Bearer {CRON_SECRET} header set by Vercel Cron.
 * Cron-lock prevents concurrent runs of the same source.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lockKey = 'cron:ats-fetch:lever';
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ skipped: true, reason: 'already running' });
  }

  try {
    const result = await fetchAndAutoClose(AtsSource.LEVER);
    console.log('[cron:lever]', result);
    return NextResponse.json(result);
  } finally {
    await releaseLock(lockKey);
  }
}
```

- [ ] **Step 5: Update `vercel.json` — add 3 ATS crons, remove stale weekly-digest**

The current `crons` array:
```json
"crons": [
  { "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }
]
```
The `/api/cron/weekly-digest` route file does not exist in `src/app/api/cron/` — every Monday it returns 404. Remove it. Replace with the 3 ATS crons staggered by 15 minutes:
```json
"crons": [
  { "path": "/api/cron/ats-fetch/ashby", "schedule": "0 9 * * *" },
  { "path": "/api/cron/ats-fetch/greenhouse", "schedule": "15 9 * * *" },
  { "path": "/api/cron/ats-fetch/lever", "schedule": "30 9 * * *" }
]
```

**Breaking point / edge case:** If the weekly-digest cron route is reintroduced later, it must be re-registered here. The digest email template still exists at `src/lib/email/weekly-digest.ts` — the cron route was deleted, not the template. Note this in the commit message.

- [ ] **Step 6: Add enrichment batch cap to `enrichJobSkills`**

In `src/services/ats-job-fetcher.service.ts`, the `enrichJobSkills` function (defined at ~line 40) runs an LLM call per job that has fewer than 3 deterministically-extracted skills. If a cron run fetches many new low-skill jobs, the cumulative LLM latency can blow past the 60s function limit.

Add a module-level counter and a cap. At the top of the file (after the existing imports/constants, near line 13):
```ts
// ponytail: global cap on LLM skill enrichment per cron run — prevents the
// 60s Vercel Hobby function limit from being exceeded on large batches.
// Remaining jobs enrich on the next daily run when the batch is smaller.
const MAX_ENRICHMENTS_PER_RUN = 20;
let enrichmentsThisRun = 0;

/*
 * resetEnrichmentCounter
 * Call at the start of each fetchAndAutoClose invocation to reset the per-run cap.
 */
export function resetEnrichmentCounter(): void {
  enrichmentsThisRun = 0;
}
```

Inside `enrichJobSkills`, add the guard at the very top (before the existing `if (job.skillMatches.length >= 3) return;`):
```ts
  if (enrichmentsThisRun >= MAX_ENRICHMENTS_PER_RUN) return;
```
And increment the counter after a successful `reconcileAndInsertSkills` call (after line ~49, inside the `if (candidates.length === 0) return;` check — increment only when enrichment actually runs):
```ts
  enrichmentsThisRun += 1;
```

In `fetchAndAutoClose` (line ~167) and `fetchAndUpsertAllJobs` (line ~112), call `resetEnrichmentCounter()` as the first line of each function.

**Edge case:** a job that returns `candidates.length === 0` doesn't consume the cap (no LLM extraction ran). A job where the LLM ran but created 0 skills still counts (the LLM call happened — that's the cost).

- [ ] **Step 7: Create the manual sync script**

`scripts/sync-ats-jobs.ts` (replaces the planned admin HTTP route — YAGNI since no admin auth pattern exists):
```ts
import { fetchAndAutoClose } from '../src/services/ats-job-fetcher.service';
import { AtsSource } from '../src/constants/enums';

/*
 * Manual ATS job sync script.
 * Usage: pnpm tsx scripts/sync-ats-jobs.ts ashby|greenhouse|lever|all
 * Runs locally for verification before relying on the daily cron.
 */
async function main() {
  const arg = process.argv[2] ?? 'all';
  const sources =
    arg === 'all'
      ? [AtsSource.ASHBY, AtsSource.GREENHOUSE, AtsSource.LEVER]
      : [arg as AtsSource];

  for (const source of sources) {
    console.log(`\n[sync] ${source} starting...`);
    const result = await fetchAndAutoClose(source as AtsSource);
    console.log(`[sync] ${source}:`, result);
  }

  console.log('\n[sync] done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync] failed:', err);
  process.exit(1);
});
```

- [ ] **Step 8: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors in the new files.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/cron/ats-fetch/ scripts/sync-ats-jobs.ts vercel.json src/services/ats-job-fetcher.service.ts
git commit -m "feat(ingestion): add 3 daily ATS fetch crons + manual sync script + enrichment cap"
```

---

## Task 2: Re-enable Browse

**Files:**
- Modify: `src/app/(app)/dashboard/browse/page.tsx`
- Modify: `src/components/layout/AppHeader.tsx` (lines ~33, ~89)
- Modify: `src/app/(app)/dashboard/page.tsx` (lines 52-101)

**Interfaces:**
- Consumes: `BrowseJobGrid` from `@/modules/browse/components/BrowseJobGrid`
- Produces: a working `/dashboard/browse` route and dashboard default showing the live job feed

- [ ] **Step 1: Replace the browse page redirect with `BrowseJobGrid`**

`src/app/(app)/dashboard/browse/page.tsx` currently:
```tsx
import { redirect } from "next/navigation";

export default function BrowseJobsPage() {
  redirect("/dashboard");
}
```
Replace the entire file content with:
```tsx
import { BrowseJobGrid } from "@/modules/browse/components/BrowseJobGrid";

/*
 * BrowseJobsPage
 * Authenticated job feed — renders the BrowseJobGrid with search, filters,
 * infinite scroll, and the apply flow. Replaces the previous redirect to /dashboard.
 */
export default function BrowseJobsPage() {
  return <BrowseJobGrid />;
}
```

- [ ] **Step 2: Remove the "Soon" badge for Browse in `AppHeader.tsx`**

In `src/components/layout/AppHeader.tsx`, there are two `isDisabled` checks for `/dashboard/browse` (lines ~33 and ~89). The pattern renders a disabled nav span with a "Soon" badge when `isDisabled` is true.

Find the line in each occurrence:
```tsx
const isDisabled = item.href === "/dashboard/browse";
```
Change both to:
```tsx
const isDisabled = false;
```

**Breaking point:** the `isDisabled` variable may be used in a conditional that renders either a disabled span (with "Soon" badge) or a normal `<Link>`. Setting it to `false` routes through the normal `<Link>` branch. Verify the conditional structure around each occurrence before committing — if removing the line entirely is cleaner (no other references), delete the line instead of setting to `false`. Read the surrounding ~15 lines at each occurrence to confirm.

- [ ] **Step 3: Replace the dashboard "Coming soon" placeholder with `BrowseJobGrid`**

In `src/app/(app)/dashboard/page.tsx`, the section from line 52 to line 101 is the "Recommended jobs — Coming soon" placeholder. It contains:
- An `<h2>` with "Recommended jobs" + a "Coming soon" badge
- A grid with the "Add your own" dashed card (lines 61-86)
- A placeholder card (lines 88-101)

Replace the entire `<div>` block (lines 52-101) with:
```tsx
<div>
  <h2 className="text-lg font-bold text-brand-foreground mb-4">
    Browse jobs
  </h2>
  <BrowseJobGrid />
</div>
```

**Important:** `BrowseJobGrid` already contains its own "Add your own" dashed card (see `BrowseJobGrid.tsx:97-117`), so do NOT keep the separate "Add your own" card from the dashboard — it would duplicate. The `BrowseJobGrid` component handles the full feed experience including the custom-job entry point.

Add the import at the top of the file (after the existing component imports, ~line 11):
```tsx
import { BrowseJobGrid } from "@/modules/browse/components/BrowseJobGrid";
```

Keep `<FreePlanBanner />`, `<ResumeParseBanner />`, and `<ApplicationsTable />` in place — only the "Recommended jobs" section is replaced.

- [ ] **Step 4: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(app)/dashboard/browse/page.tsx' 'src/app/(app)/dashboard/page.tsx' src/components/layout/AppHeader.tsx
git commit -m "feat(browse): re-enable /dashboard/browse and make it the dashboard default"
```

---

## Task 3: URL allowlist for "Add your own"

**Files:**
- Modify: `src/lib/ai/jd-parser.ts` (lines ~191-202)
- Modify: `src/app/api/seeker/apply/from-link/route.ts` (lines ~13, ~169)
- Modify: `src/components/shared/AddCustomJobModal.tsx` (lines ~104-114)
- Create: `src/lib/__tests__/jd-parser-allowlist.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `isSupportedAtsDomain(url: string): boolean` exported from `@/lib/ai/jd-parser`

- [ ] **Step 1: Write the failing test for the allowlist**

`src/lib/__tests__/jd-parser-allowlist.test.ts`:
```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('isSupportedAtsDomain', () => {
  it('accepts Ashby job URLs', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://jobs.ashbyhq.com/linear/123'), true);
  });

  it('accepts Greenhouse job URLs', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://boards.greenhouse.io/linear/jobs/123'), true);
  });

  it('accepts Lever job URLs', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://jobs.lever.co/linear/123'), true);
  });

  it('rejects Workday URLs', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://myworkdayjobs.com/acme/123'), false);
  });

  it('rejects Taleo URLs', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://taleo.acme.com/careers/123'), false);
  });

  it('rejects unknown domains', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://example.com/jobs/123'), false);
  });

  it('handles URLs with query params and trailing slashes', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://jobs.ashbyhq.com/linear/123?ref=linkedin'), true);
    assert.equal(isSupportedAtsDomain('https://boards.greenhouse.io/linear/jobs/123/'), true);
  });

  it('is case-insensitive on the domain', async () => {
    const { isSupportedAtsDomain } = await import('../ai/jd-parser.js');
    assert.equal(isSupportedAtsDomain('https://JOBS.ASHBYHQ.COM/linear/123'), true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm tsx --test src/lib/__tests__/jd-parser-allowlist.test.ts`
Expected: FAIL — `isSupportedAtsDomain` is not exported (only `isUnsupportedAtsDomain` exists).

- [ ] **Step 3: Replace the blocklist with an allowlist in `jd-parser.ts`**

In `src/lib/ai/jd-parser.ts`, find the block (lines ~191-202):
```ts
const JS_APP_DOMAINS = [
  "workday", "myworkdayjobs",
  "taleo",
  "successfactors", "sapsf",
  "icims",
];

function isUnsupportedAtsDomain(url: string): boolean {
  return JS_APP_DOMAINS.some((d) => url.includes(d));
}

export { isUnsupportedAtsDomain };
```

Replace with:
```ts
/*
 * SUPPORTED_ATS_DOMAINS — positive allowlist of ATS domains whose job pages
 * are server-rendered and fetchable by parseJobFromUrl. URLs outside this list
 * are rejected and the user is redirected to paste the description instead.
 */
const SUPPORTED_ATS_DOMAINS = [
  "jobs.ashbyhq.com",   // Ashby
  "boards.greenhouse.io", // Greenhouse
  "jobs.lever.co",      // Lever
];

/*
 * isSupportedAtsDomain
 * Returns true if the URL belongs to an ATS whose job page we can auto-fetch.
 * Case-insensitive on the domain segment.
 */
export function isSupportedAtsDomain(url: string): boolean {
  try {
    const lower = url.toLowerCase();
    return SUPPORTED_ATS_DOMAINS.some((d) => lower.includes(d));
  } catch {
    return false;
  }
}
```

Then update the `parseJobFromUrl` function (line ~204) — replace the `isUnsupportedAtsDomain` guard:
```ts
export async function parseJobFromUrl(url: string): Promise<ParsedJob | null> {
  if (!isSupportedAtsDomain(url)) {
    console.warn(`[jd-parser] URL not in the auto-fetch allowlist — ${url}`);
    return null;
  }
  const pageText = await fetchPageText(url);
  return pageText ? callExtractionLlm(pageText, "url") : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm tsx --test src/lib/__tests__/jd-parser-allowlist.test.ts`
Expected: PASS — all 8 cases pass.

- [ ] **Step 5: Update `from-link/route.ts` import + error message**

In `src/app/api/seeker/apply/from-link/route.ts`:
- Change the import (line ~13): `isUnsupportedAtsDomain` → `isSupportedAtsDomain`
- Update the error block (lines ~168-178). The current logic computes `unsupportedAts = isUnsupportedAtsDomain(url)`. Now, if `parseJobFromUrl` returned null and the URL is NOT in the allowlist, the reason is "unsupported ATS". Replace:
```ts
if (!jobData) {
  const unsupportedAts = isUnsupportedAtsDomain(url);
  return NextResponse.json(
    {
      error: unsupportedAts
        ? "This job board isn't supported for auto-fetch. Switch to 'Paste Description' and copy the job details instead."
        : "Could not parse job from this URL. Try pasting the job description instead.",
      unsupportedAts,
    },
    { status: 422 },
  );
}
```
with:
```ts
if (!jobData) {
  const unsupportedAts = !isSupportedAtsDomain(url);
  return NextResponse.json(
    {
      error: unsupportedAts
        ? "We can't auto-fetch from this site yet. Paste the job description and we'll do the rest."
        : "Could not parse job from this URL. Try pasting the job description instead.",
      unsupportedAts,
    },
    { status: 422 },
  );
}
```
The `unsupportedAts` boolean flips meaning (now true when NOT supported) but the response shape stays identical — the modal already reads `data.unsupportedAts` and shows the "switch to paste description" button when true.

- [ ] **Step 6: Auto-switch to "Paste Description" tab in `AddCustomJobModal.tsx`**

In `src/components/shared/AddCustomJobModal.tsx`, the `handleFetchUrl` callback (line ~89) handles the 422 response. Currently it sets `unsupportedAts` state and shows an error with a manual "Switch to paste description instead" button.

Find the 422 handler (lines ~103-114):
```tsx
if (res.status === 422) {
  setUnsupportedAts(data.unsupportedAts ?? false);
  setError(data.error ?? "Could not parse this URL.");
} else if (res.status === 409) {
```

Replace with an auto-switch when `unsupportedAts` is true:
```tsx
if (res.status === 422) {
  const isUnsupported = data.unsupportedAts ?? false;
  setUnsupportedAts(isUnsupported);
  if (isUnsupported) {
    setTab("text");
    setState("idle");
    setError(null);
    setPreview(null);
    setShowFullJd(false);
  } else {
    setError(data.error ?? "Could not parse this URL.");
  }
} else if (res.status === 409) {
```

**Edge case:** the URL input value is preserved in the `url` state (not cleared on switch) so the user can still see what they pasted. The "Paste Description" tab has its own empty `description` textarea — the user copies from the original job page in their browser, not from the URL field. No cross-fill needed.

The existing "Switch to paste description instead" button (lines ~380-389) stays for the non-unsupported 422 case (parse failed on a supported URL) — it's a helpful escape hatch when a supported ATS page changed its structure and parsing broke.

- [ ] **Step 7: Verify typecheck + lint + test**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors.

Run: `pnpm tsx --test src/lib/__tests__/jd-parser-allowlist.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/ai/jd-parser.ts src/app/api/seeker/apply/from-link/route.ts src/components/shared/AddCustomJobModal.tsx src/lib/__tests__/jd-parser-allowlist.test.ts
git commit -m "feat(jobs): switch URL fetch from blocklist to positive ATS allowlist + auto-switch modal"
```

---

## Task 4: Experience extractor + enum

**Files:**
- Modify: `src/constants/enums.ts` (add enum + values array, ~after line 325)
- Create: `src/lib/ats/experience-extractor.ts`
- Create: `src/lib/__tests__/experience-extractor.test.ts`

**Interfaces:**
- Consumes: `ExperienceLevel` enum (defined in this task)
- Produces: `detectExperienceLevel(title: string, description: string): ExperienceLevel | null` and `EXPERIENCE_LEVEL_VALUES` array — consumed by Task 5 (normalizers) and Task 6 (Zod schema)

- [ ] **Step 1: Add the `ExperienceLevel` enum to `enums.ts`**

In `src/constants/enums.ts`, after the `AtsSource` enum (line ~325), add:
```ts
export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}

export const EXPERIENCE_LEVEL_VALUES = [
  ExperienceLevel.ENTRY,
  ExperienceLevel.MID,
  ExperienceLevel.SENIOR,
  ExperienceLevel.LEAD,
] as const;
```

- [ ] **Step 2: Write the failing test for the extractor**

`src/lib/__tests__/experience-extractor.test.ts`:
```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('detectExperienceLevel', () => {
  it('returns ENTRY for junior titles', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Junior Frontend Engineer', 'some desc'), 'ENTRY');
  });

  it('returns ENTRY for entry-level title', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Software Engineer (Entry Level)', 'desc'), 'ENTRY');
  });

  it('returns MID for mid-level signals in description', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Software Engineer', 'Requires 3+ years of experience'), 'MID');
  });

  it('returns SENIOR for senior title', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Senior Backend Engineer', 'desc'), 'SENIOR');
  });

  it('returns LEAD for staff/principal titles', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Staff Software Engineer', 'desc'), 'LEAD');
    assert.equal(detectExperienceLevel('Principal Engineer', 'desc'), 'LEAD');
  });

  it('returns LEAD for engineering manager title', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Engineering Manager', 'desc'), 'LEAD');
  });

  it('title signal beats description signal', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Senior Engineer', 'Ideal for new grads'), 'SENIOR');
  });

  it('returns null when no signal found', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Software Engineer', 'We build things.'), null);
  });

  it('returns null for empty inputs', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('', ''), null);
  });

  it('handles "5+ years" in description', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Engineer', '5+ years building distributed systems'), 'SENIOR');
  });

  it('does not match "senior" inside a word like "seniority"', async () => {
    const { detectExperienceLevel } = await import('../ats/experience-extractor.js');
    assert.equal(detectExperienceLevel('Engineer', 'We value seniority in our team'), null);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm tsx --test src/lib/__tests__/experience-extractor.test.ts`
Expected: FAIL — `experience-extractor.js` module not found.

- [ ] **Step 4: Create `experience-extractor.ts`**

`src/lib/ats/experience-extractor.ts`:
```ts
import { ExperienceLevel } from '@/constants/enums';

/*
 * EXPERIENCE_SIGNALS — keyword sets per level. Checked in priority order:
 * LEAD → SENIOR → MID → ENTRY (most specific first to avoid false positives).
 * "senior" must match as a standalone word, not inside "seniority".
 */

const ENTRY_PATTERNS: RegExp[] = [
  /\bjunior\b/i,
  /\bentry[\s-]?level\b/i,
  /\bnew\s+grad\b/i,
  /\b0[-\s]?2\s+years?\b/i,
  /\b1\+?\s+years?\b/i,
];

const MID_PATTERNS: RegExp[] = [
  /\bmid[-\s]?level\b/i,
  /\bintermediate\b/i,
  /\b[23]\+?\s+years?\b/i,
  /\b4\+?\s+years?\b/i,
];

const SENIOR_PATTERNS: RegExp[] = [
  /\bsenior\b/i,
  /\bsr\.?\b/i,
  /\b[567]\+?\s+years?\b/i,
];

const LEAD_PATTERNS: RegExp[] = [
  /\blead\b/i,
  /\bstaff\b/i,
  /\bprincipal\b/i,
  /\bmanager\b/i,
  /\bhead\s+of\b/i,
  /\b[89]\+?\s+years?\b/i,
  /\b1\d\+?\s+years?\b/i,
];

const LEVEL_ORDER: Array<{ level: ExperienceLevel; patterns: RegExp[] }> = [
  { level: ExperienceLevel.LEAD, patterns: LEAD_PATTERNS },
  { level: ExperienceLevel.SENIOR, patterns: SENIOR_PATTERNS },
  { level: ExperienceLevel.MID, patterns: MID_PATTERNS },
  { level: ExperienceLevel.ENTRY, patterns: ENTRY_PATTERNS },
];

/*
 * detectExperienceLevel
 * Infers the experience level from the job title (strongest signal) and the
 * job description. Title is checked first across all levels; if no title match,
 * the description is checked. Returns null if no signal is found.
 * @param title       - job title (canonical signal)
 * @param description - full job description (fallback signal)
 * @returns ExperienceLevel or null
 */
export function detectExperienceLevel(
  title: string,
  description: string,
): ExperienceLevel | null {
  const titleText = title ?? '';
  const descText = description ?? '';

  if (!titleText && !descText) return null;

  // Title is the canonical signal — check all levels against the title first.
  for (const { level, patterns } of LEVEL_ORDER) {
    if (patterns.some((p) => p.test(titleText))) return level;
  }

  // Fallback to description only if the title gave nothing.
  for (const { level, patterns } of LEVEL_ORDER) {
    if (patterns.some((p) => p.test(descText))) return level;
  }

  return null;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm tsx --test src/lib/__tests__/experience-extractor.test.ts`
Expected: PASS — all 11 cases pass.

**Edge case verified by the test suite:** "seniority" in description does NOT match SENIOR (the `\bsenior\b` word boundary regex prevents it). Title signal beats conflicting description signal. Empty inputs return null.

- [ ] **Step 6: Verify typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/constants/enums.ts src/lib/ats/experience-extractor.ts src/lib/__tests__/experience-extractor.test.ts
git commit -m "feat(filters): add ExperienceLevel enum + experience-extractor with tests"
```

---

## Task 5: Wire experience extraction into normalizers

**Files:**
- Modify: `src/lib/ats/normalizers/ashby.normalizer.ts` (lines 3, 63, 75)
- Modify: `src/lib/ats/normalizers/greenhouse.normalizer.ts` (lines 3, 60, 72)
- Modify: `src/lib/ats/normalizers/lever.normalizer.ts` (lines 3, 69, 83)

**Interfaces:**
- Consumes: `detectExperienceLevel` from `@/lib/ats/experience-extractor` (Task 4)
- Produces: `NormalizedJob.experienceLevel` populated for each fetched job (consumed by `ats-job-fetcher.service.ts` which already writes `job.experienceLevel` to the DB at lines ~369, ~415, ~453)

**Pre-existing state:** All three normalizers already return `experienceLevel: null` hardcoded in their return object (Ashby line 75, Greenhouse line 72, Lever line 83) and the `NormalizedJob` interface already types it as `experienceLevel: string | null` (`ats-job-fetcher.service.ts:93`). This task replaces the hardcoded `null` with the extracted value. No new field, no DB migration.

- [ ] **Step 1: Wire experience extraction into the Ashby normalizer**

In `src/lib/ats/normalizers/ashby.normalizer.ts`:
1. Add the import near line 3 (where `detectVisaSponsorship` is imported):
```ts
import { detectExperienceLevel } from '@/lib/ats/experience-extractor';
```
2. After line 63 (`const visaSponsored = detectVisaSponsorship(description);`), add:
```ts
const experienceLevel = detectExperienceLevel(raw.title ?? '', description);
```
(`raw.title` is the job title variable — used at line 68 and 61.)
3. Change line 75 from:
```ts
experienceLevel: null,
```
to:
```ts
experienceLevel,
```

- [ ] **Step 2: Wire experience extraction into the Greenhouse normalizer**

In `src/lib/ats/normalizers/greenhouse.normalizer.ts`:
1. Add the import near line 3:
```ts
import { detectExperienceLevel } from '@/lib/ats/experience-extractor';
```
2. After line 60 (`const visaSponsored = detectVisaSponsorship(description);`), add:
```ts
const experienceLevel = detectExperienceLevel(job.title ?? '', description);
```
(`job.title` is the title variable — used at line 65.)
3. Change line 72 from `experienceLevel: null,` to `experienceLevel,`

- [ ] **Step 3: Wire experience extraction into the Lever normalizer**

In `src/lib/ats/normalizers/lever.normalizer.ts`:
1. Add the import near line 3:
```ts
import { detectExperienceLevel } from '@/lib/ats/experience-extractor';
```
2. After line 69 (`const visaSponsored = detectVisaSponsorship(description);`), add:
```ts
const experienceLevel = detectExperienceLevel(job.text ?? '', description);
```
(`job.text` is the title variable for Lever postings — used at line 76 and 67.)
3. Change line 83 from `experienceLevel: null,` to `experienceLevel,`

- [ ] **Step 4: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. (`ExperienceLevel` enum values are strings, assignable to `string | null`.)

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ats/normalizers/ashby.normalizer.ts src/lib/ats/normalizers/greenhouse.normalizer.ts src/lib/ats/normalizers/lever.normalizer.ts
git commit -m "feat(filters): wire experience extraction into all 3 ATS normalizers"
```

---

## Task 6: Wire experience + visa into feed schema, API, and client types

**Files:**
- Modify: `src/lib/validations/match.ts` (line ~4-13)
- Modify: `src/app/api/seeker/feed/route.ts` (line ~116, ~137)
- Modify: `src/hooks/use-feed.ts` (line ~10-14, ~26)

**Interfaces:**
- Consumes: `EXPERIENCE_LEVEL_VALUES` from `@/constants/enums` (Task 4)
- Produces: `experienceLevel` and `visaSponsored` accepted by the feed API and the `useFeed` hook query

- [ ] **Step 1: Add `experienceLevel` to `feedFilterSchema`**

In `src/lib/validations/match.ts`, add the import at the top:
```ts
import { JOB_TYPE_VALUES, WORK_TYPE_VALUES, LOCATION_CLASS_VALUES, EXPERIENCE_LEVEL_VALUES } from '@/constants/enums';
```
Then add to the `z.object` (after `locationClass`):
```ts
experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES).optional(),
```
`visaSponsored` is already in the schema (line ~12).

- [ ] **Step 2: Add `experienceLevel` to the feed API where clause**

In `src/app/api/seeker/feed/route.ts`:
- Update the destructure (line ~116) to include `experienceLevel`:
```ts
const { cursor, limit, jobType, workType, recentOffset, locationClass, visaSponsored, experienceLevel, q } = parsed.data;
```
- Add the where filter after the `visaSponsored` line (line ~137):
```ts
if (experienceLevel) feedFilterWhere.experienceLevel = experienceLevel;
```

**Breaking point:** there are TWO filter paths in `feed/route.ts` — the primary path (line ~130, `feedFilterWhere`) and the hybrid "recentOffset" path (line ~147, `recentWhere` which spreads `feedFilterWhere`). Since `recentWhere` spreads `feedFilterWhere`, the `experienceLevel` filter automatically applies to both paths. Verify by reading lines ~130-150 — the spread must include the new field.

There's also a manual `if (visaSponsored && !job.visaSponsored) return false;` post-filter around line ~226 (for the matched-jobs path). Add an equivalent for experience:
```ts
if (experienceLevel && job.experienceLevel !== experienceLevel) return false;
```
Find the exact location by searching for `if (visaSponsored && !job.visaSponsored)` and adding the experience check right after it.

- [ ] **Step 3: Add `visaSponsored` + `experienceLevel` to `FeedFilters`**

In `src/hooks/use-feed.ts`:
- Update the `FeedFilters` interface (line ~10):
```ts
export interface FeedFilters {
  q?: string;
  jobType?: string;
  workType?: string;
  locationClass?: string;
  visaSponsored?: boolean;
  experienceLevel?: string;
}
```
- Update the query key (line ~26) to include the two new filters:
```ts
queryKey: ["jobs", filters?.q ?? "", filters?.jobType, filters?.workType, filters?.locationClass, filters?.visaSponsored, filters?.experienceLevel],
```

- [ ] **Step 4: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/match.ts src/app/api/seeker/feed/route.ts src/hooks/use-feed.ts
git commit -m "feat(filters): wire experience + visa into feed schema, API, and client types"
```

---

## Task 7: FilterChips dropdown enhancement + add visa & experience chips

**Files:**
- Modify: `src/components/shared/FilterChips.tsx`

**Interfaces:**
- Consumes: `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
- Produces: a `FilterChips` component where filters with `options` render a dropdown menu (selecting an option sends the actual enum value to `onFilterChange`), and filters without `options` keep the existing binary toggle

- [ ] **Step 1: Understand the current bug**

`src/components/shared/FilterChips.tsx` defines `FilterDef` with an `options?: string[]` field, but `handleClick` ignores it — it toggles between `key` (the string key name, e.g., `"locationClass"`) and `undefined`. For enum filters, the server receives `?locationClass=locationClass` which fails Zod's `z.enum(LOCATION_CLASS_VALUES)` validation → 400 error. This was never caught because `/dashboard/browse` was disabled (Task 2 re-enables it).

- [ ] **Step 2: Rewrite `FilterChips.tsx` with dropdown support**

Replace the entire content of `src/components/shared/FilterChips.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterDef {
  key: string;
  label: string;
  options?: string[];
}

const DEFAULT_FILTERS: FilterDef[] = [
  { key: "jobType", label: "Job type", options: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] },
  { key: "workType", label: "Workplace", options: ["REMOTE", "HYBRID", "ONSITE"] },
  { key: "locationClass", label: "Location", options: ["worldwide", "us-only", "emea", "india", "onsite"] },
  { key: "experienceLevel", label: "Experience", options: ["ENTRY", "MID", "SENIOR", "LEAD"] },
  { key: "visaSponsored", label: "Visa sponsored" },
];

/*
 * FilterChips
 * Shared filter chip bar used by Dashboard, Browse, and Tracker.
 * - Filters WITH options: render a dropdown menu; selecting an option sends the
 *   actual enum value to onFilterChange. Active state shows the selected value label.
 * - Filters WITHOUT options (e.g. visaSponsored): binary toggle on/off.
 */
interface FilterChipsProps {
  filters?: FilterDef[];
  activeFilters?: Partial<Record<string, string | undefined>>;
  onFilterChange?: (key: string, value: string | undefined) => void;
}

 /*
 * formatOptionLabel
 * Converts an enum string value to a human-readable label for the dropdown.
 * "us-only" → "US only", "FULL_TIME" → "Full time", "ENTRY" → "Entry".
 */
function formatOptionLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FilterChips({
  filters = DEFAULT_FILTERS,
  activeFilters = {},
  onFilterChange,
}: FilterChipsProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map((filter) => {
        const activeValue = activeFilters[filter.key];
        const isActive = Boolean(activeValue);

        if (filter.options) {
          return (
            <Popover
              key={filter.key}
              open={openKey === filter.key}
              onOpenChange={(open) => setOpenKey(open ? filter.key : null)}
            >
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all duration-150",
                    isActive
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-foreground-muted border-brand-border hover:border-gray-300 hover:text-brand-foreground"
                  )}
                >
                  {isActive
                    ? `${filter.label}: ${formatOptionLabel(activeValue)}`
                    : filter.label}
                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                {filter.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onFilterChange?.(filter.key, activeValue === opt ? undefined : opt);
                      setOpenKey(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                      activeValue === opt
                        ? "bg-brand-primary/10 font-semibold text-brand-primary"
                        : "text-brand-foreground hover:bg-brand-surface"
                    )}
                  >
                    {formatOptionLabel(opt)}
                    {activeValue === opt && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          );
        }

        // Binary toggle (no options) — for visaSponsored
        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange?.(filter.key, isActive ? undefined : filter.key)}
            className={cn(
              "shrink-0 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all duration-150",
              isActive
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-white text-brand-foreground-muted border-brand-border hover:border-gray-300 hover:text-brand-foreground"
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
```

**Breaking point / edge case — the binary toggle for `visaSponsored`:** the original `handleClick` sent `key` as the value (e.g., `"visaSponsored"`), and the server's `visaSponsored: z.coerce.boolean()` coerces the string `"visaSponsored"` to `true` (non-empty string). The new code does the same (`onFilterChange?.(filter.key, isActive ? undefined : filter.key)`) — sending `"visaSponsored"` when toggled on. This works with `z.coerce.boolean()`. Do NOT send `true` (boolean) because the URL search param serialization in `seeker_service.getFeed` would convert it to the string `"true"`, which also coerces fine — but matching the existing tested behavior is safest.

**Edge case — dropdown open state:** only one dropdown open at a time (`openKey` state). Clicking outside closes it (Popover handles this). Selecting the active option clears it (sends `undefined`). Selecting a different option switches.

- [ ] **Step 3: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/FilterChips.tsx
git commit -m "feat(filters): FilterChips dropdown for enum filters + add visa & experience chips"
```

---

## Task 8: End-to-end verification

**Files:** None (verification only)

- [ ] **Step 1: Run the manual sync script to populate jobs**

Run: `pnpm tsx scripts/sync-ats-jobs.ts ashby`
Expected output: logs like `[ats-fetch] ashby: N raw → M after quality filter` and a result object with `created`/`updated`/`closed` counts.

**Breaking point:** if this fails with a Prisma connection error, ensure `.env.local` has the `DATABASE_URL` set. If it fails with a Redis lock error, the lock from a previous run may be stuck — the `cron-lock.ts` has a TTL but if manually stuck, wait for it to expire or temporarily disable the lock call in the script.

- [ ] **Step 2: Verify experience + visa are populated in the DB**

Run a quick query via Prisma studio or a one-off script:
```bash
pnpm tsx -e "import { prisma } from './src/lib/prisma'; prisma.job.findMany({ select: { title: true, experienceLevel: true, visaSponsored: true, atsSource: true }, take: 10, orderBy: { createdAt: 'desc' } }).then(j => { console.log(j); process.exit(0); });"
```
Expected: jobs have `experienceLevel` values (`ENTRY`/`MID`/`SENIOR`/`LEAD` or `null`) and `visaSponsored` booleans. `null` experienceLevel is acceptable for jobs with no signal in title or description.

- [ ] **Step 3: Start the dev server and verify Browse**

Run: `pnpm dev`
Open: `http://localhost:3000/dashboard/browse` (after logging in and completing onboarding).

Verify:
1. The page renders `BrowseJobGrid` (not a redirect to `/dashboard`).
2. Real jobs appear in the grid with match scores, company names, location badges.
3. Nav "Browse jobs" item is a normal clickable link (no "Soon" badge).
4. Dashboard default shows `BrowseJobGrid` followed by `ApplicationsTable`.

- [ ] **Step 4: Verify filters work**

On `/dashboard/browse`:
1. Click the "Location" chip → dropdown opens → select "us-only" → feed narrows to US-only remote jobs. The chip label changes to "Location: US only".
2. Click the "Experience" chip → select "SENIOR" → feed narrows to senior-level jobs. Chip shows "Experience: Senior".
3. Click the "Visa sponsored" chip → feed narrows to visa-sponsored jobs only. Chip turns purple.
4. Click each active chip again to clear → feed returns to full.
5. Open browser DevTools Network tab — verify the feed request includes the correct query params (e.g., `?experienceLevel=SENIOR`) and returns 200, not 400.

**Breaking point:** if the feed returns 400, the filter value sent to the server doesn't match the Zod enum. Check the Network tab — the param value must be the enum string (`"SENIOR"`), not the key name (`"experienceLevel"`). The dropdown enhancement in Task 7 fixes this; if it still fails, the `onFilterChange` call in `BrowseJobGrid.tsx:42-44` passes the value through unchanged (verify `handleFilterChange` doesn't transform it).

- [ ] **Step 5: Verify the URL allowlist**

1. Open the "Add your own" modal.
2. Paste a Greenhouse URL (e.g., `https://boards.greenhouse.io/figma/jobs/123`) → click "Fetch" → should fetch and show a preview (or fail gracefully if the specific job doesn't exist, but with a parse error, not an "unsupported" error).
3. Paste a Workday URL (e.g., `https://myworkdayjobs.com/acme/123`) → click "Fetch" → should auto-switch to the "Paste Description" tab with no error shown (the modal silently switched).
4. Verify the "Paste Description" tab is now active and the description textarea is empty and focused.

- [ ] **Step 6: Verify mobile layout**

Resize to ~390px width:
1. Job grid collapses to 1 column.
2. Filter chips scroll horizontally (no overflow clipping).
3. Search bar is full-width.
4. "Add your own" card is full-width.

- [ ] **Step 7: Verify typecheck + lint one final time**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 8: Commit a verification note + push the branch**

No code changes in this task. Confirm the branch is clean:
```bash
git status
```
Expected: nothing to commit, working tree clean.

---

## Out of scope (follow-up specs)
- More ATS normalizers (SmartRecruiters, Recruitee, PinpointHQ) — each needs a public job-board API.
- Lever company registry population (no companies registered yet — cron runs but fetches 0 jobs).
- Browse UX polish (job detail page, save/dismiss UI, personalization surface).
- Auto-apply engine (approval-gated ATS-API submission).
- Browser automation for JS-heavy ATS (Workday, Taleo, iCIMS) — requires infra upgrade beyond Hobby.
- Recreating the weekly-digest cron route (the email template still exists at `src/lib/email/weekly-digest.ts`; the route file was deleted during the pivot).