import { z } from "zod";
import {
  JOB_TYPE_VALUES,
  WORK_TYPE_VALUES,
  SKILL_LEVEL_VALUES,
} from "@/constants/enums";

/*
 * Admin job validation schemas.
 * Used to validate admin-posted job listings which carry per-job company
 * overrides instead of relying on a recruiter profile.
 */

const ADMIN_EXPERIENCE_LEVEL_VALUES = ["entry", "mid", "senior"] as const;
const ADMIN_CURRENCY_VALUES = ["USD", "EUR", "GBP", "INR"] as const;

const ADMIN_COMPANY_SIZE_VALUES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
const ADMIN_COMPANY_INDUSTRY_VALUES = ["TECHNOLOGY", "FINANCE", "HEALTHCARE", "EDUCATION", "OTHER"] as const;
const ADMIN_COMPANY_FUNDING_VALUES = [
  "BOOTSTRAPPED", "PRE_SEED", "SEED",
  "SERIES_A", "SERIES_B", "SERIES_C", "SERIES_C_PLUS", "PUBLICLY_TRADED",
] as const;

/*
 * jobSkillSchema
 * Validates a single skill entry for a job posting.
 * Uses z.cuid() matching the existing codebase pattern (see src/lib/validations/job.ts).
 */
const jobSkillSchema = z.object({
  skillId: z.cuid(),
  level: z.enum(SKILL_LEVEL_VALUES),
});

/*
 * adminJobCompanySchema
 * Validates the company override fields for admin-posted jobs.
 * companyName is required; all other fields are optional.
 */
export const adminJobCompanySchema = z.object({
  companyName: z.string().trim().min(1, "Company name required").max(100),
  companyLogoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  companyWebsite: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  companySize: z.enum(ADMIN_COMPANY_SIZE_VALUES).optional().or(z.literal("")),
  companyIndustry: z.enum(ADMIN_COMPANY_INDUSTRY_VALUES).optional().or(z.literal("")),
  companyFunding: z.enum(ADMIN_COMPANY_FUNDING_VALUES).optional().or(z.literal("")),
});

/*
 * adminJobBaseSchema
 * Pre-refinement base for create + update. Kept un-refined so .partial() works.
 */
const adminJobBaseSchema = adminJobCompanySchema.extend({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(50, "Description must be at least 50 characters").max(50_000),
  jobType: z.enum(JOB_TYPE_VALUES),
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  externalApplyUrl: z
    .string()
    .url("Apply URL must be a valid URL")
    .refine(
      (url) => /^https?:\/\//i.test(url),
      { message: "Apply URL must use http or https" }
    )
    .optional()
    .or(z.literal("")),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  currency: z.enum(ADMIN_CURRENCY_VALUES).optional().or(z.literal("")),
  experienceLevel: z.enum(ADMIN_EXPERIENCE_LEVEL_VALUES).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional(),
  skills: z.array(jobSkillSchema).min(1, "At least one skill required"),
});

/*
 * salaryRangeRefine
 * Enforces salaryMin <= salaryMax. Applied to both create and update schemas
 * via superRefine on each separately (cannot share — superRefine output is terminal).
 */
const salaryRangeRefine = (
  data: { salaryMin?: number | null; salaryMax?: number | null },
  ctx: z.RefinementCtx,
) => {
  if (
    typeof data.salaryMin === "number" &&
    typeof data.salaryMax === "number" &&
    data.salaryMin > data.salaryMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "salaryMin cannot exceed salaryMax",
      path: ["salaryMax"],
    });
  }
};

/*
 * adminJobCreateSchema
 * Full validation schema for creating an admin-posted job.
 */
export const adminJobCreateSchema = adminJobBaseSchema.superRefine(salaryRangeRefine);

/*
 * adminJobUpdateSchema
 * Partial version for PATCH operations. .partial() runs on un-refined base,
 * then salary refinement is re-applied on top.
 */
export const adminJobUpdateSchema = adminJobBaseSchema.partial().superRefine(salaryRangeRefine);

export type AdminJobCreateInput = z.infer<typeof adminJobCreateSchema>;
export type AdminJobUpdateInput = z.infer<typeof adminJobUpdateSchema>;

/** Exported constants for use in form select options. */
export const ADMIN_COMPANY_SIZE_OPTIONS = ADMIN_COMPANY_SIZE_VALUES;
export const ADMIN_COMPANY_INDUSTRY_OPTIONS = ADMIN_COMPANY_INDUSTRY_VALUES;
export const ADMIN_COMPANY_FUNDING_OPTIONS = ADMIN_COMPANY_FUNDING_VALUES;
export const ADMIN_EXPERIENCE_LEVEL_OPTIONS = ADMIN_EXPERIENCE_LEVEL_VALUES;
export const ADMIN_CURRENCY_OPTIONS = ADMIN_CURRENCY_VALUES;
