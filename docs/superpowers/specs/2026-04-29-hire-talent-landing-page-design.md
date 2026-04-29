# Hire Talent Landing Page Design

## Summary

Create a public recruiter-focused landing page at `/hire-talent`. The page should sit between the public header's "Hire Talent" CTA and recruiter registration, giving hiring teams a clear product preview before they create an account.

The chosen direction is dashboard-first: lead with a polished glimpse of Hiretivo's recruiter workspace, then explain how skill-based matching, applicant management, job analytics, and talent discovery help recruiters hire remote talent.

## Goals

- Add a distinct public page for recruiters and hiring managers.
- Update the public "Hire Talent" navigation CTA to route to `/hire-talent`.
- Preserve the existing recruiter registration flow at `/recruiter/register`.
- Use current Hiretivo design rules from `CLAUDE.md` and `DESIGN.md`.
- Reuse existing product concepts from the recruiter dashboard, applications, jobs, and talent pool surfaces.

## Non-Goals

- Do not build a new recruiter dashboard.
- Do not add new backend models or mutations.
- Do not change authenticated recruiter routes.
- Do not introduce new colors, gradients, shadows, or unrelated design abstractions.
- Do not add a form to the landing page; CTAs should route to existing registration or pricing flows.

## Route And Navigation

- New route: `src/app/hire-talent/page.tsx`
- Public header change: update the unauthenticated "Hire Talent" link from `/recruiter/register` to `/hire-talent`.
- Primary page CTA: `/recruiter/register`
- Secondary page CTA: `/pricing`

The route should be a Server Component unless a specific interactive requirement appears during implementation. Static visual previews do not require client state.

## Page Content

### Hero

The hero should communicate the recruiter value proposition:

- Headline: "Hire skilled remote talent with match clarity."
- Supporting copy should explain that recruiters can post roles, review skill-match scores, and manage candidates in one workspace.
- Primary CTA: "Start hiring"
- Secondary CTA: "View pricing"
- Right side: a bordered dashboard preview showing:
  - Active jobs
  - New applicants
  - Average match score
  - Candidate pipeline
  - Recent candidate rows with match percentages

Use the existing grid background pattern behind the hero, white surfaces, gray borders, and purple only for primary CTAs and active product signals.

### Stats Strip

Add a compact stats row below the hero. Use existing lightweight count queries where appropriate:

- Active remote jobs from `JobStatus.OPEN`
- Job seekers from users with role `SEEKER`
- Companies hiring from recruiter profiles

Stats should have restrained labels and no inflated hard-coded claims. If a count query fails, fall back to `0` as the homepage does.

### Product Feature Blocks

Add three feature blocks:

- Skill-match scoring: explains skills overlap and match score clarity.
- Applicant pipeline: explains reviewing, filtering, stage movement, and interview scheduling.
- Recruiter workspace: explains active jobs, analytics, talent discovery, and dashboard visibility.

Each block should use Lucide icons, `rounded-xl`, `border-brand-border`, `bg-white`, and no shadow.

### Dashboard Glimpse Section

Add a larger dashboard-inspired visual section below the feature blocks. It should be static, not connected to private recruiter APIs. It can use representative numbers and labels based on existing dashboard concepts:

- Active Jobs
- Total Applications
- New This Week
- Avg. Match Score
- Recent Applicants
- Application Trend

The goal is to show product shape, not simulate real logged-in data.

### Workflow Section

Show the recruiter workflow in four steps:

1. Post a remote role with clear skill requirements.
2. Review candidates ranked by match quality.
3. Shortlist, schedule, and move applicants through stages.
4. Hire and keep the pipeline organized.

This section should be dense and scannable, not a marketing-heavy hero repeat.

### Final CTA

Close with a simple recruiter CTA:

- Headline focused on starting the hiring workflow.
- Primary link to `/recruiter/register`.
- Secondary link to `/pricing`.

## Visual Rules

- Use brand tokens where possible: `bg-brand-primary`, `text-brand-foreground`, `text-brand-foreground-muted`, `border-brand-border`, `bg-brand-surface`.
- Purple is limited to primary CTAs, active highlights, and match-score indicators.
- Cards use `rounded-xl`, `border`, `bg-white`, and no shadow.
- Buttons use 8px radius unless existing shared `Button` styles dictate otherwise.
- Avoid nested cards. Dashboard previews may contain bordered internal panels because they represent product UI, not decorative page nesting.
- Use Lucide icons, not Material Symbols, for new code.
- Keep text sizes responsive without viewport-based font scaling.
- Ensure mobile stacks hero copy before the dashboard preview and keeps the mock dashboard readable.

## Data Flow

The page may query public aggregate counts directly in the Server Component:

- `prisma.job.count({ where: { status: JobStatus.OPEN } })`
- `prisma.user.count({ where: { role: UserRole.SEEKER } })`
- `prisma.recruiterProfile.count()`

These match existing homepage patterns. Use `.catch(() => 0)` to avoid public page failure if the database is unavailable.

Static dashboard preview data should be local constants inside the page file. No private recruiter APIs should be called from this public page.

## Error Handling

- Database count failures should degrade to `0`.
- The page should render even if counts are unavailable.
- Links should route only to existing pages.

## Testing And Verification

- Run TypeScript and lint/build checks available in the project scripts.
- Verify the `/hire-talent` route renders.
- Verify the unauthenticated header "Hire Talent" CTA points to `/hire-talent`.
- Verify mobile and desktop layouts do not overlap or truncate visible text.
- Confirm no new colors or shadows are introduced.

## Implementation Scope

Expected files:

- `src/app/hire-talent/page.tsx`
- `src/components/layout/Header.tsx`

No new shared component is required unless the page becomes too large or repeats a meaningful pattern already used elsewhere.
