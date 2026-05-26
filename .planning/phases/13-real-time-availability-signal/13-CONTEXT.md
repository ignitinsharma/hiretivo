# Phase 13: Real-time Availability Signal — Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Source:** Product brainstorm — v1.1 Trust & Conversion milestone
**Depends on:** Phase 10 (talent pool cards, /api/recruiter/talent), Phase 9 (User model, engineer settings)

<domain>
## Phase Boundary

Phase 13 adds a seeking status signal to the engineer → recruiter communication layer. Engineers set one of three states; recruiters see it on cards and can filter by it. The goal is to eliminate wasted outreach on passive engineers — the #1 recruiter churn driver at early marketplace stage.

**In scope:**
- `SeekingStatus` Prisma enum + `User.seekingStatus` field (default OPEN_TO_OFFERS)
- Engineer settings 3-state toggle with brand-consistent colored indicators
- PATCH /api/seeker/settings extended to persist seekingStatus
- Talent pool card colored availability dot
- Talent pool filter UI (All / Actively Looking / Open to Offers)
- GET /api/recruiter/talent extended with optional `seekingStatus` query param filter
- Public profile /e/[slug] availability label

**Out of scope:**
- "Last active" timestamp (not in this phase)
- Push/email notifications to engineers when status changes
- Availability status affecting match score weighting (deferred)
- Mobile-specific availability push notifications

</domain>

<decisions>
## Implementation Decisions (LOCKED)

### SeekingStatus Enum
```prisma
enum SeekingStatus {
  ACTIVELY_LOOKING
  OPEN_TO_OFFERS
  NOT_LOOKING
}
```
Add to `User` model:
```prisma
seekingStatus SeekingStatus @default(OPEN_TO_OFFERS)
```
Default is OPEN_TO_OFFERS — not ACTIVELY_LOOKING — so existing users don't flood the "actively looking" filter with stale data.

### Display Logic — NOT same as hiddenUntil
`hiddenUntil` removes engineer from talent pool entirely (null check in query).
`seekingStatus` is a visible signal within the pool — NOT_LOOKING engineers still appear in default "All" view. Recruiters can filter them out. Engineers who set NOT_LOOKING are NOT hidden.

### Color Coding (brand tokens from DESIGN.md)
| Status | Dot Color | Label | Token |
|--------|-----------|-------|-------|
| ACTIVELY_LOOKING | green | Actively Looking | `bg-brand-success` (#16a34a) |
| OPEN_TO_OFFERS | yellow | Open to Offers | `bg-yellow-400` (no brand token for yellow) |
| NOT_LOOKING | gray | Not Looking | `bg-brand-foreground-secondary` (#9ca3af) |

Dot size: `w-2.5 h-2.5 rounded-full` inline with engineer name.

### Filter UI on Talent Pool
Filter options: All | Actively Looking | Open to Offers
(NOT_LOOKING intentionally excluded from filter chips — recruiters can see them in "All" but won't specifically filter FOR them. If they want to hide NOT_LOOKING, that's a future enhancement.)

Default: All (no seekingStatus filter applied).

### API Extension — /api/recruiter/talent
Add optional query param: `seekingStatus=ACTIVELY_LOOKING|OPEN_TO_OFFERS|NOT_LOOKING`
If absent → no filter (return all).
If present → add `where: { seekingStatus: { in: [param] } }` to Prisma query.

### Settings UI
In `/seeker/settings` page, add "Availability Status" section below existing profile fields.
Use a 3-button segmented control (not a dropdown) — easier to scan at a glance.
Label: "Seeking Status" with a subtitle: "Recruiters on Hiretivo can see this."

### Rate Limiting
PATCH /api/seeker/settings uses existing `writeRateLimiter` (5/min) — no change needed.
GET /api/recruiter/talent uses existing `dataFetchRateLimiter` (30/min) — no change needed.

### Public Profile
On `/e/[slug]`, show status below engineer name as a small pill:
- ACTIVELY_LOOKING: green pill "Actively Looking"
- OPEN_TO_OFFERS: yellow pill "Open to Offers"
- NOT_LOOKING: do NOT show (no signal to public; only show positive signals)

### Claude's Discretion
- Exact segmented control component implementation (can use shadcn RadioGroup styled as pills)
- Whether to add seekingStatus to the match notification email (probably yes — include in job-match-notification email if ACTIVELY_LOOKING)
- Prisma migration filename convention (follow existing pattern: `YYYYMMDDHHMMSS_add_seeking_status`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Enums
- `prisma/schema.prisma` — current User model, existing enums (VerificationStatus, PlanTier, etc.)
- `src/constants/enums.ts` — TypeScript enum definitions that mirror Prisma enums

### Talent Pool (read + modify)
- `src/app/api/recruiter/talent/route.ts` — existing GET handler; add seekingStatus filter param
- `src/app/recruiter/talent/page.tsx` — existing talent pool page; add filter chips UI

### Talent Card (read + modify)
- Locate talent pool card component (search `src/modules/recruiter/` or `src/components/shared/`) — add colored dot

### Engineer Settings (read + modify)
- `src/app/seeker/settings/page.tsx` — existing settings page; add availability section
- `src/app/api/seeker/settings/route.ts` — existing PATCH handler; add seekingStatus field

### Public Profile (read + modify)
- `src/app/e/[slug]/page.tsx` — existing public profile page; add status pill

### Design System
- `DESIGN.md` — brand tokens, color palette, component patterns
- `CLAUDE.md` — styling priority ladder, mobile-first rules

### Prior Phase Patterns
- `.planning/phases/09-verification-system/09-01-PLAN.md` — schema change pattern
- `.planning/phases/10-talent-pool-public-profiles/10-02-PLAN.md` — talent pool API patterns

</canonical_refs>

<deferred>
## Deferred

- Availability affecting match score weight (would require reweighting formula in src/lib/match.ts)
- "Last active" timestamp display
- Email/push notification when engineer sets ACTIVELY_LOOKING
- NOT_LOOKING filter chip on talent pool (recruiters can see in All but can't specifically filter for NOT_LOOKING)
- Availability status in job-match-notification email (low priority for Phase 13)

</deferred>

---
*Phase: 13-real-time-availability-signal*
*Context gathered: 2026-05-26*
*Branch: feat/pivot-2.0*
