---
status: partial
phase: 13-real-time-availability-signal
source: [13-VERIFICATION.md]
started: 2026-05-26T00:00:00Z
updated: 2026-05-26T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Seeker settings toggle round-trip
expected: Click each status button → toast appears → selection persists after page refresh
result: [pending]

### 2. Recruiter talent pool filter + colored dots
expected: Availability chip row renders above filter bar; "Actively Looking" chip re-fetches with ?seekingStatus=ACTIVELY_LOOKING and shows only green-dot engineers
result: [pending]

### 3. Public profile pill visibility
expected: /e/{slug} (VERIFIED + profilePublic=true) shows green pill for ACTIVELY_LOOKING, no pill for NOT_LOOKING
result: [pending]

### 4. Neon DB push
expected: npx prisma db push run from environment with Neon connectivity; User.seekingStatus column exists in live DB
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
