---
phase: 13-real-time-availability-signal
verified: 2026-05-26T12:30:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open /seeker/settings as a signed-in seeker. Confirm the 3-button segmented control renders under 'Who can find me', click each button, confirm toast 'Seeking status updated' appears, and confirm the correct button remains selected after page refresh."
    expected: "Each button click persists the new status via PATCH /api/seeker/settings; the stored value is reflected on next load."
    why_human: "Requires an authenticated browser session; cannot verify real-time mutation + query invalidation + toast display programmatically."
  - test: "Open /recruiter/talent as a paid recruiter. Confirm the 'Availability' chip row shows All / Actively Looking / Open to Offers. Click 'Actively Looking'; confirm the card list refreshes and every visible card shows a green dot. Click 'All'; confirm mixed dots reappear."
    expected: "Chip selection triggers a re-fetch with ?seekingStatus=ACTIVELY_LOOKING; only green-dot engineers are returned. 'All' returns the full unfiltered list."
    why_human: "Requires an authenticated paid-recruiter session, live DB data with varying seekingStatus rows, and visual confirmation of dot colors."
  - test: "Navigate to /e/{verified-engineer-slug} as an anonymous visitor (no login). Confirm the page renders (not 404). Confirm an ACTIVELY_LOOKING engineer shows a green 'Actively Looking' pill below the name. Set the engineer's status to NOT_LOOKING and reload — confirm the pill is absent."
    expected: "Page renders with full profile content; pill visibility toggles correctly with seekingStatus value."
    why_human: "Requires a real DB row with VERIFIED + profilePublic=true; pill absence for NOT_LOOKING cannot be verified without a live render."
  - test: "Verify npx prisma db push was successfully applied to the Neon database. The 13-01-SUMMARY documents a P1001 blocked push at implementation time."
    expected: "DB column User.seekingStatus exists in live Neon with default OPEN_TO_OFFERS; can be confirmed by running: SELECT column_name, column_default FROM information_schema.columns WHERE table_name='User' AND column_name='seekingStatus';"
    why_human: "DB push was blocked at implementation time (P1001 environment restriction). This must be run manually from an environment with Neon connectivity before deploy."
---

# Phase 13: Real-time Availability Signal — Verification Report

**Phase Goal:** Engineers set a seeking status visible to recruiters on talent pool cards, filtering, and public profiles — stopping wasted recruiter outreach on passive candidates.
**Verified:** 2026-05-26T12:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `SeekingStatus` enum declared in Prisma schema with ACTIVELY_LOOKING, OPEN_TO_OFFERS, NOT_LOOKING; `User.seekingStatus` field with `@default(OPEN_TO_OFFERS)` | VERIFIED | `prisma/schema.prisma` lines 99-146: enum block + field confirmed. TS mirror at `src/constants/enums.ts` line 234. DB push blocked at implementation time — requires human confirmation (see human verification #4). |
| 2 | Engineer settings page has a 3-state toggle (colored: green/yellow/gray) that persists seekingStatus via PATCH /api/seeker/settings | VERIFIED (automated); human confirm needed for runtime | `SeekingStatusToggle.tsx` exists (98 lines), has `"use client"`, three STATUS_OPTIONS with correct brand-token classes, PATCH mutation, `invalidateQueries(["seeker-settings"])`, mounted above `<HideProfileToggle>` in `page.tsx` line 126. API PATCH wiring confirmed at `route.ts` lines 345-346. Requires human login test. |
| 3 | Talent pool cards show colored availability dot (green/yellow/gray) next to engineer name | VERIFIED (automated); human confirm needed for visual | `EngineerCard.tsx`: `SEEKING_STATUS_DOT_CLASS` and `SEEKING_STATUS_LABEL` Records defined, dot `<span>` rendered using `engineer.seekingStatus`. `LockedEngineer.seekingStatus: SeekingStatus` non-nullable in types. |
| 4 | Talent pool has filter (All / Actively Looking / Open to Offers) wired to `/api/recruiter/talent`; NOT_LOOKING engineers still appear in All | VERIFIED (automated); human confirm needed for runtime | `SeekingStatusFilter.tsx` (65 lines): 3 chips, `NOT_LOOKING` absent from chip options (only in comment). Filter wired through `TalentPoolClient.tsx` → `useTalentPool` → `params.set("seekingStatus", ...)` → route whitelist validation. |
| 5 | Public engineer profile `/e/[slug]` displays availability status pill below name; NOT_LOOKING suppresses pill; 404 gate intact; no PII leaked | VERIFIED (automated); human confirm needed for runtime | `src/app/e/[slug]/page.tsx` (199 lines): server component (no `"use client"`), `SEEKING_STATUS_PILL` Record with `NOT_LOOKING: null`, `seekingStatus: true` in Prisma select, 3-gate where clause confirmed, no `email/githubUrl/linkedinUrl` in select. |

**Score:** 5/5 truths verified (automated artifact checks pass; 4 human runtime confirmations needed)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | SeekingStatus enum + User.seekingStatus field | VERIFIED | Lines 99-146: enum with 3 members, field `seekingStatus SeekingStatus @default(OPEN_TO_OFFERS)` |
| `src/constants/enums.ts` | TypeScript SeekingStatus enum + SEEKING_STATUS_VALUES tuple | VERIFIED | Line 234: `export enum SeekingStatus` with all 3 string values; `SEEKING_STATUS_VALUES` with `as const` |
| `src/lib/validations/seeker.schema.ts` | Optional `seekingStatus` Zod field in SeekerSettingsSchema | VERIFIED | Line 141: `seekingStatus: z.nativeEnum(SeekingStatus).optional()` |
| `src/app/api/seeker/settings/route.ts` | GET returns seekingStatus; PATCH conditionally writes it | VERIFIED | Line 239: `seekingStatus: true` in select; lines 345-346: conditional spread in PATCH data |
| `src/app/api/recruiter/talent/route.ts` | Optional seekingStatus filter + field on every card | VERIFIED | Lines 58-60: param parse + whitelist; line 131: where filter; line 165: select; line 242: card field |
| `src/modules/seeker/settings/components/SeekingStatusToggle.tsx` | 3-state segmented control (min 60 lines) | VERIFIED | 98 lines, `"use client"`, export `SeekingStatusToggle`, all 3 brand-token classes, PATCH mutation |
| `src/app/seeker/settings/page.tsx` | Mounts SeekingStatusToggle above HideProfileToggle | VERIFIED | Line 20: import; line 126: `<SeekingStatusToggle />` before `<HideProfileToggle>` at line 127 |
| `src/modules/recruiter/talent/types/talent.types.ts` | LockedEngineer.seekingStatus + TalentFilters.seekingStatus | VERIFIED | Line 22: non-optional `seekingStatus: SeekingStatus`; line 47: optional `seekingStatus?: SeekingStatus` |
| `src/modules/recruiter/talent/queries/use-talent-pool.ts` | Passes seekingStatus param to API | VERIFIED | Line 19: `if (filters.seekingStatus) params.set("seekingStatus", filters.seekingStatus)` |
| `src/modules/recruiter/talent/components/EngineerCard.tsx` | Colored dot rendered next to engineer name | VERIFIED | SEEKING_STATUS_DOT_CLASS + SEEKING_STATUS_LABEL Records defined; dot span before `<h3>` |
| `src/modules/recruiter/talent/components/TalentPoolClient.tsx` | SeekingStatusFilter mounted; filter state wired | VERIFIED | Line 7: import; line 48: `<SeekingStatusFilter>` mounted with `filters.seekingStatus` |
| `src/modules/recruiter/talent/components/SeekingStatusFilter.tsx` | 3 chips (All/Actively Looking/Open to Offers); NOT_LOOKING absent | VERIFIED | 65 lines, `"use client"`, 3 CHIP_OPTIONS, no `NOT_LOOKING` value in options |
| `src/app/e/[slug]/page.tsx` | Public profile server component with seeking-status pill (min 120 lines) | VERIFIED | 199 lines, no `"use client"`, SEEKING_STATUS_PILL Record, all 3 gate conditions, no PII in select |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SeekingStatusToggle.tsx` | `PATCH /api/seeker/settings` | `fetch` with `method: "PATCH"` + `{ seekingStatus, name }` body | WIRED | PATCH call present in `useUpdateSeekingStatus` mutation |
| `src/app/seeker/settings/page.tsx` | `SeekingStatusToggle` | `<SeekingStatusToggle />` in visibility section | WIRED | Line 126, above HideProfileToggle at line 127 |
| `src/app/api/seeker/settings/route.ts` | `prisma.user.update` | Conditional spread `seekingStatus` in `$transaction` data | WIRED | Lines 345-346 confirmed |
| `src/app/api/recruiter/talent/route.ts` | `prisma.user.findMany` where clause | `...(seekingStatus !== null ? { seekingStatus } : {})` | WIRED | Line 131 confirmed |
| `TalentPoolClient.tsx` | `useTalentPool` query | `filters.seekingStatus` passed via filters state object | WIRED | `setFilters((prev) => ({ ...prev, seekingStatus: next }))` pattern confirmed |
| `use-talent-pool.ts` | `/api/recruiter/talent` | `params.set("seekingStatus", filters.seekingStatus)` | WIRED | Line 19 confirmed |
| `EngineerCard.tsx` | `engineer.seekingStatus` | Inline dot span with `SEEKING_STATUS_DOT_CLASS[engineer.seekingStatus]` | WIRED | Confirmed in file |
| `src/app/e/[slug]/page.tsx` | `prisma.user.findFirst` | Server query with `seekingStatus: true` in select + 3-gate where | WIRED | Lines 37-65 confirmed |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SeekingStatusToggle.tsx` | `settings?.seekingStatus` | `useSeekerSettingsData()` → GET `/api/seeker/settings` → `prisma.user.findUnique` with `seekingStatus: true` | Yes — DB column queried | FLOWING |
| `EngineerCard.tsx` | `engineer.seekingStatus` | `useTalentPool` → GET `/api/recruiter/talent` → `eng.seekingStatus` from `prisma.user.findMany` | Yes — DB column selected + mapped to card | FLOWING |
| `src/app/e/[slug]/page.tsx` | `engineer.seekingStatus` | Direct `prisma.user.findFirst` server-side with `seekingStatus: true` | Yes — server component queries DB directly | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires authenticated sessions (seeker and recruiter) and live Neon DB. No public unauthenticated entry points testable without live DB. Routed to human verification.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AVAIL-01 | 13-01 | SeekingStatus enum + User.seekingStatus in Prisma schema; TS mirror | SATISFIED | Schema lines 99-146; enums.ts line 234; DB push blocked but schema + TS both implemented |
| AVAIL-02 | 13-02, 13-03 | PATCH /api/seeker/settings persists seekingStatus; seeker settings UI toggle | SATISFIED | API route wired; SeekingStatusToggle.tsx exists and mounted |
| AVAIL-03 | 13-04 | Colored availability dot on talent pool cards | SATISFIED | EngineerCard.tsx dot span with SEEKING_STATUS_DOT_CLASS |
| AVAIL-04 | 13-02, 13-04 | Recruiter talent filter by seekingStatus; GET /api/recruiter/talent honors param | SATISFIED | Route whitelist+where filter confirmed; SeekingStatusFilter chip row wired |
| AVAIL-05 | 13-05 | Public profile /e/[slug] shows availability status label below name | SATISFIED | page.tsx 199 lines; conditional pill for ACTIVELY_LOOKING and OPEN_TO_OFFERS; NOT_LOOKING suppressed |

All 5 AVAIL requirements are accounted for. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `13-01-SUMMARY.md` | `npx prisma db push` blocked — P1001 environment error at implementation time | WARNING | Live Neon DB may not have `User.seekingStatus` column yet. All downstream code is correctly implemented but will fail at runtime until `db push` is manually executed from an environment with Neon connectivity. |

No TODO/FIXME/placeholder comments found in any phase-13-owned source files. No `return null`/empty stubs detected. No `style={{}}` inline styles or arbitrary hex colors in new files.

---

### Human Verification Required

#### 1. Seeker Settings Toggle — Runtime Round-Trip

**Test:** Sign in as a seeker, navigate to `/seeker/settings`. Locate the "Seeking Status" card under "Who can find me". Click each of the three buttons ("Actively Looking", "Open to Offers", "Not Looking") in sequence.
**Expected:** Each click triggers a PATCH to `/api/seeker/settings`; a `toast.success("Seeking status updated")` notification appears; after page refresh, the last-clicked button is still selected (data persisted in DB).
**Why human:** Requires authenticated browser session; mutation + query-invalidation + toast display cannot be verified programmatically.

#### 2. Recruiter Talent Pool — Filter Chip and Dot Rendering

**Test:** Sign in as a paid recruiter, navigate to `/recruiter/talent`. Confirm the "Availability" chip row appears above the existing filter bar with three chips: All, Actively Looking, Open to Offers. Click "Actively Looking".
**Expected:** Card list re-fetches with `?seekingStatus=ACTIVELY_LOOKING`; only engineers with a green dot are shown. Click "All" — engineers with mixed dots (green, yellow, gray) reappear. Each card consistently shows a small colored dot left of the engineer name.
**Why human:** Requires paid-recruiter session, live DB rows with varying seekingStatus, and visual confirmation of dot colors.

#### 3. Public Engineer Profile — Pill Visibility

**Test:** Navigate to `/e/{verified-engineer-slug}` without logging in. Confirm the page renders a full profile (not 404). Check that an ACTIVELY_LOOKING engineer shows a green "Actively Looking" pill below the name. Using the engineer's settings, change to NOT_LOOKING and reload the public URL.
**Expected:** NOT_LOOKING produces no pill; everything else (name, role, score, skills, etc.) remains visible.
**Why human:** Requires a DB row meeting all 3 gate conditions (VERIFIED + profilePublic=true + hiddenUntil null/past); pill suppression for NOT_LOOKING cannot be verified without a live render.

#### 4. Neon DB Push — Live Column Existence

**Test:** From a local dev environment with Neon connectivity, run `npx prisma db push`. Alternatively, confirm the column exists: `SELECT column_name, column_default FROM information_schema.columns WHERE table_name='User' AND column_name='seekingStatus';`
**Expected:** Column `seekingStatus` exists with default `OPEN_TO_OFFERS`. `npx prisma db push` exits 0 or reports "already in sync".
**Why human:** The `db push` was blocked with P1001 (Neon unreachable) in the execution environment during Plan 13-01. This is a known environment limitation documented in STATE.md. All code is correct — the column just needs to be applied before production deploy.

---

### Gaps Summary

No code gaps found. All 5/5 must-haves are verified at the artifact level (exists, substantive, wired, data-flowing). The single non-code issue — Neon DB push blocked at implementation time — is classified as a human verification item rather than a code gap, because the schema change is correctly written and the Prisma client is regenerated; the only remaining action is running `db push` from an environment with DB connectivity.

---

_Verified: 2026-05-26T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
