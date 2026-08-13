import { z } from "zod";
import { PIPELINE_STAGE_VALUES } from "@/constants/enums";

/*
 * createManualApplicationSchema
 * Client + server validation for manually tracked jobs added in the tracker.
 */
export const createManualApplicationSchema = z.object({
  title: z.string().trim().min(1, "Job title is required").max(120),
  companyName: z.string().trim().min(1, "Company name is required").max(120),
  location: z.string().trim().max(120).optional(),
  pipelineStage: z.enum(PIPELINE_STAGE_VALUES),
});

export type CreateManualApplicationInput = z.infer<
  typeof createManualApplicationSchema
>;
