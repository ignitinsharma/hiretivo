# Hiretivo V2 — End-to-End Development Plan

**Purpose of this doc:** single source of truth for implementation. Written for an AI coding model (DeepSeek V3 Flash) to execute phase by phase. Every phase has a checklist — mark items `[x]` as completed. Only move `CURRENT PHASE` forward once all items in the active phase are checked.

**Do not skip ahead.** Later phases assume earlier phases are fully working, not just "mostly working." If a phase's core loop is broken, no amount of UI work in a later phase will fix it — go back.

---

## 🔵 CURRENT PHASE: `PHASE 1 — Core Resume Generation Engine`

*(Update this line manually as phases complete. This is the single pointer every session should check first.)*

**Changelog — 2026-07-15:** Pre-work fix pass completed for SSRF, quota policy, regenerate versioning, AI retry, and duplicate-request guard. AI provider strategy locked (Gemini 2.5 Flash primary, Flash-Lite for low-stakes tasks), hourly rate limiting added for both generation and resume upload. Onboarding simplified to 2 steps with resume vision-parsing. Phase 0 schema updated: `portfolio` → `websiteUrl`, added `twitter`. New `MasterResume` and `CoverLetter` models added. **`resume-tailor.ts` confirmed not to exist in the codebase — full build spec added: function signature, `TailorResumeResult` type, and complete `POST /api/applications/:id/generate` route contract (request/response bodies for success, quota-exceeded, rate-limited, ai-error, and no-master-resume cases).** This is ready to build directly from — no further clarification needed before Phase 1 implementation starts.

**Changelog — 2026-07-15 (afternoon):** Phase 0 implemented in code. Prisma models `MasterResume`, `ResumeVersion`, `GenerationQuota`, `CoverLetter` added to schema + migration applied. `Application` model updated with `generationCount` and `activeVersionId`. Shared Zod schema created at `src/lib/validations/resume.schema.ts`. Phase 0 checklist verified and CURRENT PHASE moved to Phase 1.

---

## ⚠️ Open Decisions

| # | Question | Status |
|---|---|---|
| 1 | Does clicking "Regenerate" consume a quota unit? | ✅ **RESOLVED.** No — regenerate never consumes quota. Instead, each regenerate creates a new `ResumeVersion` row (version++), capped at 5 per application, with a version selector to switch/revert between them. No silent overwrite, no lost history. |
| 2 | Is "Match Score" the same number shown in the AI Rewrite panel, or a separate "resume quality score"? | **Still default:** Same number, reused everywhere. No separate generic quality score. Confirm before Phase 6. |
| 3 | Does an AI Rewrite chip click consume a separate quota unit? | **Still default:** No — tied to the original generation event, capped at 5 AI Rewrite edits per generation. Confirm before Phase 6. |
| 4 | ATS URL scrape flow — auto-try then fallback, or explicit choice upfront? | ✅ **RESOLVED (with a tradeoff to be aware of).** Auto-try first via a strict domain allowlist (see Phase 1 security section). URLs not on the allowlist go straight to the paste-JD fallback — including some legitimate self-hosted careers pages that run on Greenhouse/Lever under the hood but live on the company's own domain. This is the safe default; revisit if users complain URLs "don't work" often. |
| 5 | Does a failed/timed-out AI generation consume quota? | ✅ **RESOLVED.** No — quota only decrements when the AI response is schema-valid and successfully saved. Enforced server-side via `GenerationQuota` table + `checkGenerationQuota()` / `consumeGenerationQuota()`. |
| 6 | Multiple base resumes (e.g. separate Dev track vs. PM track)? | ✅ **RESOLVED — deferred to Phase 9.** Single master `profileId` for now. Editor is the workaround for track-specific tailoring in the meantime. `ResumeBase` model designed and ready to add later without breaking existing data if this becomes a real pain point. |
| 7 | Where does a user's first master profile get created? | ✅ **RESOLVED.** Lazily, during onboarding Step 2 — user uploads PDF → Gemini 2.5 Flash vision parses it → saved as `MasterResume`. If the user skips Step 2 ("Skip — I'll do it later"), `MasterResume` stays null and is created on first "Generate Resume" attempt instead, which prompts for upload at that point. |

---

## Core Principle: One JSON Schema, Five Consumers

Every phase below reads and writes the **same resume JSON schema** (defined in Phase 0). Do not let any phase invent its own shape of resume data. The five consumers are:

1. Resume Parser (PDF/DOCX upload → JSON)
2. AI Optimizer (JSON in → JSON out, same shape)
3. Template Renderer (JSON → PDF)
4. Editor UI (reads/writes JSON directly)
5. Cover Letter Generator (reads JSON + JD)

If a bug ever produces fabricated or missing data, the fix is almost always "this consumer didn't validate against the schema" — not a prompt-engineering fix.

---

## PHASE 0 — Foundation: Resume JSON Schema

**Status: NOT STARTED**

### Goal
Lock the canonical data contract before any UI or AI logic is built.

### Schema

```json
{
  "profileId": "string (uuid) — the user's master/base profile",
  "resumeVersionId": "string (uuid) — unique per generated variant",
  "applicationId": "string (uuid) | null — null for master profile, set for tailored versions",
  "sourceType": "uploaded | ai-generated | manual-edit",
  "generatedAt": "ISO 8601 timestamp",

  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string | null",
    "github": "string | null",
    "websiteUrl": "string | null",
    "twitter": "string | null"
  },

  "summary": "string",

  "experience": [
    {
      "id": "string",
      "company": "string",
      "title": "string",
      "location": "string | null",
      "startDate": "string (MMM YYYY)",
      "endDate": "string (MMM YYYY) | null",
      "current": "boolean",
      "bullets": [
        { "id": "string", "text": "string", "priority": "number (1=highest, used for trimming)" }
      ]
    }
  ],

  "projects": [
    {
      "id": "string",
      "name": "string",
      "link": "string | null",
      "bullets": [
        { "id": "string", "text": "string", "priority": "number" }
      ]
    }
  ],

  "education": [
    {
      "id": "string",
      "institution": "string",
      "degree": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],

  "skills": {
    "categories": [
      { "name": "string (e.g. Frameworks & Libraries)", "items": ["string"] }
    ]
  },

  "certifications": [
    { "id": "string", "name": "string", "issuer": "string | null", "date": "string | null" }
  ],

  "languages": [
    { "id": "string", "name": "string", "proficiency": "string | null" }
  ],

  "matchMeta": {
    "matchScore": "number (0-100) | null — null if not JD-tailored",
    "addedKeywords": ["string"],
    "missingKeywords": ["string"],
    "requiredSkillsMatched": "number",
    "requiredSkillsTotal": "number",
    "preferredSkillsMatched": "number",
    "preferredSkillsTotal": "number"
  }
}
```

### Rules
- `bullets[].priority` is mandatory — this is what the fit-to-one-page trimmer uses to decide what to cut. Lower priority = cut first. AI optimizer must assign priority when generating/reordering bullets.
- Every consumer (parser, optimizer, renderer, editor, cover letter gen) validates incoming/outgoing data against this schema before proceeding. **Reject and retry rather than silently render partial/fabricated data.**
- The master profile (`applicationId: null`) is never overwritten by a tailored generation. Tailoring always creates a new `resumeVersionId`.
- `personalInfo.linkedin` is **required at the onboarding form level** (Decision #12, 2026-07-15) but stays `string | null` at the schema/type level — this keeps the schema valid for edge cases like a manually-created profile that bypasses the onboarding form. Form-level required ≠ schema-level nullable; both layers are allowed to disagree here intentionally.
- `personalInfo.portfolio` was renamed to `websiteUrl`, and `twitter` was added, in the pre-build decisions pass (2026-07-15) — see Section further down for full changelog.

### Data Model (added in pre-work fix pass, 2026-07-15)

```prisma
// Canonical, document-only storage for the user's uploaded/parsed base resume.
// This is the ONE source of truth — normalized tables (WorkExperience, Education,
// SeekerSkill, etc.) are derived read-only caches, written ONLY by a
// sync-from-MasterResume transaction, never directly by any other code path.
model MasterResume {
  id         String   @id @default(cuid())
  userId     String   @unique
  resumeJson Json     // Phase 0 schema JSON — canonical source of truth
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

// Tracks monthly generation usage per user — enforced server-side
model GenerationQuota {
  id        String   @id @default(cuid())
  userId    String
  month     String   // "YYYY-MM"
  count     Int      @default(0)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, month])
  @@index([userId])
}

// Each generate/regenerate creates a new version row — no silent overwrite
model ResumeVersion {
  id            String   @id @default(cuid())
  applicationId String
  version       Int      @default(1)
  resumeJson    Json
  sourceType    String   @default("ai-generated") // ai-generated | regenerate | manual-edit
  createdAt     DateTime @default(now())
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  @@index([applicationId])
}

// Application model additions:
// generationCount  Int     @default(0)
// activeVersionId  String?  — points to current ResumeVersion.id
```

`GenerationQuota` = only counted on schema-valid success (Open Decision #5). `ResumeVersion` = backs Open Decision #1 (regenerate versioning, capped at 5). `ResumeBase` model was designed but **not added** — deferred per Open Decision #6.

### Checklist
- [x] Schema implemented as a shared TypeScript type / Zod (or equivalent) validator
- [ ] Parser output validated against schema before save
- [x] AI optimizer prompt constrained to only return fields in this schema (no extra keys)
- [x] Validation failure = block + surface error, never silently proceed with partial data (via quota-on-success-only policy)
- [x] Master profile vs. tailored version distinction enforced at DB level
- [x] `GenerationQuota` + `ResumeVersion` tables added to Prisma schema

---

## PHASE 1 — Core Resume Generation Engine (No UI Polish)

**Status: NOT STARTED**

### Goal
Prove the single core loop works reliably before touching dashboard/drawer/tracker. This is the actual product. Everything else is wrapping.

### Flow
```
Upload Resume → Parse → JSON (Phase 0 schema)
      ↓
Paste JD text OR paste ATS URL
      ↓
[If URL] Validate against domain allowlist (see Security section) → reject or proceed
      ↓
[If URL] Scrape → extract JD text
   → low confidence/empty/rejected? → prompt "Couldn't read that page — paste the JD text"
      ↓
AI Optimizer (wrapped in retry/timeout handler) → base JSON + JD text → tailored JSON (same schema)
      ↓
Only on schema-valid success: consumeGenerationQuota() called
      ↓
Render to single ATS-safe template (Phase 2) → PDF
      ↓
Download
```

### AI Provider & Model Strategy (decided 2026-07-15)

**One model family, routed through OpenRouter (already in use), no DeepSeek dependency:**

| Task | Model | Why |
|---|---|---|
| Resume parsing (PDF/DOCX → JSON) | **Gemini 2.5 Flash** (vision) | Send the PDF directly to the vision model instead of text-extraction libraries (`pdf-parse`/`mammoth`) — sidesteps the two-column-layout garbling problem entirely, and handles scanned/image PDFs without a separate OCR step. Runs once per resume upload, not per application, so cost is negligible regardless of model tier. |
| JD → resume tailoring (the core generation) | **Gemini 2.5 Flash** | This is the actual product — output quality (natural phrasing, correct keyword integration, JD-tone matching) matters more than the fractional cost difference to a cheaper model. ~$0.004/generation at current pricing. |
| Cover letter generation | **Gemini 2.5 Flash** | Same reasoning — user-facing writing quality. |
| ATS URL scrape confidence check / low-stakes classification | **Gemini 2.5 Flash-Lite** | Cheap, low-stakes, doesn't need strong reasoning — good place to actually use the cheapest tier. |

**Cost math (why this doesn't threaten the $7/20-applications or $12/unlimited plans):** ~$0.004 per generation on Flash → 20 generations ≈ $0.08/month/user on the $7 plan (~1% of revenue). Even 200 generations on the "unlimited" plan ≈ $0.80/month — still >90% margin before payment processing/infra. Resume parsing is a one-time-per-upload cost, not multiplied by application volume, so vision pricing was never the real risk here.

**Why not DeepSeek:** text-only, no vision support — would require a second provider just for resume parsing. Given Gemini Flash's low per-call cost at this volume, the added architectural complexity of a two-provider setup isn't worth it. Keep DeepSeek as a documented fallback option in OpenRouter config if Gemini pricing/availability changes later, but Gemini 2.5 Flash is primary.

### Abuse Prevention: Rate Limiting (separate from the quota system)

**This is the real risk on the "unlimited" plan — not per-call cost.** Token cost alone won't break margin even under heavy legitimate use, but at ~$0.004/call it's cheap enough that someone could script the API and resell access, or hammer it far beyond any real human's usage pattern. The monthly quota (Phase 8) doesn't protect against this because "unlimited" has no monthly quota to exceed.

**Add an hourly rate limit, independent of and in addition to the monthly quota:**
- Free tier: max 5 generation requests/hour
- Paid tiers (both $7 and $12): max 15 generation requests/hour
- Enforced server-side (e.g. token-bucket or fixed-window counter keyed by `userId`, stored in Redis/Upstash — already in the stack), not just UI-disabled buttons
- On limit hit: clear error state ("You've hit the hourly limit — try again in X minutes"), not a silent failure or a quota decrement
- This applies uniformly regardless of plan tier or monthly quota status — "unlimited" means no monthly cap, not no rate limit

**Second, separate limiter for resume upload/parsing (added 2026-07-15):** the generation rate limiter above only covers the JD-tailoring flow. Resume upload (the vision-parsing call) is a *different* endpoint and was initially missed — it has no monthly quota cost (uploading isn't a "generation"), which means without its own limiter it's fully unrate-limited and scriptable. Fix: a second, lighter limiter — **10 requests/hour, same for free and paid tiers** (no need to tier this one, since no legitimate user re-uploads their resume more than a couple times an hour even while iterating). Separate Redis key: `hiretivo:resume-upload-hourly:{userId}`, distinct from `hiretivo:resume-gen-hourly:{userId}`.

### Checklist (additions)
- [ ] Gemini 2.5 Flash configured as primary model in OpenRouter for parsing/tailoring/cover-letter routes
- [ ] Gemini 2.5 Flash-Lite configured for URL-confidence-check / classification routes only
- [ ] Vision-based resume parsing replaces `pdf-parse`/`mammoth` text-extraction as the primary path
- [ ] Hourly rate limit implemented server-side, independent of monthly quota, applies to all tiers including "unlimited"
- [ ] Separate resume-upload rate limit implemented (10/hour, all tiers) — distinct key from the generation limiter above

### The Tailoring Call — `src/lib/ai/resume-tailor.ts` (added 2026-07-15)

**Confirmed via codebase search (2026-07-15): this file does not exist yet.** No AI tailoring logic exists anywhere in the codebase — the current "Generate" button only template-fills a plain resume from profile settings with zero AI processing. This is a **new file to create**, not a rename/refactor. It is the first real implementation task of Phase 1 — build it directly against this spec, do not re-derive requirements from scratch.

This is the single most important AI call in the product and must be a named, explicit file — not left implicit inside a route handler. It's the one that takes `MasterResume.resumeJson` + parsed JD text and produces the actual tailored resume. Responsibilities, in order:

1. Call `checkGenerationQuota(userId)` — block if not allowed, before doing anything else
2. Call the hourly generation rate limiter (`hiretivo:resume-gen-hourly:{userId}` — 5/hr free, 15/hr paid) — block if exceeded, before any AI call fires
3. Only after both checks pass: call `google/gemini-2.5-flash` via OpenRouter, wrapped in `withRetry()`, with `MasterResume.resumeJson` + JD text as input
4. Validate the response against the Phase 0 schema — reject and retry once on malformed/out-of-schema output, never save partial or fabricated data
5. On schema-valid success only: call `consumeGenerationQuota(userId)`, then save the result as a new `ResumeVersion` row (`applicationId` set, `sourceType: "ai-generated"`) — **never writes to `MasterResume` directly**
6. Populate `matchMeta` (score, added/missing keywords) as part of the same response, not a separate call

**Ordering matters:** quota and rate-limit checks must run before the AI call, not after — a blocked request should cost nothing, no API call made, no quota touched.

#### Function signature

```typescript
// src/lib/ai/resume-tailor.ts

export interface TailorResumeInput {
  userId: string;
  applicationId: string;
  masterResumeJson: ResumeDocument; // Phase 0 schema
  jdText: string;
}

export type TailorResumeResult =
  | { status: "success"; resumeVersion: ResumeVersion }
  | { status: "quota_exceeded"; used: number; limit: number; resetsAt: string }
  | { status: "rate_limited"; retryAfterSeconds: number }
  | { status: "ai_error"; reason: "timeout" | "malformed_response" | "unreadable_jd" }
  | { status: "validation_error"; details: string };

export async function tailorResume(
  input: TailorResumeInput
): Promise<TailorResumeResult>
```

#### API route contract

```
POST /api/applications/:id/generate

Request body:
{
  "jdText": "string"          // already-resolved JD text (from paste or scrape,
                               // resolved upstream by the Apply flow before this
                               // route is called — this route does not scrape)
}

Success response — 200:
{
  "resumeVersionId": "string",
  "version": 1,
  "resumeJson": { ...ResumeDocument },
  "matchMeta": {
    "matchScore": 78,
    "addedKeywords": ["string"],
    "missingKeywords": ["string"],
    "requiredSkillsMatched": 8,
    "requiredSkillsTotal": 10,
    "preferredSkillsMatched": 1,
    "preferredSkillsTotal": 7
  }
}

Quota exceeded — 402:
{ "error": "quota_exceeded", "used": 2, "limit": 2, "resetsAt": "2026-08-01T00:00:00Z" }

Rate limited — 429:
{ "error": "rate_limited", "retryAfterSeconds": 1800 }

AI/validation failure — 422:
{ "error": "ai_error" | "validation_error", "message": "string (user-facing)" }

No MasterResume exists — 409:
{ "error": "no_master_resume", "message": "Upload your resume to get started" }
```

**Route-level responsibilities** (thin wrapper around `tailorResume()`):
- Auth check → resolve `userId`
- Fetch `MasterResume` for `userId` → 409 if none exists (don't call `tailorResume()` at all in this case)
- Fetch `Application` by `:id`, confirm it belongs to `userId`
- Call `tailorResume({ userId, applicationId, masterResumeJson, jdText })`
- Map `TailorResumeResult` status → HTTP status per the table above
- This same route is reused for **Regenerate** — no separate endpoint. The version-increment + 5-cap logic (Phase 3) lives inside `tailorResume()`'s save step, not in the route.

#### Checklist
- [ ] `src/lib/ai/resume-tailor.ts` created with the signature above
- [ ] `POST /api/applications/:id/generate` route implemented per the contract above
- [ ] Quota + rate-limit checks confirmed to run before any AI call fires
- [ ] Regenerate reuses this same route/function, not a duplicate implementation
- [ ] `matchMeta` populated in the same AI response, not a second call

### Cover Letter Storage — `CoverLetter` model (added 2026-07-15)

Missing from earlier drafts — `cover-letter-generator.ts` produces output but nothing persisted it. Add a dedicated model rather than a field on `Application`, so cover letters can follow the same per-application pattern as resume versions without polluting the `Application` row with unrelated content:

```prisma
model CoverLetter {
  id            String   @id @default(cuid())
  applicationId String
  content       String   // generated cover letter text
  createdAt     DateTime @default(now())
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  @@index([applicationId])
}
```

No version-cap/history needed here to match resume versioning exactly — track the current cover letter per application only, unless real usage later shows people want cover-letter history too (lower value than resume version history, skip for now).


The scraper takes a user-supplied URL and feeds it to an AI provider that fetches it — an SSRF vector if unvalidated. Fix: `src/lib/url-validator.ts` runs a `validateJobUrl()` check **before** the URL ever reaches the AI prompt.

- HTTPS-only, hostname checked against a fixed allowlist (Greenhouse, Lever, Ashby, LinkedIn, Indeed, Naukri, Instahyre, etc. — see full list in `url-validator.ts`)
- Non-allowlisted domains are rejected and routed straight to the paste-JD fallback, not fetched
- **Residual risk, not yet fixed:** if an allowlisted URL 302-redirects to a private/internal IP, and the AI provider's fetch tool follows redirects without re-validating each hop, the allowlist check is bypassed. Confirm whether the fetch tool follows redirects; if so, this needs a redirect-aware check before Phase 1 is considered secure, not just functional.
- **Known tradeoff:** legitimate self-hosted careers pages (e.g. `careers.company.com` running Greenhouse under the hood) will fail the allowlist and fall back to paste — accepted as the safe default (Open Decision #4).

### AI Reliability (fixed in pre-work pass, 2026-07-15)

All AI calls (JD parsing, resume optimization, cover letter generation) are wrapped in `withRetry()` — 2 retries, exponential backoff, 20–30s timeout per attempt. Returns `null` on exhausted retries rather than throwing, so callers can fall back to the paste-JD prompt or an error toast instead of crashing the flow.

### Edge Cases (must handle before Phase 1 is "done")
- [ ] No resume uploaded yet → block Apply, prompt upload first
- [ ] Uploaded resume is image-based PDF / unparseable → clear error, don't silently produce empty JSON
- [ ] JD text pasted is too short / not JD-like (e.g. <50 words) → validation warning, allow override
- [x] ATS URL scrape returns empty/low-confidence/non-allowlisted → auto-fallback to paste-JD prompt (see Open Decision #4, Security section)
- [x] AI optimizer/parser call times out or errors → retry with backoff, then fail gracefully without consuming quota (`withRetry`, Open Decision #5)
- [ ] AI optimizer returns malformed JSON or missing required fields → reject output, fall back to unmodified base resume + error toast — **never render fabricated fields**
- [ ] AI optimizer must only use data present in the input JSON — no inventing companies, titles, dates, or metrics not in the source. This is the exact bug class that broke a previous version; treat as a hard constraint in the system prompt and validate output against source JSON keys.
- [ ] Where is the user's first master profile created — signup or first Apply click? (Open Decision #7 — still unresolved)

### Checklist
- [ ] Resume upload + parse working end-to-end
- [ ] JD paste path working
- [x] ATS URL scrape path working with allowlist validation + fallback
- [x] AI calls wrapped in retry/timeout handler
- [ ] AI optimizer producing schema-valid, non-fabricated output
- [ ] Master profile creation flow decided and built (Open Decision #7)
- [ ] Manually tested against 10+ real JDs by Nitin himself before moving to Phase 2

---

## PHASE 2 — ATS-Safe Template + Fit-to-One-Page

**Status: NOT STARTED**

### Goal
One clean, genuinely ATS-parseable template. Not three. Not stylized. This directly fixes "looks like shit and not ATS-friendly."

### Template Rules (hard constraints)
- Single column layout only — no multi-column, no tables, no text boxes
- No icons, no graphics, no images
- Contact info in the document body, NOT in a header/footer (many ATS parsers skip header/footer content entirely)
- Standard section headers: PROFESSIONAL SUMMARY, EXPERIENCE, PROJECTS, EDUCATION, SKILLS, CERTIFICATIONS
- Font: one of Arial, Calibri, Georgia, Helvetica — no decorative fonts
- Output must be a real text-based PDF (selectable/copyable text), never a rasterized image

### Fit-to-One-Page Logic
```
1. Render at default font size (11pt) / margins (0.75")
2. If overflow:
   → shrink font down to floor of 10pt, margins down to floor of 0.5"
3. If STILL overflow after hitting floor:
   → trim lowest-priority bullet (using matchMeta / bullets[].priority) from the oldest experience entry
   → re-render, repeat trim from oldest→newest until it fits
   → show user a visible notice: "Trimmed N bullets to fit one page — review before downloading"
4. Never silently go to 2 pages without telling the user, and never shrink font below the floor.
```

### Checklist
- [ ] Template renders directly from Phase 0 JSON schema (no separate data mapping)
- [ ] Passes a manual "paste into a plain text ATS parser test" — verify all fields extract correctly
- [ ] Shrink-then-trim logic implemented with defined floors
- [ ] Visible trim notice shown to user when trimming occurs
- [ ] Tested against Nitin's real resume + 3 different JD lengths (short/medium/long)

---

## PHASE 3 — Application Page Core UI

**Status: NOT STARTED**

### Goal
The page a user lands on after clicking Apply. Wraps Phase 1+2 in UI.

### Apply Flow (from original spec, confirmed)
1. Click Apply → Application record created
2. Row added to dashboard immediately, status = `Generating Resume`
3. Resume generates in background (Phase 1 engine)
4. Status → `Review Resume`
5. Click Review Resume → opens `/applications/:id`

### Application Page Layout

**Left panel:**
- Match Score (reused number — see Open Decision #2)
- Added Keywords / Missing Keywords (from `matchMeta`)
- Required Skills checklist (matched/total, per-skill check icons)
- Preferred Skills checklist (matched/total, per-skill check icons)
- Timeline (status history)
- Buttons: Download, Regenerate, View Original Job, I've Applied

**Right panel:**
- Resume preview (rendered PDF/HTML)
- Tab: Resume | Cover Letter (see Phase 5)

### Important UI Copy Rule
"I've Applied" is a **self-reported, unverified status**. There is no ATS webhook or scrape-back confirming actual submission. Copy must not imply verified tracking — e.g. use "Mark as Applied" not "Confirmed Applied."

### Tracker Statuses
```
Generating Resume → Review Resume → Ready → Submitting (DORMANT — unused until Auto Apply phase) → Applied → Interview → Offer → Rejected
```
- [ ] `Submitting` status exists in the state machine but is **not reachable** by any current UI action — reserved for future Auto Apply phase, do not build UI that transitions into it yet.
- Auto Apply button: **hidden entirely**, not just disabled/greyed — it is not built yet and should not appear as a decorative dead button.

### Regenerate Versioning (fixed in pre-work pass, 2026-07-15)

Each Regenerate click creates a **new** `ResumeVersion` row (`version` incremented) rather than overwriting the current one — capped at 5 per application, enforced server-side. Add a version selector UI (prev/next or dropdown showing v1, v2, v3...) so the user can switch between or revert to a previous version. This was chosen over overwrite-in-place specifically so a bad regenerate isn't unrecoverable.

```
[Regenerate button] → POST /api/applications/:id/regenerate
                     → creates ResumeVersion { applicationId, version: current+1, resumeJson }
                     → cap at 5 → reject with "Already at max regenerations"
[Version selector]  → loads selected version into preview + editor
```

### Checklist
- [ ] Apply → dashboard row → background generation → status transitions working
- [ ] Application page renders left panel data from `matchMeta`
- [ ] Download button works
- [x] Regenerate button creates new `ResumeVersion` (not overwrite), capped at 5/application, no quota consumption
- [ ] Version selector UI built (prev/next or dropdown across versions)
- [ ] "I've Applied" copy reviewed for no false verification claims
- [ ] Auto Apply button not present in DOM (not just visually hidden)
- [x] Duplicate Apply click on same job → guarded (rate limit + 409 on duplicate apply already exist; added `isGenerating` early-return guard on the generate button for belt-and-suspenders)

---

## PHASE 4 — Editor Tab (Structured CRUD)

**Status: NOT STARTED**

### Goal
Manual fallback/fix layer. Cheap to build once Phase 0 schema exists. Must ship before Phase 6 (AI Rewrite) — users need a manual correction path regardless of AI quality.

### Sections (each independently expand/collapse, edit, delete, reorder)
- Personal Info
- Professional Summary
- Experience (add/remove entries, add/remove/reorder bullets within each)
- Projects
- Education
- Skills (by category)
- Certifications
- Languages
- "+ Add" control at the bottom for adding a new section entry

### Checklist
- [ ] Each section reads/writes directly to Phase 0 schema fields — no separate editor-only data model
- [ ] Add/edit/delete/reorder working per section
- [ ] Changes reflected live in the resume preview (right panel)
- [ ] Manual edits marked `sourceType: manual-edit` in the schema

---

## PHASE 5 — Cover Letter Flow

**Status: NOT STARTED**

### Goal
On-demand cover letter generation, reusing existing JD data — no new scraping needed.

### Flow
- Cover Letter tab sits next to Resume tab on the Application page
- **Disabled/queued until resume generation reaches `Review Resume` status** — cover letter should reference the tailored resume content for consistency, not just the JD in isolation
- Clicking generates using: tailored resume JSON (from this application) + stored JD text
- Shared quota pool with resume (see Open Decisions table — confirmed: shared pool)
- Cap: 2 cover letters/month on free tier, same tiering as resume

### Edge Cases
- [ ] Cover letter requested before resume finishes generating → button disabled with tooltip, not a broken/empty state
- [ ] Quota exhausted → clear upgrade prompt, show days-until-reset, do not silently fail

### Checklist
- [ ] Cover letter reuses stored JD text (no re-scrape)
- [ ] Cover letter reuses tailored resume JSON (not base profile)
- [ ] Shared quota counter working, UI copy says "generations" not "resumes" (see quota UX rule below)
- [ ] Uses same single ATS-safe template family as resume (consistent formatting)
- [ ] Generated content persisted to `CoverLetter` model (see Phase 1 — added 2026-07-15), not just returned to the client and discarded
- [ ] `cover-letter-generator.ts` uses `google/gemini-2.5-flash`, wrapped in `withRetry()`

---

## PHASE 6 — AI Rewrite Panel

**Status: NOT STARTED**

### Goal
Polish layer on top of an already-working generation engine. Do not start this phase until Phase 1–4 are proven on 10+ real JDs.

### Components
1. **Score** — reuses `matchMeta.matchScore`, no separate quality metric (Open Decision #2)
2. **Canned suggestion chips** (fixed set of 5, not dynamically generated):
   - "Use stronger action verbs"
   - "Shorten my summary"
   - "Remove skills not related to this job"
   - "Add more quantified metrics"
   - "Match the JD's tone"
   
   Each chip sends a prefixed instruction to the same rewrite endpoint used elsewhere — no new AI logic path.
3. **Freeform tweak input** — same endpoint, user-supplied instruction instead of a chip
4. **Diff-highlighting** — requires storing the pre-edit JSON snapshot. Use a word-level diff library (not custom-built) comparing old vs. new JSON field-by-field, not raw text blobs.

### Edge Cases
- [ ] First-ever generation has no "before" state → skip diff UI, show plain optimized resume
- [ ] Multiple chip clicks in sequence → each edits from current state (not original), capped at 5 edits per generation (Open Decision #3)
- [ ] Chip/freeform edits do not consume separate quota (tied to original generation event)

### Checklist
- [ ] Score reused, not recalculated separately
- [ ] 5 canned chips implemented, routed through existing rewrite endpoint
- [ ] Freeform input working
- [ ] Diff-highlight using field-level JSON comparison, word-level diff rendering
- [ ] Edit cap enforced (5/generation)

---

## PHASE 7 — Dashboard, Drawer, Browse, Search, Tracker

**Status: NOT STARTED**

### Goal
Everything from the original V2 spec that wraps around the now-proven core loop: dynamic dashboard, pinned "Add Your Own Job" card, one-row recommendations, Job Drawer (skeleton loading, header/skills/description/requirements/actions), shared search (400ms debounce, abort previous request, latest request wins), full Tracker view.

### Checklist
- [ ] Dashboard: dynamic jobs only, static cards removed, Resume button removed, Apply + Not Interested kept
- [ ] Drawer: instant open, skeleton loading, View Original Job + Apply actions
- [ ] Search: debounce + abort + latest-wins, shared across Dashboard/Browse
- [ ] Tracker: full status list rendered, `Submitting` visually present but unreachable (per Phase 3 note)

---

## PHASE 8 — Monetization & Quota Enforcement

**Status: NOT STARTED**

### Rules (confirmed)
- Free tier: 2 generations/month, **shared pool** across resume generation + cover letter generation
- Regenerate and AI Rewrite edits do NOT consume quota (Open Decisions #1, #3) — only the first generation per application does
- Paid tiers: limited (higher cap) and unlimited options

### Quota UX Rule
UI must show a single counter — **"X of 2 generations used this month"** — never split into separate "resumes remaining" / "cover letters remaining" labels, since the pool is shared. Splitting the copy will confuse users about why a button is disabled.

### Checklist
- [x] Single shared counter implemented and enforced server-side (`GenerationQuota` table, `checkGenerationQuota()` / `consumeGenerationQuota()`, built in pre-work pass 2026-07-15)
- [x] Regenerate confirmed not to decrement counter (creates new `ResumeVersion` instead, capped separately at 5)
- [ ] AI Rewrite edits confirmed not to decrement counter (build alongside Phase 6)
- [ ] Upgrade prompt shown on exhaustion, with reset date
- [x] Paid tier limits configurable (`planLimits` map in `generation-quota.ts` — FREE: 2, STARTER/GROWTH: 20, SCALE: 100 — not hardcoded per-call)

---

## PHASE 9 — Future / Parked (Not in current scope)

Do not build any of this until everything above is live and validated:
- Auto Apply (actual ATS submission automation)
- Multiple resume templates (template #2, #3)
- Resume style customization (accent color, font picker, paper size)
- Application withdrawal/deletion
- Real ATS status verification (webhook/scrape-back confirmation of "Applied")
- AI Chat (from original roadmap Phase 4)

---

## Summary: Why This Order

The AI-resume engine (Phases 0–2) is the actual product — it's also where the two previous bugs (fabricated profile data, irrelevant keyword matches) lived. Everything from Phase 3 onward is UI wrapped around that engine. Building dashboard/drawer/tracker polish before the engine is proven just means debugging five half-finished systems at once instead of one solid one. Prove the core loop on real JDs before adding surface area.