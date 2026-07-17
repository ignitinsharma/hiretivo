# Hiretivo v2 -- Product & Development Blueprint (Condensed)

> This document defines the target architecture, UX flow, and
> engineering implementation for Hiretivo. It replaces isolated page
> behavior with one unified Job → Resume → Application lifecycle.

------------------------------------------------------------------------

# Core Lifecycle

``` text
Browse / Dashboard
        │
        ▼
Open Job Drawer
        │
        ▼
Apply
        │
        ▼
Generate Resume
        │
        ▼
Resume Preview & Editor
        │
        ▼
AI Apply OR Manual Apply
        │
        ▼
Tracker
        │
        ▼
Hiring Pipeline
```

------------------------------------------------------------------------

# 1. Dashboard

## Goals

-   Remove all static job cards.
-   "Add Your Own Job" card is pinned as the first card.
-   Remaining cards are dynamic ATS recommendations.
-   Same search/filter system as Browse Jobs.
-   Shared API.

Layout:

``` text
Search
Filters

+ Add Your Own | Job | Job | Job | Job

Applications Tracker
```

Job card:

-   Company
-   Logo
-   Title
-   Match Score
-   Skills
-   Location
-   Workplace
-   Apply CTA

------------------------------------------------------------------------

# 2. Browse Jobs

Uses exactly the same API, filters, sorting and debounce as Dashboard.

Shared components:

-   Search
-   Filters
-   JobCard
-   JobDrawer

------------------------------------------------------------------------

# 3. Search

Problems: - Request on every keystroke. - Rate limiting.

Requirements:

-   400ms debounce
-   Abort previous request
-   Latest request wins
-   Ignore duplicate query
-   Empty query resets feed
-   Shared across Dashboard/Browse/Tracker

React Query key:

``` ts
["jobs", debouncedSearch, filters, page]
```

------------------------------------------------------------------------

# 4. Job Drawer

Open from Dashboard or Browse.

Contents:

-   Company
-   Job Title
-   Match Score
-   Skills
-   Tags
-   Responsibilities
-   Requirements
-   Description

Actions:

-   View Original Job (new tab)
-   Apply

No separate company profile page.

------------------------------------------------------------------------

# 5. Apply Flow

Apply

↓

Create Application

↓

Generate Resume

↓

Redirect to Resume Preview

Never redirect to generation wizard again.

------------------------------------------------------------------------

# 6. Resume Preview

Inspired by Tsenta.

Left:

-   AI Changes
-   Resume Analysis
-   Suggestions
-   Chat (future)

Right:

-   Resume Preview
-   Download
-   Apply
-   I've Applied

------------------------------------------------------------------------

# 7. Resume Editing

User can:

-   edit
-   regenerate
-   download
-   save

Future:

-   version history

------------------------------------------------------------------------

# 8. Manual Apply

User clicks

"I've Applied"

↓

Application enters Tracker

Status:

Applied

------------------------------------------------------------------------

# 9. AI Apply

Resume Ready

↓

ATS Apply

↓

Tracker

Statuses:

Generating

Ready

Applying

Submitted

Needs You

Failed

Completed

------------------------------------------------------------------------

# 10. Tracker

Inspired by Tsenta.

Tabs:

-   All
-   Submitted
-   In Flight
-   Needs You
-   Failed
-   Skipped

Each row:

-   Company
-   Role
-   Resume Status
-   Automation Status
-   Hiring Status
-   Applied Date

Clicking a row opens an Application Drawer with resume, activity
timeline, retry, download.

------------------------------------------------------------------------

# 11. Paste Job URL

Paste URL

↓

Fetch metadata

↓

Create Application

↓

Generate Resume

↓

Resume Preview

No extra generation step.

------------------------------------------------------------------------

# 12. Shared Architecture

One Application entity:

Job → Resume → Application → Tracker

Dashboard, Browse and Tracker all reference the same record.

------------------------------------------------------------------------

# 13. Engineering

-   React Query
-   AbortController
-   Shared Search component
-   Shared Filter component
-   Shared Drawer
-   Shared Job Card
-   Infinite scrolling ready
-   Skeleton loaders
-   Empty states
-   Error states
-   Analytics events

------------------------------------------------------------------------

# 14. Acceptance Criteria

-   No static jobs.
-   Dashboard & Browse identical search behavior.
-   One API request after debounce.
-   Drawer opens from any job.
-   View Original Job opens in new tab.
-   Apply always opens Resume Preview.
-   Manual Apply updates Tracker.
-   AI Apply updates automation status.
-   Tracker reflects real application lifecycle.
