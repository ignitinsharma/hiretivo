---
phase: 13-real-time-availability-signal
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - prisma/schema.prisma
  - src/constants/enums.ts
  - src/lib/validations/seeker.schema.ts
  - src/app/api/seeker/settings/route.ts
  - src/app/api/recruiter/talent/route.ts
  - src/modules/seeker/settings/components/SeekingStatusToggle.tsx
  - src/app/seeker/settings/page.tsx
  - src/modules/recruiter/talent/types/talent.types.ts
  - src/modules/recruiter/talent/queries/use-talent-pool.ts
  - src/modules/recruiter/talent/components/EngineerCard.tsx
  - src/modules/recruiter/talent/components/TalentPoolClient.tsx
  - src/modules/recruiter/talent/components/SeekingStatusFilter.tsx
  - src/app/e/[slug]/page.tsx
  - src/services/seeker.service.ts
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-05-26
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 13 introduces the `seekingStatus` field (schema, enum, API, UI toggle, talent pool filter, and public profile pill). The data model and enum definitions are clean. The seeker-side toggle component and public profile page are well-structured. Three critical issues were found: `seekingStatus` is silently dropped by the PATCH handler because `SeekerSettingsSchema` does not include it; the talent pool API references `PlanTier.PRO` and `PlanTier.ENTERPRISE` which do not exist in the enum (causing a runtime undefined check); and `seekingStatus` is missing from the talent pool API query/response, so the filter parameter sent by the client is never applied server-side. Four warnings cover the orphaned `seekingStatus` field in `SeekerSettingsData`, a URL construction race condition in the infinite query, a missing `seekingStatus` guard in `EngineerCard`, and the `settingsRateLimiter` being set to 20 req/min instead of the CLAUDE.md-required 5 req/min for write operations.

---

## Critical Issues

### CR-01: `seekingStatus` silently discarded by PATCH /api/seeker/settings

**File:** `src/app/api/seeker/settings/route.ts:318`

**Issue:** `SeekerSettingsSchema` (seeker.schema.ts) has no `seekingStatus` field. `SeekingStatusToggle` sends `{ name, seekingStatus }` in the PATCH body, but `seekingStatus` is stripped by the Zod schema parse before the DB update runs. The value is never written to `User.seekingStatus`. The toggle appears to succeed (HTTP 200, query invalidated) but the database is never updated.

**Fix:** Add `seekingStatus` to `SeekerSettingsSchema` in `src/lib/validations/seeker.schema.ts` and persist it in the `prisma.user.update` call inside the PATCH handler:

```ts
// seeker.schema.ts — inside SeekerSettingsSchema object shape
seekingStatus: z.nativeEnum(SeekingStatus).optional(),

// route.ts — inside prisma.user.update data block
data: {
  name,
  ...(parsed.data.seekingStatus !== undefined
    ? { seekingStatus: parsed.data.seekingStatus }
    : {}),
},
```

---

### CR-02: `PlanTier.PRO` and `PlanTier.ENTERPRISE` do not exist — always returns `Forbidden`

**File:** `src/app/api/recruiter/talent/route.ts:50-58`

**Issue:** `isPaidPlan` checks `PlanTier.PRO` and `PlanTier.ENTERPRISE`, but the `PlanTier` enum in `src/constants/enums.ts` only defines `FREE`, `STARTER`, `GROWTH`, `SCALE`. Both comparisons always evaluate to `undefined === plan`, so `canAccessRecruiterPaidFeature(PlanTier.FREE)` is called for every recruiter regardless of their actual plan. Depending on what `canAccessRecruiterPaidFeature(PlanTier.FREE)` returns, this either blocks all paid recruiters or grants free recruiters access.

**Fix:** Replace the stale tier names with the current enum values:

```ts
function isPaidPlan(plan: string | null | undefined): boolean {
  if (
    plan === PlanTier.STARTER ||
    plan === PlanTier.GROWTH  ||
    plan === PlanTier.SCALE
  ) {
    return canAccessRecruiterPaidFeature(plan as PlanTier);
  }
  return false;
}
```

---

### CR-03: `seekingStatus` filter param sent by client but never applied server-side

**File:** `src/app/api/recruiter/talent/route.ts:90-172`

**Issue:** `useTalentPool` appends `seekingStatus` to the query string when a filter is selected. The server reads `q`, `skill`, `location`, `availability`, `page`, and `limit` from the URL — but never reads `seekingStatus`. The `Prisma.UserWhereInput` clause has no `seekingStatus` condition. Selecting "Actively Looking" in the UI sends the param but the API ignores it and returns all statuses.

**Fix:** Parse and apply the filter in the GET handler:

```ts
// After existing param parsing (line ~99)
const seekingStatus = url.searchParams.get("seekingStatus")?.trim() ?? "";

// Inside the `where` object — add alongside `role: "SEEKER"`
...(seekingStatus
  ? { seekingStatus: seekingStatus as SeekingStatus }
  : {}),
```

Also add `seekingStatus` to the `select` block so the response includes it for the `EngineerCard` dot rendering.

---

## Warnings

### WR-01: `seekingStatus` field in `SeekerSettingsData` is typed but never returned by the GET handler

**File:** `src/services/seeker.service.ts:62` and `src/app/api/seeker/settings/route.ts:230-288`

**Issue:** `SeekerSettingsData` declares `seekingStatus: SeekingStatus | null`, but the GET handler's Prisma `select` does not include `seekingStatus` from the `User` record — only `seekerProfile` fields are selected. The returned object never contains `seekingStatus`, so `SeekingStatusToggle` always falls back to `OPEN_TO_OFFERS` on load, masking the persisted value even after CR-01 is fixed.

**Fix:** Add `seekingStatus` to the GET handler's user select and include it in the response:

```ts
// route.ts — user select block (around line 232)
select: {
  name: true,
  email: true,
  image: true,
  seekingStatus: true,   // ← add this
  seekerProfile: { ... },
},

// response spread — seekingStatus is on `userFields` once selected,
// so it flows through automatically
```

---

### WR-02: URL mutation race condition in `useTalentPool` infinite query

**File:** `src/modules/recruiter/talent/queries/use-talent-pool.ts:13-34`

**Issue:** `params` is a `URLSearchParams` instance constructed once outside `queryFn`. On subsequent page fetches `pageParam` is set on the shared `params` object via `params.set("cursor", pageParam)`. If React Query fires two concurrent page fetches (unlikely but possible under React 18 concurrent mode), both mutations race on the same object. More practically, the cursor from a previous page fetch persists if the function is called again without a fresh `URLSearchParams` construction.

**Fix:** Construct a fresh `URLSearchParams` inside `queryFn` (or accept params as a closure snapshot):

```ts
queryFn: async ({ pageParam }) => {
  const p = new URLSearchParams();
  if (filters.skills) p.set("skills", filters.skills);
  // ... rebuild all params ...
  if (pageParam) p.set("cursor", pageParam);
  const res = await fetch(`/api/recruiter/talent?${p.toString()}`);
  ...
},
```

---

### WR-03: `EngineerCard` accesses `engineer.seekingStatus` without a fallback guard

**File:** `src/modules/recruiter/talent/components/EngineerCard.tsx:76-78`

**Issue:** `SEEKING_STATUS_DOT_CLASS[engineer.seekingStatus]` and `SEEKING_STATUS_LABEL[engineer.seekingStatus]` are indexed with a value that comes from the API response. Until CR-03 is fixed the API does not include `seekingStatus` in its response shape (see `talent.types.ts` `LockedEngineer` vs current API select). If the field is absent or an unexpected value, both lookups return `undefined`, producing `className="w-2.5 h-2.5 rounded-full undefined"` in the DOM and a broken aria-label.

**Fix:** Add a fallback:

```ts
const dotClass = SEEKING_STATUS_DOT_CLASS[engineer.seekingStatus] ?? "bg-gray-300";
const statusLabel = SEEKING_STATUS_LABEL[engineer.seekingStatus] ?? "Unknown";
```

---

### WR-04: `settingsRateLimiter` is 20 req/min — exceeds CLAUDE.md limit for write operations

**File:** `src/app/api/seeker/settings/route.ts:11`

**Issue:** `createRateLimiter("seeker-settings", 20, "1 m")` sets 20 requests/minute. CLAUDE.md §5.2 mandates write operations (POST/PUT/PATCH/DELETE) use 5 req/min per user. The PATCH handler is a write operation and should respect this limit.

**Fix:**

```ts
const settingsRateLimiter = createRateLimiter("seeker-settings", 5, "1 m");
```

---

## Info

### IN-01: `SeekingStatus` enum missing from `SeekerSettingsSchema` import

**File:** `src/lib/validations/seeker.schema.ts:2`

**Issue:** Once CR-01 is fixed, `SeekingStatus` and `SEEKING_STATUS_VALUES` need to be imported. Currently only `POSITION_TYPE_VALUES` is imported from enums. This is a follow-on task, not an independent issue, but noted so the fix is complete.

**Fix:**

```ts
import { POSITION_TYPE_VALUES, SeekingStatus } from "@/constants/enums";
// then use z.nativeEnum(SeekingStatus) in the schema
```

---

### IN-02: `topProjects` JSON cast in public profile page is unguarded

**File:** `src/app/e/[slug]/page.tsx:90`

**Issue:** `profile?.topProjects as Array<{ name: string; description: string; url: string }> | null` is a forced cast with no runtime validation. If the stored JSON has a different shape (e.g., missing `url`, extra fields), downstream access like `proj.url` and `proj.name` will render `undefined` silently.

**Fix:** Add a runtime guard or filter:

```ts
const rawProjects = Array.isArray(profile?.topProjects) ? profile.topProjects : [];
const topProjects = rawProjects.filter(
  (p): p is { name: string; description: string; url: string } =>
    typeof p === "object" && p !== null && typeof p.name === "string",
);
```

---

### IN-03: `seekingStatus` in `LockedEngineer` type is non-optional but API does not select it

**File:** `src/modules/recruiter/talent/types/talent.types.ts:22`

**Issue:** `LockedEngineer.seekingStatus: SeekingStatus` is required (non-optional), but the current talent API GET handler (route.ts) does not include `seekingStatus` in its select or response mapping. This creates a type lie: TypeScript believes the field is always present, but at runtime it will be `undefined`. This will remain a latent bug until CR-03 is resolved and the API actually returns the field.

**Fix:** Either mark the field optional until the API is updated (`seekingStatus?: SeekingStatus`), or ensure CR-03 fix includes `seekingStatus` in the API select and response object — which is the correct long-term fix.

---

_Reviewed: 2026-05-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
