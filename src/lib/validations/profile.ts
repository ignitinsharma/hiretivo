import { z } from "zod";
import { SKILL_LEVEL_VALUES, WORK_TYPE_VALUES } from "@/constants/enums";

const seekerSkillSchema = z.object({
  skillId: z.cuid(),
  level: z.enum(SKILL_LEVEL_VALUES),
});

export const seekerSchema = z.object({
  headline: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(10_000).optional(),
  location: z.string().trim().max(200).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  workPreference: z.enum(WORK_TYPE_VALUES).optional(),
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
