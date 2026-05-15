# Hiretivo — Pivot Plan v2.0
> From: Generic skills-based job board
> To: Verified Indian engineer talent marketplace for US/EU startups

---

## 1. THE PIVOT IN ONE PARAGRAPH

Hiretivo pivots from a generic remote job board (competing with LinkedIn, Instahyre, Cutshort) to a **curated talent marketplace** where Indian engineers get verified with a blue-tick badge, build a public score profile, and get discovered by US/EU startups. Recruiters pay a subscription to browse the verified talent pool and unlock engineer profiles (per-engineer quota). Engineers are free forever. The moat is curation quality — every engineer is manually reviewed (AI-assisted in Phase 4) before going live. Salary transparency is mandatory on both sides in USD. Only verified engineers can apply to jobs. No resume spam. No cold applications.

> **Note: Zero active users = clean slate. No backward compatibility needed. PRO/ENTERPRISE plan tiers removed entirely. Fresh schema.**

---

## 2. POSITIONING

| | Before | After |
|---|---|---|
| What | Job board | Talent marketplace |
| Who | India-domestic | Indian engineers → US/EU startups |
| Hero | Job listings | Engineer profiles |
| Moat | Match score algorithm | Verification trust + employer feedback data |
| Recruiter action | Post job, wait | Browse verified pool OR post job |
| Engineer action | Apply to jobs | Get verified, get discovered |
| Contact | N/A | Direct PII shown after unlock (email, GitHub, LinkedIn) |
| Pricing | Subscription | Tiered subscription (Free/Starter/Growth/Scale) |

**Elevator pitch — Recruiter:**
> "Hire verified Indian engineers in 7 days. See their GitHub scores before any call. Half the cost of US hires."

**Elevator pitch — Engineer:**
> "Get a Hiretivo Verified ✓ badge. Get seen by US/EU startups. Get paid in USD. Free forever."

---

## 3. ALL LOCKED DECISIONS

| Decision | Choice | Reason |
|---|---|---|
| Active users | Zero | Clean slate — no migration needed |
| Plan tiers | FREE / STARTER / GROWTH / SCALE | PRO/ENTERPRISE fully removed |
| Onboarding | Two-phase (basic + verification separate) | Lower rebuild cost, faster ship |
| Video intro | Loom/any public URL — no upload | Build cost: 1hr vs 3–5 days |
| Contact after unlock | Direct PII exposed (email, GitHub, LinkedIn) | Trust paid recruiters, no messaging system needed |
| Who can apply | VERIFIED engineers only | Unverified = "Get Verified" CTA |
| Verified + apply | Bypass resume requirement | Profile IS the credential |
| Unlock model | Per-engineer unlock with monthly quota | Starter 10 / Growth 30 / Scale unlimited |
| Apply = free unlock | Engineer applied = recruiter sees free (no quota) | Engineer opted in |
| Pool browse = quota | Talent pool cold unlock costs 1 credit | Recruiter initiated cold outreach |
| Unlock permanence | Once unlocked = no future quota charge; access blocked only if hiddenUntil active or engineer's domain blocked | Privacy overrides unlock; billing does not |
| Quota reset | Tied to `Subscription.currentPeriodStart` | Aligns with billing period |
| Interview from pool | Auto-create Application (source=RECRUITER_INITIATED) | Reuses existing Interview model |
| Apply wording | Keep "Apply" — not "Express Interest" | Single unified concept |
| Messaging | Skip v1 — direct email + Interview model | Saves 3–4 weeks build |
| Match score | Hiretivo Score (always) + Job Match Score (if open jobs) | Contextual signal |
| Phone OTP | Skip v1 — email + GitHub + admin review enough | Defer if fraud emerges |
| Rejection flow | Structured checkboxes + custom note + reapply days | Actionable, not vague |
| Rejection communication | Email + dashboard status card with reasons + CTA | Both channels |
| Approval communication | Email + dashboard badge + profile URL | Both channels |
| Verified badge | Blue ✓ tick on all engineer mentions | Like Twitter verified |
| Admin notification | Email to admin on new submission | Admin always aware |
| Email gate | Verified email required before verification submission | Trust signal |
| GitHub API | Server GitHub PAT (`GITHUB_PAT` env var) or GitHub App token — 5000 req/hr; add retry/backoff on 403/429 | Unauthenticated = 60/hr — breaks at scale |
| BlockedRecruiter | By recruiter email domain | Simple, reliable |
| Phase 4 AI | Pre-fills rejection checkboxes + draft email | Admin 45sec per review |
| seeker-digest cron | Replace with job-match-notification in Phase 3 | No duplicate digest |
| Homepage | Rebuild in Phase 2 (talent pool launch) | New value prop needs new page |
| Nav | Update in Phase 2 | Job board nav → talent marketplace nav |
| Locked card name display | First name + last initial (e.g. "Priya S.") | Full blur looks fake; ungoogleable but feels real — LinkedIn model |
| Locked card hidden fields | Full last name, email, GitHub URL, LinkedIn URL | Last name is the unlock incentive; GitHub username = searchable |
| Profile slug | Engineer picks username in Phase B Step 4 | Chosen URL = more likely to share on resume — GitHub model |
| Slug format | Alphanumeric + hyphens, 3–30 chars, lowercase | Clean, URL-safe, pre-filled with firstnamelastname suggestion |
| Slug reservation | Reserved on verification submit, live only on VERIFIED | Rejected engineers keep their slug reserved for resubmission |
| AI scan trigger | On admin opening review page — NOT on submit | Skips cost on obvious rejects; no background job infra needed |
| AI scan skip condition | GitHub URL 404 or private repo → skip scan, instant reject reason | No wasted API call when GitHub unreachable |
| AI model | Claude Haiku via OpenRouter | 20× cheaper than Sonnet; sufficient for repo analysis |
| Hiretivo Score Phase 1 | Admin enters single score (0–100) = hiretivoScore directly | 4-component formula activates Phase 4 only |
| Score after feedback | Recalc using VerificationReview.scoreGiven (latest approved): scoreGiven×0.85 + (avgRating/5×100)×0.15 | Must use scoreGiven not current hiretivoScore — prevents drift on repeated recalc |
| Profile completeness | Computed server-side: bio≥100w=30, 3 projects=30, experience=25, video=15 | Derived on read, not stored; no AI needed |
| IN_REVIEW trigger | Auto-set when admin opens /admin/verification/[id] | No manual step; concurrent = banner warning, no hard lock |
| Admin queue order | FIFO (oldest submit first) — respects 48hr SLA | Fair queue; IN_REVIEW items show grey badge |
| Feedback token | Signed JWT + FeedbackRequest DB record (tokenHash, expiry, usedAt) | JWT for tamper-proof; DB record enforces one-time use |
| hiddenUntil precedence | hiddenUntil always overrides unlock — profile detail API returns 404 even for unlocked recruiters | Privacy > monetization |
| Blocked recruiter after unlock | Keep EngineerUnlock record (audit/no-refund), block future profile detail API for that domain | Trust: engineer disappears from domain; audit trail preserved |
| Quota unlock atomicity | Unlock creation + quota count in single DB transaction; idempotent on existing unlock; double-click safe | Prevents double-deduct race condition |
| Seats v1 | Removed from v1 — single login per subscription | No org/team schema; deferred to Phase 3 |
| profilePublic opt-in | Engineer explicitly consents after VERIFIED email — not auto-set | Salary + full name public requires consent |
| Talent pool vs public profile gates | VERIFIED = can apply. profilePublic=true = talent pool + /e/[slug]. hiddenUntil = removes from both, NOT active applications | Two separate concerns — apply gate ≠ discovery gate |
| hiddenUntil scope | Hides from talent pool + public profile only. Active applications, interviews, unlock records unaffected | Engineer hiding ≠ cancelling active workflows |
| Block after application | Block preserves active application + interview. No new unlocks. Engineer disappears from domain's pool searches | Application = consented workflow; blocking = future discovery only |
| Private GitHub handling | All repos private → flag "No public repos" for admin manual review, NOT auto-reject. Admin can request public sample | Many senior engineers have private work repos |
| GitHub ownership | MVP: admin visual review catches obvious fakes. Phase 4: GitHub OAuth or verification gist | OAuth adds 1 day build; admin review sufficient for Phase 1 volume |
| Engineer unlock notification | Engineer gets email when unlocked: "Acme Inc viewed your profile" | Trust signal + awareness; visible in dashboard settings |
| Work email for paid plans | Verified work email required at billing checkout; generic domains (gmail/outlook/yahoo/hotmail) rejected | Prevents trivial domain bypass for BlockedRecruiter |
| BlockedRecruiter domain normalization | Strip subdomains (us.acme.com → acme.com); reject block attempts on generic domains | Simple, reliable; prevents both subdomain and generic bypass |
| Feedback eligibility | FeedbackRequest generated only when: Application.status=HIRED + 90 days elapsed + by job-owning recruiter. feedbackRequestId on EmployerFeedback | One request per application; prevents spurious feedback |
| Quota source filter | Count quota: source='talent_pool' unlocks within billing period ONLY. source='application_auto' never counts | Auto-unlocks = engineer opted in; charging recruiter would be double-penalty |
| IN_REVIEW stale timeout | If IN_REVIEW for >2 hours with no admin action → auto-revert to PENDING. Checked on queue load + cron every 30 min | Prevents stuck queue items when admin leaves mid-review |
| Consent copy | Public profile consent modal must explicitly state: "Your full name, Hiretivo Score, salary range, bio, and projects become visible to anyone on the internet" | Engineer must know salary + score go public |
| External URL safety | Project/video URLs: validate https scheme only; render with rel="noopener noreferrer nofollow"; never fetch server-side | Prevents open redirect, SSRF, malicious link injection |
| Job posting quota enforcement | At publish time: check active job count. Free=0 (hard block). Starter=2 (block at 3rd). Downgrade: excess jobs auto-drafted, not deleted | Active = status OPEN. Draft jobs don't count |

---

## 4. SCHEMA CHANGES (CLEAN SLATE)

### Updated Enums
```prisma
enum VerificationStatus {
  NOT_SUBMITTED // default — user signed up but never submitted verification
  PENDING       // engineer submitted, awaiting review
  IN_REVIEW     // admin actively reviewing
  VERIFIED      // approved — public profile live, blue tick shown
  REJECTED      // rejected — reapplyAfter date set
}

enum ApplicationSource {
  SEEKER_APPLIED        // engineer applied normally
  RECRUITER_INITIATED   // recruiter invited from talent pool
}

enum ContractType {
  FULL_TIME
  CONTRACT
  PART_TIME
}

// Clean plan tiers — PRO/ENTERPRISE removed entirely
enum PlanTier {
  FREE
  STARTER
  GROWTH
  SCALE
}
```

### Add to `User` Model
```prisma
verificationStatus    VerificationStatus @default(NOT_SUBMITTED)
hiretivoScore         Int?              // 0-100 intrinsic quality score
scoreUpdatedAt        DateTime?
timezoneOverlapHours  Int?             // hours can overlap with US/EU — kept here for fast talent pool queries
availableFrom         DateTime?
reapplyAfter          DateTime?        // set on REJECTED — gate for resubmission
// salary + video canonical source = SeekerProfile (salaryMinUsd, salaryMaxUsd, videoIntroUrl)
profileSlug           String? @unique  // hiretivo.com/e/[slug] — generated on VERIFIED
hiddenUntil           DateTime?        // engineer hides profile temporarily
```

### Add to `SeekerProfile` Model
```prisma
githubUsername          String?
githubScore             Int?            // 0-100 from AI analysis
githubAnalysis          Json?           // raw AI analysis result
githubScannedAt         DateTime?
verificationNotes       String?         @db.Text  // stored as JSON: {reasons[], customNote}
verificationReviewedAt  DateTime?
verificationReviewedBy  String?         // admin userId
videoIntroUrl           String?         // Loom URL
topProjects             Json?           // [{name, description, url}] max 3
salaryMinUsd            Int?
salaryMaxUsd            Int?
profilePublic           Boolean @default(false)   // true only after VERIFIED + explicit engineer consent
profilePublicConsentAt  DateTime?                 // timestamp of engineer opt-in to public profile
```

### Add to `Job` Model
```prisma
salaryMinUsd          Int?             // USD mandatory on new posts
salaryMaxUsd          Int?             // USD mandatory
timezoneOverlapHours  Int?             // minimum overlap hours required
contractType          ContractType?
isRemoteOnly          Boolean @default(true)
```

### Add to `Application` Model
```prisma
source  ApplicationSource @default(SEEKER_APPLIED)
```

### New Models
```prisma
model VerificationReview {
  id           String             @id @default(cuid())
  userId       String
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewedBy   String?            // admin userId
  status       VerificationStatus
  scoreGiven   Int?               // becomes User.hiretivoScore on VERIFIED
  notes        Json?              // { reasons: string[], customNote: string, reapplyDays: number }
  aiSummary    Json?              // Phase 4 audit record: { model, promptVersion, inputSnapshot, output, confidence, overrideReason? }
  // model: "claude-haiku-3", promptVersion: "1.0.0", confidence: 0–1
  // inputSnapshot: { repos, languages, lastCommit, starCount }
  // output: { recommendation, reasons[], score }
  // overrideReason: set if admin overrides AI recommendation (EU AI Act audit trail)
  createdAt    DateTime           @default(now())

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model EngineerUnlock {
  id           String   @id @default(cuid())
  recruiterId  String
  engineerId   String
  source       String   // "talent_pool" | "application_auto"
  recruiter    User     @relation("RecruiterUnlocks", fields: [recruiterId], references: [id], onDelete: Cascade)
  engineer     User     @relation("EngineerUnlocks", fields: [engineerId], references: [id], onDelete: Cascade)
  unlockedAt   DateTime @default(now())

  @@unique([recruiterId, engineerId])
  @@index([recruiterId])
  @@index([recruiterId, unlockedAt])  // quota counting per billing period
}

model EmployerFeedback {
  id                String          @id @default(cuid())
  engineerId        String
  recruiterId       String
  jobId             String?
  feedbackRequestId String          @unique  // FK to FeedbackRequest — one feedback per request
  rating            Int             // 1–5
  comment           String?         @db.Text
  engineer          User            @relation("FeedbackReceived", fields: [engineerId], references: [id], onDelete: Cascade)
  recruiter         User            @relation("FeedbackGiven", fields: [recruiterId], references: [id], onDelete: Cascade)
  createdAt         DateTime        @default(now())

  @@index([engineerId])
}

model SavedEngineer {
  id           String   @id @default(cuid())
  recruiterId  String
  engineerId   String
  recruiter    User     @relation("SavedByRecruiter", fields: [recruiterId], references: [id], onDelete: Cascade)
  engineer     User     @relation("SavedEngineer", fields: [engineerId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@unique([recruiterId, engineerId])
  @@index([recruiterId])
}

model BlockedRecruiter {
  id              String   @id @default(cuid())
  engineerId      String
  recruiterDomain String   // recruiter's email domain e.g. "currentemployer.com"
  engineer        User     @relation(fields: [engineerId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())

  @@unique([engineerId, recruiterDomain])
  @@index([engineerId])
}

model FeedbackRequest {
  id          String    @id @default(cuid())
  tokenHash   String    @unique  // SHA-256 of JWT — lookup key
  engineerId  String
  recruiterId String
  jobId       String?
  expiresAt   DateTime             // now() + 90 days
  usedAt      DateTime?            // null = unused; set on submit
  engineer    User      @relation("FeedbackRequests", fields: [engineerId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())

  @@index([engineerId])
  @@index([tokenHash])
}
```

### Models Removed (Clean Slate)
- `BoostedJob` — boost feature gone
- `DismissedJob` — not needed
- `SavedJob` — replaced by `SavedEngineer`

---

## 5. MONETIZATION MODEL

### Recruiter Pricing Tiers

| Plan | Price/mo | Unlocks/mo | Active Jobs | Priority Match |
|---|---|---|---|---|
| **Free** | $0 | 0 (browse blurred) | 0 | No |
| **Starter** | $199 | 10 | 2 | No |
| **Growth** | $399 | 30 | Unlimited | Yes |
| **Scale** | $799 | Unlimited | Unlimited | Yes + Support |

> Seats removed from v1 — single login per subscription. Team seat UI deferred to Phase 3.

Annual: 2 months free (~17% off). Dodo Payments handles lifecycle.

### Unlock Rules
```
1. Engineer applies to recruiter's job
   → Recruiter sees full PII free (no unlock charge — engineer opted in)
   → Auto-creates EngineerUnlock(source="application_auto")

2. Recruiter browses talent pool, unlocks cold
   → Costs 1 unlock from monthly quota
   → Creates EngineerUnlock(source="talent_pool")

3. Recruiter schedules interview from talent pool
   → Auto-creates EngineerUnlock(source="talent_pool") if not exists
   → Auto-creates Application(source=RECRUITER_INITIATED)

4. Once unlocked = always accessible
   → Even after subscription cancel or downgrade
   → Quota reset = Subscription.currentPeriodStart → currentPeriodEnd

5. hiddenUntil overrides unlock — always
   → Engineer sets hiddenUntil → profile detail API returns 404 for ALL recruiters
   → Even previously unlocked recruiters cannot access during hidden period
   → Unlock record preserved (no refund impact)

6. Blocked domain overrides unlock for future requests
   → EngineerUnlock record kept (audit trail, no refund)
   → Profile detail API checks BlockedRecruiter before returning PII
   → Blocked recruiter gets 403 on profile detail route

7. Unlock is atomic
   → EngineerUnlock creation + quota decrement in single DB transaction
   → Idempotent: existing unlock = return cached record, no quota deduct
   → Double-click protection: unique constraint on [recruiterId, engineerId]

8. Quota counting — source filter
   → Count only source='talent_pool' within billing period:
      SELECT COUNT(*) FROM EngineerUnlock
      WHERE recruiterId = ? AND source = 'talent_pool'
      AND unlockedAt >= currentPeriodStart
   → source='application_auto' NEVER counts toward quota

9. Engineer unlock notification
   → On every EngineerUnlock creation: email to engineer
      "Acme Inc viewed your profile"
   → Visible in engineer dashboard → Settings → "Who viewed me"
   → source='application_auto': "Acme Inc viewed your application profile"

10. Job posting quota enforcement
    → At publish time (status: DRAFT → OPEN):
       count = SELECT COUNT(*) FROM Job WHERE recruiterId=? AND status='OPEN'
       Free: count >= 0 → hard block "Upgrade to post jobs"
       Starter: count >= 2 → block "Upgrade to post more jobs"
       Growth/Scale: unlimited
    → On plan downgrade: excess OPEN jobs auto-set to DRAFT (not deleted)
       Engineer receives: "This job was paused due to a plan change"
```

### Engineer Pricing
- **Always free.** No exceptions.

---

## 6. VERIFICATION SYSTEM (DETAILED)

### Engineer Verification Flow

```
Phase A — Basic Onboarding (existing, adapted):
Step 1: Situation
Step 2: Role + Skills
Step 3: Resume (optional — not required for verified)
Step 4: USD salary target + timezone overlap hours + availability
  → Lands on dashboard with "Unverified" badge
  → CTA: "Submit for Verification →"

Phase B — Verification Application (new, separate flow):
Step 1: GitHub URL
  → Validate: must be github.com domain (client + server)
  → Submit → spinner: "Scanning your GitHub... (~15 sec)"
  → Profile public + repos found: proceed to Step 2
  → Profile public + all repos private:
       Show: "Your GitHub has no public repos. Add at least one public
              sample project before submitting, or provide an alternative
              link (open source contribution, public gist, etc.)"
       Engineer can: add public repo then retry, OR proceed with a note
       NOT auto-rejected — admin reviews manually with "no public repos" flag
  → Profile not found / URL invalid: "GitHub profile not found — check URL"
       Cannot proceed until fixed
  → Timeout (30s): "Couldn't scan — proceed manually" → still continues
       Admin sees "GitHub scan failed" flag in review queue
Step 2: Legal full name + bio + top 3 projects (name, description, URL)
Step 3: Video intro URL (Loom or any public video — optional)
Step 4: Pick profile username + Review + Submit
  → Username input: hiretivo.com/e/[___________]
  → Pre-filled: firstnamelastname (lowercased, hyphens for spaces)
  → Real-time uniqueness check: debounced 300ms → GET /api/engineer/check-slug
  → Shows ✓ Available or ✗ Taken inline
  → Reserved words blocked (client + server): admin, api, pricing, jobs, engineers,
    recruiter, seeker, login, signup, dashboard, health, feedback, e, app, www,
    support, help, about, blog, terms, privacy, careers, hire, hiretivo
  → On submit:
     - profileSlug reserved (unique constraint)
     - verificationStatus = PENDING
     - Admin gets email notification
     - Engineer sees: "Under review — we'll email you within 48 hours"

Slug abuse rules:
  - REJECTED forever (3+ rejections, all reapplyAfter expired + no resubmit in 1yr):
    slug released after 365 days of inactivity
  - Account deletion: slug released immediately
  - Impersonation/trademark (e.g. "googleengineer"):
    admin can manually clear slug via admin panel
```

### Apply Gate
```
VERIFIED engineer:
  → Can apply to jobs ✅
  → Resume requirement bypassed (profile IS the credential)
  → Profile visible in talent pool

UNVERIFIED engineer:
  → Cannot apply to jobs
  → Sees CTA: "Get Verified to Apply →"
  → Can browse jobs, cannot apply
  → NOT shown in talent pool
```

### Reapply Gate
```ts
// In POST /api/engineer/verification:
import { isAfter } from 'date-fns'

if (user.reapplyAfter && isAfter(user.reapplyAfter, new Date())) {
  return Response.json({
    error: 'Too soon to reapply',
    reapplyAfter: user.reapplyAfter   // shown on dashboard countdown
  }, { status: 429 })
}
```

### Admin Review Flow (Phase 1 — Manual)

```
Engineer submits →
Admin gets email: "New verification submission: Priya Sharma"
  ↓
Admin opens /admin/verification queue
  ↓
Sees profile: GitHub link, skills, projects, video (if added)
  ↓
Reviews GitHub manually (2–3 mins)
  ↓
Decision:

[APPROVE] →
  - Enter score (0–100)
  - Click Send
  → User.verificationStatus = VERIFIED
  → User.hiretivoScore = scoreGiven
  → User.profileSlug = reserved slug (chosen by engineer in Phase B Step 4)
  → SeekerProfile.profilePublic = false (stays false until engineer opts in)
  → Approval email sent with [Make Profile Public →] CTA
  → Engineer clicks CTA → profilePublic = true, profilePublicConsentAt = now()

[REJECT] →
  - Multi-select rejection reasons (checkboxes)
  - Optional custom note
  - Select reapply window: 30 / 60 / 90 days
  - Click Send
  → User.verificationStatus = REJECTED
  → User.reapplyAfter = addDays(now(), reapplyDays)
  → VerificationReview.notes = { reasons, customNote, reapplyDays }
  → Rejection email sent
```

### Admin Review Flow (Phase 4 — AI-Assisted)

```
Engineer submits → status = PENDING → appears in admin queue
  ↓
Admin opens /admin/verification/[id]:
  → status auto-set to IN_REVIEW
  → AI scan triggers NOW (on open, not on submit — saves cost)
  → If GitHub URL 404 or private: skip scan → show "GitHub inaccessible" reason pre-filled
  → Spinner: "Analysing GitHub with AI... (~15 sec)"
  ↓
Scan complete (Claude Haiku via OpenRouter, ~$0.02):
┌──────────────────────────────────────────────┐
│ Priya Sharma — AI Analysis Complete          │
│ AI Recommendation: REJECT (78% confidence)  │
│                                              │
│ Pre-filled reasons (admin can uncheck):      │
│ ☑ All repos are forks/tutorials (detected)  │
│ ☑ Last commit: 8 months ago                │
│ ☐ No real-world project                    │
│                                              │
│ Score suggestion: 42/100                    │
│ Admin override score: [42]  ← editable      │
│ AI Draft Email: [preview →]                  │
│ Admin note (optional): [___________]         │
│                                              │
│ [Edit & Send Rejection]  [Override: Approve] │
└──────────────────────────────────────────────┘

Scan failed / AI error:
  → Show manual review form (no pre-fill)
  → Banner: "AI scan failed — review manually"

Concurrent admin (two open same review):
  → Banner: "Another admin has this open — proceed anyway?"
  → No hard lock (MVP has 1–2 admins)

Admin time: ~45 seconds vs 3 minutes manual
```

### Predefined Rejection Reasons

```ts
// src/constants/verification-reasons.ts
export const REJECTION_REASONS = [
  // GitHub Quality
  { key: 'no_public_repos',       label: 'No public repositories found' },
  { key: 'forks_only',            label: 'All repos are forks or tutorial clones' },
  { key: 'inactive_github',       label: 'No commits in last 6 months (inactive)' },
  { key: 'no_production_code',    label: 'Projects don\'t show production-level code' },
  { key: 'skills_mismatch',       label: 'Skills claimed don\'t match GitHub repos' },

  // Profile Completeness
  { key: 'bio_missing',           label: 'Bio missing or too short (<100 words)' },
  { key: 'no_work_experience',    label: 'Work experience not added' },
  { key: 'no_projects',           label: 'Top projects not described' },

  // Project Quality
  { key: 'no_real_project',       label: 'No real-world/production project (only practice)' },
  { key: 'vague_descriptions',    label: 'Project descriptions too vague' },
  { key: 'broken_links',          label: 'Project links broken or missing' },

  // Identity / Trust
  { key: 'name_mismatch',         label: 'Name on profile doesn\'t match GitHub name' },
  { key: 'incomplete_profile',    label: 'Profile feels incomplete — needs more detail' },

  // Experience Level
  { key: 'too_junior',            label: 'Less than 2 years experience — reapply when more senior' },
] as const
```

### Approval Email Content
```
Subject: ✓ You're Hiretivo Verified — One step to go live

Hi [Name],

You're verified. You have the Hiretivo Verified ✓ badge.

ONE STEP LEFT:
Your profile is private until you choose to go public.

[Make My Profile Public →]   ← sets profilePublic=true, profilePublicConsentAt=now()

ONCE PUBLIC, YOUR PROFILE WILL BE:
✓ Visible to US/EU startup recruiters
✓ Eligible for job match notifications
✓ Shareable: hiretivo.com/e/[slug]

MAKE IT STRONGER FIRST:
→ Add all 3 top projects with descriptions
→ Add a Loom video intro (huge recruiter signal)
→ Update target salary if changed
→ Add more work experience

[Preview My Profile →]
```

### Rejection Email Content
```
Subject: Your Hiretivo Verification — Action Required

Hi [Name],

We reviewed your profile. Here's what needs improvement:

WHAT TO FIX:
✗ [reason 1 label]
  → [specific fix instruction]
✗ [reason 2 label]
  → [specific fix instruction]

[ADMIN NOTE if provided]:
"[customNote]"

YOU CAN REAPPLY AFTER: [reapplyAfter formatted date]

[Update Profile →]   [Set a Reminder →]
```

### Engineer Dashboard Status Cards

**PENDING:**
```
Under review — we'll email you within 48 hours
Submitted: [date]
```

**IN_REVIEW:**
```
Admin is reviewing your profile now
```

**VERIFIED:**
```
✓ Hiretivo Verified
Score: 84/100
Profile visible to recruiters
[View my public profile →]
```

**REJECTED:**
```
Verification Unsuccessful

What to fix:
• [reason 1]
• [reason 2]
[Admin note if exists]

Can reapply: [date]           (if future)
  "Available in 43 days"      (countdown)

[Update Profile →]  [Resubmit →]  (enabled after reapplyAfter)
```

### Verified Badge
Blue ✓ badge (bg-brand-primary) shown:
- Engineer card in talent pool (next to blurred/revealed name)
- Unlocked profile detail view
- Public profile page `hiretivo.com/e/[slug]`
- Engineer's own dashboard header

---

## 7. MATCH SCORE SYSTEM

### Two Scores

**Hiretivo Score (intrinsic — per engineer, always shown):**

Phase 1 (manual — no AI):
```
Admin enters single score (0–100) → stored as hiretivoScore directly
After employer feedback: hiretivoScore = (VerificationReview.scoreGiven × 0.85) + (avgRating/5 × 100 × 0.15)
// scoreGiven = latest approved VerificationReview — prevents drift on repeated recalc
```

Phase 4 (AI-assisted — full formula):
```
= GitHub analysis score (40%)      — Claude Haiku scan result
+ Verification admin score (25%)   — admin's judgment (overrideable)
+ Profile completeness (20%)       — computed server-side, not stored:
    bio ≥ 100 words    = 30 pts
    3 top projects     = 30 pts
    work experience    = 25 pts
    video intro URL    = 15 pts
    ──────────────────────────
    total / 100 × 20   = completeness component
+ Past employer ratings (15%)      — avg(all feedback ratings) / 5 × 100 × 0.15
```
Range: 0–100. Shown on all cards (blurred and unlocked).

**Job Match Score (contextual — per engineer × job):**
```
= skillsOverlap (50%)              — existing computeMatchScore logic
+ salaryAlignment (20%)            — any USD range overlap = 1.0, no overlap = 0
+ experienceMatch (15%)            — years mapped: 0-2=junior, 3-5=mid, 6+=senior
+ timezoneOverlap (10%)            — engineer hours >= job required = 1.0, else 0.5
+ availabilityFit (5%)             — immediate=1.0, ≤30d=0.8, ≤60d=0.6, >60d=0.3

Null handling:
- salaryMinUsd null on job → skip salary weight, renormalize others to 100%
- timezoneOverlapHours null on engineer → skip timezone weight, renormalize
```

### Talent Pool Display Logic
```
Recruiter has open jobs:
  → Show Hiretivo Score: 84/100
  → Show Best Match: "Senior React Dev — 87%"

Recruiter has NO open jobs:
  → Show Hiretivo Score: 84/100
  → Show CTA: "Post a job to see match scores"

Default sort options:
  1. Best match for your jobs (default when jobs exist)
  2. Highest Hiretivo Score
  3. Most recent joiners
  4. Lowest salary minimum
  5. Best timezone overlap
```

---

## 8. CORE FLOWS

### Engineer Flow (Full)
```
Signup (free) →
Phase A Onboarding (situation, role, skills, USD salary, timezone, availability) →
Dashboard — "Unverified" state →
  [Cannot apply to jobs yet]
  [CTA: Submit for Verification]
  ↓
Phase B Verification flow:
  GitHub URL → projects + bio → optional video URL → submit
  ↓
PENDING state (48hr SLA) →
Admin reviews + decides:
  ↓
VERIFIED:
  Blue ✓ badge live
  Profile in talent pool
  Can apply to jobs (resume not required)
  Job match notifications start
  Public URL: hiretivo.com/e/[slug]
  → Approval email + dashboard update

REJECTED:
  Dashboard shows reasons + reapply date
  → Rejection email with reasons + fix guide
  → "Update Profile" CTA
  After reapplyAfter date → [Resubmit] button unlocks
```

### Recruiter Flow (Full)
```
Signup →
Browse talent pool FREE:
  → Visible on locked card: Hiretivo Score, skills, salary range, timezone, availability
  → Name shown as: first name + last initial only (e.g. "Priya S.") — feels real, ungoogleable
  → Hidden until unlock: full last name, email, GitHub URL, LinkedIn URL, resume
  → Can: filter, save engineers (saved visible on return)
  ↓
Wants to unlock engineer:
  → FREE plan: "Upgrade to unlock" modal
  → PAID plan: 1 unlock deducted from quota
  → Full profile revealed: name, email, GitHub, LinkedIn, resume signed URL
  ↓
Two actions after unlock:
  A. Email directly (mail client opens)
  B. Schedule Interview → picks open job → auto-Application created → engineer notified
  ↓
Engineer applies to posted job:
  → Recruiter sees full profile FREE (no unlock charge)
  → Auto-unlock record created (source="application_auto")
  ↓
Move through pipeline: Applied → Reviewing → Interview → Offer → Hired
  ↓
Mark "Hired" →
90 days later → feedback email → rate engineer 1–5 → score updated
```

### Admin Flow (Phase 1 — Manual)
```
Engineer submits verification →
Admin email: "New submission: [Name]" →
Admin opens /admin/verification →
Reviews profile (GitHub, projects, bio, video) manually →
Selects: [Approve with score] or [Reject with reasons + reapply days] →
One click → email auto-sent to engineer
```

### Admin Flow (Phase 4 — AI-Assisted)
```
Engineer submits → appears in queue as PENDING (no scan yet)
  ↓
Admin opens /admin/verification/[id]:
  → status auto-set to IN_REVIEW
  → AI scan triggers ON OPEN (not on submit — cost saving)
  → Spinner: "Analysing GitHub..."
  → Pre-filled form appears with AI recommendation + checkboxes
Admin reviews + confirms or edits →
One click → done
```

---

## 9. WHAT WE KEEP vs MODIFY vs REMOVE

### Keep As-Is ✅
| File/Layer | Reason |
|---|---|
| `src/auth.ts`, `src/auth.config.ts` | Auth.js v5 works |
| `src/middleware.ts` | Route protection (already protects /admin/*) |
| `src/lib/prisma.ts`, `prisma-edge.ts` | DB clients |
| `src/lib/redis.ts`, `src/lib/rate-limit.ts` | Rate limiting — extend for new routes |
| `src/lib/r2.ts` | R2 upload (for resume + avatar) |
| `src/lib/resend.ts` | Email — add new templates |
| `src/lib/utils.ts`, `src/lib/metadata.ts` | Generic |
| `src/providers/`, `src/components/ui/` | Unchanged |
| `src/app/api/auth/*` | All auth routes |
| `src/app/api/upload/avatar`, `upload/resume` | Keep |
| `src/app/api/health/route.ts` | Keep |
| `src/lib/application-pipeline.ts` | Keep, add RECRUITER_INITIATED label |
| `src/lib/onboarding/progress.ts` | Keep (nextProgressStep, mergeOnboardingDraft) |
| `src/components/auth/AuthGuard.tsx` | Onboarding gate unchanged |
| Prisma: `Account`, `Session`, `VerificationToken` | Auth.js — never touch |
| Prisma: `Skill`, `SeekerSkill`, `JobSkill` | Keep, extend taxonomy |
| Prisma: `WorkExperience`, `Education` | Keep on engineer profile |
| Prisma: `Interview` | Keep — extend to work without applicationId gate |
| `src/lib/openrouter.ts` | Keep — used for AI GitHub scan in Phase 4 |

### Modify ⚠️
| File/Layer | What Changes |
|---|---|
| `prisma/schema.prisma` | All schema additions above |
| `src/constants/enums.ts` | Add `VerificationStatus`, `ApplicationSource`, `ContractType` |
| `src/constants/pricing.ts` | Replace with Free/Starter/Growth/Scale |
| `src/constants/billing.ts` | New Dodo product IDs for new tiers |
| `src/lib/dodo.ts` | Update `getDodoProductId` + `DODO_PRODUCT_TO_PLAN` for new tiers |
| `src/lib/billing/plan-access.ts` | Rewrite for new tiers: `canAccessTalentPool`, `getUnlockQuota` |
| `src/lib/match.ts` | Add weighted formula, `computeWeightedJobMatch`, `computeBestJobMatchForEngineer` |
| `src/lib/ai-prompts.ts` | Add `GITHUB_ANALYSIS_PROMPT` (Phase 4) |
| `src/lib/seeker-dashboard.ts` | Add recruiterInvites vs myApplications split |
| `src/lib/validations/onboarding.schema.ts` | Step 4: add USD salary, timezone, availability |
| `src/lib/validations/job.ts` | Mandatory `salaryMinUsd`, `salaryMaxUsd`, `timezoneOverlapHours` |
| `src/app/actions/onboarding/seeker.ts` | saveStep4 — persist new fields |
| `src/store/use-seeker-onboarding-store.ts` | Step 4 type + setters |
| `src/app/api/recruiter/talent/route.ts` | Privacy layer — VERIFIED only, blurred, add Hiretivo Score + match |
| `src/app/api/recruiter/talent/[id]/route.ts` | Access check gate (applied OR unlocked → full PII) |
| `src/app/api/recruiter/interviews/route.ts` | Accept `{engineerId, jobId}` → auto-Application |
| `src/app/api/applications/route.ts` | Gate unverified, bypass resume, auto-unlock |
| `src/app/api/cron/match/route.ts` | Weighted scoring, VERIFIED only, match notification |
| `src/app/api/cron/seeker-digest/route.ts` | Replace with job-match-notification (Phase 3) |
| `src/app/api/billing/checkout/route.ts` | New tier IDs |
| `src/app/api/billing/webhook/route.ts` | New plan mapping |
| `src/modules/recruiter/talent/components/TalentPoolClient.tsx` | Blur/unlock/quota UI |
| `src/app/(public)/pricing/page.tsx` | New tier structure |
| `src/app/page.tsx` + `src/config/home-page.ts` | Full homepage rebuild (Phase 2) |
| `src/constants/nav.ts` | New nav links (Phase 2) |

### Remove ❌
| File/Layer | Reason |
|---|---|
| `src/constants/fake-jobs.ts` | No fake data |
| `src/constants/boost.ts` | Boost gone |
| `src/app/api/billing/boost-checkout/route.ts` | Boost gone |
| `src/app/api/admin/jobs/` | Admin job posting removed |
| `src/app/admin/jobs/` | Admin job UI removed |
| `src/app/companies/[id]/page.tsx` | Company pages not in v1 |
| `src/app/api/admin/companies/suggest/route.ts` | Removed |
| `src/services/early-access.service.ts` | Replaced |
| `src/app/api/early-access/route.ts` | Replaced |
| `Prisma: BoostedJob` | Boost gone |
| `Prisma: DismissedJob` | Not needed |
| `Prisma: SavedJob` | Replaced by SavedEngineer |

---

## 10. NEW PAGES & ROUTES

### New Pages
| Route | Phase | Description |
|---|---|---|
| `/seeker/verification` | 1 | Verification submission flow (Phase B) |
| `/seeker/verification/status` | 1 | Status card — PENDING/IN_REVIEW/VERIFIED/REJECTED |
| `/admin/verification` | 1 | Admin review queue |
| `/admin/verification/[id]` | 1 | Individual review — approve/reject form |
| `/e/[slug]` | 2 | Public engineer profile — badge, score, skills (no PII) |
| `/recruiter/saved` | 2 | Saved engineers list |
| `/engineers` | 2 | Public browse (blurred) |
| `/pricing` | 2 | New tier structure |
| `/` (homepage) | 2 | Full rebuild — talent marketplace |
| `/recruiter/pipeline` | 4 | Kanban pipeline view |
| `/feedback/[token]` | 4 | Public employer feedback form (no login) |

### New API Routes
| Route | Method | Phase | Description |
|---|---|---|---|
| `/api/engineer/verification` | GET/POST | 1 | Get status / submit for verification |
| `/api/engineer/check-slug` | GET | 1 | Real-time slug uniqueness check (debounced) |
| `/api/admin/verification/queue` | GET | 1 | Pending reviews list |
| `/api/admin/verification/[id]/review` | POST | 1 | Approve or reject with structured reasons |
| `/api/recruiter/talent/[id]/unlock` | POST | 2 | Unlock engineer (deduct quota) |
| `/api/recruiter/talent/[id]/save` | POST/DELETE | 2 | Save/unsave engineer |
| `/api/recruiter/talent/[id]/invite` | POST | 3 | Schedule interview from talent pool |
| `/api/feedback/employer` | POST | 4 | Submit employer rating |
| `/api/engineer/github-scan` | POST | 4 | Trigger AI GitHub analysis |

---

## 11. TECH DECISIONS

| Decision | Choice | Reason |
|---|---|---|
| GitHub API | `GITHUB_TOKEN` env var required | Unauthenticated = 60 req/hr; token = 5000/hr |
| AI code analysis | OpenRouter / Claude Haiku | ~$0.02/engineer, existing setup |
| Video intro | Any public URL (Loom recommended) | No upload infrastructure needed |
| Payments | Dodo (existing) | Already integrated |
| Feedback token | Signed JWT with `FEEDBACK_SECRET` | No DB entry needed, tamper-proof |
| BlockedRecruiter | By email domain (`email.split('@')[1]`) | Simple, always available |
| Quota reset | `Subscription.currentPeriodStart` | Aligns with Dodo billing period |
| Branch | `feature/pivot-v2` from `staging` | Keep current job board as fallback |
| USD enforcement | Zod schema mandatory | No ambiguity for global recruiters |
| Rate limits | Required on ALL new routes | CLAUDE.md mandatory rule |

---

## 12. WHAT MAKES US DIFFERENT (THE 3 PILLARS)

### Pillar 1 — Verified Before You See Them
Every engineer admin-reviewed before recruiter ever sees them. Recruiter skips screening entirely. Score visible before unlock creates trust without burning credits.
> "Talk to 3. Hire 1."

### Pillar 2 — Salary Transparency Both Ways
Engineer shows USD target. Job mandates USD range. Mismatch = filtered before any conversation. Both sides see the numbers upfront.
> "No surprises. No wasted calls."

### Pillar 3 — India-First Identity
First platform giving Indian engineers a globally trusted credential. Hiretivo ✓ badge becomes a signal US/EU startups learn to trust via employer feedback data over time.
> "Your skills, globally visible. Finally."

---

## 13. KILL SIGNALS

| Signal | Threshold | Action |
|---|---|---|
| Cold email response from US startups | < 3% after 50 emails | Reassess positioning |
| Engineers completing verification | < 30% of signups | Onboarding too hard |
| First paying recruiter | Not by month 2 | Re-examine paywall |
| Recruiter churn month 1 | > 60% | Value prop not landing |

---

## 14. DEFERRED (NOT IN THIS BUILD)

- In-platform messaging / chat
- Phone OTP verification
- Email relay / masked addresses
- Promo / discount codes
- Refund automation (manual via Dodo portal)
- Auto-approve verification (AI score > 85) — Phase 4b
- Team seat management UI
- Engineer score decay (6-month refresh prompt)
- Multiple primary roles per engineer
- OG tags on public engineer profile
- Side-by-side engineer comparison (recruiter)

### Privacy / Legal — Minimal Phase 2 (NOT fully deferred)
Exposing PII + AI scores + public profiles triggers GDPR (EU) and India DPDP obligations.
Minimum required before Phase 2 launch:

| Requirement | Implementation | Phase |
|---|---|---|
| Right to erasure | "Request account deletion" button → email to admin → manual within 30 days | 2 |
| Data export | "Download my data" → JSON of profile, scores, applications, unlock log | 2 |
| Consent record | `profilePublicConsentAt` already in schema — sufficient for public profile consent | 1 ✅ |
| AI decision notice | Show "Your profile was evaluated using AI assistance" in verification status card | 1 |

Full automation (GDPR export API, instant deletion cascade) deferred to Phase 4.

### Admin Deletion Runbook (Manual — Phase 2)
When engineer submits "Request account deletion":
```
1. Admin receives email: "Deletion request: priya@gmail.com"
2. Verify identity: confirm email matches User record
3. Check active applications:
   → Notify affected recruiters: "This candidate has withdrawn"
   → Set Application.status = WITHDRAWN for all open applications
4. Remove public presence:
   → SeekerProfile.profilePublic = false (immediate)
   → User.hiddenUntil = far future (immediate — removes from pool)
5. Delete data (Prisma cascade handles relations):
   → db.user.delete({ where: { email } })
   → Cascade deletes: SeekerProfile, WorkExperience, Education,
     SeekerSkill, Application, VerificationReview, SavedEngineer,
     BlockedRecruiter, EngineerUnlock (engineer side)
6. Delete files from R2:
   → Avatar: r2.delete(`avatars/${userId}`)
   → Resume: r2.delete(`resumes/${userId}`)
7. Confirm to user via email: "Your account has been deleted"
8. Retain minimal audit log (not in DB):
   → Log: { email (hashed), deletedAt, requestedBy: 'user' }
   → Keep for 90 days in admin log file (legal obligation)
9. Complete within 30 days of request (GDPR/DPDP requirement)
```
Note: EngineerUnlock records on the RECRUITER side are kept (recruiter paid for access — refund not automatic).

---

## 15. UI EDGE CASES & STATE HANDLING BY PHASE

### Phase 1 — Verification System

#### Phase B Step 1: GitHub Scan States
```
User enters GitHub URL → clicks Next:
  INVALID URL:      Zod client-side: "Must be a valid github.com URL" (instant)
  SCANNING:         Spinner + "Scanning your GitHub... (~15 sec)"
                    Disable Next button during scan
  SUCCESS (public repos found):
                    Proceed to Step 2 automatically
  ALL REPOS PRIVATE:
                    "Your GitHub has no public repos."
                    "Add a public sample project, or provide an alternative link."
                    Options: [Retry after adding repo]  [Proceed with a note →]
                    NOT blocked — admin reviews with "no public repos" flag
  PROFILE NOT FOUND / URL 404:
                    "GitHub profile not found — check your URL"
                    Cannot proceed until fixed
  TIMEOUT (30s):    "Couldn't scan right now — we'll review manually"
                    [Proceed Anyway →]
                    Admin queue shows "GitHub scan failed" flag
```

#### Phase B Step 4: Username Picker
```
Input: hiretivo.com/e/ [priyasharma        ]
                        ↑ pre-filled, editable

Validation rules (client-side, instant):
  - 3–30 chars
  - Lowercase only (auto-transform on type)
  - Alphanumeric + hyphens only
  - Cannot start or end with hyphen

Async uniqueness (debounced 300ms):
  IDLE:      no indicator
  CHECKING:  small spinner inline
  AVAILABLE: ✓ Available  (green)
  TAKEN:     ✗ Already taken — try priyasharma2  (red + suggestion)

Submit blocked if: validation fails OR slug taken OR check in-flight
```

#### Verification Status Cards (Engineer Dashboard)
```
NOT_SUBMITTED (default for all new users):
┌─────────────────────────────────────┐
│ Get Hiretivo Verified               │
│ Apply to jobs. Get discovered.      │
│ Free — takes ~10 minutes            │
│                                     │
│ [Submit for Verification →]         │
└─────────────────────────────────────┘

PENDING:
┌─────────────────────────────────────┐
│ ⏳ Under Review                      │
│ Submitted: May 15, 2026             │
│ We'll email you within 48 hours     │
└─────────────────────────────────────┘

IN_REVIEW:
┌─────────────────────────────────────┐
│ 👀 Admin is reviewing your profile  │
│ Almost there — hang tight           │
└─────────────────────────────────────┘

VERIFIED:
// profilePublic = false (not yet opted in):
┌─────────────────────────────────────┐
│ ✓ Hiretivo Verified  Score: 84/100  │
│                                     │
│ Profile not public yet              │
│ hiretivo.com/e/priyasharma          │
│                                     │
│ [Make Profile Public →]             │
│ [View Preview →]                    │
└─────────────────────────────────────┘

// profilePublic = true (opted in):
┌─────────────────────────────────────┐
│ ✓ Hiretivo Verified  Score: 84/100  │
│ Profile live — visible to recruiters│
│ hiretivo.com/e/priyasharma  [Copy]  │
│                                     │
│ [View My Profile →]  [Hide Profile] │
└─────────────────────────────────────┘

REJECTED:
┌─────────────────────────────────────┐
│ ✗ Verification Unsuccessful         │
│                                     │
│ What to fix:                        │
│ • All repos are forks/tutorials     │
│ • Bio missing or too short          │
│ [Admin note if exists]              │
│                                     │
│ Can reapply: Jun 14, 2026           │
│ "Available in 43 days" (countdown)  │
│                                     │
│ [Update Profile →]  [Resubmit →]   │
│  Resubmit disabled until date passes│
└─────────────────────────────────────┘
```

#### Reapply Button Edge Cases
```
reapplyAfter in future  → [Resubmit] disabled, shows countdown
reapplyAfter passed     → [Resubmit] enabled, links to Phase B flow
reapplyAfter null       → never rejected — no resubmit CTA shown
Engineer already PENDING → [Resubmit] hidden entirely
```

#### IN_REVIEW Stale Timeout
```
Admin opens review → status = IN_REVIEW
If no decision after 2 hours:
  → Cron (every 30 min): check for IN_REVIEW where updatedAt < now() - 2hr
  → Auto-revert: verificationStatus = PENDING
  → Admin queue shows item again as unreviewed
  → No email to engineer (transparent to them)

Also checked lazily on admin queue page load:
  → Any IN_REVIEW items older than 2hr shown with "Stale — reclaimed" badge
```

#### hiddenUntil Scope
```
Engineer sets hiddenUntil to future date:
  ✗ Removed from talent pool browse
  ✗ /e/[slug] returns 404
  ✓ Active applications still visible to recruiters with those applications
  ✓ Active interviews continue unaffected
  ✓ Unlock records preserved
  ✓ Can still apply to jobs (VERIFIED gate unchanged)

hiddenUntil passes → automatically visible again (no manual action needed)
```

#### profilePublic Consent Modal Copy
```
Modal text (shown when engineer clicks "Make Profile Public"):

"By making your profile public, the following become visible
to anyone on the internet — including recruiters, colleagues,
and search engines:

  • Your full name
  • Hiretivo Score (e.g. 84/100)
  • Target salary range (e.g. $80k–$120k/yr)
  • Bio, top projects, skills, and availability

Your email, GitHub URL, and LinkedIn remain hidden.
You can hide your profile at any time from your dashboard."

[Make It Public]   [Not Yet]
```

#### Apply Gate (Job listings)
```
VERIFIED engineer     → [Apply] button active
UNVERIFIED engineer   → [Apply] replaced with [Get Verified to Apply →]
                        Links to /seeker/verification
PENDING/IN_REVIEW     → [Verification in progress — check back soon]
                        Button disabled, not misleading
REJECTED              → [Get Verified to Apply →] (same as unverified)
```

---

### Phase 2 — Talent Pool & Public Profiles

#### Engineer Card: 3 States

**State 1 — Locked (all plans before unlock)**
```
┌─────────────────────────────────────┐
│ Priya S.  ✓ Verified     84/100    │
│ Senior React Engineer · 6 yrs      │
│                                     │
│ React  Node.js  AWS  PostgreSQL    │
│ $80k–$120k/yr  ·  5+ hrs US overlap│
│ Available Jun 2026                  │
│                                     │
│ Best match: Senior React Dev — 87% │
│ (only shown if recruiter has jobs)  │
│                                     │
│ [🔒 Unlock Profile]  [♡ Save]      │
└─────────────────────────────────────┘
```

**State 2 — Unlocked (paid plan, quota used)**
```
┌─────────────────────────────────────┐
│ Priya Sharma  ✓ Verified   84/100  │
│ Senior React Engineer · 6 yrs      │
│                                     │
│ React  Node.js  AWS  PostgreSQL    │
│ $80k–$120k/yr  ·  5+ hrs US overlap│
│ Available Jun 2026                  │
│                                     │
│ priya@gmail.com                     │
│ github.com/priyasharma              │
│ linkedin.com/in/priyasharma         │
│                                     │
│ [✉ Email]  [📅 Schedule Interview] │
└─────────────────────────────────────┘
```

**State 3 — Free plan hits unlock**
```
Modal:
┌─────────────────────────────────────┐
│ Unlock Priya S. — ✓ Verified 84/100│
│                                     │
│ React · Node.js · $80k–$120k        │
│                                     │
│ Starter plan unlocks 10 engineers/mo│
│ $199/mo — cancel anytime            │
│                                     │
│ [Upgrade to Starter →]              │
│ [Maybe Later]                       │
└─────────────────────────────────────┘
```

#### Quota States (Paid Plans)
```
Quota remaining    → [🔒 Unlock Profile] active, shows "8 unlocks left"
Quota = 0          → [🔒 Unlock Profile] grayed out
                     Tooltip: "Quota exhausted — resets Jan 1"
                     No modal, no upgrade prompt (already paid)
Auto-unlock (apply)→ No quota deducted, button shows [✓ Unlocked]
```

#### Interview Scheduling Modal (from unlocked card)
```
Recruiter clicks [📅 Schedule Interview]:
┌─────────────────────────────────────┐
│ Invite Priya Sharma to Interview    │
│                                     │
│ For which role?                     │
│ [Senior React Engineer ▼]  ← dropdown of open jobs
│                                     │
│ Note to engineer (optional):        │
│ [________________________]          │
│                                     │
│ [Cancel]  [Send Invite →]           │
└─────────────────────────────────────┘

On confirm:
→ EngineerUnlock created if not exists (source="talent_pool")
→ Application created (source=RECRUITER_INITIATED)
→ Engineer email: "You've been invited to interview at [Company]"

Edge cases:
→ No open jobs: dropdown empty → show "Post a job first" with link
→ Already applied: show "Engineer already applied — view application"
```

#### Blocked Recruiter After Active Application
```
Engineer blocks company domain AFTER applying or after interview invite:

Application side:
  → Application remains visible to recruiter (active workflow)
  → Interview continues unaffected
  → Application status changes proceed normally (both parties can see)
  → On application resolution (hired/rejected/withdrawn): engineer can
    then disappear from domain's future searches

Discovery side (immediate on block):
  → Engineer removed from that domain's talent pool searches
  → Engineer's /e/[slug] still accessible (public) but not surfaced to them
  → No new unlocks from that domain

If engineer wants to halt active application after blocking:
  → Must explicitly withdraw via dashboard (separate action)
  → Block alone does NOT withdraw application

Recruiter blocks on blocked domain tries to unlock another engineer:
  → Unaffected — BlockedRecruiter is per engineer × domain, not domain-wide
```

#### External URL Safety (Project Links + Video)
```
All user-submitted URLs (topProjects[].url, videoIntroUrl, githubUrl):

Server-side validation (Zod):
  → scheme must be https:// (reject http, javascript, data, ftp)
  → githubUrl: must match /^https:\/\/github\.com\/.+/
  → videoIntroUrl: allow any https URL (Loom, YouTube, Vimeo, etc.)
  → projectUrl: any https URL

Client-side rendering:
  → All external links: rel="noopener noreferrer nofollow" target="_blank"
  → Never fetch/proxy external URLs server-side (SSRF prevention)
  → No link previews / OG card fetching for project URLs

Admin review panel:
  → Project URLs rendered as plain text + [Open ↗] button (not auto-fetched)
```

#### Public Profile Page `/e/[slug]`

Route gate — return 404 unless ALL true:
```ts
verificationStatus === 'VERIFIED'
&& profilePublic === true
&& (hiddenUntil === null || hiddenUntil < new Date())
```
Any condition false → 404 "Profile not found" (no info leak about existence)

```
Visible to anyone (no auth):
  Full name, verified badge, Hiretivo Score
  Skills, bio, top 3 projects (name, description, URL)
  Salary range (USD), timezone overlap, availability

Hidden always (even on public page):
  Email, GitHub URL, LinkedIn URL

Engineer hides profile (hiddenUntil set to future):
  → 404 — same as not found (no info leak)

Recruiter landing:
  → "Hire engineers like Priya — Sign up free →" CTA banner

Engineer sharing:
  → Profile URL shown in dashboard after VERIFIED
  → Copy button next to URL
```

#### Saved Engineers
```
♡ Save on locked card  → saves without unlock (no quota used)
♡ Save on unlocked card → saves (already unlocked)
Saved tab (/recruiter/saved):
  → Shows saved cards in locked/unlocked state (whichever applies)
  → [Remove] per card
  → Persists after subscription cancel
```

#### BlockedRecruiter Flow (Engineer Side)
```
Location: Engineer dashboard → Settings → "Who can find me"
Shows list of recruiter domains that have unlocked their profile
Per domain: [Block this company →]
  → Creates BlockedRecruiter(engineerId, recruiterDomain)
  → That domain's recruiters can no longer see engineer in talent pool
  → Existing unlock record stays (can't un-see PII already seen)

Edge case: engineer blocks AFTER being unlocked
  → Recruiter keeps access to already-revealed PII
  → Engineer disappears from future talent pool searches for that domain
```

---

### Phase 3 — Job Match & Notifications

#### Match Score Display Logic
```
Recruiter HAS open jobs:
  Card shows: "Best match: Senior React Dev — 87%"
  Sorted by: best match first (default)

Recruiter has NO open jobs:
  Card shows: Hiretivo Score only (84/100)
  Sort default: Highest Score
  CTA inline: "Post a job to see match scores"

Null field handling (renormalize weights):
  salaryMinUsd null on job → salary weight skipped, others ÷ 0.80
  timezoneOverlapHours null on engineer → timezone skipped, others ÷ 0.90
```

#### RECRUITER_INITIATED Application
```
Engineer receives email: "Invited to interview at Acme Inc."
  → Link to job detail page
  → Application pre-created (source=RECRUITER_INITIATED, status=APPLIED)
  → Engineer dashboard shows under "Recruiter Invites" tab (separate from "My Applications")
```

---

### Phase 4 — AI Review & Feedback

#### Employer Feedback Form `/feedback/[token]`
```
Token: signed JWT { engineerId, recruiterId, jobId, exp: 90days }
No login required

Form:
┌─────────────────────────────────────┐
│ How was working with Priya Sharma?  │
│                                     │
│ ★ ★ ★ ★ ★  (star picker 1–5)       │
│                                     │
│ Comments (optional):                │
│ [________________________]          │
│                                     │
│ [Submit Feedback →]                 │
└─────────────────────────────────────┘

Edge cases:
→ Token expired (>90 days): "This feedback link has expired"
→ Already submitted: "Feedback already received — thank you"
   (mark token used in DB after submit)
→ Invalid JWT signature: 400 error page
```

#### Admin AI-Assisted Review Card
```
┌─────────────────────────────────────────────┐
│ Priya Sharma — AI Analysis Complete         │
│ AI Recommendation: REJECT (78% confidence) │
│                                             │
│ Pre-filled reasons (admin can uncheck):     │
│ ☑ All repos are forks/tutorials            │
│ ☑ Last commit: 8 months ago               │
│ ☐ No real-world project                   │
│                                             │
│ Score suggestion: 42/100                   │
│ Admin override score: [___]                │
│                                             │
│ Admin note (optional): [___________]        │
│                                             │
│ [Edit & Send Rejection]  [Override: Approve]│
└─────────────────────────────────────────────┘

Edge cases:
→ AI scan failed: show manual review form (no pre-fill)
→ AI confidence < 50%: show "Low confidence — review manually" warning
→ Admin overrides AI: log override in VerificationReview.aiSummary
```

---

## 16. NORTH STAR METRIC

**Verified engineers placed in jobs per month.**

Not signups. Not traffic. Not posts. Placements.

---

*Last updated: 2026-05-15 — Round 3 fixes: talent pool vs profilePublic gates, hiddenUntil scope, block-after-application rules, private GitHub = manual review, engineer unlock notification, work email requirement, feedback eligibility + feedbackRequestId, quota source filtering, IN_REVIEW stale timeout, consent modal copy, URL safety, job quota enforcement, deletion runbook*
*Status: Plan approved — ready to build on `feature/pivot-v2`*
