import { z } from "zod";
import { APPLICATION_STATUS_VALUES } from "@/constants/enums";

export const createApplicationSchema = z.object({
  jobId: z.cuid(),
  coverLetter: z.string().trim().max(10_000).optional(),
});

export const updateApplicationStageSchema = z.object({
  stage: z.enum(APPLICATION_STATUS_VALUES),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
