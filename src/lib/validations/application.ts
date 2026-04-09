import { z } from "zod";

const applicationStatusValues = [
  "APPLIED",
  "REVIEWING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

export const createApplicationSchema = z.object({
  jobId: z.cuid(),
  coverLetter: z.string().trim().max(10_000).optional(),
});

export const updateApplicationStageSchema = z.object({
  stage: z.enum(applicationStatusValues),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
