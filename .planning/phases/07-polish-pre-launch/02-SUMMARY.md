# Plan 02: Skeleton Loaders — Summary

**Status:** Complete
**Type:** implementation

## What was built

Reusable `PageSkeleton` component created and applied to all async surfaces that needed loading states.

## Changes Made

| File | Action | Detail |
|------|--------|--------|
| `src/components/shared/PageSkeleton.tsx` | Created | Reusable skeleton with `lines`, `showHeader`, `showFilters` props. Uses shadcn `Skeleton` internally. |
| `src/app/recruiter/jobs/page.tsx` | Modified | Replaced plain text "Loading jobs..." with `<PageSkeleton lines={5} showHeader={false} />` in table body. |
| `src/app/recruiter/applications/page.tsx` | Modified | Added early return guard with `<PageSkeleton lines={8} showHeader={true} showFilters={true} />` when either stats or applications query is loading. |
| `src/app/jobs/[id]/loading.tsx` | Created | Next.js `loading.tsx` pattern for streaming SSR — renders `<PageSkeleton lines={6} showHeader={true} />`. |

## Pages NOT modified (already have loading states)

- `src/app/seeker/dashboard/page.tsx` — child `RecommendedJobsList` already handles loading with Skeleton
- `src/app/seeker/applications/page.tsx` — child `ApplicationList` already has `ApplicationListSkeleton`
- `src/app/recruiter/talent/page.tsx` — uses mock data, no async fetching

## API
```ts
interface PageSkeletonProps {
  lines?: number;        // default: 5
  showHeader?: boolean;  // default: true
  showFilters?: boolean; // default: false
}
```
