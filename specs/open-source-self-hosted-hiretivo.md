# Open source, self hosted HireTivo

## Problem Statement

HireTivo can currently be used through its hosted service, but an individual cannot download it, supply their own model or API key, and use the complete application without HireTivo's database, billing, and other hosted services. The mandatory onboarding gate, job feed, subscription controls, and current navigation add complexity to that use case. The dashboard does not yet show an application funnel or calendar, and the canonical base resume cannot be edited through a dedicated workspace.

## Solution

Provide a complete, password protected, self hosted HireTivo that starts with Docker Compose, stores each installation's data in its own persistent Postgres database and local file volume, and works with a local model or a user supplied OpenRouter, OpenAI, Anthropic, or Google AI Studio credential. Remove mandatory onboarding, job discovery, and plan gates from this edition. Keep manual job entry, the application tracker, and job specific resume generation. Add a collapsible sidebar, light and dark themes inspired by Dossier, an application funnel and weekly activity dashboard, a local interview and deadline calendar, and an editable base resume with live preview and multiple themes. Implement Dossier inspired behavior in HireTivo's own code; do not copy Dossier source or assets without a separate license decision.

## User Stories

1. As a self hosting user, I want one documented startup command, so that I can run HireTivo on my computer.
2. As a self hosting user, I want my database and files to persist across restarts and upgrades, so that I do not lose my work.
3. As a self hosting user, I want to create a password protected account, so that my resumes and applications are private.
4. As a self hosting user, I want to sign in without an email delivery service, so that a fresh installation works offline.
5. As a self hosting user, I want to reach the dashboard without mandatory onboarding, so that I can explore the app immediately.
6. As a self hosting user, I want a clear empty state when no model is configured, so that I know how to enable AI features.
7. As a self hosting user, I want to configure a local model endpoint, so that I can process resume data on my own machine.
8. As a self hosting user, I want to configure OpenRouter, OpenAI, Anthropic, or Google AI Studio, so that I can use an account I already have.
9. As a self hosting user, I want to choose a supported model for each provider, so that I can balance capability, speed, and cost.
10. As a self hosting user, I want eligible OpenRouter free models shown clearly, so that I can start without paying for model inference.
11. As a self hosting user, I want to see where my resume data will be sent before selecting a cloud model, so that I can make an informed privacy choice.
12. As a self hosting user, I want saved API keys protected and hidden after entry, so that other browser users cannot retrieve them.
13. As a self hosting user, I want to test a provider configuration, so that I can correct an invalid key or unreachable endpoint before generating documents.
14. As a self hosting user, I want a provider error to leave my saved work intact, so that I can retry with another model.
15. As a job seeker, I want to add a job manually or from a URL, so that I can track opportunities without a curated job feed.
16. As a job seeker, I want my existing applications and tracker stages preserved, so that the removal of Browse does not erase my history.
17. As a job seeker, I want a dashboard funnel based on my applications, so that I can see how far opportunities progress.
18. As a job seeker, I want weekly application activity, so that I can understand my recent pace.
19. As a job seeker, I want dashboard periods and an accessible numeric summary of charts, so that I can interpret the data I see.
20. As a job seeker, I want interviews and deadlines on a calendar and agenda, so that I can prepare for upcoming events.
21. As a job seeker, I want to add or edit interview and deadline dates, so that the calendar reflects my actual schedule.
22. As a job seeker, I want the calendar to work without Google or another external calendar account, so that local use remains complete.
23. As a job seeker, I want one editable base resume, so that I can correct parsed details without uploading a new document.
24. As a job seeker, I want to choose among multiple resume themes and adjust their presentation, so that my resume fits different preferences.
25. As a job seeker, I want a live preview and PDF export, so that I can check a resume before sharing it.
26. As a job seeker, I want job specific resume versions to stay separate from my base resume, so that tailoring one application does not alter my canonical profile.
27. As a user, I want a collapsible sidebar and usable mobile navigation, so that I can move between dashboard, tracker, calendar, resume, and settings.
28. As a user, I want light and dark themes, so that the interface suits my environment.
29. As a self hosting user, I want documented upgrades, backups, and restore steps, so that I can maintain my own installation.
30. As an existing HireTivo user, I want a documented path for moving my own data to a self hosted installation, so that I can retain my work.
31. As a contributor, I want a clear license, setup guide, and architecture boundaries, so that I can run and improve the project.

## Implementation Decisions

- Release the web application for local use through Docker Compose first. Package the application with Postgres and persistent database and file volumes. A desktop installer is a later option.
- Use a local password protected account for the initial self hosted installation. Remove the dependency on signup email verification and external OAuth for local operation. Keep authorization checks on private routes. The exact bootstrap mechanism should be chosen during implementation without reintroducing onboarding.
- Remove every mandatory onboarding redirect and completion gate. Put provider settings in Settings and show actionable empty states for AI features until a provider is configured. Profile and resume entry remain optional until a feature needs them.
- Extend the existing centralized AI service with provider adapters and a consistent task interface. Support OpenRouter, OpenAI, Anthropic, Google AI Studio, and a configurable local model endpoint. Validate task capabilities, including structured resume extraction and document generation, rather than assuming any model works for every task.
- Save provider credentials only on the server, encrypted with an installation secret. Never send stored secrets back to the browser. Provide connection testing, key replacement, and removal. Display cloud data processing and model cost information where a model is selected; free model availability is provider dependent.
- Remove Browse navigation, job feed UI, feed APIs, scheduled ATS ingestion, and feed dependent dashboard cards from the self hosted product. Preserve manual jobs, applications, tracker stages, and the data needed for existing application history. Review shared job records before deleting any database fields.
- Remove subscription checkout, webhooks, upgrade prompts, plan quotas, and paid feature gates from the self hosted experience. Keep reasonable local request protection and resource limits as operational safeguards. A managed paid service is a separate future product decision.
- Replace the current top level app navigation with a responsive, collapsible sidebar. Build a Dossier inspired palette and layout using HireTivo owned implementation. Add light and dark theme tokens and a saved theme preference. Update HireTivo's design and agent guidance, which currently require the old palette and prohibit dark mode.
- Derive funnel stages, status distribution, weekly activity, and attention items from HireTivo's canonical application records and events. Preserve its existing tracker rather than adding a second board. Add an accessible data table or equivalent numeric view for charts.
- Add first class local interview and deadline data connected to applications. Show a month view and agenda. Google Calendar synchronization is deferred.
- Make the existing MasterResume the editable canonical resume. Keep ResumeVersion as the job specific output. Add a base resume workspace with section editing, live preview, theme selection, presentation controls, and PDF export. Reuse HireTivo's existing rendering and style capabilities where possible; provide twelve distinct built-in themes through original implementation.
- Replace production dependencies on Upstash Redis, QStash, R2, and Resend with working local paths for rate limits, background generation, files, and account bootstrap. Hosted integrations may remain optional, but no hosted credential is required to complete a local workflow.
- Publish HireTivo under the MIT License, with accurate setup documentation, environment variable example without secrets, data backup and restore instructions, and an upgrade/migration guide before calling the release open source ready. Do not copy Dossier AGPL source, CSS, or assets under this spec. Any decision to reuse them requires a separate license review and spec change.
- Preserve existing user and application data during schema migration. Document the consequences for existing hosted users before removing routes or records.

## Testing Decisions

- Test externally visible behavior and persisted outcomes, not component structure or internal helper calls. The primary seam is the authenticated application workflow through pages and API endpoints, with external model calls replaced by controlled provider fixtures.
- Verify a fresh local installation can create an account, sign in, use manual job tracking, configure a model, edit a base resume, generate a job specific version, view dashboard metrics, and add a calendar event without hosted service credentials.
- Verify an installation restart preserves the account, application history, calendar events, resume content, model configuration, and local files.
- Verify onboarding and billing gates no longer block local workflows; removed Browse and ATS routes are unavailable while tracker routes still work.
- Verify provider selection, connection failures, invalid credentials, unsupported model capabilities, and switching providers through the central AI boundary. Assert that API keys never appear in browser responses or logs.
- Verify funnel and weekly activity calculations using application histories that include rejected, archived, and in progress cases. Verify calendar dates and deadlines render correctly and remain usable without external sync.
- Verify base resume edits persist while existing job specific versions retain their own content. Verify PDF output for representative themes.
- Check sidebar and theme behavior at mobile and desktop widths, including keyboard navigation, contrast, and the accessible numeric chart view.
- Use the repository's existing AI unit tests and route tests as prior art, while placing new workflow checks at the higher application boundary wherever practical.

## Out of Scope

- A desktop installer.
- Google Calendar or other external calendar synchronization.
- A new job discovery feed or ATS ingestion service.
- A second application Kanban board.
- Operating a paid managed HireTivo service as part of this release.
- Copying Dossier's AGPL implementation or assets.
- Guaranteeing that third party free model tiers remain available or suitable for every AI task.

## Further Notes

- The agreed product direction is Docker first, no mandatory onboarding, a full self hosted edition without subscription gates, manual job tracking, local calendar first, and an editable base resume alongside tailored versions.
- The current repository describes HireTivo as a remote job portal, while the present application is centered on the job seeker's tracker and resume workflow. Product copy and documentation should be updated to match the released scope.
- The current repository has no tracked LICENSE. Its package metadata says ISC. The owner chose MIT for the open source release; publish a LICENSE file and align package metadata before release.
- Dossier is AGPL-3.0-only. Matching general appearance and independently implementing behavior is the agreed approach; direct code or asset reuse would change the licensing decision.
- This is a large release spec. Delivery can be split into smaller implementation issues after the shared contracts, migrations, and acceptance checks are established.
