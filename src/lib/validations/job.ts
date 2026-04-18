import { z } from "zod";

const jobTypeValues = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const applyTypeValues = ["INTERNAL", "EXTERNAL"] as const;
const jobStatusValues = ["DRAFT", "OPEN", "PAUSED", "CLOSED"] as const;
const workTypeValues = ["REMOTE", "HYBRID", "ONSITE"] as const;
const skillLevelValues = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

const jobSkillSchema = z.object({
  skillId: z.cuid(),
  level: z.enum(skillLevelValues),
});

const baseJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(50_000),
  jobType: z.enum(jobTypeValues),
  applyType: z.enum(applyTypeValues),
  workType: z.enum(workTypeValues).optional(),
  status: z.enum(jobStatusValues).default("DRAFT"),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  externalApplyUrl: z.string().url().optional(),
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
  if (data.applyType === "EXTERNAL" && !data.externalApplyUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "externalApplyUrl is required when applyType is EXTERNAL",
      path: ["externalApplyUrl"],
    });
  }
  if (data.applyType === "INTERNAL" && data.externalApplyUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "externalApplyUrl must be empty when applyType is INTERNAL",
      path: ["externalApplyUrl"],
    });
  }
}

export const createJobSchema = baseJobSchema.superRefine(jobRefinements);

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = baseJobSchema
  .partial()
  .extend({ id: z.cuid() })
  .superRefine(jobRefinements);

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
