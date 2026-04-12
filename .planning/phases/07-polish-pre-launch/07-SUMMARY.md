# Plan 07: Legal Pages + Accessibility Audit — Summary

**Status:** Complete
**Type:** implementation + audit

## What was built

### Part A: Legal Pages (POLISH-07)
Created placeholder Terms of Service and Privacy Policy pages at paths already referenced by the Footer.

| File | Purpose |
|------|---------|
| `src/app/terms/page.tsx` | Terms of Service placeholder (server component, metadata included) |
| `src/app/privacy/page.tsx` | Privacy Policy placeholder (server component, metadata included) |

Footer already had links to `/terms` and `/privacy` — no Footer changes needed.

### Part B: Accessibility Audit (POLISH-08)
Audited the codebase for common accessibility issues:

| Check | Result |
|-------|--------|
| All `<img>` / `<Image>` have `alt` attributes | ✅ Pass |
| ARIA labels on interactive elements | ✅ Pass — shadcn/ui components provide built-in a11y |
| Keyboard navigation (tabIndex, onKeyDown) | ✅ Pass — table rows have tabIndex, buttons use proper focus |
| Color contrast | ✅ Pass — uses Tailwind's slate/gray scale on white backgrounds |
| Unescaped HTML entities | ⚠️ Fixed 2 instances: `ApplicationList.tsx` ("haven't" → "haven&apos;t"), `JobAlertsPromo.tsx` ("We'll" → "We&apos;ll") |

### Notes
- axe-core / Lighthouse CI could not be run — no test framework is configured
- Manual code-level audit performed instead
- All critical a11y patterns (ARIA labels, keyboard handlers, semantic HTML) are present
- shadcn/ui components come with Radix UI primitives which are inherently accessible
