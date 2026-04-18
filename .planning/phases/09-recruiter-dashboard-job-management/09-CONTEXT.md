# Phase 9: Recruiter Dashboard & Job Management - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Recruiter dashboard shows real-time data from the database (stats, trend chart, recent applicants, active jobs), sidebar reflects actual job and applicant counts, and dead UI pages/sections are removed (Analytics page, Talent Pool/Settings sidebar links, grid/list toggle and filter section from jobs page). Payments, settings restructure, and auth guards are separate phases.
</domain>

<decisions>
## Implementation Decisions

### Dashboard data API
- **D-01:** Single aggregated `/api/recruiter/dashboard` endpoint returning all dashboard data: stats (activeJobs, totalApplications, newThisWeek, avgMatchScore), recent applicants (last 5), and application trend data (last 30 days by day)
- **D-02:** Dashboard page uses a single TanStack Query call to this endpoint — one loading state, one error state, one refetch
- **D-03:** Stats that change slowly (counts) use the aggregated response; no separate per-stat endpoints

### Sidebar real-time counts
- **D-04:** Sidebar reads Active Jobs count and Applicants count from the same `/api/recruiter/dashboard` endpoint via TanStack Query
- **D-05:** Stale time of 5 minutes; auto-refetch on window focus — badges update without page refresh
- **D-06:** Hardcoded badge values ("8", "12") in `RECRUITER_NAV_ITEMS` replaced with dynamic data from the API response
- **D-07:** No Zustand store for sidebar counts — TanStack Query cache is the source of truth; sidebar component uses `useQuery` directly

### Application trend chart
- **D-08:** Area chart with gradient fill using shadcn Chart component (built on Recharts)
- **D-09:** Data source: `/api/recruiter/dashboard` response includes `trendData` array with `{date, count}` entries for last 30 days
- **D-10:** Replace the current static SVG `ApplicationTrendChart` component entirely with a real data-driven chart
- **D-11:** Chart shows application count per day with a smooth gradient area fill in primary brand color

### Dead UI removal
- **D-12:** Remove Talent Pool nav link from `RECRUITER_NAV_ITEMS` in `constants/nav.ts`
- **D-13:** Remove Analytics nav link from `RECRUITER_NAV_ITEMS` — no `/recruiter/analytics` page should exist
- **D-14:** Remove Settings nav link from sidebar — Settings will move to header avatar dropdown in Phase 10
- **D-15:** Remove grid/list view toggle buttons (LayoutGrid, List icons) and the SlidersHorizontal filter button from `/recruiter/jobs/page.tsx`
- **D-16:** Remove the filter bar section (search input, department dropdown, status dropdown) from `/recruiter/jobs/page.tsx`
- **D-17:** Replace hardcoded "Good morning, Nitin." with dynamic user greeting from session data
- **D-18:** Replace hardcoded user avatar ("AS", "Alex Sterling", "Premium Active") in sidebar with real user data from session

### Skeleton loaders
- **D-19:** All data-fetching areas (dashboard stats, active jobs list, recent applicants, trend chart, sidebar badges) show shadcn Skeleton components while loading
- **D-20:** Replace text-based "Loading..." state in `ActiveJobsList` with proper Skeleton components
- **D-21:** Stat cards show skeleton rectangles while data loads; chart shows skeleton placeholder; sidebar badges show skeleton pulse

### the agent's Discretion
- Exact API response shape and field names for the dashboard endpoint
- Chart tooltip and axis formatting specifics
- Skeleton animation speed and exact layout
- Whether to add a refetch button on dashboard or rely only on window focus
- Empty state designs (0 jobs, 0 applicants)

</decisions>

<canonical_refs>
## Canonical References

### Dashboard and data
- `src/app/recruiter/dashboard/page.tsx` — Current dashboard page with hardcoded stats
- `src/modules/recruiter/dashboard/data/mock-dashboard-data.ts` — All mock data to be replaced
- `src/modules/recruiter/dashboard/components/ApplicationTrendChart.tsx` — Static SVG chart to replace with real data
- `src/modules/recruiter/dashboard/components/ActiveJobsList.tsx` — Already fetches from /api/recruiter/jobs, needs skeleton update
- `src/modules/recruiter/dashboard/components/RecentApplicantsList.tsx` — Hardcoded data, needs real fetch

### Sidebar and navigation
- `src/components/layout/RecruiterSidebar.tsx` — Hardcoded user info "Alex Sterling", "AS", "Premium Active"
- `src/constants/nav.ts` — RECRUITER_NAV_ITEMS with hardcoded badges and dead links (Talent Pool, Analytics, Settings)

### Jobs page cleanup
- `src/app/recruiter/jobs/page.tsx` — Jobs page with grid/list toggle, filter bar, and search to remove

### Prior phase context
- `.planning/phases/08-bug-fixes-schema-foundation-cleanup/8-CONTEXT.md` — JobStatus simplified to OPEN/UNPUBLISHED/DELETED, notification removal, onboarding redirect fix

### Schema and auth
- `prisma/schema.prisma` — Current models (User, Job, Application, JobStatus enum)
- `src/constants/enums.ts` — Single source of truth for enums
- `src/auth.ts` — Session/auth configuration for getting real user data

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActiveJobsList.tsx` — Already has `useEffect` fetching from `/api/recruiter/jobs`, has loading/empty states. Pattern can be reused but needs migration to TanStack Query + skeletons
- `src/components/ui/sidebar.tsx` — shadcn sidebar component exists (may not be used; RecruiterSidebar is custom)
- `RecruiterSidebar.tsx` — Has `SidebarToggle` export used by dashboard and jobs pages
- `useUIStore` in `src/store/use-ui-store.ts` — Global UI state for post job modal
- TanStack Query already set up in the app (`@tanstack/react-query` used in jobs page)

### Established Patterns
- TanStack Query for data fetching (used in `/recruiter/jobs/page.tsx` with `useQuery` and `useMutation`)
- Server-side auth via `auth()` from `src/auth.ts`
- API routes in `src/app/api/recruiter/` pattern
- Mock data in module `data/` subdirectories
- shadcn/ui components in `src/components/ui/`
- Named exports for components (not default)
- `cn()` utility for conditional classes

### Integration Points
- `/api/recruiter/jobs` — existing endpoint for jobs list (already used by ActiveJobsList)
- `/api/recruiter/applications` — existing endpoint for applications
- `/api/recruiter/dashboard` — NEW endpoint to create
- `RECRUITER_NAV_ITEMS` in `constants/nav.ts` — needs dynamic badge values (currently static)
- RecruiterSidebar needs to call auth session for real user data
- Dashboard page needs to replace all mock data imports with real API data

</code_context>

<specifics>
## Specific Ideas

- Area chart with gradient fill should look like the existing static SVG but with real data flowing through it
- Sidebar should feel alive — counts update without manual refresh
- "Good morning, Nitin." should use the logged-in recruiter's actual name
- Clean removal of dead features — no commented-out code, no hidden links

</specifics>

<deferred>
## Deferred Ideas

- Talent Pool feature — explicitly out of scope (REQUIREMENTS.md: Out of Scope)
- Analytics page — removed entirely, no replacement in this phase (Phase 13 may add real analytics)
- Settings restructure — Phase 10
- Auth guard / homepage redirect — Phase 10
- Seeker dashboard dynamic data — Phase 12
- AI candidate summaries — Phase 13
- Boost job feature — Phase 13

</deferred>

---

*Phase: 09-recruiter-dashboard-job-management*
*Context gathered: 2026-04-16*