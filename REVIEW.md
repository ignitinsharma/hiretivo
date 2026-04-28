---
phase: page-header-component
reviewed: 2026-04-27T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/components/layout/PageHeader.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Code Review: PageHeader Component

**Reviewed:** 2026-04-27
**Depth:** standard
**Files Reviewed:** 1
**Commit:** `97e4ab9` — `feat(layout): add reusable PageHeader component`
**Status:** issues_found

## Summary

A clean, well-structured presentational component that correctly implements the spec from the plan. The component is 22 lines, properly typed, uses brand tokens via Tailwind, and correctly handles the optional `subtitle` prop. It is a Server Component by default (no `"use client"`), which is correct for a pure presentational component. The implementation matches the plan exactly.

Two warnings were identified: a pre-existing Tailwind config issue that causes the subtitle color to render incorrectly, and a missing `aria-label` on the wrapper `<div>`. Two info-level suggestions cover test coverage and export pattern consistency.

## Strengths

1. **Correct component placement** — `src/components/layout/` is the right location per CLAUDE.md §5.1 (headers, footers, layout elements).
2. **Proper typing** — Uses `interface` for props (CLAUDE.md §4), all props explicitly typed, no `any`.
3. **Brand token usage** — Uses `text-brand-heading` and `text-brand-muted-secondary` instead of hardcoded hex values (CLAUDE.md §16.2, DESIGN.md §16.1).
4. **`cn()` utility** — Correctly uses `cn()` for className merging with base `mb-8` margin (CLAUDE.md §12.2).
5. **Server Component** — No `"use client"` directive, which is correct since this is a pure presentational component with no state, effects, or browser APIs (CLAUDE.md §5.3).
6. **File size** — 22 lines, well under the ~80-line limit (CLAUDE.md §15.6).
7. **Typography matches DESIGN.md** — h1 uses the Sub-heading scale (40px, font-black/900, leading-[0.85]), subtitle uses Body Semibold (18px, font-semibold/600, leading-[1.44], tracking-[-0.108px]) — both with `[font-feature-settings:'calt']`.
8. **Conditional subtitle rendering** — `{subtitle && (...)}` pattern is clean and correct.

## Issues

### Warnings

#### WR-01: Subtitle color renders wrong due to swapped Tailwind tokens

**File:** `src/components/layout/PageHeader.tsx:16`

**Issue:** The component uses `text-brand-muted-secondary` for the subtitle. Per CLAUDE.md §16.2 and DESIGN.md §2, the subtitle ("tertiary text") should be `#454745` (Warm Dark). However, `tailwind.config.ts:84-85` has the values **swapped**:

```ts
// tailwind.config.ts — CURRENT (wrong)
muted: '#454745',            // Should be #868685 (Gray)
"muted-secondary": '#868685', // Should be #454745 (Warm Dark)
```

This means `text-brand-muted-secondary` resolves to `#868685` (Gray) instead of the intended `#454745` (Warm Dark). The subtitle will appear lighter/more muted than the design specifies.

**Why it matters:** The subtitle won't match the visual design. The color hierarchy (heading → body → muted → muted-secondary) is inverted for the last two levels.

**Fix:** Correct the token values in `tailwind.config.ts`:
```ts
// tailwind.config.ts — CORRECTED
muted: '#868685',             // Gray — muted/secondary text
"muted-secondary": '#454745', // Warm Dark — tertiary text
```

The PageHeader component itself is using the correct token name — the fix is in the config, not the component.

#### WR-02: Missing semantic role on wrapper element

**File:** `src/components/layout/PageHeader.tsx:11`

**Issue:** The wrapper `<div>` has no `role` attribute. Since this component represents a page heading section, adding `role="banner"` or `role="heading"` with `aria-level` would improve accessibility. At minimum, the `<h1>` already provides semantic heading structure, but the container could benefit from `role="region"` with `aria-labelledby` pointing to the title.

**Why it matters:** Screen readers can better navigate page structure when regions are properly labeled. This is a presentational layout component that will be reused across pages — accessibility should be built in from the start.

**Fix:**
```tsx
<div className={cn("mb-8", className)} role="region" aria-labelledby="page-title">
  <h1 id="page-title" className="...">
    {title}
  </h1>
  ...
</div>
```

Or, if `id` conflicts are a concern (multiple PageHeaders on a page), accept an optional `id` prop:
```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  id?: string;
}
```

### Info

#### IN-01: No test file

**File:** `src/components/layout/PageHeader.tsx`

**Issue:** No corresponding test file exists (e.g., `PageHeader.test.tsx`). The project has a test infrastructure (2 existing test files found), but this component is untested.

**Why it matters:** Even presentational components benefit from tests that verify: title renders, subtitle renders when provided, subtitle does not render when omitted, className is merged correctly.

**Fix:** Add a basic test:
```tsx
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  });

  it("renders subtitle when provided", () => {
    render(<PageHeader title="Dashboard" subtitle="Manage your jobs" />);
    expect(screen.getByText("Manage your jobs")).toBeInTheDocument();
  });

  it("does not render subtitle when omitted", () => {
    const { container } = render(<PageHeader title="Dashboard" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("applies custom className", () => {
    render(<PageHeader title="Dashboard" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
```

#### IN-02: Component not yet consumed anywhere

**File:** `src/components/layout/PageHeader.tsx`

**Issue:** The component is defined but not imported or used anywhere in the codebase (confirmed via grep). This is expected for a newly created reusable component, but it means the component's real-world utility hasn't been validated yet.

**Why it matters:** Unused components can drift from actual needs. The component should be integrated into at least one page to confirm the API is ergonomic and the styling works in context.

**Fix:** Integrate into a page that needs a header (e.g., a dashboard or listing page) as a follow-up task.

## Recommendations

1. **Fix the Tailwind token swap** (WR-01) as a separate commit — this affects any component using `text-brand-muted` or `text-brand-muted-secondary`, not just PageHeader.
2. **Add accessibility attributes** (WR-02) before widespread adoption — it's easier to add now than retrofit across multiple pages.
3. **Consider extracting typography classes** into a shared constant if more components use the Sub-heading or Body Semibold patterns. CLAUDE.md §15.2 recommends extracting repeated className strings. Currently the typography strings are only in this file, but if they appear in 2+ files, extract them.
4. **No barrel import** — the component is correctly imported directly from its file path (CLAUDE.md §3.1). No barrel file exists for `src/components/layout/`, which is correct.

## Assessment

**Ready to merge?** Yes, with minor fixes recommended.

**Reasoning:** The PageHeader component is well-implemented, correctly typed, follows project conventions, and matches the plan spec. The two warnings are not blockers — WR-01 is a pre-existing config issue (not introduced by this change) and WR-02 is an accessibility enhancement. The component is production-ready as a presentational building block.
