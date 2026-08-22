import { z } from "zod";
import { PIPELINE_STAGE_VALUES } from "@/constants/enums";

/*
 * externalApplicationSchema
 * Validates manual external job log — for jobs applied elsewhere and tracked in Kanban.
 * Title/company required, location optional, stage required (5 columns).
 */
export const externalApplicationSchema = z.object({
  title: z.string().min(1, "Job title is required").max(120),
  companyName: z.string().min(1, "Company name is required").max(120),
  location: z.string().max(120).optional(),
  pipelineStage: z.enum(PIPELINE_STAGE_VALUES),
});

export type ExternalApplicationInput = z.infer<typeof externalApplicationSchema>;
