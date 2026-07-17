/** Zod schemas for seeker and recruiter onboarding step validation */

import { z } from "zod";
import { WorkType, SkillLevel, JobType } from "@/constants/enums";

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
  experienceLevel: z.string().max(100).nullable(),
  category: z.string().max(100).nullable(),
  salaryMin: z.number().min(0).nullable(),
  salaryMax: z.number().min(0).nullable(),
  requiredSkills: z.array(z.string()).max(50, "Maximum 50 skills allowed"),
});
