# Hiretivo v3 — Feature Blueprint

> **Status:** Pre-planning  
> **Last Updated:** 2026-07-23  
> **Context:** Expanding beyond resume tailoring to cover the full "get hired faster" funnel — from job discovery through interview prep.

---

## Overview

Four features identified through competitive analysis of Simplify, Jobscan, Rezi, and Careerflow. All four extend the core tailoring engine — each feature builds on data Hiretivo already has (MasterResume, JD, Application, SeekerProfile).

| # | Feature | Funnel Stage | Impact | Effort |
|---|---------|-------------|--------|--------|
| 1 | LinkedIn Profile Optimizer | Discover → Apply | Medium — recruiter discoverability, quick win | Low |
| 2 | Smart Job Feed + Alerts | Discover → Apply | High — proactive discovery, first-mover advantage | Low-Medium |
| 3 | ATS Resume Quality Score | Match → Apply | Medium — deeper ATS optimization, trust signal | Medium |
| 4 | AI Mock Interview | Interview → Offer | High — converts callbacks into offers | High |

---

## Feature 1: LinkedIn Profile Optimizer

### Problem

Recruiters find candidates on LinkedIn, but most profiles are undertuned. Users have a great resume (thanks to Hiretivo) but their LinkedIn doesn't match. The same AI that tailors resumes can optimize LinkedIn profiles — same data, different format.

### Solution

One-click LinkedIn profile optimization. AI reads MasterResume + SeekerProfile → generates optimized LinkedIn content (headline, About, skills, experience rewrites). User reviews and copies to LinkedIn.

### Optimized Sections

| Section | What We Optimize |
|---------|-----------------|
| **Headline** | Current: generic. Optimized: role + keywords + value prop. "Senior Frontend Engineer | React, TypeScript, Design Systems | 8+ years shipping user-facing products" |
| **About** | Current: empty or outdated. Optimized: 3-paragraph story with hooks, achievements, career narrative |
| **Experience** | Current: copied from resume verbatim. Optimized: more conversational tone, first-person, LinkedIn-friendly formatting |
| **Skills** | Current: random order. Optimized: reordered by relevance to target roles, add missing skills from profile |
| **Featured** | Suggestions: which resume/project/portfolio to feature |
| **Profile Tips** | Photo, background image, custom URL, recommendations |

### User Flow

```
Dashboard → "LinkedIn Optimizer" card
  OR
Settings → "LinkedIn" tab
  → Click "Generate Optimized Profile"
  → AI analyzes MasterResume + SeekerProfile + target roles
  → Preview appears with tabs: Headline | About | Experience | Skills
  → Each tab shows current vs. optimized side-by-side
  → User edits optimized version if desired
  → "Copy to Clipboard" per section (or "Copy All")
  → User pastes into LinkedIn manually
```

### Why No LinkedIn API Auto-Save?

LinkedIn's API is heavily restricted (only approved partners, read-only for most). Copy-to-clipboard is the pragmatic approach. Future: Chrome extension could paste sections.

### Data Model

```prisma
model LinkedInProfile {
  id                   String   @id @default(cuid())
  seekerId             String   @unique
  seeker               User     @relation(fields: [seekerId], references: [id])
  optimizedHeadline    String?
  optimizedAbout       String?
  optimizedExperience  Json?    // array of {company, role, optimizedText}
  optimizedSkills      String[] // reordered + added skills
  featuredSuggestions  String[]
  profileTips          String[]
  sourceResume         String?  // version ID used for optimization
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/seeker/linkedin/optimize` | Generate optimization (with optional target role) |
| `GET` | `/api/seeker/linkedin/optimize` | Get latest optimized profile |
| `PATCH` | `/api/seeker/linkedin/optimize` | Save user edits to optimized version |

### AI Architecture

```
Input:
  - MasterResume JSON (full experience)
  - SeekerProfile (headline, bio, skills, primaryRole)
  - Optional: target role/industry for focus

Prompt strategy (single call, multiple sections):
  System: "You are a LinkedIn profile optimization expert..."
  Output schema: { headline, about, experience[], skills[], featuredSuggestions[], profileTips[] }
  
Model: primary model (single generation, high-value output)
Quota: 1 optimization per month free, 3/month paid (or unlimited for premium)
```

### UI Components

- **LinkedInOptimizerShell** — Tabs for each section
- **ComparisonView** — Two-column: current vs. optimized, per section
- **CopyButton** — Copies section content, shows "Copied!" toast
- **OptimizeButton** — Triggers AI generation with loading state
- **SectionPreview** — Renders LinkedIn-like preview of how it'll look

### Edge Cases

- No MasterResume: prompt user to upload resume first, show "upload to unlock" state
- Partial SeekerProfile: optimize what's available, flag missing fields
- Already optimized: show "last optimized on [date]", allow regenerate
- Target role changes: regenerate is per-call, not cached

---

## Feature 2: Smart Job Feed + Real-Time Alerts

### Problem

Users must actively check the platform to find new jobs. They miss opportunities because they don't know when a perfect-match job appears. Being among the first applicants significantly increases callback rates.

### Solution

Proactive job matching with configurable alerts. When new jobs from ATS feeds match a user's profile, notify them via email and/or in-app notification. Replace passive browsing with active discovery.

### How It Works

1. User sets alert preferences: roles, companies, locations, match threshold, frequency
2. After each ATS cron sync (or new user-submitted job), run matching against alert preferences
3. If jobs match above threshold, queue notifications
4. Send batched email digest (instant / daily / weekly) and/or show in-app badge

### User Flow

```
Dashboard → "Job Alerts" settings
  → Set preferences:
    - Target roles (e.g., "Senior Frontend Engineer", "Staff Engineer")
    - Location preference (remote, US, specific cities)
    - Minimum match score (60%+)
    - Frequency: Instant / Daily Digest / Weekly
    - Notification channel: Email / In-app / Both
  → Save
  → System matches new jobs against preferences
  → Notifications sent
    - Email: subject "3 new Senior Frontend Engineer jobs matched your profile"
    - In-app: badge on dashboard, notification bell
```

### Alert Preferences Data Model

```prisma
model JobAlert {
  id            String   @id @default(cuid())
  seekerId      String
  seeker        User     @relation(fields: [seekerId], references: [id])
  title         String?  // user-given name like "Frontend roles"
  targetRoles   String[] // e.g., ["Senior Frontend Engineer", "Staff Engineer"]
  locations     String[] // e.g., ["remote", "San Francisco"]
  companyIds    String[] // optional: specific companies to watch
  minMatchScore Int      @default(60) // 0-100
  frequency     AlertFrequency @default(INSTANT)
  channels      AlertChannel[]  // EMAIL, IN_APP
  isActive      Boolean  @default(true)
  lastTriggeredAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum AlertFrequency {
  INSTANT   // per-job, may be noisy
  DAILY     // digest at 9am
  WEEKLY    // Monday digest
}

enum AlertChannel {
  EMAIL
  IN_APP
}
```

```prisma
model AlertNotification {
  id            String   @id @default(cuid())
  seekerId      String
  jobId         String
  job           Job      @relation(fields: [jobId], references: [id])
  alertId       String?
  alert         JobAlert? @relation(fields: [alertId], references: [id])
  matchScore    Float
  read          Boolean  @default(false)
  sentAt        DateTime @default(now())
  readAt        DateTime?
}
```

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/seeker/alerts` | Create/update alert preferences |
| `GET` | `/api/seeker/alerts` | List user's alerts |
| `DELETE` | `/api/seeker/alerts/:id` | Delete an alert |
| `GET` | `/api/seeker/notifications` | List recent notifications (paginated) |
| `PATCH` | `/api/seeker/notifications/:id/read` | Mark as read |
| `PATCH` | `/api/seeker/notifications/read-all` | Mark all as read |
| `POST` | `/api/seeker/alerts/:id/test` | Trigger test notification |

### Cron Job Changes

Add to existing `cron-jobs.yml`:
- After each ATS sync, run `POST /api/cron/alerts/process`
- Daily: process pending instant alerts, compile daily digests
- Weekly (Monday): compile and send weekly digests

### Email Templates (Resend)

- `instant-alert` — Single job: "[Company] is hiring a [Role] — 87% match"
- `daily-digest` — Batched: "3 new jobs match your profile today"
- `weekly-digest` — Weekly roundup: "12 new matches this week"

### Edge Cases

- No matching jobs: send periodic "no matches" check-in to keep engagement
- Too many matches: cap at 10 per digest, link to full list
- Alert spam: minimum 1-hour cooldown between instant alerts for same role
- Free plan: 1 alert with daily digest only
- Paid plans: 5 alerts, instant + daily + weekly

---

## Feature 3: ATS Resume Quality Score

### Problem

Current match score only measures skill/keyword overlap. Users don't know if their resume formatting will parse correctly, if their bullet points are effective, or why their score is low beyond missing keywords. They get a number but no roadmap to fix it.

### Solution

Multi-dimensional resume quality scoring with specific, actionable fix recommendations. Six scoring dimensions + per-issue fix suggestions. User sees score improve in real-time as they fix issues.

### Score Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Keyword Match** (existing) | 30% | Hard skills, soft skills, keywords from JD |
| **Bullet Point Quality** | 25% | STAR/XYZ format, measurable results, action verbs, concrete vs. vague |
| **ATS Format Safety** | 15% | Tables, columns, graphics, fonts, special chars, header/footer usage |
| **Section Completeness** | 10% | Missing sections: summary, skills, experience, education |
| **Length & Density** | 10% | One-page fit, appropriate word count, scannability |
| **Action Verb Strength** | 10% | Weak verbs ("worked on", "helped with") vs. strong ("led", "shipped", "reduced") |

### Per-Issue Fix Format

Each issue detected gets:
```
Issue: "Bullet point #3 under 'Software Engineer at Acme' lacks measurable impact"
Severity: MEDIUM
Dimension: Bullet Point Quality
Current: "Worked on improving API performance"
Suggestion: "Reduced API response time by 45% by implementing Redis caching layer"
```

### User Flow

```
Application Page → "Resume Score" tab
  → Overall score display (0-100 gauge, color-coded)
  → Dimension breakdown (6 bars/circles)
  → Issues list sorted by severity
  → Click an issue → see current text + AI suggestion
  → "Apply Fix" button → auto-edits resume in editor
  → Score updates in real-time
  → "Before/After" comparison once fixes applied
```

### Score Data Model

```prisma
model ResumeScore {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  versionId     String    // which ResumeVersion this score is for
  overallScore  Float     // 0-100
  keywordScore  Float
  bulletScore   Float
  atsSafetyScore Float
  completenessScore Float
  lengthScore   Float
  verbStrengthScore Float
  createdAt     DateTime  @default(now())
  
  issues        ResumeScoreIssue[]
}

model ResumeScoreIssue {
  id            String   @id @default(cuid())
  scoreId       String
  score         ResumeScore @relation(fields: [scoreId], references: [id])
  dimension     String   // keyword, bullet, ats_safety, completeness, length, verb_strength
  severity      IssueSeverity
  title         String   // short description
  description   String   // detailed problem
  location      String?  // "bullet_3", "section_summary", etc.
  currentText   String?  // what the user currently has
  suggestedText String?  // AI suggestion for fix
}

enum IssueSeverity {
  CRITICAL  // resume likely filtered out
  HIGH      // significantly hurting score
  MEDIUM    // improvement opportunity
  LOW       // nice to have
}
```

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/applications/:id/score` | Generate/regenerate score for current version |
| `GET` | `/api/applications/:id/score` | Get latest score + issues |
| `GET` | `/api/applications/:id/score/history` | Score history across versions |
| `PATCH` | `/api/score-issues/:id/apply` | Apply AI-suggested fix to resume |
| `PATCH` | `/api/score-issues/:id/dismiss` | Dismiss an issue |

### AI Architecture

```
Two-pass approach:

Pass 1 — Structural Analysis (no AI needed):
  - Check for tables, columns, images in resume JSON
  - Check section completeness (summary? skills? experience?)
  - Count words, check page fit
  - Check for weak verbs from a known list
  → Produces: completeness_score, ats_safety_score, length_score, verb_strength_score

Pass 2 — AI Content Analysis:
  - Send each bullet point to AI for STAR/XYZ evaluation
  - Send existing keyword match data
  → Produces: bullet_score, keyword_score, issues with suggestions

Model: lite model for pass 2 (structured evaluation, not generation)
Quota: scoring does NOT consume generation quota (it's analysis, not generation)
```

### UI Components

- **ScoreGauge** — Circular gauge with color (red <50, yellow 50-75, green 75+)
- **ScoreBreakdown** — 6 horizontal bars per dimension
- **IssueCard** — Severity badge, dimension, current vs. suggested, "Apply Fix" / "Dismiss" buttons
- **ScoreHistoryChart** — Line chart of scores across versions
- **BeforeAfterDiff** — Side-by-side or inline diff of applied fixes

### Edge Cases

- MasterResume doesn't exist: score only what's available, show "upload resume for full score"
- AI scoring fails: fall back to structural-only score, show "partial score" badge
- No issues found (100 score): show congratulations state
- Resume in non-standard format: flag as "unable to parse fully" instead of failing
- Regenerate triggers re-score automatically

---

## Feature 4: AI Mock Interview

### Problem

Users get callbacks from tailored resumes, then fail interviews. No tool connects "here's what your resume says" to "here's how to talk about it in the interview." The interview is the highest-stakes conversion point with zero tooling support.

### Solution

AI generates interview questions from the **actual job description + user's tailored resume + master resume**. Users practice answers (text-based MVP, voice later) and get structured feedback per response.

### Key Differentiator vs Competitors

- Rezi/Careerflow generate generic questions. Ours are **specific to the user's tailored resume** — the AI knows what the user emphasized, what they left out, and can ask probing questions about gaps.
- Questions reference specific experience bullets from the user's resume.

### User Flow

```
Application Page → "Prepare for Interview" button
  → Interview Session created (based on JD + tailored resume)
  → Question 1 shown (category: Behavioral / Technical / Role-specific)
  → User types answer (or skips)
  → AI feedback: what was strong, what to improve, suggested better phrasing
  → Next question → repeat
  → Session summary: overall score, top strengths, areas to improve
```

### Question Categories

| Category | Source | Example |
|----------|--------|---------|
| **Behavioral** | JD requirements + resume experience | "Tell me about a time you led a cross-functional project — your resume mentions the dashboard redesign at Acme." |
| **Technical/Role** | JD skills section + user's skill tags | "The role requires Python and SQL. Walk me through how you'd design a data pipeline for..." |
| **Experience Deep-Dive** | Specific resume bullet points | "You mentioned 'reduced deployment time by 40%' — what specific changes did you make?" |
| **Company/Context** | Company name, industry, JD clues | "Why do you want to work at [Company] specifically, given your background in [industry]?" |
| **Gap Questions** | Skills in JD missing from user's profile | "The role asks for Kubernetes experience. How would you position your Docker experience?" |

### AI Feedback per Answer

For each answer, the AI evaluates:
- **Relevance** (0-10): Did it answer the question?
- **Specificity** (0-10): Concrete examples vs. vague claims
- **Structure** (0-10): STAR format, clear narrative
- **Suggested Rewrite** (text): A better version of their answer
- **Tip** (text): One actionable improvement

### Data Model

```prisma
model InterviewSession {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  seekerId      String
  status        InterviewSessionStatus @default(IN_PROGRESS)
  currentIndex  Int      @default(0)   // which question user is on
  totalQuestions Int     @default(5)
  overallScore  Float?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  questions     InterviewQuestion[]
}

model InterviewQuestion {
  id            String   @id @default(cuid())
  sessionId     String
  session       InterviewSession @relation(fields: [sessionId], references: [id])
  category      QuestionCategory
  questionText  String
  context       String?  // which resume bullet / JD requirement triggered this
  orderIndex    Int
  answer        InterviewAnswer?
}

model InterviewAnswer {
  id            String   @id @default(cuid())
  questionId    String   @unique
  question      InterviewQuestion @relation(fields: [questionId], references: [id])
  userAnswer    String
  relevanceScore Float?
  specificityScore Float?
  structureScore  Float?
  aiRewrite     String?  // suggested better answer
  aiTip         String?  // one improvement tip
  createdAt     DateTime @default(now())
}

enum InterviewSessionStatus {
  IN_PROGRESS
  COMPLETED
}

enum QuestionCategory {
  BEHAVIORAL
  TECHNICAL
  EXPERIENCE_DEEP_DIVE
  COMPANY_CONTEXT
  GAP_QUESTION
}
```

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/applications/:id/interview` | Create session (generates 5-7 questions from JD + resume) |
| `GET` | `/api/applications/:id/interview` | Get active session with questions |
| `POST` | `/api/interview-sessions/:id/answer` | Submit answer, get AI feedback |
| `POST` | `/api/interview-sessions/:id/regenerate` | Regenerate remaining questions |
| `GET` | `/api/interview-sessions/:id/summary` | Session summary with scores |

### AI Architecture

```
Input:
  - JD (title, description, skills, requirements)
  - Tailored Resume JSON (ResumeVersion)
  - Master Resume JSON (full experience)
  - SeekerProfile (skills, years experience)

Prompt strategy:
  1. Question generation: system prompt with categories + output schema
  2. Answer evaluation: system prompt with scoring rubric + output schema
  
Model: lite model for question gen, primary model for answer feedback
Quota: interview sessions count against generation quota (or separate quota)
```

### UI Components

- **InterviewPreviewCard** — Card on application page: "Prepare for Interview" with play icon
- **InterviewSessionClient** — Full-page interview UI: question display, text input, feedback panel
- **QuestionCard** — Category badge, question text, context hint
- **AnswerFeedback** — Three score gauges + AI rewrite + tip
- **SessionSummary** — Overall score, radar chart (relevance/specificity/structure), question history

### Edge Cases

- User has no MasterResume: generate questions from JD only, no experience-specific questions
- User skips a question: mark as skipped, don't count toward overall score
- Session interrupted: auto-resume at `currentIndex`
- Free plan: limit to 2 sessions/month
- Paid plans: unlimited sessions or higher quota

---

## Implementation Priority (Easiest → Hardest)

| Order | Feature | Days | Reason |
|-------|---------|------|--------|
| **1** | LinkedIn Profile Optimizer | 1-2 | Single AI call, no new DB models needed (JSON on SeekerProfile), one route, copy-to-clipboard only. Quickest win. |
| **2** | Smart Job Feed + Alerts | 2-3 | 2 new tables, CRUD routes, cron job, email templates. More infra but zero AI complexity. |
| **3** | ATS Resume Quality Score | 4-5 | 2 new tables, 5 routes, two-pass analysis (structural + AI), issue detection, "apply fix" flow, score gauge UI. |
| **4** | AI Mock Interview | 5-7 | 3 new tables, 5 routes, question gen + per-answer AI feedback, session management, full-page UI with scoring. Most complex. |

Build order rationale: each feature's output feeds the next. LinkedIn optimization proves the "one-click AI + copy" UX pattern. Alerts build the notification infra you'll want for interview reminders later. Score improves the core tailoring UX — the foundation interview prep sits on.

## Cross-Feature Considerations

- **Quota model**: Interview sessions and LinkedIn optimization may need separate quota pools or be bundled into plan tiers
- **AI cost**: Interview feedback (per answer) is the most expensive — lite model for question gen, primary model for scoring
- **Email**: Job alerts add email volume — ensure Resend limits accommodate new templates
- **UI consistency**: All new features should use existing shadcn/ui components, TanStack Query, React Hook Form patterns
- **Mobile**: All features should be responsive — interview and scoring UI especially need mobile consideration

---

## Appendix: Competitor Feature Map

| Feature | Simplify | Jobscan | Rezi | Careerflow | Hiretivo (now) | Hiretivo (planned) |
|---------|----------|---------|------|------------|----------------|---------------------|
| AI Resume Tailoring | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ATS Job Feed | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Smart Job Alerts | ✅ | ❌ | ❌ | ❌ | ❌ | 🔜 |
| Application Tracker | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Browser Auto-fill | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ (by design) |
| AI Mock Interviews | ✅ | ❌ | ✅ | ✅ | ❌ | 🔜 |
| ATS Resume Score | ✅ | ✅ | ✅ | ✅ | Partial | 🔜 |
| LinkedIn Optimizer | ❌ | ✅ | ❌ | ✅ | ❌ | 🔜 |
| Cover Letter Gen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multiple Templates | ✅ | ✅ | 18+ | ✅ | 1 | 🔜 (parked) |
| Networking/Hiring Manager | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
