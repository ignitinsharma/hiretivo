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
