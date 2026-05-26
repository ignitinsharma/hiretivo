---
phase: 09-verification-system
reviewed: 2026-05-17T12:00:00Z
re-verified: 2026-05-26
depth: standard
files_reviewed: 42
files_reviewed_list:
  - prisma/schema.prisma
  - src/app/(auth)/seeker/onboarding/page.tsx
  - src/app/actions/onboarding/seeker.ts
  - src/app/admin/verification/[id]/AdminReviewForm.tsx
  - src/app/admin/verification/[id]/AiRecommendationBanner.tsx
  - src/app/admin/verification/[id]/VerificationReviewRightColumn.tsx
  - src/app/admin/verification/[id]/page.tsx
  - src/app/admin/verification/page.tsx
  - src/app/api/admin/verification/[id]/review/route.ts
  - src/app/api/admin/verification/[id]/route.ts
  - src/app/api/admin/verification/queue/route.ts
  - src/app/api/applications/route.ts
  - src/app/api/cron/verification-stale/route.ts
  - src/app/api/engineer/check-slug/route.ts
  - src/app/api/engineer/data-export/route.ts
  - src/app/api/engineer/github-scan/route.ts
  - src/app/api/engineer/profile/public-consent/route.ts
  - src/app/api/engineer/verification/route.ts
  - src/app/seeker/dashboard/page.tsx
  - src/app/seeker/settings/page.tsx
  - src/app/seeker/verification/page.tsx
  - src/constants/billing.ts
  - src/constants/enums.ts
  - src/constants/pricing.ts
  - src/constants/verification-reasons.ts
  - src/lib/emails/verification-approval.ts
  - src/lib/emails/verification-rejection.ts
  - src/lib/onboarding/progress.ts
  - src/lib/validations/onboarding.schema.ts
  - src/lib/validations/seeker-onboarding.schema.ts
  - src/middleware.ts
  - src/modules/admin-verification/components/AdminReviewPanel.tsx
  - src/modules/admin-verification/components/ApproveForm.tsx
  - src/modules/admin-verification/components/RejectForm.tsx
  - src/modules/admin-verification/components/VerificationQueue.tsx
  - src/modules/admin-verification/components/VerificationQueueRow.tsx
  - src/modules/jobs/components/ApplyButton.tsx
  - src/modules/seeker-dashboard/components/ProfilePublicConsentModal.tsx
  - src/modules/seeker-dashboard/components/VerificationStatusCard.tsx
  - src/modules/seeker-onboarding/components/StepPreferences.tsx
  - src/modules/seeker-onboarding/types/seeker-onboarding.types.ts
  - src/modules/seeker/settings/components/SettingsSidebar.tsx
  - src/modules/verification/components/VerificationFlow.tsx
  - src/modules/verification/components/steps/StepBioProjects.tsx
  - src/modules/verification/components/steps/StepGitHub.tsx
  - src/modules/verification/components/steps/StepSlugSubmit.tsx
  - src/modules/verification/components/steps/StepVideo.tsx
  - src/store/use-seeker-onboarding-store.ts
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: passed
score: 15/15 must-haves verified
overrides_applied: 0
gaps: []
gap_resolution_notes:
  PIVS-08: "Rejection reasons count now 16 (was 14). Fixed during Phase 10-12 work."
  PIVS-10: "ApplyButton wired in JobDetailHeader, JobDetailSidebar, JobCard, SavedJobsList, RecommendedJobsList. Job detail page fetches User.verificationStatus and passes to both components. Fixed during Phase 10-12 work."
  PIVS-11: "AiReviewNotice component present in VerificationStatusCard, renders in PENDING/VERIFIED/REJECTED states. Fixed during Phase 10-12 work."
  PIVS-12: "admin-job.service.ts, AdminJobList.tsx, src/app/companies/, src/app/api/admin/companies/ all deleted. src/modules/companies/ empty folder deleted 2026-05-26. No /companies/ route links remain."
  PIVS-13: "writeRateLimiter changed from 10 to 5 req/min in src/lib/rate-limit.ts 2026-05-26. Now matches CLAUDE.md 5 req/min write-op requirement."
---

# Phase 09: Code Review Report — Verification System

**Reviewed:** 2026-05-17T12:00:00Z
**Depth:** standard
**Files Reviewed:** 42
**Status:** issues_found

## Summary

The verification system implementation is structurally sound with strong patterns: consistent use of Zod validation on API boundaries, Prisma transactions for atomicity, rate limiting on all API routes, and proper admin email gating. The admin review flow (queue page, detail page, review POST, stale cron, email notifications) is well-architected with audit trails.

**However, there are two critical issues that break core flows.** The seeker-side GitHub scan in `StepGitHub.tsx` calls the wrong API endpoint with the wrong payload — the entire first step of verification submission is non-functional. Additionally, HTTP GET endpoints that mutate database state violate REST semantics and create race conditions.

---

## Critical Issues

### CR-01: GitHub scan from verification flow sends wrong payload — broken submission

**File:** `src/modules/verification/components/steps/StepGitHub.tsx:43-46`
**Issue:** The `handleScan` function in the seeker verification flow sends `{ githubUrl }` to `/api/engineer/github-scan`, but that API endpoint requires `{ engineerId: z.string().cuid() }`. The Zod validation rejects the request with a 400 response, the `.json()` parse on the client throws, and the catch block sets `scanStatus` to `"timeout"`. The entire first step of the verification submission flow is non-functional — every submission attempt will show "TIMEOUT: GitHub scan timed out. You can continue for manual review."

Additionally, the client expects a response shape with `status: "success" | "private" | "not_found" | "timeout"` and `publicRepoCount`, but the API returns `status: "ok" | "inaccessible" | "private" | "error"` with `data` and `aiSummary` fields. The response shapes are completely mismatched.

**Root cause:** The `StepGitHub.tsx` component was written to call a GitHub scan API that doesn't exist in this form. The actual `/api/engineer/github-scan` endpoint was designed for the admin panel's `VerificationReviewRightColumn.tsx`, which correctly sends `{ engineerId }`.

**Fix:** Either:
- Option A: Create a lighter, seeker-facing GitHub check endpoint that accepts a GitHub URL and just validates the profile exists (no AI analysis), or
- Option B: Have StepGitHub call a separate simple endpoint like `/api/github/check-profile?username=...` that only validates the URL points to a real GitHub profile without the full AI scan overhead.

Given the admin scan endpoint also transitions status to `IN_REVIEW` (line 236-239 of `github-scan/route.ts`), it would be incorrect to call it from the verification flow anyway. A dedicated lightweight check endpoint is the right approach.

**Severity:** Critical — blocks all new verification submissions from seekers.

---

### CR-02: GET endpoints mutate database state — HTTP semantics violation + race condition

**Files:**
- `src/app/admin/verification/[id]/page.tsx:108-113`
- `src/app/api/admin/verification/[id]/route.ts:118-123`

**Issue:** Both the server component (page) and the GET API endpoint transition `PENDING` → `IN_REVIEW` as a side effect of a read operation. This violates HTTP GET semantics (GET must be idempotent and safe — no side effects). It also creates a race condition: if two admins open the same PENDING submission simultaneously, both could see it transition to `IN_REVIEW`, and both could attempt to review it.

The server component does this:
```ts
if (engineer.verificationStatus === VerificationStatus.PENDING) {
  await prisma.user.update({
    where: { id: params.id },
    data: { verificationStatus: VerificationStatus.IN_REVIEW },
  });
}
```

The GET API handler does the same mutation.

**Fix:** Move the `PENDING → IN_REVIEW` transition into the review submission POST handler or a dedicated PATCH endpoint. The admin panel should use a separate API call (e.g., `POST /api/admin/verification/[id]/claim`) to lock the submission for review. The GET endpoints should be pure reads.

```ts
// In the review POST (review/route.ts), add a status check:
if (engineer.verificationStatus === VerificationStatus.PENDING) {
  await prisma.user.update({
    where: { id: params.id },
    data: { verificationStatus: VerificationStatus.IN_REVIEW },
  });
}
```

**Severity:** Critical — race condition can lead to duplicate reviews or lost updates.

---

## Warnings

### WR-01: Duplicate auth guard in skipSeekerResumeOnboarding

**File:** `src/app/actions/onboarding/seeker.ts:220-222`
**Issue:** The `session.user.role !== UserRole.SEEKER` check is duplicated immediately. Lines 220-222 are identical to 217-219. The second check is dead code — it will never execute.

```ts
if (session.user.role !== UserRole.SEEKER) {
  return { success: false, error: "Forbidden" };
}
if (session.user.role !== UserRole.SEEKER) { // <-- DEAD CODE
  return { success: false, error: "Forbidden" };
}
```

**Fix:** Remove the duplicate block (lines 220-222).

---

### WR-02: Old slate color tokens in seeker settings UI

**Files:**
- `src/app/seeker/settings/page.tsx:136,138`
- `src/modules/seeker/settings/components/SettingsSidebar.tsx:25,32,35`

**Issue:** These components reference `slate-*` Tailwind colors instead of project brand tokens. Per CLAUDE.md: "NEVER use slate-*, gray-* when brand tokens exist."

```tsx
// page.tsx line 136
<h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>

// SettingsSidebar.tsx line 25
<p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">

// SettingsSidebar.tsx line 32
className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100"
```

**Fix:** Replace with brand tokens:
| Current | Should be |
|---------|-----------|
| `text-slate-900` | `text-brand-foreground` |
| `text-slate-500` | `text-brand-foreground-muted` |
| `text-slate-400` | `text-brand-foreground-secondary` |
| `text-slate-600` | `text-brand-foreground` |
| `hover:bg-slate-100` | `hover:bg-brand-surface` |

---

### WR-03: Old color tokens in StepPreferences onboarding component

**File:** `src/modules/seeker-onboarding/components/StepPreferences.tsx:80-88`
**Issue:** Uses generic Tailwind tokens (`bg-primary/10`, `text-primary`, `text-foreground`, `text-muted-foreground`) instead of brand tokens. These are likely from the default shadcn/ui theme and do not match the DESIGN.md specification.

```tsx
<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
  <Target className="w-6 h-6 text-primary" />
</div>
<h2 className="text-2xl font-semibold text-foreground">
<p className="text-muted-foreground">
```

**Fix:** Replace with brand tokens:
| Current | Should be |
|---------|-----------|
| `bg-primary/10` | `bg-brand-surface` (or `bg-brand-primary/10` if intentional) |
| `text-primary` | `text-brand-primary` |
| `text-foreground` | `text-brand-foreground` |
| `text-muted-foreground` | `text-brand-foreground-muted` |

---

### WR-04: Inconsistent project validation in submission step

**File:** `src/modules/verification/components/steps/StepSlugSubmit.tsx:117-128`
**Issue:** The `canSubmit` check uses `.some()` to validate projects, meaning only one project out of three needs to pass validation:
```ts
formData.topProjects.some(
  (project) =>
    project.name.trim() &&
    project.description.trim() &&
    project.url.trim().startsWith("https://"),
);
```

This is inconsistent with `StepBioProjects.tsx:78-90`, which validates ALL projects with `.forEach()`. The API schema also requires all projects to be valid (`projectSchema` requires `.min(1)` on all fields). If a user adds incomplete projects and then proceeds, they'll get a server-side validation error rather than a clear client-side message.

**Fix:** Change `.some()` to `.every()`:
```ts
formData.topProjects.every(
  (project) =>
    project.name.trim() &&
    project.description.trim() &&
    project.url.trim().startsWith("https://"),
);
```

---

### WR-05: Redundant manual validation duplicates Zod schemas

**File:** `src/lib/validations/seeker-onboarding.schema.ts:65-109`
**Issue:** The file exports Zod schemas (`step1Schema` through `step4Schema`) AND manual validation functions (`validateSeekerStep1`, `validateSeekerStep2`, `validateSeekerStep4`) that duplicate the same logic. The manual functions reimplement field checks that Zod already handles via `safeParse`. This creates two maintenance surfaces that can drift apart.

For example, the Zod schema validates salary min/max bounds, but the manual function only checks `typeof !== "number"`. If the Zod bounds change, the manual function won't catch the new rules.

**Fix:** Replace manual validation callers with `stepXSchema.safeParse(data)`:
```ts
// Instead of:
const validation = validateSeekerStep4({...});
if (!validation.valid) { ... }

// Use:
const parsed = step4Schema.safeParse({...});
if (!parsed.success) {
  setErrors(parsed.error.issues.map(i => i.message));
}
```

Alternatively, remove the manual functions entirely and keep only the Zod schemas (DRY principle).

---

### WR-06: getProjectSummaries does not validate project object shape

**File:** `src/app/admin/verification/[id]/page.tsx:21-27`
**Issue:** The `getProjectSummaries` function accepts any non-null object as a valid project:
```ts
function getProjectSummaries(value: unknown): ProjectSummary[] {
  if (!Array.isArray(value)) return [];
  return value.filter((project): project is ProjectSummary => {
    return typeof project === "object" && project !== null;
  });
}
```

The type predicate `project is ProjectSummary` is a lie — it only confirms `typeof === "object"`, not that the object actually has `name`, `description`, or `url` fields. If `topProjects` contains objects with unexpected shapes, the UI will silently show "Untitled project" and empty descriptions.

**Fix:** Add actual field validation:
```ts
function getProjectSummaries(value: unknown): ProjectSummary[] {
  if (!Array.isArray(value)) return [];
  return value.filter((project): project is ProjectSummary => {
    if (typeof project !== "object" || project === null) return false;
    const p = project as Record<string, unknown>;
    return typeof p.name === "string" || typeof p.description === "string" || typeof p.url === "string";
  });
}
```

---

## Info

### IN-01: Empty profileSlug produces broken URL in approval email

**File:** `src/app/api/admin/verification/[id]/review/route.ts:178` → `src/lib/emails/verification-approval.ts:38-40`
**Issue:** When `profileSlug` is null/empty on the user record, the approval email renders `hiretivo.com/e/` — a broken URL. The email template's fallback check only covers the missing-slug case with generic text (`"your public Hiretivo profile"`), but the route passes `engineer.profileSlug ?? ""` which never yields null.

```ts
// review/route.ts line 178
profileSlug: engineer.profileSlug ?? "",
// This converts null → ""   (empty string, not null)
```

The email template checks `safeProfileSlug` as a truthy value. Empty string is falsy, so the fallback text is actually used correctly. However, passing `""` instead of `null` is misleading — it relies on truthy/falsy coercion rather than explicit null checking.

**Fix:** Either pass `null` and check `null` in the email, or add a comment explaining the empty string → falsy coercion.

---

### IN-02: Prisma JsonValue import used but could be more explicit

**File:** `src/lib/onboarding/progress.ts:1`
**Issue:** Imports `Prisma` from `@prisma/client` just for the `JsonValue` and `InputJsonValue` types. This is a clean pattern but worth noting that `InputJsonValue` accepts any JSON-serializable value, which is less type-safe than using a Zod schema for draft validation. The `parseOnboardingDraft` function already handles this by validating the runtime shape, so the risk is minimal.

---

### IN-03: `VERIFICATION_REQUIRED` error code in application route is hardcoded as a string

**File:** `src/app/api/applications/route.ts:71`
**Issue:** The error code `"VERIFICATION_REQUIRED"` is a string literal rather than a shared const. If the frontend checks for this code, any typo or refactor would silently break the contract:
```ts
code: "VERIFICATION_REQUIRED",
```

**Fix:** Define as a shared constant:
```ts
export const APPLICATION_ERROR_CODES = {
  VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED",
} as const;
```

---

_Reviewed: 2026-05-17T12:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
