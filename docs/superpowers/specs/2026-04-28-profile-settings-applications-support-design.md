# Profile, Settings, Applications, And Support Fixes Design

## Context

Hiretivo has several broken or inconsistent flows across seeker profile settings, recruiter settings, recruiter applications, dashboard data, and support contact. The implementation must follow `CLAUDE.md` and `DESIGN.md`, use existing shadcn/ui components, preserve current user/worktree changes, and avoid unrelated refactors.

This spec uses the targeted-fixes approach: fix each affected behavior directly and extract only small shared patterns where they reduce duplication or make the flow consistent.

## Scope

In scope:

- Seeker skills should be profile-owned editable tags, not a full global skill catalog.
- Seeker avatar upload should persist visually after reload.
- Recruiter company logo upload should update immediately and after refresh.
- Settings sections should show Save/Cancel only after Edit is clicked.
- Loading skeletons should replace plain loading text in affected async sections.
- `CLAUDE.md` should require layout-matching skeletons for async UI.
- Recruiter dashboard Application Trend should use dynamic API data.
- Recruiter application stage updates should stop returning 500 after successful DB saves.
- Recruiters should be able to move application stages backward or forward.
- Recruiter applications table and candidate drawer should show skills better.
- One shared contact/support page should support contact messages and book-a-call requests.

Out of scope:

- Changing general input field styling in settings. The user explicitly asked to skip this.
- Rebuilding all settings forms into a new framework.
- Adding a calendar integration for book-a-call scheduling.
- Changing match score calculation rules.
- Broad visual redesign outside the approved sections.

## Seeker Skills

The current seeker skills section renders every skill returned by `/api/skills` as toggle buttons. That is not the intended profile flow.

The new flow:

- Show only the seeker's current skills as removable tags.
- Provide an input where the seeker can type a skill and add it with Enter or an add action.
- Prevent duplicate skills case-insensitively.
- Keep a reasonable maximum tag count using existing validation limits.
- Save skills as part of the seeker profile settings flow.

The API should accept skill names for this flow, resolve existing skills by normalized slug/name, create missing skill records when needed, update `SeekerSkill`, and invalidate seeker matching/recommendation cache when skills change.

## Avatar And Logo Uploads

Avatar and company logo uploads already store files in R2 and save keys to the database, but stale UI/cache behavior can make old images appear after reload.

The upload flow should:

- Use the returned upload key or URL to update local preview immediately.
- Invalidate the matching settings query after successful upload.
- Render image URLs through the existing `/api/logo?key=...` proxy when needed.
- Add a cache-busting query value after successful upload so overwritten R2 keys do not keep showing cached images.
- Show a skeleton or upload overlay while upload is pending.
- Keep direct upload behavior for avatar/logo/resume; these are not normal edit/save forms.

## Edit Mode Settings Pattern

Settings/profile sections should follow the approved screenshot pattern.

Default state:

- Section header has the title on the left and `Edit` on the right.
- Fields display in a disabled/read-only visual state.
- No Save or Cancel buttons are visible.

Edit state:

- Header right side switches to `Cancel` and `Save`.
- Editable fields become enabled.
- Non-editable fields, such as email, remain read-only.
- Cancel resets the form to the last loaded server values and exits edit mode.
- Save persists the section and exits edit mode after success.
- Save shows a loading state while the mutation is pending.

Apply this pattern to:

- Seeker personal/profile settings.
- Seeker skills.
- Recruiter profile.
- Recruiter company profile.

## Skeleton Loading States

Affected pages and sections should use skeletons that match the final layout instead of generic text.

Targets:

- Recruiter talent pool filters and talent cards.
- Recruiter settings page sections.
- Seeker settings sections.
- Recruiter applications page where current loading coverage is too generic.
- Dashboard trend/list sections where the data is async.

`CLAUDE.md` should add a rule that every new async page, query section, or async component includes a skeleton that approximates the final layout.

## Recruiter Application Stage Updates

The stage route currently can return 500 even after the application status is updated. The expected behavior is that a successful database update returns success even if candidate notification email fails.

The route should:

- Validate recruiter auth and ownership.
- Validate the requested stage with the existing Zod schema and enum source.
- Allow changing from any displayed stage to any other displayed stage, including backward transitions.
- Update the database first.
- Attempt to send the candidate status email.
- Catch/log email failures without changing a successful stage update into a 500 response.
- Return a consistent success response.

The UI should continue showing all stage options and should invalidate recruiter applications and stats after mutation.

## Applications Table And Candidate Drawer

The applications table should remain compact, but expose enough skills to be useful.

Table behavior:

- Show up to 8-10 skills in the technical stack preview when space allows.
- If there are more skills, show a `+N more` indicator.
- Keep row click behavior opening the candidate drawer.

Drawer behavior:

- Increase drawer width so candidate details do not feel cramped.
- Show all candidate skills.
- Show match score prominently.
- Show role, headline, location, status, cover letter, resume, interview details, and AI summary where available.
- Keep stage editing and schedule/reschedule/cancel interview actions.

## Recruiter Dashboard Trend

`ApplicationTrendChart` currently uses hardcoded SVG path data and hardcoded date labels. It should consume the existing `trendData` returned by `/api/recruiter/dashboard`.

The chart should:

- Render the last 30 days from `trendData`.
- Treat missing days as zero; the API already fills missing days.
- Scale values dynamically.
- Show a layout-matching skeleton while the dashboard query is loading.
- Show an empty/flat state if there are no applications in the period.

## Shared Contact And Support

Add one shared `/contact` page for public users, seekers, and recruiters.

The page should include two flows:

- Contact form: name, email, subject, message.
- Book-a-call request: name, email, company or role, preferred time, message.

Both flows should:

- Use React Hook Form and Zod.
- Submit to a shared API route.
- Rate-limit requests.
- Send details to `hiretivo@gmail.com` using the existing Resend utility.
- Return clear success and error states.
- Avoid exposing raw server errors to the client.

Navigation:

- Public links can point to `/contact`.
- Recruiter sidebar should show `Contact & Support` above Sign Out.
- Seeker navigation should also expose the shared contact/support page.

## Data And Validation

Add or update validation schemas in `src/lib/validations/`:

- Seeker settings schema should support the approved skills payload shape.
- Contact/support schema should support both contact and book-a-call modes.
- Stage update schema should continue to validate against application status enum values.

Client API calls should go through service modules and the typed axios client. API routes remain server-side and use Prisma or server utilities directly.

## Error Handling

- Upload failures show user-facing toast errors.
- Contact/support email failures return a safe generic error.
- Stage notification email failures do not undo or mask a successful stage update.
- Settings save failures keep edit mode open so the user can retry.
- Skeletons should cover loading; error states should be explicit where the section cannot recover.

## Testing And Verification

Minimum verification:

- Typecheck or lint where available.
- Seeker can add/remove skills, save, reload, and see the same skills.
- Seeker avatar upload updates immediately and after reload.
- Recruiter logo upload updates immediately and after reload.
- Settings Save/Cancel only appear after Edit.
- Cancel restores server-loaded values.
- Recruiter can change an application stage backward and forward.
- Stage API does not return 500 when email notification fails after DB success.
- Candidate drawer shows all skills and a wider layout.
- Application Trend uses API data, not hardcoded values.
- Contact form and book-a-call request send email to `hiretivo@gmail.com`.
- Loading skeletons appear in the affected async areas.

