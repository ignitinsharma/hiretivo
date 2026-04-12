# Plan 04: SEO/OG Metadata — Summary

**Status:** Complete (partial — auth pages inherit from layout)
**Type:** implementation

## What was built

Shared `generatePageMetadata()` utility in `src/lib/metadata.ts` that generates consistent metadata with Open Graph and Twitter Card tags for any public page.

## Changes Made

| File | Action | Detail |
|------|--------|--------|
| `src/lib/metadata.ts` | Created | Shared utility with OG, Twitter, canonical URL support |
| `src/app/page.tsx` | Modified | Added metadata: "Skills-Based Remote Job Portal" |
| `src/app/about/page.tsx` | Modified | Added metadata: "About Us" |
| `src/app/(public)/how/page.tsx` | Modified | Added metadata: "How It Works" |
| `src/app/(public)/pricing/page.tsx` | Modified | Updated existing metadata to use shared utility + OG tags |

## Pages NOT modified

- Auth pages (`/seeker/login`, `/seeker/register`, `/recruiter/login`, etc.) — these are Client Components and Next.js does not support `export const metadata` in client components. They inherit metadata from the parent layout.
- Authenticated routes (recruiter/seeker dashboards) — out of scope per plan
- Job detail page (`/jobs/[id]`) — Server Component but uses Prisma data; would need `generateMetadata()` with DB call — deferred as it requires additional complexity

## API
```ts
generatePageMetadata({
  title: string,       // Page title (prepended to site name)
  description?: string, // Meta description
  path?: string,        // URL path for canonical + OG
  ogImage?: string,     // Custom OG image URL
  noIndex?: boolean,    // robots noindex
}): Metadata
```
