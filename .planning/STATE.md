# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Seekers see only the jobs they match — match score drives every surface, from feed ranking to per-skill breakdowns, creating a signal-rich experience that generic job boards can't offer.
**Current focus:** Phase 1 — Auth & Onboarding

## Current Position

Phase: 1 of 7 (Auth & Onboarding)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-04-01 — Roadmap created for milestone v1.0; 7 phases, 54 requirements mapped

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All UI pre-built via Stitch — never redesign, only wire logic, props, event handlers, server actions
- V1 plans manually set in DB — no Stripe/Razorpay; show upgrade prompts only
- Auth.js v5 (beta) for App Router compatibility
- Redis cache for match scores (15-min TTL) to avoid O(n×m) recomputation on every load
- Google Calendar OAuth tokens encrypted at rest (AES-256) before DB storage

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-04-01
Stopped at: Roadmap created — ready to plan Phase 1 (Auth & Onboarding)
Resume file: None
