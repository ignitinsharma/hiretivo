import { z } from "zod";
import { APPLICATION_STATUS_VALUES } from "@/constants/enums";

/* POST /api/seeker/applications — starts a wizard run against a feed job. */
export const createApplicationWizardSchema = z.object({
  jobId: z.cuid(),
});

/*
 * POST /api/seeker/applications — manual entry branch (Section F3). No
 * jobId: the Add-application modal and CSV import both create an
 * ApplySource.MANUAL row from these fields alone. Company + role are the
 * only required fields per the plan; everything else defaults sensibly.
 */
export const manualApplicationSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().min(1).max(200),
  status: z.enum(APPLICATION_STATUS_VALUES).optional(),
  appliedAt: z.iso.datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
  externalJobUrl: z.url().max(500).optional(),
});

/* Mirrors SubmittedFormField (apply.types.ts) — one ATS-form answer. */
const SubmittedFormFieldSchema = z.object({
  fieldKey: z.string().min(1).max(80),
  label: z.string().min(1).max(160),
  value: z.string().max(2000),
});

/* Mirrors KeywordStats (lib/apply/keyword-match.ts) — required/preferred
 * match COUNTS, not name lists (matchedSkills name lists exist only inside
 * KeywordMatchResult, not persisted). */
const KeywordStatsSchema = z.object({
  requiredMatched: z.number().int().min(0),
  preferredMatched: z.number().int().min(0),
  total: z.number().int().min(0),
});

/*
 * PATCH /api/seeker/applications/[id] — partial artifact save as the wizard
 * advances, PLUS the tracker's (Section F2) status transitions. `status` now
 * accepts the full ApplicationStatus enum — the wizard itself only ever
 * writes APPLIED (its created default), while the tracker kanban's
 * drag-and-drop writes any member as the seeker moves a card between
 * columns. The route appends a statusLog entry whenever `status` actually
 * changes value.
 */
export const patchApplicationSchema = z
  .object({
    tailoredResumeKey: z.string().min(1).max(500),
    coverLetter: z.string().trim().max(10_000),
    submittedFormData: z.array(SubmittedFormFieldSchema).max(60),
    keywordStats: KeywordStatsSchema,
    status: z.enum(APPLICATION_STATUS_VALUES),
  })
  .partial();

/* Mirrors ResumeDocument (resume-document.types.ts) — the edited document
 * the wizard renders to PDF at finalize. No shared Zod schema existed yet
 * (parseResumeDocument in ai-prompts.ts validates raw model strings, not a
 * typed request body) — this is the finalize route's own contract. */
const ResumeDocumentSchema = z.object({
  fullName: z.string().min(1).max(120),
  headline: z.string().max(160).optional(),
  contact: z.object({
    email: z.string().email().max(200).optional(),
    location: z.string().max(160).optional(),
    websiteUrl: z.string().url().max(300).optional(),
    linkedinUrl: z.string().url().max(300).optional(),
    githubUrl: z.string().url().max(300).optional(),
  }),
  summary: z.string().max(2000).optional(),
  skillGroups: z
    .array(z.object({ category: z.string().min(1).max(80), skills: z.array(z.string().max(60)).max(60) }))
    .max(20),
  experience: z
    .array(
      z.object({
        company: z.string().max(160),
        title: z.string().max(160),
        startDate: z.string().max(20),
        endDate: z.string().max(20).nullable(),
        isCurrent: z.boolean(),
        bullets: z.array(z.string().max(500)).max(20),
      }),
    )
    .max(30),
  education: z
    .array(
      z.object({
        institution: z.string().max(200),
        degree: z.string().max(160).optional(),
        major: z.string().max(160).optional(),
        graduationDate: z.string().max(20).optional(),
      }),
    )
    .max(15),
  certifications: z
    .array(
      z.object({
        name: z.string().max(160),
        issuer: z.string().max(160).optional(),
        issueDate: z.string().max(20).optional(),
      }),
    )
    .max(20),
  projects: z
    .array(
      z.object({
        title: z.string().max(160),
        url: z.string().url().max(300).optional(),
        description: z.string().max(1000).optional(),
      }),
    )
    .max(20),
});

/*
 * POST /api/seeker/applications/[id]/finalize
 * All fields optional at the schema level — the route enforces the real
 * contract: `resume` is required only the first time (before
 * tailoredResumeKey exists); `submittedFormData` is what actually moves a
 * row from Needs-you to Submitted, and can arrive in a later call (Section D5
 * Approve-all) once the PDF was already rendered by an earlier call (D5
 * Apply-to-all's batch-generate step).
 */
export const finalizeApplicationSchema = z.object({
  resume: ResumeDocumentSchema.optional(),
  coverLetter: z.string().trim().max(10_000).optional(),
  submittedFormData: z.array(SubmittedFormFieldSchema).max(60).optional(),
});

export type CreateApplicationWizardInput = z.infer<typeof createApplicationWizardSchema>;
export type ManualApplicationInput = z.infer<typeof manualApplicationSchema>;
export type PatchApplicationInput = z.infer<typeof patchApplicationSchema>;
export type FinalizeApplicationInput = z.infer<typeof finalizeApplicationSchema>;
