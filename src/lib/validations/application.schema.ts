import { z } from "zod";
import { ApplicationStatus } from "@/constants/enums";

/* POST /api/seeker/applications — starts a wizard run against a feed job. */
export const createApplicationWizardSchema = z.object({
  jobId: z.cuid(),
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
 * advances. `status` only ever transitions APPLIED (the row's created
 * default) forward to itself here; the tracker (Phase 6) owns later
 * transitions (REVIEWING, INTERVIEW, …).
 */
export const patchApplicationSchema = z
  .object({
    tailoredResumeKey: z.string().min(1).max(500),
    coverLetter: z.string().trim().max(10_000),
    submittedFormData: z.array(SubmittedFormFieldSchema).max(60),
    keywordStats: KeywordStatsSchema,
    status: z.literal(ApplicationStatus.APPLIED),
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

/* POST /api/seeker/applications/[id]/finalize */
export const finalizeApplicationSchema = z.object({
  resume: ResumeDocumentSchema,
  coverLetter: z.string().trim().max(10_000),
  submittedFormData: z.array(SubmittedFormFieldSchema).max(60),
});

export type CreateApplicationWizardInput = z.infer<typeof createApplicationWizardSchema>;
export type PatchApplicationInput = z.infer<typeof patchApplicationSchema>;
export type FinalizeApplicationInput = z.infer<typeof finalizeApplicationSchema>;
