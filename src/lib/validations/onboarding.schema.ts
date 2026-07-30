/** Zod schemas for seeker onboarding step validation */

import { z } from "zod";
import { WorkType, SkillLevel } from "@/constants/enums";

export const step1Schema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(200, "Name must be under 200 characters"),
  phone: z.string().trim().min(5, "Phone number is required").max(20, "Phone must be under 20 characters"),
  linkedinUrl: z
    .string()
    .trim()
    .min(1, "LinkedIn URL is required")
    .url("Invalid URL")
    .refine((u) => /linkedin\.com\/in\//i.test(u), "Must be a LinkedIn profile URL (linkedin.com/in/...)"),
  githubUrl: z
    .string()
    .trim()
    .url("Invalid URL")
    .refine((u) => /github\.com\//i.test(u), "Must be a GitHub profile URL (github.com/...)")
    .nullable()
    .optional()
    .or(z.literal("")),
  portfolioUrl: z
    .string()
    .trim()
    .url("Invalid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  situation: z.string().trim().min(1, "Current situation is required"),
});

export const step2Schema = z.object({
  primaryRole: z.string().trim().min(1, "Primary role is required").max(100, "Primary role must be under 100 characters"),
  yearsOfExperience: z.string().nullable(),
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
  salaryMin: z.number().min(0, "Minimum salary cannot be negative").nullable(),
  salaryMax: z.number().min(0, "Maximum salary cannot be negative").nullable(),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code"),
  availability: z.string().max(100, "Availability must be under 100 characters").nullable(),
  workPreference: z.nativeEnum(WorkType).nullable(),
});


