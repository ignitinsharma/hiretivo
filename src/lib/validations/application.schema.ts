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

/* Mirrors ApplyKeywordStats (apply.types.ts). */
const KeywordStatsSchema = z.object({
  requiredMatched: z.array(z.string().max(60)).max(60),
  preferredMatched: z.array(z.string().max(60)).max(60),
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

export type CreateApplicationWizardInput = z.infer<typeof createApplicationWizardSchema>;
export type PatchApplicationInput = z.infer<typeof patchApplicationSchema>;
