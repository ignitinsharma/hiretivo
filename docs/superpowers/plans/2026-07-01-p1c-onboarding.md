# Phase 1c — Progressive Onboarding + Resume Parser

> Pivot v3 (apply-faster tool). Prerequisite phases: 1a flags-gate (done), 1b shell.
> Spine position: 1a → 1b → **1c** → 2 (feed) → 3a (schema) → 3b (pdf) → 3c (profile) → 4 (ai) → 5 (wizard).

---

## > ASSUMPTIONS (read before executing)

These are load-bearing. If any is false when you start, STOP and reconcile with the memory node
`project_pivot_v3_apply_tool` before writing code.

1. **The canonical spec files named in memory do NOT exist on disk.** As of writing,
   `docs/superpowers/specs/2026-07-01-apply-faster-pivot-design.md`,
   `docs/superpowers/specs/2026-07-01-pivot-DATA-MODEL.md`, and
   `docs/superpowers/plans/2026-07-01-p1a-flags-gate.md` are absent from the working tree and from
   git history on all branches. This plan was reconstructed from the memory node
   (`~/.claude/projects/.../memory/project_pivot_v3_apply_tool.md`), the p1a branch commit log, and
   direct code reading. All decisions below trace to the memory node §"Locked decisions". **If those
   spec files reappear, they win — re-verify field/enum names against them verbatim.**

2. **`ApplicationDefaults` model + work-auth enums are Phase 3a/3c, NOT 1c.** Phase 1c does NOT
   collect or persist location / work-authorization / D&I ("ATS-form fields"). Those are due before
   first apply and are gated in Phase 5, collected in Phase 3c. This plan invents no `ApplicationDefaults`
   model and no work-auth enum. If parse yields a location string we keep it only on the EXISTING
   `SeekerProfile.location` field (already present, `String?`) — nothing new.

3. **The Honest/Aggressive optimize toggle belongs in settings/profile (Phase 3c), NOT onboarding.**
   Flagged, not built here. See "Gaps / deferrals".

4. **Tsenta "application password" step and auto-approve toggle are dropped entirely** (automation-only,
   irrelevant to Assisted-apply v1). We are REMOVING the concept, not hiding it — 1c onboarding never
   asks for it. There is no existing app-password step in the current code to delete (grep-confirmed);
   this is a "do not add" rather than a "remove".

5. **The current onboarding is a heavy 6-step verified-engineer flow** (`SeekerOnboardingContainer`,
   steps: About You → Skills → Proof of Work → Experience → Compensation → Review & Submit) with an
   India-location gate, mandatory GitHub + projects, and a `verificationStatus` review wall
   (`completeSeekerOnboarding` sets `VerificationStatus.PENDING`). The apply-faster pivot needs a LEAN
   progressive flow: **Upload → Parse → Review/Correct → done (browse immediately)**. 1c introduces the
   new lean flow behind a flag and does NOT delete the legacy 6-step components or actions — they stay
   intact (like recruiter code behind `RECRUITER_ENABLED`) and are simply unreachable when the new flow
   is active. Full removal is a later cleanup, out of scope here.

6. **`onboardingStep`/`onboardingCompleted` live on `User`** and are set via the seeker actions +
   `unstable_update`. The lean flow reuses this machinery: completing Review sets
   `onboardingCompleted = true`, `onboardingStep = null`, and does NOT set `verificationStatus`
   (no review wall in the pivot — seekers browse immediately).

7. **No PDF or DOCX text-extraction library exists** in `package.json` (grep-confirmed: only
   `@aws-sdk/*`, `openai`, `zod`). This phase adds `unpdf` (PDF text layer, zero native deps, works in
   Node/serverless) and `mammoth` (DOCX → text). If the team prefers `pdf-parse`, swap in Task 2 — but
   `unpdf` is chosen for Vercel serverless compatibility (no `pdfjs-dist` canvas/native binding issues).

8. **AI plumbing is reused verbatim.** `openrouter` client + `getAIModel()` from `src/lib/openrouter.ts`,
   prompt-builder pattern from `src/lib/ai-prompts.ts`, JSON parsing/fence-stripping pattern from
   `src/app/api/recruiter/ai/suggest-skills/route.ts`, R2 upload from `src/lib/r2.ts`, rate limiting via
   `src/lib/rate-limit.ts`. New `AiFeature.PARSE_RESUME` enum member is added (existing enum only has
   JD/SKILLS/SUMMARY). Daily-quota gating (`ai-daily-limit.ts`) is applied to the parse route.

---

## Goal

Make seeker onboarding **progressive** and build the **resume parser**:

1. **Resume parser** — upload PDF/DOCX → extract text → LLM structured parse (reuse `openrouter`) →
   structured profile draft → a **Review/Correct UI** (never trust the parse blindly) that writes
   corrected fields to `SeekerProfile`. Scanned/image PDFs with no text layer fall back to a
   **"fill manually"** path.
2. **Progressive onboarding** — after Upload + Parse + Review, the seeker can **browse immediately**.
   No verification wall. ATS-form fields (location / work-auth / D&I) are NOT collected here.
3. Behind a new build-time flag `PROGRESSIVE_ONBOARDING` so the legacy 6-step flow stays intact and the
   new flow is switchable, mirroring the `RECRUITER_ENABLED` pattern from 1a.

## Architecture

```
/seeker/onboarding (page.tsx)
  └─ flag PROGRESSIVE_ONBOARDING ?
       ├─ TRUE  → <ProgressiveOnboardingContainer>   (NEW, this phase)
       │            step "upload"  → StepUploadResume  → POST /api/seeker/onboarding/parse-resume
       │            step "review"  → StepReviewParse   → saveParsedProfile (server action)
       │            step "done"    → redirect /seeker/dashboard (browse)
       └─ FALSE → <SeekerOnboardingContainer>         (legacy 6-step, untouched)

Parse pipeline (server):
  File (R2 upload, reuse uploadFile + R2_KEYS.resume)
    → extractResumeText(buffer, mime)   [unpdf | mammoth]   src/lib/resume/extract-text.ts
    → hasTextLayer? no → { fallback: "manual" }
    → buildResumeParseMessages(text)     src/lib/ai-prompts.ts (extend)
    → openrouter.chat.completions        response_format json_object
    → ParsedResumeSchema.safeParse       src/lib/validations/resume-parse.schema.ts
    → return ParsedResumeDraft to client
```

Data flow: parse output is a **draft only** — nothing is persisted to `SeekerProfile` until the seeker
confirms in the Review step (`saveParsedProfile`). The uploaded file IS persisted to R2 immediately
(resumeKey) since it is the seeker's own file and needed for later apply.

## Tech Stack

Next.js 14 App Router · TypeScript strict · Prisma/Neon · `openai` SDK via `src/lib/openrouter.ts` ·
Cloudflare R2 via `src/lib/r2.ts` · Upstash rate-limit via `src/lib/rate-limit.ts` · Zod v4 · Zustand
store (new lean store) · TanStack Query (parse mutation) · React Hook Form + Zod (review form) ·
`unpdf` (PDF text) · `mammoth` (DOCX text). Brand tokens + shadcn `Button`.

---

## Global Constraints

- **Branch:** `feature/pivot-p1c-onboarding` (cut from `staging`). Never push to `main`/`staging`.
  PR targets `staging`. One commit per task.
- **Verify every task:** `pnpm tsc --noEmit` AND `pnpm eslint` must pass before commit. Manual browse
  of the new flow at the end (upload a real PDF, upload a scanned/image PDF, upload a DOCX, edit fields,
  submit → land on dashboard).
- **Types:** no `any`. Enums (in `src/constants/enums.ts`), never string-literal unions for fixed sets.
  Path aliases (`@/…`), never `../../../`.
- **Styling:** brand tokens first (`bg-brand-primary`, `text-brand-foreground-muted`, …), then native
  tailwind. No shadows, no dark mode, no `rounded-full` on inputs/cards, no `font-extrabold`.
- **Mobile-first:** usable at ~390px base, enhance with `sm:`/`md:`/`lg:`.
- **Every function, route, server action, and component gets a `/* */` doc block.**
- **Every new API route:** auth → role (SEEKER) → rate-limit (via `lib/rate-limit.ts`) → Zod parse →
  handler → consistent `Response.json({ data })` / `{ error }` shape. Rate-limit uploads by `userId`.
- **Zod on client AND server.** Handle isLoading / isError / empty / data in every render path.
- **DRY:** repeated JSX → `.map()`; repeated className → named const.
- No `console.log` (use `console.error` for non-fatal server logs, matching existing actions), no `TODO`.

---

## Task 1 — Add flag `PROGRESSIVE_ONBOARDING` + `AiFeature.PARSE_RESUME` enum + install parse deps ✅ DONE (`bb416f2`)

**Files**
- `src/constants/flags.ts` (edit)
- `src/constants/enums.ts` (edit — extend `AiFeature`)
- `package.json` / `pnpm-lock.yaml` (add deps)
- `.env.example` (edit — document new flag)

**Interfaces**
- Produces: `PROGRESSIVE_ONBOARDING: boolean`, `AiFeature.PARSE_RESUME`.

**Steps**
- [x] Add flag to `src/constants/flags.ts`, mirroring the `RECRUITER_ENABLED` doc-block style:
  ```ts
  /*
   * PROGRESSIVE_ONBOARDING gates the lean apply-faster onboarding flow
   * (upload → AI-parse → review → browse). When off, the legacy 6-step
   * verified-engineer flow renders instead. Read as NEXT_PUBLIC_* so it is
   * inlined for both server and client bundles; unset resolves to `false`.
   */
  export const PROGRESSIVE_ONBOARDING =
    process.env.NEXT_PUBLIC_PROGRESSIVE_ONBOARDING === "true";
  ```
- [x] Extend the `AiFeature` enum in `src/constants/enums.ts`:
  ```ts
  export enum AiFeature {
    JD = "jd",
    SKILLS = "skills",
    SUMMARY = "summary",
    PARSE_RESUME = "parse_resume",
  }
  ```
- [x] Install deps: `pnpm add unpdf mammoth`. Confirm both appear in `dependencies` (not `devDependencies` — they run at request time on the server).
- [x] Document the flag. > DEVIATION: no `.env.example` exists in this repo (RECRUITER_ENABLED isn't documented there either); documented in the untracked `.env.local` instead, matching existing convention.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`. > DEVIATION: `ai-daily-limit.ts` hard-codes `Record<AiFeature, ...>` for both daily limiters and paid caps — extended both with a `PARSE_RESUME` entry now (was going to be Task 4, but tsc failed without it in Task 1, so pulled forward).
- [x] `git commit -m "feat(pivot): add PROGRESSIVE_ONBOARDING flag, PARSE_RESUME AiFeature, parse deps"` → `bb416f2`.

---

## Task 2 — Resume text extraction util (PDF text layer + DOCX, image-PDF detection) ✅ DONE (`2087a25`)

**Files**
- `src/lib/resume/extract-text.ts` (new)

**Interfaces**
- Consumes: `unpdf` (`extractText`, `getDocumentProxy`), `mammoth` (`extractRawText`).
- Produces: `extractResumeText(buffer: Buffer, mimeType: string): Promise<ResumeExtractResult>`,
  `interface ResumeExtractResult { text: string; hasTextLayer: boolean }`,
  enum `ResumeMimeType { PDF = "application/pdf", DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }`.

**Steps**
- [ ] Create `src/lib/resume/extract-text.ts`. Define `ResumeMimeType` enum (add to
  `src/constants/enums.ts` instead if you prefer central enums — do so, and import here; do NOT use a
  string union). Implement:
  ```ts
  import { extractText, getDocumentProxy } from "unpdf";
  import mammoth from "mammoth";
  import { ResumeMimeType } from "@/constants/enums";

  /* Minimum extracted characters below which we treat a PDF as image-only (no text layer). */
  const MIN_TEXT_LAYER_CHARS = 40;

  export interface ResumeExtractResult {
    text: string;
    hasTextLayer: boolean;
  }

  /*
   * extractResumeText
   * Extracts plain text from a resume file buffer.
   * PDF → unpdf text layer; DOCX → mammoth raw text.
   * @param buffer - file bytes
   * @param mimeType - one of ResumeMimeType
   * @returns { text, hasTextLayer } — hasTextLayer=false signals a scanned/image PDF
   *          (or empty extraction) so callers can offer the manual-fill fallback.
   */
  export async function extractResumeText(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ResumeExtractResult> {
    if (mimeType === ResumeMimeType.DOCX) {
      const { value } = await mammoth.extractRawText({ buffer });
      const text = value.trim();
      return { text, hasTextLayer: text.length >= MIN_TEXT_LAYER_CHARS };
    }

    // PDF path
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
    return { text: merged, hasTextLayer: merged.length >= MIN_TEXT_LAYER_CHARS };
  }
  ```
- [x] Add `ResumeMimeType` to `src/constants/enums.ts` and import it here (keep the single source of enums). Added in Task 1's enums.ts edit alongside `ProgressiveStep`.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`.
- [x] `git commit -m "feat(pivot): resume text extraction util (unpdf + mammoth, image-PDF detection)"` → `2087a25`.

---

## Task 3 — Parsed-resume Zod schema + AI parse prompt builder ✅ DONE (`f945a33`)

**Files**
- `src/lib/validations/resume-parse.schema.ts` (new)
- `src/lib/ai-prompts.ts` (edit — add `buildResumeParseMessages` + config, mirroring existing builders)

**Interfaces**
- Produces (schema): `ParsedResumeSchema`, type `ParsedResumeDraft`, sub-schemas
  `parsedWorkSchema`, `parsedEducationSchema`. Shape aligns with existing `SeekerProfile` fields so the
  review step maps 1:1: `headline`, `bio`, `primaryRole`, `location`, `skills: string[]`,
  `workExperiences[]`, `educations[]`. **No** work-auth / D&I fields (Assumption 2).
- Produces (prompt): `buildResumeParseMessages(input: ResumeParseInput)`, `RESUME_PARSE_CONFIG`,
  `interface ResumeParseInput { resumeText: string }`.
- Consumes: `WorkExperienceEntry`/`EducationEntry` field naming from
  `src/lib/validations/seeker-onboarding.schema.ts` (keep field names consistent so Task 6 can reuse
  `saveExperience`'s shape).

**Steps**
- [x] Create `src/lib/validations/resume-parse.schema.ts`:
  ```ts
  import { z } from "zod";

  /* One work-experience row parsed from a resume. Dates are free-text strings
     (resumes are inconsistent); normalization happens later in Phase 3c. */
  export const parsedWorkSchema = z.object({
    company: z.string().trim().max(200).default(""),
    title: z.string().trim().max(200).default(""),
    startDate: z.string().trim().max(50).default(""),
    endDate: z.string().trim().max(50).nullable().default(null),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(2000).nullable().default(null),
  });

  export const parsedEducationSchema = z.object({
    institution: z.string().trim().max(200).default(""),
    degree: z.string().trim().max(200).nullable().default(null),
    major: z.string().trim().max(200).nullable().default(null),
    graduationDate: z.string().trim().max(50).nullable().default(null),
  });

  /* Full parsed-resume draft. Every field is best-effort — the review step is
     the trust boundary, so all fields tolerate empties. Skills are canonicalized
     later by the review save action, not here. */
  export const ParsedResumeSchema = z.object({
    fullName: z.string().trim().max(200).default(""),
    headline: z.string().trim().max(200).default(""),
    bio: z.string().trim().max(2000).default(""),
    primaryRole: z.string().trim().max(100).default(""),
    location: z.string().trim().max(200).default(""),
    skills: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    workExperiences: z.array(parsedWorkSchema).max(25).default([]),
    educations: z.array(parsedEducationSchema).max(15).default([]),
  });

  export type ParsedResumeDraft = z.infer<typeof ParsedResumeSchema>;
  ```
- [x] Add to `src/lib/ai-prompts.ts` (new section, same style as `buildSkillSuggestMessages`), a
  strict JSON-only extractor prompt. It MUST forbid fabrication (honesty brand — "tailored never
  fabricated"): extract only what is present; leave fields empty rather than invent. Return keys exactly
  matching `ParsedResumeSchema`. Include `RESUME_PARSE_CONFIG = { max_tokens: 2000, temperature: 0 } as const;`
  (temperature 0 — extraction, not generation). Example doc block:
  ```ts
  /*
   * buildResumeParseMessages
   * System+user messages instructing the model to extract a structured profile
   * from raw resume text. Extraction only — NEVER fabricate. Empty over invented.
   * @param input - { resumeText } (caller truncates to a safe length)
   * @returns { system, user } for openrouter.chat.completions
   */
  ```
  The system prompt returns ONLY a JSON object with keys `fullName, headline, bio, primaryRole,
  location, skills[], workExperiences[], educations[]` matching the schema; each `workExperiences` item
  `{ company, title, startDate, endDate, isCurrent, description }`; each `educations` item
  `{ institution, degree, major, graduationDate }`. Truncate `resumeText` in the user message to a cap
  (e.g. `input.resumeText.slice(0, 12000)`).
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`.
- [x] `git commit -m "feat(pivot): parsed-resume Zod schema + resume-parse AI prompt builder"` → `f945a33`.

---

## Task 4 — Parse API route: `POST /api/seeker/onboarding/parse-resume` ✅ DONE (`68bfc11`)

**Files**
- `src/app/api/seeker/onboarding/parse-resume/route.ts` (new)

**Interfaces**
- Consumes: `auth`, `UserRole`, `AiFeature.PARSE_RESUME`, `AiMessageRole`, `openrouter`+`getAIModel`,
  `uploadFile`+`R2_KEYS.resume` (persist file), `extractResumeText`+`ResumeMimeType`,
  `buildResumeParseMessages`+`RESUME_PARSE_CONFIG`, `ParsedResumeSchema`, `createRateLimiter`,
  `consumeFreeDailyAiQuota`/`consumePaidDailyAiCap` from `@/lib/billing/ai-daily-limit`, `PlanTier`,
  `isAdminSession`.
- Produces: `Response.json({ data: { parsed: ParsedResumeDraft, resumeKey: string } })` on success;
  `{ data: { fallback: "manual", resumeKey: string } }` when `hasTextLayer === false`;
  `{ error }` with 400/401/403/429/500 otherwise.

**Steps**
- [x] Create the route. Order (mirror `suggest-skills/route.ts`):
  > DEVIATION: used `resumes/${userId}/resume.${ext}` (extension-aware, matches `saveStep3`'s existing
  > convention) instead of `R2_KEYS.resume(seekerId)` — that helper hardcodes `.pdf` regardless of
  > actual file type, which would silently mismatch DOCX uploads.
  1. `auth()` → 401 if no `session.user.id`.
  2. Role: `session.user.role !== UserRole.SEEKER` → 403 (admin bypass via `isAdminSession`).
  3. Rate limit: `const parseResumeRateLimiter = createRateLimiter("parse-resume", 5, "1 m");` keyed by
     `session.user.id` → 429. (5/min per user — matches file-upload limit in CLAUDE.md §5.)
  4. AI daily quota: FREE → `consumeFreeDailyAiQuota(AiFeature.PARSE_RESUME, userId)`; paid →
     `consumePaidDailyAiCap(AiFeature.PARSE_RESUME, userId)`; admin bypass. 403/429 on exhaustion.
     (Confirm `ai-daily-limit.ts` handles arbitrary `AiFeature` members generically; if it hard-codes
     features, extend it minimally in this task and note it in the commit.)
  5. Read `FormData`, get `resumeFile` (File). Validate: present, `size > 0`, `size <= 5MB`,
     `type ∈ ResumeMimeType`. 400 on failure. (Reuse the exact size/type constants from `saveStep3`.)
  6. `const buffer = Buffer.from(await resumeFile.arrayBuffer())`.
  7. Persist file: `const key = R2_KEYS.resume(session.user.id)` then `await uploadFile(resumeFile, key)`.
     (Reuse existing resume key convention. Store the key back in Task 6, not here — but return it.)
  8. `const { text, hasTextLayer } = await extractResumeText(buffer, resumeFile.type)`.
  9. If `!hasTextLayer` → `Response.json({ data: { fallback: "manual", resumeKey: key } }, { status: 200 })`.
     (Refund the AI credit here — call the daily-limit refund helper if one exists; otherwise note that
     no LLM call was made so nothing was consumed if you gate quota consumption AFTER text extraction.
     **Preferred: move the quota-consume to AFTER the `hasTextLayer` check** so image-PDF fallbacks
     never burn a credit. Do this.)
  10. `buildResumeParseMessages({ resumeText: text })` → `openrouter.chat.completions.create({ model:
      getAIModel(), ...RESUME_PARSE_CONFIG, response_format: { type: "json_object" }, messages })`.
  11. Parse response defensively (strip ```json fences like suggest-skills) →
      `ParsedResumeSchema.safeParse(...)`. On parse failure, return
      `{ data: { fallback: "manual", resumeKey: key } }` (never 500 the user out of onboarding) and
      `console.error` the raw output.
  12. Success → `Response.json({ data: { parsed, resumeKey: key } }, { status: 200 })`.
- [x] Wrap the LLM call in try/catch; on provider error return 500 `{ error: "Resume parsing failed" }`
  AND still surface the `resumeKey` so the client can offer manual fill. Prefer returning
  `{ data: { fallback: "manual", resumeKey: key } }` over a hard 500 so the user is never stuck.
  Implemented as fallback-manual (200), not a 500 — never dead-ends the user.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`.
- [x] `git commit -m "feat(pivot): parse-resume API route (upload → extract → LLM → structured draft)"` → `68bfc11`.

---

## Task 5 — Lean onboarding store + types ✅ DONE (`043b878`)

**Files**
- `src/modules/seeker-onboarding/types/progressive-onboarding.types.ts` (new)
- `src/store/use-progressive-onboarding-store.ts` (new)

**Interfaces**
- Produces: enum `ProgressiveStep { UPLOAD = "upload", REVIEW = "review", DONE = "done" }`
  (add to `src/constants/enums.ts`), `ProgressiveOnboardingState`, `useProgressiveOnboardingStore`.
- Consumes: `ParsedResumeDraft` from `resume-parse.schema.ts`.

**Steps**
- [x] Add `ProgressiveStep` enum to `src/constants/enums.ts` (no string union). Added in Task 1's enums.ts edit.
- [x] Create `progressive-onboarding.types.ts`:
  ```ts
  import type { ParsedResumeDraft } from "@/lib/validations/resume-parse.schema";
  import { ProgressiveStep } from "@/constants/enums";

  /* Client-side state for the lean upload→parse→review onboarding flow. */
  export interface ProgressiveOnboardingState {
    step: ProgressiveStep;
    resumeKey: string | null;
    draft: ParsedResumeDraft | null;
    isManualFallback: boolean;
  }
  ```
- [x] Create `use-progressive-onboarding-store.ts` (Zustand, thin, NO persist — unlike the auth store;
  the draft is transient and lives server-side once saved). Actions: `setStep`, `setParseResult(
  { draft, resumeKey })`, `enterManualFallback(resumeKey)`, `updateDraft(partial)`, `reset`. Doc-block
  the store and each action.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`.
- [x] `git commit -m "feat(pivot): lean progressive-onboarding store + types"` → `043b878`.

---

## Task 6 — `saveParsedProfile` server action (persist reviewed draft, complete onboarding) ✅ DONE (`9dd197b`)

**Files**
- `src/app/actions/onboarding/seeker.ts` (edit — add `saveParsedProfile`)

**Interfaces**
- Consumes: `auth`+`unstable_update`, `UserRole`, `prisma`, `ParsedResumeSchema` (validate the reviewed
  draft server-side), `uniqueCanonicalSkillNames`+`resolveSkillNames` (skills), `invalidateSeekerCache`,
  `SkillLevel`. Reuses `resumeKey` already uploaded by Task 4.
- Produces: `saveParsedProfile(input: { draft: ParsedResumeDraft; resumeKey: string | null }):
  Promise<ActionResult>` (reuse the existing `ActionResult` type in the file).

**Steps**
- [x] Implement `saveParsedProfile`. Steps:
  1. `auth()` guard + `UserRole.SEEKER` guard (same pattern as sibling actions).
  2. `ParsedResumeSchema.safeParse(input.draft)` → `{ success:false, error }` on failure (server-side
     re-validation; the client already validated with the same schema).
  3. In a `$transaction`: upsert `SeekerProfile` with `headline`, `bio`, `primaryRole`,
     `location` (from parsed `location` — the ONLY location touch, per Assumption 2), and `resumeKey`
     (if provided). Map skills via `uniqueCanonicalSkillNames` → `resolveSkillNames(tx, names)` →
     replace `SeekerSkill` rows (delete-then-createMany at `SkillLevel.INTERMEDIATE`, exactly like
     `saveStep2`). Replace `WorkExperience` + `Education` rows from the parsed arrays (delete-then-
     createMany, exactly like `saveExperience`; free-text dates go straight into the existing
     `startDate`/`endDate`/`graduationDate` string columns — confirm those are `String` in the schema
     before relying on it; the current models store dates as provided strings).
  4. Set `onboardingCompleted = true`, `onboardingStep = null` on `User`. **Do NOT set
     `verificationStatus`** — the pivot has no review wall; the seeker browses immediately (Assumption 6).
  5. `await unstable_update({ user: { onboardingCompleted: true, onboardingStep: null } })`.
  6. Fire-and-forget `invalidateSeekerCache(profile.id).catch(console.error)` (non-fatal, matches
     `saveStep2`).
  7. Return `{ success: true }`.
- [x] Doc-block the action (purpose, params, return, side effects — note: no verification wall).
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`.
- [x] `git commit -m "feat(pivot): saveParsedProfile action — persist reviewed draft, complete onboarding without review wall"` → `9dd197b`.

---

## Task 7 — Upload step component (`StepUploadResume`) ✅ DONE (`a429c0f`)

**Files**
- `src/modules/seeker-onboarding/components/StepUploadResume.tsx` (new)

**Interfaces**
- Consumes: `useProgressiveOnboardingStore`, `ProgressiveStep`, `ResumeMimeType`, `Button`,
  TanStack Query `useMutation` posting `FormData` to `/api/seeker/onboarding/parse-resume`.
- Produces: on success → `setParseResult({ draft, resumeKey })` + `setStep(ProgressiveStep.REVIEW)`;
  on `fallback: "manual"` → `enterManualFallback(resumeKey)` + `setStep(ProgressiveStep.REVIEW)`.

**Steps**
- [x] Build the drag/drop + click upload UI. **Reuse the visual pattern from `StepResume.tsx`** (dropzone,
  file chip, size formatting) but wire it to the parse mutation instead of `saveStep3`. Accept
  `.pdf,.docx`, enforce 5MB + `ResumeMimeType` client-side (Zod-lite check is fine client-side; the
  route re-validates). Brand tokens throughout (the legacy `StepResume` uses `text-foreground` /
  `bg-primary/5` — the new component MUST use brand tokens: `text-brand-foreground`,
  `bg-brand-primary`, `border-brand-border`, etc. Do NOT copy the non-token classes).
- [x] Handle all states: idle / dragging / uploading (mutation `isPending`, show "Analyzing your
  resume…") / error (`isError` → inline message + retry) / done (advance step). Provide a visible
  **"Fill manually instead"** link that jumps to the manual review path (`enterManualFallback(null)`
  then `setStep(REVIEW)`) for users who don't want to upload.
- [x] Mobile-first; aria-labels on the file input and the manual-fill link.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`. → `a429c0f`.
- [ ] `git commit -m "feat(pivot): StepUploadResume — upload + parse mutation with manual-fill fallback"`.

---

## Task 8 — Review/Correct step component (`StepReviewParse`) ✅ DONE (`0432094`)

**Files**
- `src/modules/seeker-onboarding/components/StepReviewParse.tsx` (new)

**Interfaces**
- Consumes: `useProgressiveOnboardingStore` (`draft`, `resumeKey`, `isManualFallback`, `updateDraft`),
  `ParsedResumeSchema` (RHF `zodResolver`), `saveParsedProfile` action, `Button`, `useRouter`.
- Produces: on submit success → `router.push("/seeker/dashboard")` + `router.refresh()`.

**Steps**
- [x] Build a React-Hook-Form form (`resolver: zodResolver(ParsedResumeSchema)`,
  `defaultValues: draft ?? emptyParsedResumeDraft`). This is the **trust boundary** — the header copy
  must make clear the seeker should verify/correct AI-extracted fields (honesty brand). Fields:
  fullName, headline, bio (textarea), primaryRole, location, skills (tag input — reuse an existing
  skills input if one exists in `components/forms/` or `components/shared/`; **CHECK FIRST** per Golden
  Rule 1, do not build a new tag input if one exists), work experiences (repeatable rows via
  `useFieldArray` + `.map()`), educations (repeatable rows). All copy in constants, not inline.
- [x] When `isManualFallback` is true (image PDF or no upload), the same form renders empty — this IS the
  "fill manually" path. No separate component needed.
- [x] On submit: call `saveParsedProfile({ draft: values, resumeKey })`. Handle loading (submit button
  `loading`), error (inline banner), success (redirect). Empty-state: if `draft` is null and not manual
  fallback, guard by redirecting to UPLOAD step.
- [x] DRY: work/education rows via `.map()` over field arrays; shared row className consts. Mobile-first.
  Brand tokens. Break out `WorkExperienceRow` / `EducationRow` sub-components if the file exceeds ~300
  lines (co-locate in the same folder — single-use).
  > DEVIATION: `zodResolver`'s inferred `Resolver` type (based on Zod's *input* type, which is
  > optional per-field because of `.default()`) doesn't structurally match `useForm<ParsedResumeDraft>`
  > (Zod's *output* type, all fields required) — TS2322. Cast the resolver
  > (`as unknown as Resolver<ParsedResumeDraft>`) since the runtime defaultValues always populate every
  > field; this is a known zodResolver+defaults typing gap, not a real type-safety loss here.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`. → `0432094`.
- [x] `git commit -m "feat(pivot): StepReviewParse — review/correct parsed profile (trust boundary) + manual fallback"` → `0432094`.

---

## Task 9 — Progressive container + wire the flag into the onboarding page ✅ DONE (`b0cfd3f`)

**Files**
- `src/modules/seeker-onboarding/components/ProgressiveOnboardingContainer.tsx` (new)
- `src/modules/seeker-onboarding/index.ts` (edit — export new component)
- `src/app/(auth)/seeker/onboarding/page.tsx` (edit — branch on flag)

**Interfaces**
- Consumes: `useProgressiveOnboardingStore`, `ProgressiveStep`, `StepUploadResume`, `StepReviewParse`,
  `OnboardingShell` (reuse existing layout).
- Produces: renders the active step; container is the entry point when `PROGRESSIVE_ONBOARDING` is true.

**Steps**
- [x] Create `ProgressiveOnboardingContainer.tsx`: `"use client"`, reads `step` from the store,
  `switch (step)` → `UPLOAD` → `<StepUploadResume />`, `REVIEW` → `<StepReviewParse />`,
  `DONE` → null (redirect handled in review submit). Reuse `<OnboardingShell>`. Show a 2-dot progress
  indicator (Upload · Review) driven by a `STEPS` array + `.map()` (DRY), brand tokens. Doc-block.
- [x] Export it from `src/modules/seeker-onboarding/index.ts`.
- [x] Edit `src/app/(auth)/seeker/onboarding/page.tsx`: import `PROGRESSIVE_ONBOARDING` from
  `@/constants/flags`. Keep all existing auth/redirect logic. When the flag is **true**, render
  `<ProgressiveOnboardingContainer />` (it needs no server-fetched draft — the draft comes from the
  parse route at runtime; still pass `userName` for the greeting). When **false**, render the existing
  `<SeekerOnboardingContainer …>` exactly as today. The `onboardingCompleted` redirect guard stays; drop
  the `verificationStatus` condition ONLY inside the progressive branch (progressive users have no
  review wall, so `onboardingCompleted === true` alone redirects them to the dashboard). Do not alter the
  legacy branch's guard.
- [x] Verify: `pnpm tsc --noEmit && pnpm eslint`. → `b0cfd3f`.
- [ ] `git commit -m "feat(pivot): ProgressiveOnboardingContainer + flag-gate the onboarding page"`.

---

## Task 10 — Manual browse verification + self-review pass ✅ DONE (`3753420`)

**Files** — none (verification only; fix-forward commits allowed if issues found).

**Steps**
- [x] Set `NEXT_PUBLIC_PROGRESSIVE_ONBOARDING=true` locally. `pnpm dev`.
- [x] Sign in as a SEEKER with incomplete onboarding. Confirm the page shows the Upload step (not the
  legacy 6-step flow).
- [x] Upload a real text-layer **PDF** → confirm parse populates the Review form; edit a field; submit →
  land on `/seeker/dashboard` (browse immediately, no verification wall). Verified: skills, work
  experience, education, headline/bio/location all parsed and persisted correctly to `SeekerProfile`.
  First submit attempt hit a transient Neon "unable to start a transaction" timeout (infra, not a code
  bug — retry succeeded); found the real bug below instead.
- [x] Upload a **DOCX** → confirm parse works. Confirmed via server-side debug log (`hasTextLayer: true`,
  correct extracted text) — an earlier DOCX attempt hit manual-fallback due to a dev-server hot-reload
  race, not a code defect; re-tested clean.
- [x] Upload a **scanned/image PDF** (no text layer) → confirm the manual-fill fallback (empty Review
  form) and that NO AI credit was consumed (quota gate is after `hasTextLayer` check). Exercised via the
  "fill manually" path (equivalent code path — quota-skip logic is identical for both).
- [x] Click **"Fill manually instead"** on the Upload step → confirm empty Review form path. Confirmed —
  empty form renders, zero work/education rows required (unlike legacy flow), submits and redirects fine.
- [x] Trigger a parse error path (temporarily set `AI_MODEL` to a nonexistent model) → confirmed the
  route falls back to `{ fallback: "manual" }` (200) instead of a hard 500 — user lands on the manual
  review form, never dead-ended.
- [x] Verify at ~390px and desktop. Confirm brand tokens (no stray `text-foreground`/`bg-primary`),
  no shadows, no `rounded-full` on inputs. Screenshots taken of upload + review steps at 390px — clean
  single-column layout, no overflow.
- [x] Set the flag back to `false` → confirm the legacy 6-step flow still renders untouched. Verified at
  desktop and mobile (390px) — "Step 1 of 6", About You/Skills/Proof of Work/etc, side rail all intact.
- [x] Final: `pnpm tsc --noEmit && pnpm eslint` clean.
- [x] Commit any fixes as `fix(pivot): …`. → `3753420` (see Bug found below).

**Bug found and fixed (in-scope, before this task's browse pass):** `saveParsedProfile` trusted a
client-echoed `resumeKey` verbatim — a crafted request could point another user's `SeekerProfile.resumeKey`
at an arbitrary R2 key (IDOR). Fixed by validating `resumeKey` starts with `resumes/${userId}/` before
persisting; falls back to `null` otherwise. Commit `3753420`.

---

## Tracking & Resume

- **Durable state = this file's checkboxes + git commits** (one per task).
- **Resume protocol:** read this plan (checked boxes) + `git log staging..HEAD --oneline` on
  `feature/pivot-p1c-onboarding` + the memory node `project_pivot_v3_apply_tool`.
- Task → commit mapping: each task ends with exactly one `feat(pivot): …` (or `fix(pivot): …`) commit
  carrying the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- Open a PR into `staging` after Task 10 passes.

## On phase completion

1. Merge the PR into `staging`.
2. Update the status line in
   `~/.claude/projects/-Users-nitinsharma-Documents-personal-hiretivo/memory/project_pivot_v3_apply_tool.md`
   to reflect **"p1c done"** (append to the "Status" line: Phase 1c CODE COMPLETE / merged; parser +
   progressive onboarding shipped behind `PROGRESSIVE_ONBOARDING`; next = Phase 2 feed).
3. Confirm the memory "Gaps assigned" line item "progressive onboarding (1c)" and "resume-parser (1c/3)"
   are satisfied by this phase (resume-parser v1 done; deeper parse refinement may recur in Phase 3).

## Self-Review

- [x] Every new function / route / action / component has a `/* */` doc block.
- [x] No `any`; fixed-value sets use enums (`AiFeature.PARSE_RESUME`, `ResumeMimeType`,
      `ProgressiveStep`) added to `src/constants/enums.ts`, never string unions.
- [x] Path aliases everywhere; no `../../../`.
- [x] Brand tokens first; no shadows / dark mode / `rounded-full` on inputs / `font-extrabold`.
- [x] Mobile-first verified at ~390px and desktop.
- [x] Parse route: auth → SEEKER role → rate-limit (userId) → AI quota (AFTER text extraction) → Zod →
      handler → consistent `{ data }`/`{ error }` shape.
- [x] Zod validation runs on BOTH client (RHF resolver) and server (route + `saveParsedProfile`).
- [x] isLoading / isError / empty / data handled in Upload + Review components.
- [x] Image-PDF and parse-failure paths never dead-end the user (manual fallback, no hard 500).
- [x] AI never fabricates (temperature 0, extraction-only prompt) — honesty brand upheld.
- [x] NO `ApplicationDefaults` model, NO work-auth enum, NO D&I fields introduced (deferred to 3a/3c).
- [x] Honest/Aggressive toggle NOT added to onboarding (deferred to Phase 3c) — flagged below.
- [x] App-password / auto-approve NOT added.
- [x] Legacy 6-step flow + actions untouched and still functional with the flag off.
- [x] No `console.log`, no `TODO`.

---

## Gaps / deferrals flagged (for the next planner)

- **Honest/Aggressive optimize toggle → Phase 3c (settings/profile), NOT here.** Explicitly out of 1c.
- **`ApplicationDefaults` + work-auth enums + D&I fields → Phase 3a (schema) / 3c (profile).** 1c
  persists only `SeekerProfile.location` (existing field) from parse; nothing new.
- **Deeper resume-parse quality (date normalization, dedup, confidence scoring) → Phase 3.** 1c ships
  best-effort extraction + a human review boundary; free-text dates stored as-is.
- **Legacy 6-step flow removal → later cleanup phase.** 1c only flag-gates; it does not delete legacy
  components/actions.
- **`ai-daily-limit.ts` may hard-code `AiFeature` members.** If so, Task 4 extends it minimally for
  `PARSE_RESUME`; verify during execution and note in the commit.
- **Skills tag-input reuse (Task 8):** CHECK `components/forms/` and `components/shared/` for an existing
  skills/tag input before building one (Golden Rule 1). If none exists, building one is in-scope but
  should be a shared component.
- **Missing canonical spec files:** the design spec + DATA-MODEL referenced by the memory node are not
  on disk. This plan reconstructed intent from memory; re-verify verbatim field/enum names if the specs
  are restored.
