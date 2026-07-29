# Hiretivo v2 — Technical Product Requirements Document (PRD)

> **Version:** 1.0  
> **Branch:** `feature/pivot-v2`  
> **Last Updated:** 2026-07-17  
> **Status:** Active

---

## Table of Contents

1. [Product Vision & Pivot Overview](#1-product-vision--pivot-overview)
2. [User Personas](#2-user-personas)
3. [End-to-End User Flow](#3-end-to-end-user-flow)
4. [System Architecture](#4-system-architecture)
5. [Page-by-Page Spec](#5-page-by-page-spec)
6. [Data Model](#6-data-model)
7. [API Routes](#7-api-routes)
8. [AI Engine Architecture](#8-ai-engine-architecture)
9. [ATS Job Feed Architecture](#9-ats-job-feed-architecture)
10. [Frontend Component Tree](#10-frontend-component-tree)
11. [Error Handling & Edge Cases](#11-error-handling--edge-cases)
12. [Monetization & Quota](#12-monetization--quota)
13. [Future Roadmap](#13-future-roadmap)
14. [Feature Completion Checklist](#14-feature-completion-checklist)

---

## 1. Product Vision & Pivot Overview

### Old Hiretivo

A skills-based remote job portal (like Instahyre) connecting job seekers with recruiters. Users created profiles, recruiters posted jobs, and matching happened via skill overlap. Required two-sided adoption — recruiters AND seekers — which is slow to bootstrap.

### Pivot — New Hiretivo

An **AI-powered job-getting platform**. The core value prop shifts from "find jobs" to **"get hired faster."**

Users bring their resume — Hiretivo handles the rest:
- AI-parses their resume into structured data (via Gemini Vision)
- Aggregates jobs from ATS platforms (Greenhouse, Lever, Ashby) + user-submitted links
- Tailors their resume for each specific job description using AI
- Generates ATS-safe PDFs with fit-to-one-page logic
- Generates cover letters referencing the tailored resume
- Tracks every application in one pipeline view

**Why this works:** The product is immediately useful to any job seeker regardless of whether recruiters are on the platform. Jobs come from ATS feeds + user paste — no recruiter adoption required.

---

## 2. User Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Active Seeker** | Applying to 5-20 jobs/week | Tailored resumes at scale, application tracking, ATS-optimized PDFs |
| **Casual Seeker** | Browsing, applying occasionally | Quick resume tweak for one-off applications |
| **Career Switcher** | Moving to new role/industry | Resume rewrite to highlight transferable skills |

**Primary focus:** Active Seeker. They generate the most value (and revenue).

---

## 3. End-to-End User Flow

### First Visit — Onboarding

```
Sign Up ──► Step 1: Profile ──► Step 2: Upload Resume ──► MasterResume Created
               (role, skills,      (PDF → AI Vision Parse → JSON)
                LinkedIn, etc.)         │
                                        └── Skip → prompt on first "Generate Resume"
```

### Daily Use — Job Discovery

The platform has two distinct job discovery surfaces:

**Dashboard** — Profile-matched jobs (recommended for you)
```
Dashboard ──► Profile-matched jobs ──► Click Job Card ──► Job Drawer
  │                                                            │
  │                                                     View Original (new tab)
  │                                                     Apply
  │
  ├── Matched jobs grid: only jobs matching user's skills (via computeAllMatches)
  ├── "Add Your Own Job" card (pinned, first card — paste URL or JD)
  ├── Recent unmatched jobs section: newer admin-posted jobs not yet matched
  ├── Applications table: recent 5 applications summary
  ├── Free Plan Banner
  └── Resume Parse Banner (shown if MasterResume is null)
```

**Browse Jobs** — All jobs from ATS feed (searchable)
```
Browse Jobs ──► ALL ATS jobs ──► Search / Filter ──► Click Job Card ──► Job Drawer
                                                                           │
                                                                     View Original (new tab)
                                                                     Apply
  No "Add Your Own Job" card
  No plan/resume banners
  No applications table
  Just search, filter, and all jobs
```

**Navigation:**
- Top nav has two links: "Dashboard" (matched) and "Browse" (all jobs)
- Both use the same `SearchBar`, `FilterChips`, `JobCard`, `JobDrawer` components
- Dashboard uses `GET /api/seeker/feed` (matched + recent unmatched)
- Browse uses `GET /api/jobs/feed` (all jobs, unfiltered) — different endpoint

### Core Loop — Apply → Generate → Review → Apply

```
Apply ──► Create Application ──► Background AI Generate ──► Redirect to Tracker
  │                                │
  │                           ┌────┴────────┐
  │                           │  quota OK?  │── No ──► 402 + upgrade prompt
  │                           └────┬────────┘
  │                           ┌────┴────────┐
  │                           │ rate limit? │── No ──► 429 + retry message
  │                           └────┬────────┘
  │                           ┌────┴─────────────┐
  │                           │ Gemini tailors    │── Fail ──► GENERATING → FAILED, no quota charged
  │                           │ resume            │
  │                           └────┬─────────────┘
  │                           ┌────┴──────────────┐
  │                           │ Schema validation │── Fail ──► ai_error, no quota charged
  │                           └────┬──────────────┘
  │                           ┌────┴──────────┐
  │                           │ Save as        │
  │                           │ ResumeVersion  │
  │                           │ + consume quota│
  │                           └────┬──────────┘
  │                           ┌────┴──────────┐
  │                           │ Status → READY │
  │                           └────┬──────────┘
  │                                │
  │         ┌──────────────────────┘
  │         ▼
  │    Application Page (/applications/:id)
  │    ┌─────────────────────────────────┐
  │    │ Left Panel:                     │
  │    │  • Match Score gauge            │
  │    │  • Job Description              │
  │    │  • Added/Missing Keywords       │
  │    │  • Skills Checklist             │
  │    │  • Actions (I've Applied)       │
  │    │  • Quota Badge                  │
  │    │  • Timeline                     │
  │    ├─────────────────────────────────┤
  │    │ Right Panel:                    │
  │    │  [Resume] [Cover Letter] [Editor]│
  │    │  • Version selector (v1, v2...) │
  │    │  • AI Rewrite Panel (5 chips)  │
  │    │  • Download PDF                 │
  │    │  • Regenerate                   │
  │    └─────────────────────────────────┘
  │
  ▼
Download PDF ──► Apply on job site ──► Click "I've Applied" ──► Tracker updated
```

### Tracker Pipeline

```
All ──► Submitted ──► In Flight ──► Needs You ──► Failed ──► Skipped
  │
  ├── Each row: Company | Role | Resume Status | Automation Status | Hiring Status | Date
  ├── Click row → Application Drawer / redirect to /applications/:id
  └── Failed row → Retry button
```

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT (Next.js 14 App Router)                  │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │Dashboard │  │  Browse  │  │  App     │  │ Tracker  │  │Settings││
│  │          │  │          │  │  Page    │  │          │  │       │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬───┘ │
│       │             │             │             │            │      │
│  ┌────▼─────────────▼─────────────▼─────────────▼────────────▼───┐ │
│  │                Shared Components Layer                         │ │
│  │  SearchBar │ FilterChips │ JobCard │ JobDrawer                 │ │
│  │  AddCustomJobModal │ ApplyJobModal │ ...                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  State Management:                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │ │
│  │  Zustand       │  │  TanStack Query  │  │  React Hook Form  │ │ │
│  │  (global UI)   │  │  (server data)   │  │  + Zod (forms)    │ │ │
│  └────────────────┘  └──────────────────┘  └────────────────────┘ │ │
├─────────────────────────────────────────────────────────────────────┤
│                      API LAYER (Next.js Route Handlers)             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │/api/     │  │/api/     │  │/api/     │  │/api/     │  │/api/ │ │
│  │applica-  │  │applica-  │  │applica-  │  │applica-  │  │gener-│ │
│  │tions     │  │tions/:id │  │tions/:id │  │tions/:id │  │ation-│ │
│  │          │  │          │  │/generate │  │/cover-   │  │quota │ │
│  │          │  │          │  │          │  │letter    │  │      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │/api/     │  │/api/     │  │/api/     │  │/api/     │          │
│  │resume/   │  │resume/   │  │applica-  │  │applica-  │          │
│  │upload    │  │preview-  │  │tions/:id │  │tions/:id │          │
│  │          │  │pdf       │  │/versions │  │/rewrite  │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐                                       │
│  │/api/     │  │/api/     │   ← Feed endpoints (see §9.2)        │
│  │seeker/   │  │jobs/feed │                                       │
│  │feed      │  │          │   Dashboard → seeker/feed (matched)   │
│  │(matched) │  │(all jobs)│   Browse   → jobs/feed (all jobs)     │
│  └──────────┘  └──────────┘                                       │
├─────────────────────────────────────────────────────────────────────┤
│                      AI ENGINE (Server-side lib/)                   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ resume-tailor.ts │  │resume-parser │  │cover-letter-         │  │
│  │ (core generation)│  │.ts (vision)  │  │generator.ts          │  │
│  ├──────────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ with-retry.ts    │  │generation-   │  │jd-parser.ts          │  │
│  │ (2 retries, exp  │  │quota.ts      │  │(extract from JD)     │  │
│  │ backoff, 30s)    │  │              │  │                      │  │
│  └──────────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                     │
│  AI Provider: OpenRouter                                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Primary: google/gemini-2.5-flash      (parsing, tailoring,     │ │
│  │                                      cover letter, JD parse)  │ │
│  │ Lite:    google/gemini-2.5-flash-lite (low-stakes classification)│ │
│  └────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Prisma ORM  │  │ Upstash Redis│  │ Cloudflare R2│              │
│  │  → Neon      │  │ (rate limit, │  │ (file storage│              │
│  │  (PostgreSQL)│  │  cache)      │  │  for resumes)│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ Auth.js v5   │  │ Dodopayments │                                │
│  │ (NextAuth)   │  │ (subscription│                                │
│  │              │  │  billing)    │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **AI Provider** | OpenRouter → Gemini 2.5 Flash | Vision support (PDF parsing without OCR libs), low cost (~$0.004/gen), single provider |
| **Quota enforcement** | Server-side (`GenerationQuota` table) | Can't be bypassed by client modification |
| **Rate limiting** | Upstash Redis (sliding window) | Independent of monthly quota, protects against abuse even on "unlimited" plans |
| **Resume versioning** | New `ResumeVersion` row per generate (never overwrite) | Bad regenerations are recoverable — user can revert to v1 |
| **Regenerate quota** | Does NOT consume quota | Encourages iteration to get the perfect resume |
| **Single JSON schema** | 5 consumers validate against same `ResumeDocumentSchema` | Prevents data drift between parser, optimizer, renderer, editor, cover letter gen |

---

## 5. Page-by-Page Spec

### 5.1 Landing Page (`/`)

| Section | Details |
|---------|---------|
| **Hero** | Grid background, headline (Display), subtitle, CTA buttons: "Get Started" (primary), "Browse Jobs" (secondary) |
| **Features** | AI resume tailoring, ATS-safe PDF, cover letter gen, application tracker |
| **Pricing** | Free/$7/$12 tiers — feature comparison |
| **CTA** | Sign up / Sign in |
| **Status** | Public — no auth required |

### 5.2 Onboarding (`/(auth)/seeker/`)

| Step | Fields | Behavior |
|------|--------|----------|
| **Step 1 — Profile** | Name, email (pre-filled), phone, location, LinkedIn, GitHub, website, headline, bio, years exp, work preference, primary role, skills (tag input), seeking status, salary range | Saved to `SeekerProfile`. Single form with RHF + Zod |
| **Step 2 — Resume Upload** | File upload (PDF/DOCX, max 10MB) | Uploads to R2 → `POST /api/resume/upload` → Gemini Vision parses → `MasterResume` created. Shows parsing progress |
| **Skip** | "Skip — I'll do it later" button | `MasterResume` stays null. `ResumeParseBanner` shows on Dashboard until uploaded |

**States:**
- Loading: upload progress bar during file upload + "Parsing your resume..." during AI processing
- Error: "Couldn't parse your resume. Try uploading a text-based PDF." + retry button
- Success: redirect to `/dashboard` with success toast

### 5.3 Dashboard (`/(app)/dashboard/`)

The Dashboard shows **profile-matched jobs only** — not all jobs in the database. Matching is computed server-side based on the user's skills.

| Section | Component | Behavior |
|---------|-----------|----------|
| **Search Bar** | `SearchBar` | 400ms debounce, abort previous request, latest wins. Shows result count. Query key: `['jobs', debouncedSearch, filters, page]` |
| **Filter Chips** | `FilterChips` | Location, work type (Remote/Hybrid/Onsite), job type (Full-time/Part-time/Contract/Internship), experience level |
| **Free Plan Banner** | `FreePlanBanner` | Shows upgrade prompt + current plan usage. Dismissible |
| **Resume Parse Banner** | `ResumeParseBanner` | "Upload your resume to get tailored resumes" — shows only if `MasterResume` is null. Dismissible |
| **Add Your Own Job Card** | Dashed border card (pinned, first in grid) | Opens `AddCustomJobModal` — modal with two modes: (1) Paste URL → scrape JD, (2) Paste JD text directly |
| **Matched Jobs Grid** | Grid of `JobCard` | Only jobs matched to user's profile skills. Heading: "Recommended jobs". 4-col xl / 3-col lg / 2-col sm / 1-col base |
| **Job Cards** | `JobCard` | Company logo, title, match score ring, skills badges (max 3 + "N more"), location, workplace type, Apply + Not Interested buttons |
| **Load More** | "Load more jobs" link | Infinite scroll via `fetchNextPage()` from `useInfiniteQuery` |
| **Recent Unmatched Jobs** | Section below matched grid | Shows newer admin-posted jobs that haven't been matched yet (uses `recentOffset` mode in feed API). Heading: "Recent jobs" |
| **Applications Table** | `ApplicationsTable` | Recent 5 applications — quick view below job grid |

**Match Score Computation:**
- Runs via `computeAllMatches()` in `src/lib/match.ts`
- Formula: `(seeker skills ∩ job required skills) / job required skills × 100`
- Results cached in Redis for 15 minutes (key: `match:{seekerProfileId}`)
- Dismissed jobs and already-applied jobs are filtered out of results
- Boosted jobs float to top of feed

**States:**

| State | Render |
|-------|--------|
| **Loading** | 8 skeleton cards (Skeleton × 8, h-64, rounded-xl) |
| **Error** | "Could not load jobs. Please try again." centered |
| **Empty (no matches)** | "No jobs found matching your skills." + "Browse all jobs" CTA linking to `/dashboard/browse` |

### 5.4 Browse Jobs (`/(app)/dashboard/browse/`)

Browse Jobs shows **ALL jobs** from the ATS feed — not just profile-matched ones. This is the full catalog.

| Section | Component | Behavior |
|---------|-----------|----------|
| **Search Bar** | `SearchBar` | Same 400ms debounce as Dashboard |
| **Filter Chips** | `FilterChips` | Same filters as Dashboard |
| **All Jobs Grid** | Grid of `JobCard` | ALL open jobs from ATS feed, paginated. Heading: "Browse jobs" + subtitle |
| **Load More** | "Load more jobs" | Same infinite scroll pattern |

**Key differences from Dashboard:**
- ❌ No "Add Your Own Job" card
- ❌ No Free Plan or Resume Parse banners
- ❌ No Applications Table
- ❌ No matched/recommended filtering — shows every open job
- ✅ Uses **different API endpoint**: `GET /api/jobs/feed` (all jobs, unfiltered) instead of `GET /api/seeker/feed` (matched)

**States:**

| State | Render |
|-------|--------|
| **Loading** | 8 skeleton cards |
| **Error** | "Could not load jobs. Please try again." |
| **Empty** | "No jobs found matching your criteria." + "Try adjusting your filters or search terms." |

### 5.5 Job Drawer (Shared Component)

| Section | Details |
|---------|---------|
| **Header** | Company logo (left) + company name + job title (right). Close button (X) |
| **Match Score** | SVG gauge ring in header area (green ≥70, amber ≥40, red <40) |
| **Body** | Skills tags (wrap), location, work type, job type, salary range. Full description (rendered HTML stripped to text) |
| **Sections** | Responsibilities, Requirements, Description (if present) |
| **Actions** | "View Original Job" (secondary button, opens `externalApplyUrl` in new tab), "Apply" (primary button) |
| **States** | Loading: skeleton for header + body. Error: toast + close drawer. Empty/404: toast + close |
| **Data** | `GET /api/jobs/:id` — fetched on drawer open via TanStack Query |

### 5.6 Application Page (`/(app)/applications/[id]/`)

**Layout:** 3-column grid (left: 1/3, right: 2/3) on desktop → single column on mobile.

#### Left Panel

| Card | Content |
|------|---------|
| **Match Score** | SVG gauge ring (0-100). Color: green ≥70, amber ≥40, red <40. Shows before→after delta on regenerate |
| **Job Description** | Scrollable text from job description (max-h-96, whitespace-pre-line) |
| **Keywords Added** | Green badges with `CheckCircle2` icon. Only shown if `addedKeywords.length > 0` |
| **Keywords Missing** | Red badges with `Circle` icon. Only shown if `missingKeywords.length > 0` |
| **Skills Checklist** | Required: matched/total + progress bar (green if 100%, amber if ≥50%, red <50%). Preferred: matched/total + progress bar (green if 100%, amber if ≥50%, blue <50%) |
| **Actions** | "I've Applied" button (full width). Status: default / loading (spinner) / submitted (checkmark + "Applied ✓"). Disabled if already submitted |
| **Quota Badge** | "X of Y generations used this month". Upgrade link if exhausted. Component: `QuotaBadge` |
| **Timeline** | Chronological: Application Created → Resume Generated → Applied. Each with relative timestamp + colored dot |

#### Right Panel

| Element | Content |
|---------|---------|
| **Tab Bar** | Three tabs: Resume / Cover Letter / Editor. Active tab highlighted with purple bg |
| **Version Selector** | Dropdown: "v1 — AI Generated", "v2 — Regenerated", etc. Switches preview to selected version |
| **Download PDF** | Button → `POST /api/resume/preview-pdf` → blob download. Loading state with spinner |
| **Regenerate** | Button → `POST /api/applications/:id/generate` (same route as first generation). Captures pre-regenerate match score for delta display. Capped at 5 versions/application |
| **AI Rewrite Panel** | 5 canned chips + freeform input. See Phase 6 spec below |
| **Resume Preview** | ATS-safe rendered resume via `ResumePreviewContent` |
| **Cover Letter** | Generate (if none) or rendered text. See Phase 5 spec below |
| **Editor** | Full structured CRUD. See Phase 4 spec below |

**States:**

| State | Render |
|-------|--------|
| **Loading** | Skeleton h-8 w-48 + skeleton h-[600px] rounded-xl |
| **Error / 404** | "Application not found" + "Back to tracker" button |
| **Generating** | Skeleton resume preview (7 skeleton lines) |
| **No resume yet** | "No resume generated yet" + "Generate Resume" button |
| **No cover letter** | "No cover letter yet" + "Generate Cover Letter" button |
| **No editor content** | "Generate a resume first before editing" (if no resumeDoc) |

### 5.7 Resume Editor (`ResumeEditor` component)

| Section | Features |
|---------|----------|
| **Personal Info** | Name, email, phone, location, LinkedIn, GitHub, Website, Twitter — all text inputs |
| **Professional Summary** | Textarea — plain text |
| **Experience** | Add entry, delete entry, reorder via drag handle. Each entry: company, title, location, start/end date, current checkbox, bullets (add/delete/reorder bullets) |
| **Projects** | Same pattern as Experience: name, link, bullets |
| **Education** | Institution, degree, start/end date |
| **Skills** | Add/delete categories. Within each: add/delete skill items |
| **Certifications** | Name, issuer, date. Add/delete |
| **Languages** | Name, proficiency. Add/delete |
| **Save** | Button → `POST /api/applications/:id/versions` with `sourceType: manual-edit`. Creates new `ResumeVersion` |
| **Data** | Reads/writes directly to Phase 0 ResumeDocument schema fields — no separate editor data model |

### 5.8 AI Rewrite Panel (`AiRewritePanel` component)

| Element | Details |
|---------|---------|
| **Match Score** | Reuses `matchMeta.matchScore` — not a separate quality metric |
| **Canned Chips** | 5 fixed chips: "Use stronger action verbs", "Shorten my summary", "Remove skills not related to this job", "Add more quantified metrics", "Match the JD's tone" |
| **Freeform Input** | Text input with "Apply" button — user writes their own instruction |
| **Endpoint** | `POST /api/applications/:id/rewrite` — accepts `{ instruction, resumeJson }`, returns `{ resumeJson, matchMeta }` |
| **Diff** | Field-level JSON comparison, word-level diff rendering using `diff` library. Before/after side-by-side |
| **Edit Cap** | 5 edits per generation — hard cap enforced server-side |
| **Quota** | Does NOT consume generation quota |
| **Apply button** | Accepts the rewrite → creates new `ResumeVersion` with `sourceType: regenerate` |

### 5.9 Cover Letter (`CoverLetterPanel` inline component)

| Element | Details |
|---------|---------|
| **Tab** | Sits next to Resume tab, enabled only after resume reaches `READY` status |
| **Generate** | Button → `POST /api/applications/:id/cover-letter`. Shared quota pool with resume |
| **Display** | Rendered text in rounded-xl border card, whitespace-pre-line |
| **Data** | Stored in `CoverLetter` model — not just returned to client |
| **States** | Loading (spinner), no content yet (generate button), content rendered, quota exhausted (upgrade prompt) |

### 5.10 Tracker (`/(app)/dashboard/tracker/`)

| Section | Details |
|---------|---------|
| **Tabs** | All / Submitted / In Flight / Needs You / Failed / Skipped. Filter by `automationStatus` |
| **Table Headers** | Company | Role | Resume | Automation | Hiring | Applied |
| **Rows** | Each application as a row. Clickable → navigates to `/applications/:id` |
| **Status Badges** | Color-coded: GENERATING (amber), READY (blue), SUBMITTED (green), FAILED (red) |
| **States** | Loading: skeleton rows (6). Empty: "No applications yet" + "Browse Jobs" CTA. Error: error state with retry |
| **Data** | `GET /api/applications` — query key `['applications', filters]` |

#### Status Mapping

| `automationStatus` | Display Label | Badge Color |
|--------------------|---------------|-------------|
| `GENERATING` | Generating Resume | Amber/blue with spinner |
| `READY` | Review Resume | Blue |
| `APPLYING` | Submitting | (DORMANT — reserved for Auto Apply phase, NOT reachable by any current UI) |
| `SUBMITTED` | Applied | Green with checkmark |
| `FAILED` | Failed — Retry | Red |
| `SKIPPED` | Skipped | Gray |

### 5.11 Settings (`/(app)/settings/`)

| Section | Details |
|---------|---------|
| **Profile** | Edit name, email, phone, Links (LinkedIn, GitHub, website, Twitter) |
| **Notifications** | Email notification toggles |
| **Subscription** | Current plan, usage stats, upgrade/downgrade/cancel. Dodopayments integration |
| **Account** | Delete account (with confirmation) |

---

## 6. Data Model

### Entity Relationship Diagram

```
User (1) ────── (1) MasterResume       — Canonical parsed resume JSON
User (1) ────── (many) GenerationQuota — Monthly usage: {userId, month, count}
User (1) ────── (many) Application     — Job applications
  Application (1) ── (many) ResumeVersion  — Generated versions (v1, v2, v3...)
  Application (1) ── (many) CoverLetter    — Generated cover letters
  Application (1) ── (many) Interview      — Scheduled interviews
  Application (many) ── (1) Job            — Linked job posting
User (1) ────── (1) SeekerProfile     — Extended profile data
User (1) ────── (1) Subscription      — Dodopayments subscription
Job (many) ──── (many) Skill          — Via JobSkill join table
SeekerProfile (many) ──── (many) Skill — Via SeekerSkill join table
```

### Core Enums

| Enum | Values | Notes |
|------|--------|-------|
| `AutomationStatus` | `GENERATING`, `READY`, `APPLYING`, `SUBMITTED`, `NEEDS_YOU`, `FAILED`, `COMPLETED`, `SKIPPED` | `APPLYING` is DORMANT — reserved for Auto Apply phase, NOT built in current UI |
| `AppStatus` | `APPLIED`, `REVIEWING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED` | Hiring pipeline status set manually by user |
| `PlanTier` | `FREE`, `STARTER`, `GROWTH`, `SCALE` | Maps to subscription tiers |

### Key Models

**MasterResume** — Single source of truth for user's base resume. Document-only storage (JSON), not normalized tables. Normalized tables (WorkExperience, Education, SeekerSkill) are derived read-only caches.

```
MasterResume {
  id: String (PK)
  userId: String (unique FK → User)
  resumeJson: Json (ResumeDocument schema — canonical)
  createdAt, updatedAt
}
```

**ResumeVersion** — Each generate/regenerate creates a new row. Never overwrites. Capped at 5 per application.

```
ResumeVersion {
  id: String (PK)
  applicationId: String (FK → Application)
  version: Int (auto-increment)
  resumeJson: Json (ResumeDocument schema)
  sourceType: "ai-generated" | "regenerate" | "manual-edit"
  createdAt
}
```

**GenerationQuota** — Monthly generation counter. Enforced server-side. Only decremented on schema-valid AI success.

```
GenerationQuota {
  id: String (PK)
  userId: String (FK → User)
  month: String ("YYYY-MM")
  count: Int (default 0)
  @@unique([userId, month])
}
```

**Application** — Central entity linking user to job + owning the generation lifecycle.

```
Application {
  id: String (PK)
  jobId: String (FK → Job)
  seekerId: String (FK → User)
  status: AppStatus (default APPLIED)
  matchScore: Int
  automationStatus: AutomationStatus?
  generationCount: Int (default 0)
  activeVersionId: String? (FK → ResumeVersion)
  @@unique([jobId, seekerId])
}
```

Full Prisma schema at `prisma/schema.prisma` (671 lines — all enums, models, indexes, and relations defined).

---

## 7. API Routes

### Application Routes

| Method | Route | Purpose | Auth | Rate Limit | Request Body | Success Response | Error Responses |
|--------|-------|---------|------|------------|--------------|-----------------|-----------------|
| `POST` | `/api/applications` | Create application | Required | 5/min/user | `{ jobId }` | `{ id, status, ... }` 201 | 401, 409 (duplicate) |
| `GET` | `/api/applications` | List user's applications | Required | 30/min/user | — | `{ applications: [...] }` | 401 |
| `GET` | `/api/applications/:id` | Get application detail | Required | 30/min/user | — | Full app + versions + meta | 401, 404 |
| `PATCH` | `/api/applications/:id` | Update application | Required | 5/min/user | `{ action: "mark_applied" }` | Updated app | 401, 404 |
| `POST` | `/api/applications/:id/generate` | Generate/regenerate resume | Required | 5/hr free, 15/hr paid | `{ jdText?, forceGenerate? }` | `{ resumeVersionId, version, resumeJson, matchMeta }` 200 | 401, 402 (quota), 409 (no master resume), 422 (ai/validation error), 429 (rate limited) |
| `POST` | `/api/applications/:id/versions` | Save manual edit version | Required | 5/min/user | `{ resumeJson }` | `{ id, version }` | 401, 404, 422 |
| `POST` | `/api/applications/:id/cover-letter` | Generate cover letter | Required | 5/hr free, 15/hr paid | — | `{ content }` | 401, 402, 422, 429 |
| `GET` | `/api/applications/:id/cover-letter` | Get cover letter | Required | 30/min/user | — | `{ content }` or null | 401 |
| `POST` | `/api/applications/:id/rewrite` | AI rewrite edit | Required | 5/min/user | `{ instruction, resumeJson }` | `{ resumeJson, matchMeta }` | 401, 422 |
| `POST` | `/api/applications/:id/status` | Get automation status | Required | 30/min/user | — | `{ automationStatus }` | 401 |

### Feed Routes

| Method | Route | Purpose | Auth | Rate Limit | Used By | Response |
|--------|-------|---------|------|------------|---------|----------|
| `GET` | `/api/seeker/feed` | Matched jobs (profile-based) | Required (SEEKER) | 30/min/user | **Dashboard** | `{ jobs[], nextCursor, totalCount, remainingCount, hasMoreRecent }` |
| `GET` | `/api/jobs/feed` | All jobs (unfiltered catalog) | Required | 30/min/user | **Browse Jobs** | `{ jobs[], nextCursor, totalCount }` |

The two feed endpoints share the same response shape but different filtering:
- `seeker/feed`: filters by match score against user's skills, excludes applied/dismissed jobs, boosts promoted jobs
- `jobs/feed`: returns ALL open jobs with cursor pagination, supports search + filter params

### Resume Routes

| Method | Route | Purpose | Auth | Rate Limit | Request | Response | Error |
|--------|-------|---------|------|------------|---------|----------|-------|
| `POST` | `/api/resume/upload` | Upload + parse resume | Required | 10/hr (all tiers) | FormData: file (PDF/DOCX, max 10MB) | `{ masterResume }` | 401, 422 (unparseable), 429 |
| `POST` | `/api/resume/preview-pdf` | Generate PDF for preview/download | Required | 30/min/user | `{ resumeJson }` | `application/pdf` blob | 401, 422 |
| `GET` | `/api/generation-quota` | Get quota status | Required | 30/min/user | — | `{ used, limit, resetsAt }` | 401 |

---

## 8. AI Engine Architecture

### 8.1 Component Map

```
src/lib/ai/
├── resume-tailor.ts            ★ Core: MasterResume + JD → tailored ResumeVersion
├── resume-parser.ts              Vision: PDF/DOCX → structured ResumeDocument JSON
├── cover-letter-generator.ts     Tailored resume + JD → cover letter text
├── jd-parser.ts                  JD text → structured skills/requirements extraction
├── generation-quota.ts           Check (allowed?) + Consume (decrement) monthly quota
├── with-retry.ts                 Generic: 2 retries, exp backoff, 30s timeout → null on exhaustion
└── skill-catalog-extractor.ts    (utility) Extract skill catalog from JD text
```

### 8.2 `resume-tailor.ts` — The Core Loop

This is the single most important AI call. Everything else wraps around it.

**Execution order (strict):**

```
1. checkGenerationQuota(userId)        → block if exceeded, return quota_exceeded
2. hourly rate limit check             → block if exceeded, return rate_limited
3. JD quality check (<50 words)        → return ai_error(unreadable_jd) if too short
4. buildTailorResumeMessages()         → construct system + user prompt
5. call Gemini via OpenRouter          → withRetry wrapper (2 retries, 30s timeout)
6. parseAiResponse()                   → extract { resume, matchMeta } from AI output
7. ResumeDocumentSchema.safeParse()    → validate against Phase 0 schema
8. If valid: create ResumeVersion row  → version++ capped at 5
9. Update Application                  → bump generationCount, set activeVersionId
10. consumeGenerationQuota(userId)     → only on schema-valid success
11. Return success with resumeVersion + matchMeta
```

**TailorResumeResult discriminated union:**

```typescript
type TailorResumeResult =
  | { status: "success"; resumeVersion: ResumeVersionResponse }
  | { status: "quota_exceeded"; used: number; limit: number; resetsAt: string }
  | { status: "rate_limited"; retryAfterSeconds: number }
  | { status: "ai_error"; reason: "timeout" | "malformed_response" | "unreadable_jd" }
  | { status: "validation_error"; details: string }
```

**Prompt constraints (system prompt):**
- AI must ONLY use data present in input ResumeDocument JSON — no invented companies, titles, dates, or metrics
- Output wrapped in `{ resume: ResumeDocument, matchMeta: MatchMeta }`
- `matchMeta` includes: matchScore, addedKeywords, missingKeywords, requiredSkillsMatched/Total, preferredSkillsMatched/Total
- Temperature and max_tokens controlled via `TAILOR_RESUME_CONFIG`

### 8.3 `resume-parser.ts` — Vision-based Upload

```
Upload PDF/DOCX → R2 storage → Gemini 2.5 Flash (vision) → structured JSON
                                                              │
                                                    ResumeDocumentSchema.safeParse()
                                                              │
                                                    Save as MasterResume (upsert)
```

- File uploaded to Cloudflare R2, then sent as base64 to Gemini Vision API
- Handles scanned/image PDFs (no separate OCR step needed)
- Two-column layouts handled correctly (sidesteps `pdf-parse` garbling)
- Runs once per upload — not per application

### 8.4 `cover-letter-generator.ts`

```
Tailored ResumeVersion JSON + JD text → Gemini 2.5 Flash → cover letter text
                                                              │
                                                    Persisted to CoverLetter model
```

- Reuses stored JD text (no re-scrape)
- Reuses tailored resume JSON (not base MasterResume)
- Shared quota pool with resume generation

### 8.5 `with-retry.ts` — Reliability Wrapper

```
withRetry(fn, { maxRetries: 2, baseDelayMs: 1000, timeoutMs: 30000 })
  ├── Attempt 1 → 30s timeout → fail → wait 1s
  ├── Attempt 2 → 30s timeout → fail → wait 2s
  └── Attempt 3 → 30s timeout → fail → return null
```

- Returns `null` on exhausted retries (never throws)
- `AbortController` used for timeout enforcement
- All AI calls (parsing, tailoring, cover letter, JD parse) use this wrapper

### 8.6 `generation-quota.ts` — Quota Enforcement

```typescript
checkGenerationQuota(userId):
  → find GenerationQuota for current "YYYY-MM"
  → look up user.plan → planLimits[plan]
  → return { allowed: boolean, used: number, limit: number, resetsAt: string }

consumeGenerationQuota(userId):
  → upsert GenerationQuota { userId, month: "YYYY-MM", count: { increment: 1 } }
```

- planLimits: `{ FREE: 2, STARTER: 20, GROWTH: 50, SCALE: 100 }`
- Only called on schema-valid AI success
- Rate limits are SEPARATE from quota (independent enforcement)

---

## 9. ATS Job Feed Architecture

### Data Flow

```
Cron Jobs (via Vercel Cron / GitHub Actions)
  │
  ├── Fetch from Greenhouse API → normalize → upsert Job records
  ├── Fetch from Lever API → normalize → upsert Job records
  ├── Fetch from Ashby API → normalize → upsert Job records
  └── (extensible to more sources)
        │
        ▼
  Deduplication: dedupeKey = MD5(companyName|title|atsSourceId)
        │
        ▼
  Record stored in Job table with atsSource, atsSourceId
        │
        ▼
  Staleness: lastSeenAt updated every cron run
  → Jobs not seen in 48h marked stale (status → CLOSED or filtered out)
```

### Job Schema Enhancements for ATS

| Field | Purpose |
|-------|---------|
| `atsSource` | Source platform: `greenhouse` / `lever` / `ashby` |
| `atsSourceId` | Raw ID from source API (stable per source) |
| `dedupeKey` | `MD5(companyName\|title\|atsSourceId)` — unique constraint |
| `lastSeenAt` | Refreshed every cron run — drives 48h stale check |
| `location` | Raw location string |
| `locationClass` | Classified: `worldwide` / `us-only` / `emea` / `india` / `onsite` |
| `visaSonsored` | Extracted from description text |

### Blocklist

`AtsBlocklist` table allows admins to block specific companies or domains from appearing in the feed:
- `companyName` — matched case-insensitively against `Job.companyName`
- `domain` — matched against `Job.companyWebsite` (optional)

### 9.1 Profile-Based Matching (Dashboard Feed)

The Dashboard feed (`GET /api/seeker/feed`) returns only jobs that match the user's skills:

```
User uploads/seeks profile with skills
              │
              ▼
computeAllMatches(seekerProfileId)
  → compares seeker skills vs job required skills
  → score = (intersection / jobSkills) × 100
              │
              ▼
Results cached in Redis (15 min TTL)
  key: "match:{seekerProfileId}"
  value: [{ jobId, score }, ...]
  sorted by score descending
              │
              ▼
Feed API returns matched jobs with:
  - matchScore (0-100)
  - matchedSkillNames (what the user has)
  - missingSkills (gaps, shown if score < 60)
  - boosted jobs float to top
              │
              ▼
Filtered out: already-applied jobs, dismissed jobs
```

**Two feed modes in `GET /api/seeker/feed`:**
- **Matched mode (default):** Returns paginated results from `computeAllMatches()` — the user's skill-matched jobs
- **Recent unmatched mode (`recentOffset` param):** Returns newer admin-posted jobs that don't have a match score yet. This ensures new jobs still appear even before the matching system processes them

### 9.2 All-Jobs Feed (Browse)

The Browse feed (`GET /api/jobs/feed`) returns ALL open jobs without profile filtering:

```
Browse Jobs → GET /api/jobs/feed
  → NO match score filtering
  → NO applied/dismissed exclusion
  → Supports: search (q), jobType, workType, locationClass, visaSponsored
  → Cursor-based pagination
  → Returns every open job (status = OPEN)
```

This endpoint is used exclusively by the Browse Jobs page. It does NOT apply any personalization — every user sees the same job catalog (filtered only by their search/filter params).

### 9.3 "Add Your Own Job" Flow

1. User clicks "Add Your Own Job" card (Dashboard only)
2. Modal opens with two options:
   - **Paste URL** → `POST /api/jobs/parse-url` → extract metadata (title, company, description) → pre-fill form
     - URL validated against domain allowlist (SSRF protection — see security section in BUILD-PLAN.md)
     - Non-allowlisted URLs routed to paste-JD fallback
   - **Paste JD Text** → raw JD text input → AI parses via `jd-parser.ts`
3. Application record created → generation flow begins

---

## 10. Frontend Component Tree

```
src/
├── app/(app)/                           ← Authenticated pages
│   ├── dashboard/
│   │   ├── page.tsx                     ← Main dashboard (feed + apps table)
│   │   ├── browse/page.tsx              ← Browse all jobs
│   │   ├── tracker/
│   │   │   ├── page.tsx                 ← Application tracker (tabbed table)
│   │   │   └── [id]/page.tsx            ← Tracker item detail
│   │   ├── applications/page.tsx        ← All applications list
│   │   └── saved/page.tsx               ← Saved/bookmarked jobs
│   ├── applications/
│   │   └── [id]/page.tsx                ← Application detail page
│   ├── generate-resume/page.tsx         ← Standalone resume generation (legacy)
│   ├── resume-preview/page.tsx          ← Standalone resume preview (legacy)
│   ├── profile/page.tsx                 ← User profile
│   └── settings/page.tsx                ← Settings + subscription
│
├── modules/                             ← Domain modules
│   ├── applications/
│   │   └── components/
│   │       ├── ApplicationPageClient.tsx    ★ Main application page orchestrator
│   │       ├── ResumePreviewContent.tsx     ★ ATS-safe resume HTML renderer
│   │       ├── ResumeEditor.tsx             ★ Full structured CRUD editor
│   │       ├── AiRewritePanel.tsx           ★ AI rewrite with diff display
│   │       └── QuotaBadge.tsx               ★ Quota usage display
│   ├── dashboard/components/
│   │   ├── FreePlanBanner.tsx               Upgrade prompt banner
│   │   ├── ResumeParseBanner.tsx            Upload prompt banner
│   │   └── ApplicationsTable.tsx            Recent applications table
│   ├── tracker/components/                  Tracker-specific components
│   ├── seeker-onboarding/                   Onboarding wizard
│   ├── browse/                              Browse-specific components
│   ├── billing/                             Subscription/plan components
│   ├── jobs/                                Job-related components
│   └── seeker/                              Seeker profile components
│
├── components/shared/                   ★ Reusable (used in 2+ modules)
│   ├── JobCard.tsx                       Job card for grid display
│   ├── JobDrawer.tsx                     Job detail slide-over drawer
│   ├── JobStatusBadge.tsx                Status badge with color
│   ├── SearchBar.tsx                     400ms debounce search
│   ├── FilterChips.tsx                   Active filter chips
│   ├── AddCustomJobModal.tsx             Paste URL/JD modal
│   ├── ApplyJobModal.tsx                 Apply confirmation modal
│   ├── MatchRing.tsx                     SVG match score ring
│   ├── Logo.tsx                          Brand logo
│   ├── AccountMenu.tsx                   User menu dropdown
│   ├── InitialsAvatar.tsx                Avatar fallback
│   ├── Pagination.tsx / PaginationControls.tsx
│   └── ... (30 components total)
│
├── components/ui/                        ★ shadcn/ui primitives (never customize)
│   ├── button.tsx
│   ├── skeleton.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   └── ... (shadcn/ui base components)
│
├── lib/                                  ★ Shared utilities
│   ├── ai/                               AI engine (6 files — see §8)
│   ├── validations/resume.schema.ts      Phase 0 ResumeDocument schema (Zod)
│   ├── ai-prompts.ts                     System prompts for AI calls
│   ├── openrouter.ts                     OpenAI-compatible client config
│   ├── prisma.ts                         Prisma client singleton
│   ├── rate-limit.ts                     Upstash rate limiters
│   └── utils.ts                          General utilities
│
├── store/
│   └── use-ui-store.ts                   Zustand global UI state
│
├── hooks/                                Custom React hooks
│   ├── use-feed.ts                       Job feed infinite query
│   └── ...
│
├── services/                             Service layer
│   └── application.service.ts            Application API calls
│
├── constants/
│   └── enums.ts                          TypeScript enums matching Prisma enums
│
├── types/                                Shared type definitions
├── config/                               App configuration
└── providers/                            React context providers
```

---

## 11. Error Handling & Edge Cases

| Case | Detection | Handling | User Facing |
|------|-----------|----------|-------------|
| **No resume uploaded** | `MasterResume` is null | Block generate, return 409 | "Upload your resume to get started" + link to onboarding |
| **JD text too short** | `< 50 words` | Return validation error, allow `forceGenerate: true` override | "Job description seems too short" + override option |
| **ATS URL unreadable** | Low confidence / empty scrape result | Auto-fallback to paste-JD prompt | "Couldn't read that page — paste the JD text instead" |
| **AI call timeout** | `withRetry` returns null after 3 attempts | Set `automationStatus = FAILED`, no quota consumed | "We couldn't generate your resume right now. Please try again." + Retry button |
| **AI returns malformed JSON** | `safeParse` fails | Reject output, set `FAILED`, no quota consumed | Same as timeout |
| **Quota exceeded** | `checkGenerationQuota()` returns `allowed: false` | 402 HTTP, no AI call made | "You've used all X generations this month. Upgrade to get more." + reset date |
| **Rate limited (generation)** | Hourly limit exceeded (5/hr free, 15/hr paid) | 429 HTTP, no AI call made | "You've hit the hourly limit — try again in X minutes" |
| **Rate limited (upload)** | 10/hr limit per user | 429 HTTP | Same format, shorter window |
| **Duplicate apply to same job** | `@@unique([jobId, seekerId])` constraint | Prisma throws unique constraint violation → 409 | "You've already applied to this job" |
| **Generate while already generating** | `isGenerating` state in UI | Button disabled + early return in route | Button shows spinner, no double-fire |
| **Regenerate at max versions** | Count versions ≥ 5 | Reject with error | "Already at max regenerations (5)" |
| **Fit-to-one-page overflow** | PDF render exceeds 1 page after 10pt + 0.5" margins | Trim lowest-priority bullets from oldest→newest | "Trimmed N bullets to fit one page — review before downloading" |
| **Cover letter before resume ready** | Resume status ≠ `READY` | Button disabled with tooltip | "Generate your resume first" |
| **AI fabricates data** | System prompt constraint + `safeParse` validation | Reject output, no quota consumed | Same as malformed response |

---

## 12. Monetization & Quota

### Pricing Tiers

| Tier | Price (USD) | Generations/Month | Hourly Rate Limit | Description |
|------|-------------|-------------------|-------------------|-------------|
| **FREE** | $0 | 2 | 5/hr | Try it out |
| **STARTER** | $7 | 20 | 15/hr | Active job seekers |
| **GROWTH** | TBD | 50 | 15/hr | Power users |
| **SCALE** | $12 | Unlimited | 15/hr | Heavy users |

### Quota Rules

1. **Shared pool** — resume generation + cover letter generation use the same counter
2. **Regenerate** does NOT consume quota (capped at 5/application instead)
3. **AI Rewrite** does NOT consume quota (capped at 5 edits/generation instead)
4. **Only counts** when AI returns schema-valid output — timeouts and errors cost nothing
5. **Server-side enforcement** — quota is checked in `resume-tailor.ts` BEFORE any AI call fires

### UI Quota Display

Single counter format in `QuotaBadge`:

> "**X of Y** generations used this month"

Never split into separate counters (shared pool would confuse). On exhaustion:
> "You've used all Y generations this month. Resets on July 31."
> [Upgrade Plan] button

### Rate Limiting (separate from quota)

| Limiter | Scope | Free | Paid | Redis Key |
|---------|-------|------|------|-----------|
| Generation | Per user, hourly | 5/hr | 15/hr | `hiretivo:resume-gen-hourly:{userId}` |
| Resume upload | Per user, hourly | 10/hr | 10/hr | `hiretivo:resume-upload-hourly:{userId}` |

Both checked before any AI call — blocked requests cost nothing.

---

## 13. Future Roadmap

> **Do not build any of this until the core loop (Phases 0-8) is validated on 10+ real job descriptions.**

### Phase 9+ — Parked Features

| Feature | Description | Dependency |
|---------|-------------|------------|
| **Auto Apply** | Actual ATS submission automation — user doesn't leave the platform | ATS integration per platform (Greenhouse API, Lever API, etc.) |
| **Multiple Resume Templates** | Template #2, #3 beyond the single ATS-safe template | Template renderer extensibility |
| **Resume Style Customization** | Accent color, font picker, paper size | Template engine v2 |
| **Application Withdrawal/Deletion** | User can withdraw submitted applications | Tracker UI + status model |
| **ATS Status Verification** | Webhook/scrape-back confirmation of "Applied" | ATS-specific integration |
| **AI Chat** | Conversational resume assistant (from original roadmap) | AI engine + chat UI |
| **Multiple Base Resumes** | Separate Dev track vs PM track (ResumeBase model designed but not built) | MasterResume model evolution |

---

## Appendix: Key Files Reference

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | All data models, enums, indexes (671 lines) |
| `src/lib/validations/resume.schema.ts` | Phase 0 ResumeDocument Zod schema (121 lines) |
| `src/lib/ai/resume-tailor.ts` | Core AI tailoring engine (197 lines) |
| `src/lib/ai/with-retry.ts` | Retry wrapper for AI calls (37 lines) |
| `src/lib/ai/generation-quota.ts` | Monthly quota check + consume |
| `src/lib/ai/resume-parser.ts` | Vision-based resume parser |
| `src/lib/ai/cover-letter-generator.ts` | Cover letter generation |
| `src/lib/ai-prompts.ts` | System prompts for AI calls |
| `src/lib/openrouter.ts` | OpenAI-compatible client config |
| `src/app/api/applications/[id]/generate/route.ts` | Generate endpoint (175 lines) |
| `src/app/api/applications/[id]/route.ts` | Application detail endpoint |
| `src/modules/applications/components/ApplicationPageClient.tsx` | Application page (748 lines) |
| `src/modules/applications/components/AiRewritePanel.tsx` | AI rewrite panel |
| `src/modules/applications/components/ResumeEditor.tsx` | Resume CRUD editor |
| `BUILD-PLAN.md` | Implementation plan (658 lines — phases 0-9) |

---

## 14. Feature Completion Checklist

> **Audit date:** 2026-07-17  
> **Branch:** `feature/pivot-v2`  
> **Method:** Codebase audit (all 373 changed files reviewed against BUILD-PLAN.md requirements)

### 14.1 Core Platform

- [x] User authentication (Auth.js v5 — email/password + Google OAuth)
- [x] Onboarding Step 1 — Profile creation (role, skills, LinkedIn, etc.)
- [x] Onboarding Step 2 — Resume upload + AI vision parsing
- [x] Onboarding Step 2 — Skip option ("I'll do it later")
- [x] Seeker role flow (recruiter/admin code removed in pivot)
- [x] Subscription / billing via Dodopayments
- [x] Email verification for trusted actions

### 14.2 ATS Job Feed

- [x] Greenhouse ATS cron integration
- [x] Lever ATS cron integration
- [x] Ashby ATS cron integration
- [x] Job deduplication (`dedupeKey = MD5(companyName|title|atsSourceId)`)
- [x] Job staleness tracking (48h via `lastSeenAt`)
- [x] Company blocklist (`AtsBlocklist` table)
- [x] Location classification (`locationClass` field)
- [x] Visa sponsorship detection
- [x] Match score computation (`computeAllMatches()` — skill-based)
- [x] Match score caching (Redis, 15 min TTL)
- [x] Boosted jobs floating to top of feed
- [x] Job dismissal (user can dismiss jobs)

### 14.3 Dashboard

- [x] Dashboard page exists at `/dashboard`
- [x] Profile-matched job grid (via `GET /api/seeker/feed`)
- [x] "Add Your Own Job" card (pinned, first in grid)
- [x] "Add Your Own Job" modal (paste URL or JD text)
- [x] Recent unmatched jobs section (`recentOffset` mode)
- [x] Recent applications table (last 5)
- [x] Free Plan Banner
- [x] Resume Parse Banner (shown if `MasterResume` is null)
- [x] Search bar with 400ms debounce + abort previous
- [x] Filter chips (location, work type, job type, experience)
- [x] Skeleton loading states
- [x] Error states
- [x] Empty states
- [ ] **BUG:** FREE plan quota set to 99 in code (`generation-quota.ts:12`) — should be 2 per BUILD-PLAN.md
- [ ] **GAP:** Dashboard shows all jobs from feed, not just "matched" — need to verify feed endpoint correctly filters by match score for Dashboard context

### 14.4 Browse Jobs

- [x] Browse Jobs page exists at `/dashboard/browse`
- [x] Full search + filter functionality
- [x] Cursor-based pagination / load more
- [ ] **BUG:** Browse Jobs page incorrectly includes "Add your own" card (`BrowseJobGrid.tsx:95-105`)
- [ ] **GAP:** Browse Jobs uses same matched feed as Dashboard (`/api/seeker/feed`) — needs a separate endpoint (`/api/jobs/feed`) that returns ALL jobs without profile filtering

### 14.5 Job Drawer

- [x] Slide-over drawer with job details
- [x] Company logo + name + title
- [x] Match score ring
- [x] Skills tags
- [x] Location, work type, job type, salary
- [x] Full job description
- [x] "View Original Job" button (new tab)
- [x] "Apply" button
- [x] Skeleton loading states
- [x] Error / 404 handling

### 14.6 Resume Upload & Parsing

- [x] File upload (PDF/DOCX, max 10MB) to Cloudflare R2
- [x] Vision-based parsing via Gemini 2.5 Flash
- [x] Parsed JSON validated against `ResumeDocumentSchema`
- [x] MasterResume upsert (create or update)
- [x] Upload rate limiting (10/hr per user)

### 14.7 Resume Generation Engine

- [x] `resume-tailor.ts` — Core AI tailoring (MasterResume + JD → tailored version)
- [x] `with-retry.ts` — 2 retries, exponential backoff, 30s timeout
- [x] Quota check BEFORE AI call (no quota = no API cost)
- [x] Rate limit check BEFORE AI call (5/hr free, 15/hr paid)
- [x] Schema validation AFTER AI call (`ResumeDocumentSchema.safeParse()`)
- [x] Quota consumption only on schema-valid success
- [x] Versioned storage (new `ResumeVersion` row per generate)
- [x] Application generation counter (`generationCount` increment)
- [x] Match metadata populated in same response (`matchMeta`)
- [x] JD quality check (< 50 words — warns, allows `forceGenerate`)
- [x] Fallback to stored job description if no `jdText` provided

### 14.8 Regenerate

- [x] Uses same `POST /api/applications/:id/generate` route
- [x] Creates new `ResumeVersion` (version auto-increment)
- [x] Capped at 5 versions per application
- [x] Does NOT consume generation quota
- [x] Captures pre-regenerate match score for before/after delta display

### 14.9 ATS-Safe PDF Generation

- [x] Single-column template (no tables, no icons, no images)
- [x] Contact info in document body (not header/footer)
- [x] Standard section headers
- [x] Real text-based PDF (selectable/copyable)
- [x] Fit-to-one-page: shrink 11pt→10pt, then trim low-priority bullets
- [x] Trim notice (`X-Trimmed-Bullets` response header)
- [x] Download via `POST /api/resume/preview-pdf`

### 14.10 Application Page

- [x] Application page at `/applications/:id`
- [x] Match Score gauge (SVG ring, color-coded)
- [x] Before/after score delta on regenerate
- [x] Job Description display (scrollable)
- [x] Added Keywords badges (green)
- [x] Missing Keywords badges (red)
- [x] Skills Checklist (required + preferred with progress bars)
- [x] "I've Applied" / "Mark as Applied" button
- [x] Quota Badge (used/limit with upgrade prompt)
- [x] Timeline (Application Created → Resume Generated → Applied)

### 14.11 Resume Preview + Versioning

- [x] Resume Preview tab (ATS-safe rendered HTML)
- [x] Version selector dropdown (v1, v2, v3...)
- [x] Download PDF button
- [x] Regenerate button
- [x] Cover Letter tab
- [x] Editor tab
- [x] AI Rewrite Panel — 5 canned chips + freeform input
- [x] AI Rewrite diff highlighting (before/after)

### 14.12 Cover Letter

- [x] `cover-letter-generator.ts` — AI generation
- [x] `POST /api/applications/:id/cover-letter` — generate route
- [x] `GET /api/applications/:id/cover-letter` — fetch route
- [x] `CoverLetter` model for persistence
- [x] Shared quota pool with resume generation
- [x] Disabled until resume reaches `READY` status
- [x] Loading / empty / error states

### 14.13 Resume Editor

- [x] `ResumeEditor` component with full CRUD
- [x] Personal Info section
- [x] Professional Summary section
- [x] Experience section (add/delete entries, add/delete/reorder bullets)
- [x] Projects section
- [x] Education section
- [x] Skills section (by category)
- [x] Certifications section
- [x] Languages section
- [x] Save creates new `ResumeVersion` with `sourceType: manual-edit`
- [x] Reads/writes directly to Phase 0 schema fields

### 14.14 AI Rewrite Panel

- [x] `AiRewritePanel` component
- [x] 5 canned suggestion chips
- [x] Freeform input field
- [x] `POST /api/applications/:id/rewrite` endpoint
- [x] Before/after diff highlighting
- [x] 5-edit cap per generation (server-side)
- [x] Does NOT consume generation quota

### 14.15 Tracker

- [x] Tracker page at `/dashboard/tracker`
- [x] Tab filtering: All / Submitted / In Flight / Needs You / Failed / Skipped
- [x] Table columns: Company | Role | Resume Status | Automation Status | Hiring Status | Applied Date
- [x] Color-coded status badges
- [x] Search within applications
- [x] Retry button for failed generations
- [x] Row click → navigate to `/applications/:id`
- [x] Loading / empty / error states
- [x] `APPLYING` status is DORMANT (reserved for future Auto Apply, not reachable)

### 14.16 API & Infrastructure

- [x] All API routes rate-limited (Upstash Redis sliding window)
- [x] Server-side quota enforcement (`GenerationQuota` table)
- [x] Rate limiting: generation (5/hr free, 15/hr paid)
- [x] Rate limiting: resume upload (10/hr all tiers)
- [x] Auth checks on every route (401 if no session)
- [x] Role checks on seeker-specific routes (403 if not SEEKER)
- [x] Application ownership checks (user can only access their own apps)
- [x] Input validation via Zod schemas on all POST/PATCH routes
- [x] Consistent error response shape: `{ error, message?, details? }`
- [x] Rate limiting for all public + authenticated endpoints

### 14.17 Data Model

- [x] `MasterResume` — canonical parsed resume JSON
- [x] `ResumeVersion` — per-application versioned generations
- [x] `GenerationQuota` — monthly usage tracking
- [x] `CoverLetter` — per-application cover letters
- [x] `Application` — generation tracking fields (generationCount, activeVersionId)
- [x] Unique constraint on `Application(jobId, seekerId)` — prevents duplicate apply
- [x] `ResumeDocument` Zod schema shared across all 5 consumers

### 14.18 Known Bugs & Gaps

| # | Severity | Issue | Location | Fix Needed |
|---|----------|-------|----------|------------|
| 1 | **High** | FREE plan quota hardcoded to 99 | `generation-quota.ts:12` | Change to 2 per BUILD-PLAN.md |
| 2 | **Medium** | Browse Jobs has "Add your own" card | `BrowseJobGrid.tsx:95-105` | Remove the card from Browse — it should only appear on Dashboard |
| 3 | **Medium** | Browse Jobs uses matched feed, not all-jobs feed | `BrowseJobGrid.tsx` uses `useFeed` → `/api/seeker/feed` | Create `GET /api/jobs/feed` endpoint returning all open jobs without matching |
| 4 | **Low** | Resume preview URL generation may create stale previews | `preview-pdf` endpoint | Verify PDF reflects latest version, not a cached render |
| 5 | **Low** | No E2E test coverage for generation flow | Entire codebase | Add test for Apply → Generate → Preview → Mark Applied flow |

### 14.19 Summary

| Category | Total Features | Completed | Bugs/Gaps | Completion % |
|----------|---------------|-----------|-----------|--------------|
| Core Platform | 7 | 7 | 1 bug | 100% (85% with bug) |
| ATS Job Feed | 12 | 12 | 0 | 100% |
| Dashboard | 15 | 13 | 2 gaps | 87% |
| Browse Jobs | 3 | 1 | 2 gaps | 33% |
| Job Drawer | 11 | 11 | 0 | 100% |
| Resume Upload | 5 | 5 | 0 | 100% |
| Generation Engine | 11 | 11 | 0 | 100% |
| Regenerate | 5 | 5 | 0 | 100% |
| PDF Generation | 7 | 7 | 0 | 100% |
| Application Page | 10 | 10 | 0 | 100% |
| Preview + Versions | 6 | 6 | 0 | 100% |
| Cover Letter | 7 | 7 | 0 | 100% |
| Resume Editor | 10 | 10 | 0 | 100% |
| AI Rewrite | 7 | 7 | 0 | 100% |
| Tracker | 10 | 10 | 0 | 100% |
| API & Infra | 10 | 10 | 0 | 100% |
| Data Model | 7 | 7 | 0 | 100% |
| **Total** | **143** | **139** | **5** | **97%** |
