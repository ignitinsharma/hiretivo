import { z } from "zod";
import {
  APPLY_TYPE_VALUES,
  ApplyType,
  JobStatus,
  JOB_STATUS_VALUES,
  JOB_TYPE_VALUES,
  SKILL_LEVEL_VALUES,
  WORK_TYPE_VALUES,
} from "@/constants/enums";

const jobSkillSchema = z.object({
  skillId: z.cuid(),
  level: z.enum(SKILL_LEVEL_VALUES),
});

const baseJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(50_000),
  jobType: z.enum(JOB_TYPE_VALUES),
  applyType: z.enum(APPLY_TYPE_VALUES),
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  status: z.enum(JOB_STATUS_VALUES).default(JobStatus.DRAFT),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  externalApplyUrl: z.string().url().optional(),
  experienceLevel: z.string().trim().max(50).optional(),
  category: z.string().trim().max(100).optional(),
  skills: z.array(jobSkillSchema).min(1),
});

function jobRefinements(
  data: {
    salaryMin?: number;
    salaryMax?: number;
    applyType?: string;
    externalApplyUrl?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (
    data.salaryMin !== undefined &&
    data.salaryMax !== undefined &&
    data.salaryMin > data.salaryMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "salaryMin cannot be greater than salaryMax",
      path: ["salaryMax"],
    });
  }
  if (data.applyType === ApplyType.EXTERNAL && !data.externalApplyUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "externalApplyUrl is required when applyType is EXTERNAL",
      path: ["externalApplyUrl"],
    });
  }
  if (data.applyType === ApplyType.INTERNAL && data.externalApplyUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "externalApplyUrl must be empty when applyType is INTERNAL",
      path: ["externalApplyUrl"],
    });
  }
}

export const createJobSchema = baseJobSchema.superRefine(jobRefinements);

export type CreateJobInput = z.infer<typeof createJobSchema>;

const updateJobBase = baseJobSchema
  .partial()
  .extend({ id: z.cuid() });

export const updateJobSchema = updateJobBase.superRefine(jobRefinements);

export const updateJobBaseSchema = updateJobBase;

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
