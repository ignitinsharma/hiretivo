---
phase: 12-ai-review-feedback
plan: 01
subsystem: admin-verification
tags: [ai, github-scan, claude-haiku, openrouter, eu-ai-act, audit-trail]
requires:
  - Phase 09 — Verification system (schema, admin routes, rejection reasons)
provides:
  - GITHUB_ANALYSIS_PROMPT in ai-prompts.ts
  - POST /api/engineer/github-scan (AI-powered admin endpoint)
  - AiRecommendationBanner (5-state AI recommendation display)
  - AdminReviewForm (AI pre-fill + override capture + audit trail)
affects:
  - src/app/admin/verification/[id]/page.tsx — replaced AdminReviewPanel with AI-integrated layout
  - src/app/api/admin/verification/[id]/review/route.ts — added aiSummary/overrideReason fields
tech-stack:
  added: []
  patterns:
    - "Sanitized AI input: inputSnapshot with typed fields only (no raw repo descriptions)"
    - "EU AI Act audit trail: aiSummary JSON persisted on VerificationReview"
    - "Skip conditions: AI scan returns skip statuses (inaccessible/private) rather than failing"
key-files:
  created:
    - src/app/admin/verification/[id]/AiRecommendationBanner.tsx
    - src/app/admin/verification/[id]/AdminReviewForm.tsx
    - src/app/admin/verification/[id]/VerificationReviewRightColumn.tsx
  modified:
    - src/lib/ai-prompts.ts
    - src/app/api/engineer/github-scan/route.ts
    - src/app/admin/verification/[id]/page.tsx
    - src/app/api/admin/verification/[id]/review/route.ts
decisions: []
metrics:
  duration: ~22 minutes
  completed: 2026-05-16T20:20:00Z
  tasks: 2
  commits: 2
  files_changed: 7
---

# Phase 12 Plan 01: AI-Assisted Admin Verification Review

**One-liner:** Builds the AI-assisted admin verification flow — when an admin opens `/admin/verification/[id]`, the page triggers a GitHub scan via Claude Haiku (OpenRouter), then pre-fills the admin review form with AI recommendation, confidence, score suggestion, and pre-checked rejection reasons. Admin overrides are captured and logged in `VerificationReview.aiSummary` for the EU AI Act audit trail.

## Tasks Executed

### Task 1 — GITHUB_ANALYSIS_PROMPT + AI-powered github-scan route (d2ad77a)

- Added `GITHUB_ANALYSIS_PROMPT`, `GithubAnalysisOutput` interface, and `GITHUB_ANALYSIS_CONFIG` to `src/lib/ai-prompts.ts`
- Replaced the existing placeholder `github-scan` route (`src/app/api/engineer/github-scan/route.ts`) with the AI-powered admin version:
  - Admin auth via `isAdminSession` + 403 Forbidden guard
  - Rate limited at 5 req/min per IP using a dedicated `githubScanLimiter`
  - Zod validation on `engineerId` (`z.string().cuid()`)
  - Fetches GitHub profile + repos from GitHub API with optional `GITHUB_TOKEN`
  - **Skip conditions**: returns `"inaccessible"` if GitHub URL missing or 404; returns `"private"` if no public repos
  - Builds sanitized `inputSnapshot` with typed fields only (repos count, languages, lastCommit, starCount) — no raw repo descriptions (prompt injection guard, T-12-01-04)
  - Calls Claude Haiku via OpenRouter with `response_format: json_object`
  - Validates AI output with Zod (recommendation is `APPROVE`|`REJECT`, confidence 0-1, scoreSuggestion 0-100)
  - Persists LOCKED `aiSummary` shape to `VerificationReview.aiSummary`
  - Sets `User.verificationStatus` to `IN_REVIEW`
  - Returns 200 for all states (ok, inaccessible, private, error) so UI shows graceful fallbacks

### Task 2 — Admin UI: AI recommendation banner + pre-filled form (4261b87)

- **`AiRecommendationBanner.tsx`** — 5-state display component:
  - `loading`: Spinner + "Scanning GitHub profile…"
  - `inaccessible` / `private`: Amber banner "AI scan skipped — review manually"
  - `error`: Amber banner "AI scan failed — review manually"
  - `ok` with recommendation: Green banner (APPROVE ≥50%), Red banner (REJECT ≥50%), Amber banner (confidence <50%)
  - Shows AI summary text and "AI Draft" badge

- **`AdminReviewForm.tsx`** — AI pre-filled review form with React Hook Form + Zod:
  - Decision radio pre-selected from `aiOutput.recommendation`
  - Score input pre-filled with `aiOutput.scoreSuggestion` ("AI Draft" badge on both)
  - Rejection reason checkboxes pre-checked from `aiOutput.reasons` (only visible when REJECT)
  - Notes textarea (free text)
  - **Override reason input** shown automatically when admin changes the AI-recommended decision — stored in `aiSummary.overrideReason`
  - Submits to `POST /api/admin/verification/[id]/review` with full review data + aiSummary

- **`VerificationReviewRightColumn.tsx`** — Client data-fetching wrapper:
  - Fires `POST /api/engineer/github-scan` on mount with `{ engineerId }`
  - Manages banner status (loading → ok/inaccessible/private/error)
  - Passes `aiOutput` and `aiSummaryMeta` to AdminReviewForm
  - Skips scan if `aiSummary` already exists (re-opened review)

- **`page.tsx`** — Updated with `flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_2fr] lg:gap-8` layout:
  - Left column: Engineer profile card (unchanged from Phase 09)
  - Right column: AI recommendation banner stacked above review form
  - Fetches `aiSummary` from latest review to determine if scan should be skipped

- **Review API route** (`src/app/api/admin/verification/[id]/review/route.ts`):
  - Extended Zod schema to accept `overrideReason` (max 500 chars) and `aiSummary` (LOCKED audit trail shape)
  - Both fields persisted on `VerificationReview.aiSummary` for APPROVED and REJECTED paths

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None found.

## Threat Flags

None. All threats from the plan's threat register are mitigated:
- T-12-01-01 (Spoofing): Session + isAdminSession check ✓
- T-12-01-02 (Tampering): Zod cuid() validation ✓
- T-12-01-03 (Info Disclosure): GITHUB_TOKEN env var, never logged ✓
- T-12-01-04 (Injection): inputSnapshot only (no raw descriptions) ✓
- T-12-01-05 (DoS): Rate limited 5 req/min per IP ✓
- T-12-01-06 (Elevation): isAdminSession check ✓
- T-12-01-07 (Tampering): overrideReason max 500 chars ✓
- T-12-01-08 (Repudiation): aiSummary stored on VerificationReview ✓

No new network endpoints, auth paths, or trust-boundary-crossing schemas introduced.

## Verification Results

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` | ✅ Passed (0 errors) |
| `GITHUB_ANALYSIS_PROMPT` exported | ✅ Found in `src/lib/ai-prompts.ts` |
| `POST /api/engineer/github-scan` | ✅ Rate limited, admin auth, POST export |
| `AiRecommendationBanner` used in page | ✅ Via `VerificationReviewRightColumn` |
| `overrideReason` captured in form | ✅ 15 references across form + page + API |

## Self-Check: PASSED
