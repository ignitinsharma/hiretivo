import { z } from "zod";

export const SourceTypeEnum = z.enum(["uploaded", "ai-generated", "manual-edit"]);

export const ResumeBulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  priority: z.number(),
});

export const ResumeExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  current: z.boolean(),
  bullets: z.array(ResumeBulletSchema),
});

export const ResumeProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string().nullable(),
  bullets: z.array(ResumeBulletSchema),
});

export const ResumeEducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const ResumeSkillCategorySchema = z.object({
  name: z.string(),
  items: z.array(z.string()),
});

export const ResumeSkillsSchema = z.object({
  categories: z.array(ResumeSkillCategorySchema),
});

export const ResumeCertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string().nullable(),
  date: z.string().nullable(),
});

export const ResumeLanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.string().nullable(),
});

export const ResumeMatchMetaSchema = z.object({
  matchScore: z.number().min(0).max(100).nullable(),
  addedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  requiredSkillsMatched: z.number(),
  requiredSkillsTotal: z.number(),
  preferredSkillsMatched: z.number(),
  preferredSkillsTotal: z.number(),
});

export const ResumePersonalInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string().nullable(),
  github: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  twitter: z.string().nullable(),
});

/*
 * ResumeDocumentSchema — Phase 0 canonical resume JSON schema.
 * All five consumers (parser, optimizer, renderer, editor, cover letter gen)
 * validate against this schema.
 */
export const ResumeDocumentSchema = z.object({
  profileId: z.string(),
  resumeVersionId: z.string().nullable(),
  applicationId: z.string().nullable(),
  sourceType: SourceTypeEnum,
  generatedAt: z.string(),

  personalInfo: ResumePersonalInfoSchema,

  summary: z.string(),

  experience: z.array(ResumeExperienceSchema),

  projects: z.array(ResumeProjectSchema),

  education: z.array(ResumeEducationSchema),

  skills: ResumeSkillsSchema,

  certifications: z.array(ResumeCertificationSchema),

  languages: z.array(ResumeLanguageSchema),

  matchMeta: ResumeMatchMetaSchema,
});

export type ResumeDocument = z.infer<typeof ResumeDocumentSchema>;
export type ResumeBullet = z.infer<typeof ResumeBulletSchema>;
export type ResumePersonalInfo = z.infer<typeof ResumePersonalInfoSchema>;
export type ResumeExperience = z.infer<typeof ResumeExperienceSchema>;
export type ResumeProject = z.infer<typeof ResumeProjectSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type ResumeSkills = z.infer<typeof ResumeSkillsSchema>;
export type ResumeCertification = z.infer<typeof ResumeCertificationSchema>;
export type ResumeLanguage = z.infer<typeof ResumeLanguageSchema>;
export type ResumeMatchMeta = z.infer<typeof ResumeMatchMetaSchema>;
export type SourceType = z.infer<typeof SourceTypeEnum>;
