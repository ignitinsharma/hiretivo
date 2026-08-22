# Pagination Optimization — End-to-End Plan (Dedicated Server, UX Friendly, Scale-Ready)

> Branch: `feature/browse-eager-resume` from `staging`. Status: PLAN ONLY — no code until you approve. This is the "think bigger, maximum effort, cover every edge case" plan you asked for. Breaking changes are called out first per AGENTS.md.

## Breaking Changes Disclosure — Read First

**What will break if we execute this plan as written:**

1. **GET /api/applications shape changes** — Today `src/app/api/applications/route.ts:209` returns `{data, pagination}` with server `page/limit=10/25/50` (dedicated server, done in `e0a3460`). Front-end `ApplicationsTable.tsx:88` already expects `{data, pagination}` via `getMyApplicationsPaginated`. **Any other caller that still uses `getMyApplications()` expecting a flat `SeekerApplicationItem[]` (e.g., `src/modules/seeker/applications/components/ApplicationList.tsx:20` and `src/modules/tracker-v2/components/KanbanBoard.tsx:202`) will receive the new paginated shape if we unify the endpoint to always paginate.** Mitigation: keep `getMyApplications()` backward-compatible (unwrap `data` when called without params) and keep `getMyApplicationsPaginated` for the table. No silent breakage — we keep both, old callers untouched.

2. **QueryKey changes** — `ApplicationsTable` moves from `["applications"]` to `["applications", page, limit, q, tab]` with `keepPreviousData`. Any code that does `queryClient.invalidateQueries({queryKey: ["applications"]})` today invalidates all pages (prefix match). After, it still works (prefix invalidation), but `queryClient.getQueryData(["applications"])` without page will return `undefined`. We will update all `invalidate`/`getQueryData` sites to use prefix invalidation, not exact key.

3. **URL shape changes** — `ApplicationsTable` will sync `?page&limit&q&tab` via `router.replace`. Direct links to `/dashboard?page=2` will now deep-link to page 2 (new behavior). No break, but bookmarked old `/dashboard` without params will default to `page=1, limit=10, tab=All`.

**If you approve, we proceed. If you want to keep `GET /api/applications` non-paginated for Kanban, we keep both.**

---

## Goals

- **Immediate:** Fix `Next` double-click (old `isLoading` only) with dark skeleton `!bg-gray-300` + `keepPreviousData` + `Loading page 2…` overlay, `1 2 3 4 Next` simple as you asked, `Rows per page 10/25/50` (10 default) with `Showing 1–10 of 27`.
- **Scale:** Dedicated server `page/limit` (`skip/take` now, `cursor` fallback at `>500` rows) so `100+` applications per seeker (power users) stay `10` payload/DB per page, not `27→100` full fetch. Front-end `slice 10/27` already fixed lengthy page DOM, now fix fetch size.
- **UX friendly:** Search debounce, persisted `limit`, shareable URL, prefetch next page on hover, `Generating→Generated` poll stays live, `0 rows` / `1 page` / `page>totalPages` edges handled, no second click.

## Non-Goals

- No new table for `Browse` or `TopJobRow` — they already server paginated (`GET /api/seeker/browse` cursor, `GET /api/seeker/feed` matched). This plan is `ApplicationsTable` only.
- No `react-window` virtualization — only if `100` rows measure jank (defer, keep `IntersectionObserver` if we ever switch table to infinite scroll).
- No new ATS or cron changes.

---

## Current State Diagnosis (on `feature/browse-eager-resume:9621780`)

- **Server:** `GET /api/applications` now server paginated (`page/limit/q/tab`, `prisma $transaction [count, findMany skip/take orderBy createdAt desc]`) — dedicated server, done.
- **Client:** `ApplicationsTable.tsx:88` `useQuery(["applications", page, limit, q, tab], getMyApplicationsPaginated, placeholderData: keepPreviousData, staleTime 5s, gcTime 10m, refetchInterval: hasGenerating?3000:false)` with `isFetching && isPlaceholderData` overlay `Loading page X…` + `opacity-40` old rows, `prefetchNext` on `Next` hover, `URL sync ?page&limit&q&tab`, `Rows per page 10/25/50` + `1 2 3 4 Next` footer. **Before this, `isLoading` only showed skeleton on first mount, so `Next` kept old `page 1` data until second click — fixed by `keepPreviousData`.**
- **Remaining gaps for "more better":** `Pagination.tsx` still fixed `1..4` (no `…` ellipsis when `totalPages=10`), no `Jump to page` input, `Search` not debounced (`q` fires `GET ?q=Z` → `Zo` → `Zoo` 3 fetches), `limit` not persisted in `localStorage`, `tab` `Applied/Reviewing…` not deep-linked beyond URL, `Generating` poll `3s` still fetches `10` not `1` delta.

---

## Architecture — Optimized + UX Friendly

**API:** Keep `page/limit` (simple `1 2 3 4` you asked). Add **cursor fallback at scale**: when `total >500`, server translates `page→cursor` chain (`nextCursor base64{createdAt,id}` like `browse` does) — `skip` is `O(page*limit)` at `page 50` (`skip 500`), cursor is `O(limit)`. Keep `page` UI, store `cursors[]` client-side, so `Next` is `where createdAt < cursor`. No API shape change for `page/limit` callers — server does translation.

**Client:**
- `useQuery` stays `keepPreviousData` + `gcTime 10m` (100 users paging `1→2→1` hits cache) + `staleTime 5s` (fast `Generating→Generated` poll).
- `useDeferredValue(search)` + `300ms debounce` for `q` → one `GET ?q=Zoom` not three.
- `localStorage limit` persist (`limit 10` default, you asked `10/25/50`) + URL `?page&limit&q&tab` shallow `router.replace` (shareable, back button).
- `prefetchQuery` on `Next` **and** on `Rows per page` hover (`10→25`) + on `1..4` number hover, so `10 by 10` feels instant.
- `select` to transform `data` once, `useTransition` for `setPage` so `1→2` stays responsive while `isFetching` (no freeze).
- `Pagination.tsx:18` upgrade: ellipsis `1 … 4 5 6 … 10` when `totalPages>5`, plus `Jump to page [__] Go` input for `27→100` jump without clicking `Next` 9×. Keep `Rows per page [10 ▼]` as you asked.
- **UX:** `isLoading && !isPlaceholderData` → `5` dark `!bg-gray-300` `Skeleton` rows `h-4` matching `Company/Resume/Status/Applied`; `isFetching && isPlaceholderData` → old `10` rows `opacity-40` + centered `Loading page 2…` `Loader2` overlay (you approved `skeleton` + `optimized`), buttons `1 2 3 4 Next` `disabled={isFetching}`. `0 rows` → `No applications` + `Browse jobs →`; `1 page` → controls disabled.

**File Touch (same branch, sequential commits):**
- `src/app/api/applications/route.ts` — keep server `page/limit` (add cursor fallback comment, no shape change)
- `src/services/application.service.ts` — keep `getMyApplications()` array + `getMyApplicationsPaginated(params)` paginated (backward compat)
- `src/modules/dashboard/components/ApplicationsTable.tsx` — `keepPreviousData` + `isFetching` overlay + `prefetch` + `useDeferredValue` search + `localStorage limit` + `Pagination` ellipsis + `Jump to`
- `src/components/shared/Pagination.tsx` — ellipsis + Jump input (reuse)
- `docs/superpowers/plans/2026-08-23-pagination-optimization-plan.md` — this file

---

## Edge Cases Covered (so we don’t repeat)

- **Auth:** `401` unauth → `No applications` + `Browse jobs →` link, no `Generating` poll.
- **Empty:** `total 0` → empty `No applications yet` (not skeleton), `total 0` after `search` → `No match` + `Clear filters`.
- **Single page:** `total 7, limit 10` → `totalPages 1` → `1` active, `Next/Prev` disabled, no `…`.
- **Page > totalPages (after Pass/Apply removes):** `useEffect if page>totalPages setPage(totalPages)` clamp, no blank page.
- **Rows per page change `10→50`:** `setPage(1)` + `updateUrl`, `isFetching` overlay, `Showing 1–25 of 27` correct.
- **Search `q`:** debounced `300ms`, `setPage(1)`, server `OR title/company contains insensitive`, `0 match` → empty.
- **Tab `Applied/Reviewing…`:** server `where status: tab`, `setPage(1)`, `count` filtered, `totalPages` recalculated.
- **Generating:** `ensure` creates `GENERATING` immediately → `invalidate ["applications"]` → `poll 3s` while `hasGenerating` → `isFetching` overlay keeps old rows dark until `READY` → next poll shows `Generated` + `Download` enabled; `FAILED` shows `Resume Failed` + `Retry` that re-calls `generate`; `SUBMITTED` shows `Applied`.
- **Quota:** `quota !allowed` before `ensure` → `openPaidFeatureModal` (no DB row, no remove), no `Generating`.
- **Network:** `isFetching` disabled buttonsprevent double `Next` spam; `onError` toast + `previous` rollback for optimistic `Pass`/`Apply` removes.
- **URL:** `?page=2&limit=25&q=Zoom&tab=Applied` deep-links to same `10` rows, back button restores `page 1`, `localStorage limit` wins over default on reload.
- **Scale:** `27` now, `100+` later → server `10` not `100` JSON/DB, `gcTime 10m` cache, `prefetch` next page, cursor fallback at `500`.

---

## Tasks (sequential on `feature/browse-eager-resume`, no code until you approve)

- **Task 17d.1 — Pagination UX:** `Pagination.tsx` ellipsis `1 … 4 5 6` when `totalPages>5` + `Jump to [__] Go` + `Rows per page` `localStorage` persist + `Search` `useDeferredValue 300ms`.
- **Task 17d.2 — Table polish:** `ApplicationsTable` `keepPreviousData` dark skeleton `!bg-gray-300` already, add `useTransition` for `setPage` + `select` transform + `aria-busy` + `prefetch` for `Rows per page` hover.
- **Task 17d.3 — Verify:** `pnpm exec tsc --noEmit` `0`, `pnpm dev` → `Next` shows overlay once then `11–20` without second click, `10/25/50` persists, `Search Zoom` debounced `1` fetch, `Generating` poll `3s` → `Generated`, `tsc` clean, `400px` pagination wraps.

---

## Verification (before push)

- `pnpm exec tsc --noEmit` zero, `pnpm lint` zero new.
- Manual `pnpm dev`: `Browse Apply` → card gone → `/dashboard` first row `Generating` spinner → `3s` → `Generated`; `Rows per page 10` `1–10 of 27`, `25` → `1–25 of 27`, `page 2` → `11–20` overlay once, `page 3` → `21–27`, `Search Zoom` → `1` result, `Jump to 3` → `21–27`, back button to `2`.

---

**Breaking change recap:** Only `GET /api/applications` now requires `?page&limit` for paginated callers — `ApplicationList`/`KanbanBoard` stay on `getMyApplications()` array (no break). If you approve, we execute `17d.1→17d.3` on `feature/browse-eager-resume` and keep `Browse`/`Top` already done. If you want cursor now for `100+`, say so and we add it in the same branch.

**Approve `go` in build to execute, or tell me what to adjust in this plan.**
