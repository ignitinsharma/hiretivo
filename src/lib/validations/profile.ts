import { z } from "zod";

const workTypeValues = ["REMOTE", "HYBRID", "ONSITE"] as const;
const skillLevelValues = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

const seekerSkillSchema = z.object({
  skillId: z.cuid(),
  level: z.enum(skillLevelValues),
});

export const seekerSchema = z.object({
  headline: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(10_000).optional(),
  location: z.string().trim().max(200).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  workPreference: z.enum(workTypeValues).optional(),
  skills: z.array(seekerSkillSchema).max(50),
});

export type SeekerProfileInput = z.infer<typeof seekerSchema>;

export const recruiterSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  website: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().url().optional()
  ),
  bio: z.string().trim().max(10_000).optional(),
});

export type RecruiterProfileInput = z.infer<typeof recruiterSchema>;
