# Pivot Data Model — Authoritative Schema Reference

**Date:** 2026-07-01 (regenerated 2026-07-02 after docs/ wipe — content identical)
**Scope:** Every new/changed Prisma model, field, enum, and relation for the apply-faster pivot. Phases 3a, 5, and 8 all touch schema — this is the single source they reference so migrations don't drift.
**Companion:** `2026-07-01-apply-faster-pivot-design.md` (decisions), per-phase plans in `../plans/`.

> Migration rule (memory `project_db_schema_workflow`): `migrate dev` on DB1 (local/staging), CI `migrate deploy` to DB2 (prod). P2022 = drift. Never edit an applied migration; add a new one.

---

## Current state (verified 2026-07-01, do NOT rebuild)

- `Application` — has `id, jobId, seekerId, status(AppStatus @default APPLIED), matchScore Int, coverLetter String? @db.Text, aiSummary String?, job, seeker, interviews[], createdAt, updatedAt`. **`@@unique([jobId, seekerId])` already enforces feed-job dedup.**
- `SeekerProfile` — rich (headline, bio, location, yearsExperience, workPreference, resumeKey, salary, links, skills[], workExperiences[], educations[], …). Add relations, don't duplicate fields.
- `WorkExperience`, `Education` — dates are freeform `"MM/YYYY"` strings, not DateTime. Follow that convention.
- `SeekerSkill` — join to `Skill`, `@@unique([seekerProfileId, skillId])`.
- Enum `AppStatus` = APPLIED, REVIEWING, INTERVIEW, OFFER, HIRED, REJECTED (in `prisma/schema.prisma`).
- Enum `AiFeature` = JD, SKILLS, SUMMARY (in `src/constants/enums.ts`).
- Enum `PlanTier` = FREE, STARTER, GROWTH, SCALE (in `src/constants/enums.ts`).
- Enum `WorkType` (in enums.ts). `Job.locationClass String?` = `worldwide|us-only|emea|india|onsite`.

---

## Phase 3a — new models + enums

### New enums (`src/constants/enums.ts` + Prisma where persisted)

```ts
// Country-agnostic work authorization (global-first — NOT a US-visa list)
export enum WorkAuthStatus {
  CITIZEN = "CITIZEN",
  PERMANENT_RESIDENT = "PERMANENT_RESIDENT",
  WORK_VISA = "WORK_VISA",
  NEEDS_SPONSORSHIP = "NEEDS_SPONSORSHIP",
  STUDENT = "STUDENT",
  OTHER = "OTHER",
}

// Optional US-EEO self-ID (shown ONLY for US jobs). "Prefer not" is explicit.
export enum SelfIdGender { MALE="MALE", FEMALE="FEMALE", NONBINARY="NONBINARY", PREFER_NOT="PREFER_NOT" }
export enum SelfIdAnswer { YES="YES", NO="NO", PREFER_NOT="PREFER_NOT" }
```

### `Certification` (1:N SeekerProfile)

```prisma
model Certification {
  id              String        @id @default(cuid())
  seekerProfileId String
  seekerProfile   SeekerProfile @relation(fields: [seekerProfileId], references: [id], onDelete: Cascade)

  name       String
  issuer     String?
  issueDate  String?   // "MM/YYYY" — follow WorkExperience convention
  expiryDate String?   // "MM/YYYY" — null = no expiry
  credentialUrl String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([seekerProfileId])
}
```
Add `certifications Certification[]` to `SeekerProfile`.

### `ApplicationDefaults` (1:1 SeekerProfile) — the reusable ATS-form-fill payload

```prisma
model ApplicationDefaults {
  id              String        @id @default(cuid())
  seekerProfileId String        @unique
  seekerProfile   SeekerProfile @relation(fields: [seekerProfileId], references: [id], onDelete: Cascade)

  // Location (ATS address fields)
  addressLine String?
  city        String?
  state       String?
  postalCode  String?
  countryCode String?   // ISO-3166 alpha-2

  // Contact
  phone       String?   // E.164 "+.."
  linkedinUrl String?

  // Work authorization (global)
  workAuth          WorkAuthStatus?
  authorizedCountry String?   // ISO country the auth applies to
  needsSponsorship  Boolean?

  // Preferences (bool toggles; null = unanswered)
  openToOnsite    Boolean?
  willingRelocate Boolean?
  startImmediately Boolean?

  // Voluntary US-EEO self-ID (ENCRYPTED at rest — see PII note). Shown US-only.
  selfIdGender    SelfIdGender?
  selfIdEthnicity String?      // encrypted
  veteranStatus   SelfIdAnswer?
  disabilityStatus SelfIdAnswer?

  additionalNotes String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
Add `applicationDefaults ApplicationDefaults?` to `SeekerProfile`.

**PII note (spec §7 gap 5):** `selfIdEthnicity` + self-ID fields encrypted at rest (app-layer crypto helper, key in env). Account delete cascades (FK `onDelete: Cascade`) + wipes R2 artifacts. D&I fields optional, rendered US-only. **No field-crypto helper exists in src/lib yet** (verified by p3a agent) — contract: `src/lib/crypto/field-crypto.ts`, AES-256-GCM, `FIELD_ENCRYPTION_KEY` env; build in Phase 3c.

**DROPPED from Tsenta:** no `applicationPassword` field (automation-only, Phase 9).

---

## Phase 5 — `Application` extensions + `AppStatus` + `ApplySource`

### New enum `ApplySource` (`src/constants/enums.ts` + prisma)

```ts
export enum ApplySource { FEED = "FEED", PASTED_LINK = "PASTED_LINK" }
```

### `AppStatus` — add GHOSTED

```prisma
enum AppStatus {
  APPLIED
  REVIEWING
  INTERVIEW
  OFFER
  HIRED
  REJECTED
  GHOSTED   // NEW — no employer response after N days
}
```
Kanban columns (Phase 6) map to: Applied=APPLIED, Interviewing=INTERVIEW(+REVIEWING), Rejected=REJECTED, Offer=OFFER(+HIRED), Ghosted=GHOSTED. Feed "Pass" uses existing `DismissedJob`, NOT an AppStatus.

### `Application` — new fields

```prisma
// add to existing model Application:
source            ApplySource @default(FEED)
externalJobUrl    String?     // source ATS apply URL (feed job or pasted link)
tailoredResumeKey String?     // R2 key of the generated ATS-safe PDF
// coverLetter already exists (String? @db.Text) — REUSE, do not add coverLetterText
submittedFormData Json?       // per-field answers used at submit (extension-ready)
keywordStats      Json?       // { requiredMatched, preferredMatched, total } from match.ts
notes             String?  @db.Text   // Phase 6 free-text notes
statusLog         Json?              // Phase 6: [{status, at}] audit trail
```

### Pasted-link dedup (spec §7 gap 4) — schema decision

`jobId` is currently **required** and `@@unique([jobId, seekerId])` covers feed jobs. Pasted links have no `Job` row. **Decision:** make `jobId` nullable and add a URL dedup:

```prisma
jobId    String?   // nullable — PASTED_LINK applications have no Job
// keep @@unique([jobId, seekerId]) for FEED
@@unique([seekerId, externalJobUrl])   // dedup for PASTED_LINK
```
Note: relation `job Job @relation(...)` becomes `job Job? @relation(...)`. Audit all `Application.job` consumers for null-safety when this lands (bug-fix standard: cross-feature impact).

---

## Phase 8 — billing / quota

### `AiFeature` — add tailoring features (`src/constants/enums.ts`)

```ts
export enum AiFeature {
  JD = "jd", SKILLS = "skills", SUMMARY = "summary",   // existing
  RESUME_OPTIMIZE = "resume_optimize",                  // NEW
  COVER_LETTER = "cover_letter",                        // NEW
}
```
(Phase 1c may also add `PARSE_RESUME` for the onboarding parser — same pattern.)

Metering: **1 credit = 1 job tailored** (a wizard run consumes ONE credit covering both RESUME_OPTIMIZE + COVER_LETTER). Extend `lib/billing/ai-daily-limit.ts` with a monthly rolling-window limiter keyed by userId. **Refund on failure:** only decrement after the artifact is saved.

### `PlanTier` — remap decision (NEEDS CONFIRM at Phase 8)

Current values FREE/STARTER/GROWTH/SCALE are wired to Dodo product IDs. Ladder A = FREE/PRO/MAX. Two options:
- **A (recommended, low-risk):** keep enum values, remap meaning — FREE=8/mo, STARTER→"Pro" $9/400, GROWTH→"Max" $19/1000, hide SCALE. UI labels change, enum + Dodo mapping stay. No data migration.
- **B (clean, costly):** rename enum to FREE/PRO/MAX — migration rewrites existing rows + re-map Dodo product IDs + webhook.

Quota grants live in `src/constants/billing.ts` as monthly AI credits (not application counts). Add annual price IDs (10× monthly).

---

## Migration order (one `migrate dev` per phase)

1. **3a:** `Certification`, `ApplicationDefaults` + enums `WorkAuthStatus`, `SelfIdGender`, `SelfIdAnswer`; add SeekerProfile relations. Name: `p3a_certification_application_defaults`.
2. **5:** `AppStatus += GHOSTED`; `ApplySource`; `Application` new fields + `jobId` nullable + new unique index. **Backfill:** existing rows get `source=FEED` (default), `jobId` stays set.
3. **8:** `PlanTier` remap (Option A = no schema migration; billing constants only). AiFeature additions are TS-only (not a DB enum unless persisted).

Each migration: `pnpm prisma migrate dev --name <phase>_<desc>` on DB1 → PR → CI `migrate deploy` to prod. (`migrate dev` needs `SHADOW_DATABASE_URL` per repo setup.)

---

## Enum home rule

Business enums in `src/constants/enums.ts` (TS). DB-persisted enums (`AppStatus`, `WorkAuthStatus`, `SelfIdGender`, `SelfIdAnswer`, `ApplySource`) also declared in `prisma/schema.prisma` and must stay in sync (same members, same casing). `AiFeature`, `PlanTier` are TS-only today — keep that unless a column needs them.
