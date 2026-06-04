import { z } from "zod";
import { POSITION_TYPE_VALUES } from "@/constants/enums";
import { isValidState, isValidCity } from "@/modules/india-location";

const SkillNameSchema = z
  .string()
  .trim()
  .min(1, "Skill is required")
  .max(80, "Skill must be 80 characters or fewer");

const SkillIdSchema = z.string().trim().min(1, "Skill id is required");

const MAX_POSTGRES_INT = 2_147_483_647;
const SALARY_ERROR_MESSAGE = "Salary must be a non-negative integer at most 2147483647";

const SalarySchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null) {
      return null;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (trimmedValue === "") {
        return null;
      }

      if (!/^\d+$/.test(trimmedValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: SALARY_ERROR_MESSAGE,
        });
        return z.NEVER;
      }

      const numericValue = Number(trimmedValue);

      if (numericValue > MAX_POSTGRES_INT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: SALARY_ERROR_MESSAGE,
        });
        return z.NEVER;
      }

      return numericValue;
    }

    if (!Number.isInteger(value) || value < 0 || value > MAX_POSTGRES_INT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: SALARY_ERROR_MESSAGE,
      });
      return z.NEVER;
    }

    return value;
  });

export const WorkExperienceInputSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required"),
    title: z.string().trim().min(1, "Title is required"),
    startDate: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Start date must be in MM/YYYY format"),
    endDate: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "End date must be in MM/YYYY format")
      .optional()
      .nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string().max(2000).optional().nullable(),
    positionType: z.enum(POSITION_TYPE_VALUES).optional().nullable(),
    skills: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.isCurrent && data.endDate != null && data.endDate.trim() !== "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be empty when currently working here",
        path: ["endDate"],
      });
    }
  });

export const EducationInputSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  graduationDate: z.string().optional().nullable(),
  degree: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
});

export type WorkExperienceInput = z.infer<typeof WorkExperienceInputSchema>;
export type EducationInput = z.infer<typeof EducationInputSchema>;

export const SeekerSettingsSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    headline: z.string().max(200).optional().or(z.literal("")),
    bio: z.string().max(1000).optional().or(z.literal("")),
    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(100, "City must be under 100 characters")
      .regex(/^[^,]+$/, "City name cannot contain commas")
      .optional()
      .or(z.literal("")),
    state: z.string().optional().or(z.literal("")),
    situation: z.string().max(200).optional().or(z.literal("")),
    primaryRole: z.string().max(100).optional().or(z.literal("")),
    salaryMin: SalarySchema,
    salaryMax: SalarySchema,
    currency: z.string().max(10).optional().or(z.literal("")),
    availability: z.string().max(100).optional().or(z.literal("")),
    skillIds: z
      .array(SkillIdSchema)
      .max(30)
      .refine((skillIds) => new Set(skillIds).size === skillIds.length, {
        message: "Skill ids must be unique",
      })
      .optional(),
    skillNames: z.array(SkillNameSchema).max(30).optional(),
    websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    twitterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    yearsExperience: z.number().int().min(0).max(10).optional().nullable(),
    workExperiences: z.array(WorkExperienceInputSchema).max(20).optional(),
    educations: z.array(EducationInputSchema).max(10).optional(),
  })
  .refine(
    (data) =>
      data.salaryMax == null ||
      data.salaryMin == null ||
      data.salaryMin <= data.salaryMax,
    {
      message: "Minimum salary must be less than or equal to maximum salary",
      path: ["salaryMax"],
    },
  )
  .refine(
    (data) => {
      const hasCity = !!data.city && isValidCity(data.city);
      const hasState = !!data.state && isValidState(data.state);
      if (hasCity && !hasState) return false;
      if (!hasCity && hasState) return false;
      return true;
    },
    {
      message: "Provide a valid city and state together, or omit both",
      path: ["city"],
    },
  )
  .transform((data) => ({
    ...data,
    salaryMin: data.salaryMin ?? null,
    salaryMax: data.salaryMax ?? null,
  }));

export type SeekerSettingsInput = z.input<typeof SeekerSettingsSchema>;
