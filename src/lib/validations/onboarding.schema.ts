/** Zod schemas for seeker and recruiter onboarding step validation */

import { z } from "zod";
import { SkillLevel, JobType } from "@/constants/enums";

export const step1Schema = z.object({
  situation: z.string().trim().min(1, "Situation is required").max(500, "Situation must be under 500 characters"),
});

export const step2Schema = z.object({
  primaryRole: z.string().trim().min(1, "Primary role is required").max(100, "Primary role must be under 100 characters"),
  yearsOfExperience: z.number().int().min(0).max(50).nullable(),
  skills: z.array(
    z.object({
      skillId: z.string().min(1, "Skill ID is required"),
      level: z.nativeEnum(SkillLevel).default(SkillLevel.INTERMEDIATE),
    })
  ).min(1, "At least one skill is required"),
});

export const step3Schema = z.object({
  resumeFile: z.instanceof(File).nullable().optional(),
});

export const step4Schema = z.object({
  targetSalaryMin: z.number().int().min(1000, "Minimum salary must be at least $1,000").max(1000000, "Maximum salary seems too high"),
  targetSalaryMax: z.number().int().min(1000, "Maximum salary must be at least $1,000").max(1000000, "Maximum salary seems too high"),
  timezoneOverlapHours: z.number().int().min(0, "Live meeting availability must be 0-16 hours").max(16, "Live meeting availability must be 0-16 hours"),
  availableFrom: z.string().min(1, "Availability date is required"),
}).refine((data) => data.targetSalaryMax >= data.targetSalaryMin, {
  message: "Maximum salary must be >= minimum salary",
  path: ["targetSalaryMax"],
});

export const recruiterProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200, "Company name must be under 200 characters"),
  website: z.string().url("Invalid website URL").nullable().or(z.literal('')).nullable(),
  companySize: z.string().max(50).nullable(),
  bio: z.string().max(2000, "Bio must be under 2000 characters").nullable(),
  industry: z.string().max(100).nullable(),
  fundingType: z.string().max(100).nullable(),
  isFullyRemote: z.boolean().optional(),
  logo: z.string().nullable(),
});

export const createJobFromOnboardingSchema = z.object({
  title: z.string().trim().min(1, "Job title is required").max(200, "Job title must be under 200 characters"),
  description: z.string().trim().min(50, "Job description must be at least 50 characters").max(10000, "Job description must be under 10,000 characters"),
  jobType: z.nativeEnum(JobType),
  minYearsExperience: z.number().int().min(0).nullable(),
  category: z.string().max(100).nullable(),
  salaryMin: z.number().min(0).nullable(),
  salaryMax: z.number().min(0).nullable(),
  requiredSkills: z.array(z.string()).max(50, "Maximum 50 skills allowed"),
});
