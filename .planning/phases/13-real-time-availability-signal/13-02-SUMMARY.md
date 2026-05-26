---
phase: 13
plan: "13-02"
subsystem: api
tags: [seeking-status, seeker-settings, talent-pool, rate-limiting, zod-validation]
dependency_graph:
  requires: ["13-01"]
  provides: ["13-03"]
  affects: [src/lib/validations/seeker.schema.ts, src/app/api/seeker/settings/route.ts, src/app/api/recruiter/talent/route.ts]
tech_stack:
  added: []
  patterns: [conditional-spread-patch, whitelist-query-param, zod-nativeEnum]
key_files:
  created: []
  modified:
    - src/lib/validations/seeker.schema.ts
    - src/app/api/seeker/settings/route.ts
    - src/app/api/recruiter/talent/route.ts
decisions:
  - "seekingStatus not destructured from parsed.data in PATCH handler — intentionally routed to User not SeekerProfile"
  - "Unknown ?seekingStatus= values resolve to null (filter skipped) rather than 400 — safe degradation for future enum expansion"
  - "No new rate limiters introduced per CONTEXT.md decision; existing settingsRateLimiter and searchRateLimiter cover both routes"
metrics:
  duration: "12 minutes"
  completed: "2026-05-26"
  tasks_completed: 3
  files_modified: 3
---

# Phase 13 Plan 02: seekingStatus API Data Plumbing Summary

Data plumbing for `User.seekingStatus`: Zod schema accepts optional field, PATCH writes it conditionally, GET returns it, talent pool filters by it and surfaces it on every engineer card.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add optional seekingStatus to SeekerSettingsSchema | 1d4d381 | src/lib/validations/seeker.schema.ts |
| 2 | Wire seekingStatus into GET + PATCH /api/seeker/settings | 4468d3f | src/app/api/seeker/settings/route.ts |
| 3 | Add seekingStatus filter + card field to GET /api/recruiter/talent | 06041b3 | src/app/api/recruiter/talent/route.ts |

## Behavior Changes

### PATCH /api/seeker/settings
- Now accepts optional `seekingStatus` body field (`ACTIVELY_LOOKING | OPEN_TO_OFFERS | NOT_LOOKING`)
- Zod validates via `z.nativeEnum(SeekingStatus).optional()` — invalid values return 400
- `prisma.user.update` data block extended with conditional spread:
  `...(parsed.data.seekingStatus !== undefined ? { seekingStatus: parsed.data.seekingStatus } : {})`
- When `seekingStatus` is absent from body, no write occurs — existing value preserved (PATCH semantics)

### GET /api/seeker/settings
- `prisma.user.findUnique` select now includes `seekingStatus: true`
- Response payload includes `seekingStatus` automatically via `...userFields` spread in response body

### GET /api/recruiter/talent
- Accepts optional `?seekingStatus=` query param
- Whitelist validated against `SEEKING_STATUS_VALUES` tuple — raw value never passed to Prisma
- Unknown/missing values resolve to `null` (filter not applied, no error returned)
- `where` clause gains top-level `...(seekingStatus !== null ? { seekingStatus } : {})` filter on `User.seekingStatus`
- Every engineer card now includes `seekingStatus` field (non-nullable, DB default `OPEN_TO_OFFERS`)

## Key Links

| From | Via | To |
|------|-----|----|
| PATCH /api/seeker/settings | conditional spread in prisma.user.update data | User.seekingStatus column write |
| GET /api/recruiter/talent where clause | top-level UserWhereInput spread | User.seekingStatus column filter |
| GET /api/recruiter/talent select | seekingStatus: true | eng.seekingStatus on each card |

## Security / Threat Mitigations Applied

| Threat | Mitigation |
|--------|-----------|
| T-13-02-01: Tampering via invalid seekingStatus in PATCH body | `z.nativeEnum(SeekingStatus).optional()` — Zod rejects unknown strings with 400 |
| T-13-02-02: Elevation of privilege in PATCH | Existing role check (`role !== SEEKER` → 403) + `where: { id: session.user.id }` unchanged |
| T-13-02-04: Tampering via ?seekingStatus= query injection | `SEEKING_STATUS_VALUES` whitelist; null on unknown; raw value never touches Prisma |
| T-13-02-03: Info disclosure of seekingStatus to recruiter | Accepted by design; gated by `canAccessTalentPool` (403 for FREE plan) — unchanged |
| T-13-02-05: DoS on both routes | No new rate limiters; existing `settingsRateLimiter` (20/min) and `searchRateLimiter` cover routes |

## Rate Limiters Confirmation

**No new rate limiters introduced.** Both routes continue to use pre-existing limiters:
- PATCH /api/seeker/settings: `settingsRateLimiter` = `createRateLimiter("seeker-settings", 20, "1 m")`
- GET /api/recruiter/talent: `searchRateLimiter` (imported from `@/lib/rate-limit`)

## Sample curl Commands (Post-Deploy)

```bash
# Seeker: update seekingStatus to ACTIVELY_LOOKING
curl -X PATCH https://hiretivo.com/api/seeker/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: <seeker-session-cookie>" \
  -d '{"name":"Jane Doe","seekingStatus":"ACTIVELY_LOOKING"}'
# Expected: 200 { data: { success: true } }

# Seeker: read back current seekingStatus
curl -X GET https://hiretivo.com/api/seeker/settings \
  -H "Cookie: <seeker-session-cookie>"
# Expected: 200 { data: { ..., seekingStatus: "ACTIVELY_LOOKING", ... } }

# Recruiter: filter talent pool to ACTIVELY_LOOKING engineers
curl -X GET "https://hiretivo.com/api/recruiter/talent?seekingStatus=ACTIVELY_LOOKING" \
  -H "Cookie: <paid-recruiter-session-cookie>"
# Expected: 200 { data: { items: [{ ..., seekingStatus: "ACTIVELY_LOOKING", ... }], nextCursor: ... } }

# Recruiter: unknown filter value — no filter applied, all engineers returned
curl -X GET "https://hiretivo.com/api/recruiter/talent?seekingStatus=INVALID_VALUE" \
  -H "Cookie: <paid-recruiter-session-cookie>"
# Expected: 200 { data: { items: [...all engineers...], nextCursor: ... } }
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All three routes fully wired; `seekingStatus` reads and writes to the live `User.seekingStatus` DB column added in Plan 13-01.

## Threat Flags

None. All new surface is covered by the plan's threat model and mitigated as specified.

## Self-Check: PASSED

- [x] `src/lib/validations/seeker.schema.ts` modified — `seekingStatus: z.nativeEnum(SeekingStatus).optional()` present
- [x] `src/app/api/seeker/settings/route.ts` modified — `seekingStatus: true` in select + conditional spread in PATCH data
- [x] `src/app/api/recruiter/talent/route.ts` modified — import, param parse, where filter, select, card field all present
- [x] Commits 1d4d381, 4468d3f, 06041b3 exist in git log
- [x] `npx tsc --noEmit` — zero errors in all three target files
- [x] No new rate limiters introduced
- [x] Existing destructure `const { name, skillIds, ... } = parsed.data` unchanged
- [x] `canAccessTalentPool` gate unchanged in talent route
