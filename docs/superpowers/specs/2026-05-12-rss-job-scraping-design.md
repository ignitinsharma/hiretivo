# RSS Job Import - Corrected Design Spec

Status: APPROVED FOR PLANNING
Date: 2026-05-12

## Problem

Hiretivo needs real remote jobs in the seeker experience before recruiter supply is strong. The import must not break the existing job flows, and it must not introduce unsafe scraping, public cron execution, fake admin credentials, or untrusted HTML risks.

## Decision

Use the existing `Job` table for imported jobs. Keep `Job.recruiterId` required. For each imported employer, create or reuse a hidden internal recruiter user and `RecruiterProfile`, then create a normal external-apply job attached to that hidden recruiter.

This is the safest v1 because the current app already assumes:

- `Job` belongs to a recruiter.
- Company name and logo are read from `job.recruiter.recruiterProfile`.
- Seeker feed, saved jobs, job detail, match scoring, and external apply confirmation all operate on `Job`.
- Visible seeker jobs use `JobStatus.OPEN`.

## Rejected Approaches

### Separate `ScrapedJob` Display Table

Rejected for v1. It creates a second job model that must be threaded through seeker feed, job detail, saved jobs, dismissals, external apply, match scoring, and analytics. The current code is not shaped for that.

### Nullable `Job.recruiterId`

Rejected. Current feed and detail paths dereference `job.recruiter.recruiterProfile`. Making recruiter nullable creates a broad runtime-crash risk across existing code.

### New Public Statuses Like `ACTIVE`

Rejected for v1. Current public job queries use `JobStatus.OPEN`. Imported jobs should become visible by using the existing `OPEN` status. Review queue can use existing `DRAFT` for v1.

### Admin User and Admin UI in V1

Rejected for v1. Adding an `ADMIN` role requires auth, middleware, session, navigation, authorization, and operational controls. The May 12 plan included a default admin password, which is not acceptable. V1 should avoid admin auth entirely.

## Scope

V1 imports jobs from allowlisted RSS/API sources, starting with RemoteOK. It validates and normalizes each job, extracts skills, creates hidden employer profiles, stores jobs as `DRAFT`, and exposes a protected cron/import endpoint. A reviewer can approve imported jobs by changing them from `DRAFT` to `OPEN` through a protected maintenance path or a later admin UI.

## Data Model

Add `JobSource`:

```prisma
enum JobSource {
  RECRUITER
  RSS
  MANUAL
}
```

Add fields to `Job`:

```prisma
source     JobSource @default(RECRUITER)
sourceName String?
sourceUrl  String?   @unique
importedAt DateTime?
```

Rules:

- Recruiter jobs keep `source = RECRUITER` and `sourceUrl = null`.
- Imported jobs use `source = RSS`.
- `sourceUrl` is the normalized source job page URL and is unique for race-safe duplicate prevention.
- Existing `recruiterId` remains required.
- Imported jobs start as `DRAFT`.
- Approved imported jobs use existing `status = OPEN`.

## Hidden Employer Profile Strategy

Imported jobs need a recruiter relationship because current app flows depend on it.

For each imported employer:

1. Normalize company name.
2. Generate an internal email like `rss+<company-slug>@hiretivo.internal`.
3. Upsert a `User` with role `RECRUITER`, no password, verified email, and onboarding complete.
4. Upsert a `RecruiterProfile` with `companyName`.
5. Attach imported jobs to that hidden recruiter.

These internal users are not login accounts. No default password is created.

## Import Flow

1. Vercel Cron calls `POST /api/cron/import-jobs`.
2. Route requires `CRON_SECRET`; missing secret returns 500 and does no work.
3. Route validates `Authorization: Bearer ${CRON_SECRET}` using constant-time comparison.
4. Route checks `RSS_IMPORT_ENABLED === "true"`.
5. Import service fetches enabled sources.
6. Source fetchers only request configured allowlisted hosts.
7. Feed items normalize into `ImportedJobCandidate`.
8. Source URLs are normalized by dropping UTM/tracking params, lowercasing host, and removing fragments.
9. Existing `sourceUrl` rows are skipped.
10. Details are scraped best-effort from the same allowlisted host.
11. Description HTML is sanitized and truncated before saving.
12. Skills come from source tags first, then AI fallback.
13. Jobs with no usable skills are skipped because they cannot match seekers.
14. Job, hidden employer, and `JobSkill` rows are created transactionally.
15. New jobs are saved as `DRAFT`.
16. Approved jobs are changed to `OPEN`.

## Security Requirements

### Cron Auth

- `CRON_SECRET` is mandatory in production and local execution.
- Never fallback to `local-dev-secret` for this route.
- Missing `CRON_SECRET` must fail closed.
- Use the existing constant-time comparison pattern from current cron routes.

Vercel sends cron auth as a `Bearer` authorization header when `CRON_SECRET` is configured.

### SSRF Protection

Server-side request forgery (SSRF) means our server fetches an attacker-controlled URL and accidentally reaches internal services. To prevent it:

- Source configs must define exact allowed hosts.
- Fetch helpers must accept only `http:` and `https:`.
- Fetch helpers must reject localhost, loopback, private IP ranges, link-local IPs, and metadata IPs.
- Fetch helpers must use `redirect: "manual"` and reject cross-host redirects.
- Source detail scraping must stay on the source allowlist.
- No user-entered source URL is fetchable in v1.

### XSS Protection

Imported HTML is untrusted. Use the existing `src/lib/utils/html-sanitizer.ts` DOMPurify wrapper instead of regex sanitization. Do not render unsanitized source HTML.

### Prompt Injection Boundary

Source job descriptions are untrusted LLM input. The AI skill extractor must:

- Ask only for a JSON array of skill names.
- Ignore instructions inside the job description.
- Parse with a tolerant JSON parser.
- Return `[]` on malformed output.
- Never execute, store, or display AI text beyond normalized skill names.

### External Apply Safety

- `externalApplyUrl` must be the normalized source job URL.
- Only `https` URLs are allowed for imported jobs.
- Apply flow uses the existing external apply confirmation UX.
- The public copy must not call sourced jobs "verified partner" unless that source has a real verification process.

## Source Policy

Start with RemoteOK only.

Each source config includes:

- `id`
- `name`
- `feedUrl`
- `allowedHosts`
- `userAgent`
- `maxNewJobsPerRun`
- `enabled`

Rate and etiquette:

- Use a product-identifying User-Agent with contact email.
- Limit to 50 new jobs per source per run.
- Add source-level delay.
- Continue on per-job failures.
- Do not add LinkedIn, Indeed, or sources requiring authentication in v1.

## Job Mapping

| Field | Imported Value |
| --- | --- |
| `title` | Cleaned source title |
| `description` | Sanitized scraped description, fallback sanitized feed description |
| `jobType` | Inferred, default `FULL_TIME` |
| `workType` | `REMOTE` unless source clearly says otherwise |
| `status` | `DRAFT` until approved, then `OPEN` |
| `applyType` | `EXTERNAL` |
| `externalApplyUrl` | normalized source job URL |
| `publishedAt` | source date, fallback now |
| `source` | `RSS` |
| `sourceName` | source config name |
| `sourceUrl` | normalized source job URL |
| `importedAt` | now |
| `salaryMin/salaryMax/currency` | parsed only when confident |
| `category` | source category or inferred broad category |
| `experienceLevel` | inferred only when obvious |

## Skill Policy

Skills are required for imported jobs because Hiretivo's core value is match scoring.

Skill candidates come from:

1. Source tags.
2. Scraped page tags.
3. AI extraction fallback.

Normalize by:

- Trim whitespace.
- Collapse spaces.
- Dedupe case-insensitively.
- Map common aliases like `ReactJS -> React`, `NodeJS -> Node.js`, `Postgres -> PostgreSQL`.
- Reject soft skills and sentence fragments.
- Use existing `Skill` rows first.
- Create new skills only when the normalized name is 2-50 characters and passes the allowlist rules.
- Attach imported skills as `SkillLevel.INTERMEDIATE`.

If no usable skills remain, skip the job.

## Review and Approval

V1 does not need a full admin UI. It must provide a safe way to review:

- Imported jobs are `DRAFT`.
- Reviewer can inspect imported drafts through a protected maintenance script or later admin route.
- Approval means changing `status` to `OPEN`.
- Rejection means `status` remains `DRAFT` or changes to an existing non-public status if one is already available.

Do not add `ADMIN` role in v1 unless a separate auth design is approved.

## Edge Cases Covered

### Feed and Source

- Source unavailable, malformed, empty, or rate-limited.
- Feed item missing title, URL, company, tags, or description.
- Feed repeats the same item in one run.
- Feed includes more than 50 new jobs.
- Source changes structure.
- Source URL contains tracking params or fragments.

### Scraping and Security

- Page blocks scraping.
- Page redirects.
- Redirect points to another host.
- Host resolves to private/internal IP.
- Description is empty after sanitization.
- HTML includes scripts, unsafe attributes, tracking pixels, or huge content.

### Database and Idempotency

- Same URL appears with query params, trailing slash, or UTM params.
- Concurrent cron runs race on the same source URL.
- Hidden company slug collides.
- Skills or job creation partially fails.
- Imported job has no usable skills.

### App Behavior

- Imported jobs match seekers through existing `JobSkill`.
- Imported jobs appear in seeker feed only after `OPEN`.
- Job detail renders sanitized content and existing company profile fields.
- External apply confirmation still works.
- Saved jobs and dismissed jobs continue to work because imported jobs are normal `Job` records.

## Testing Requirements

Automated tests must cover:

- URL normalization.
- Source host allowlist and SSRF rejection.
- HTML sanitization.
- Skill normalization and alias mapping.
- AI response parsing.
- Duplicate source URL handling.
- Hidden employer upsert behavior.
- Import service partial failure handling.
- Cron auth fail-closed behavior.
- Imported jobs are created as `DRAFT`.
- Approved imported jobs use `OPEN` and appear in existing match/feed paths.

Manual verification must cover:

- Cron disabled does no work.
- Cron enabled imports RemoteOK jobs into `DRAFT`.
- Approval to `OPEN` makes a job appear in seeker feed.
- Job detail renders.
- External apply opens source URL.
- Duplicate run does not create duplicates.

## Out of Scope

- Full admin UI.
- `ADMIN` role.
- Separate `ScrapedJob` table.
- Nullable recruiter jobs.
- Playwright/browser scraping.
- LinkedIn, Indeed, or authenticated job boards.
- Company logo scraping/upload.
- Auto-closing stale imported jobs.
- Backfilling all match rows immediately after every import.

## Research Notes

- OWASP recommends allowlisting and network-layer controls for SSRF prevention.
- OWASP recommends DOMPurify for HTML sanitization and warns React cannot protect unsafe HTML or unsafe URLs by itself.
- Vercel Cron supports securing cron invocations with `CRON_SECRET` sent in the `Authorization` header.
