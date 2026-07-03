import { z } from "zod";
import { OptimizeMode } from "@/constants/enums";

/* Mirrors ResumeContact (resume-document.types.ts) — all optional, ATS-safe. */
const ContactForAiSchema = z.object({
  email: z.string().email().max(200).optional(),
  location: z.string().max(160).optional(),
  websiteUrl: z.string().url().max(300).optional(),
  linkedinUrl: z.string().url().max(300).optional(),
  githubUrl: z.string().url().max(300).optional(),
});

/* Mirrors ResumeSkillGroup — category + flat skill names. */
const SkillGroupForAiSchema = z.object({
  category: z.string().min(1).max(80),
  skills: z.array(z.string().max(60)).max(40),
});

/*
 * ProfileForAiSchema
 * Request contract for the seeker profile passed into both apply-AI routes.
 * Mirrors SeekerProfileForAi (ai-prompts.ts) exactly — the caller (Phase 5
 * wizard) builds this from the seeker's real profile/resume data.
 */
export const ProfileForAiSchema = z.object({
  fullName: z.string().min(1).max(120),
  headline: z.string().max(160).nullable(),
  primaryRole: z.string().max(120).nullable(),
  yearsExperience: z.number().int().min(0).max(60).nullable(),
  bio: z.string().max(3000).nullable(),
  location: z.string().max(160).nullable(),
  contact: ContactForAiSchema,
  skillGroups: z.array(SkillGroupForAiSchema).max(20),
  workExperiences: z
    .array(
      z.object({
        company: z.string().max(160),
        title: z.string().max(160),
        startDate: z.string().max(10),
        endDate: z.string().max(10).nullable(),
        description: z.string().max(3000).nullable(),
      }),
    )
    .max(30),
  educations: z
    .array(
      z.object({
        institution: z.string().max(200),
        degree: z.string().max(160).nullable(),
        major: z.string().max(160).nullable(),
        graduationDate: z.string().max(10).nullable(),
      }),
    )
    .max(15),
  certifications: z
    .array(
      z.object({
        name: z.string().max(160),
        issuer: z.string().max(160).optional(),
        issueDate: z.string().max(10).optional(),
      }),
    )
    .max(20),
  projects: z
    .array(
      z.object({
        title: z.string().max(160),
        url: z.string().url().max(300).optional(),
        description: z.string().max(1000).optional(),
      }),
    )
    .max(20),
});

/* Shared JD + profile payload. jobId optional because pasted-link JDs (Phase 7)
 * have no Job row; when absent, jdText is required. */
const ApplyAiBaseSchema = z.object({
  jobId: z.string().cuid().optional(),
  jdText: z.string().min(50).max(20000).optional(),
  requiredSkills: z.array(z.string().max(60)).max(60).default([]),
  preferredSkills: z.array(z.string().max(60)).max(60).default([]),
  jobTitle: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  tone: z.nativeEnum(OptimizeMode).default(OptimizeMode.HONEST),
  profile: ProfileForAiSchema,
});

/* POST /api/seeker/apply/optimize-resume request contract. */
export const ResumeOptimizeSchema = ApplyAiBaseSchema.refine(
  (v) => Boolean(v.jobId) || Boolean(v.jdText),
  { message: "Either jobId or jdText is required" },
);

/* POST /api/seeker/apply/cover-letter request contract. `reservationHandle`
 * (from optimize-resume's X-Reservation-Handle response header) lets this
 * call skip a second credit reservation when it follows a successful
 * optimize-resume call in the same wizard run (one credit/run). NOT a client
 *-asserted boolean — the route atomically redeems this server-minted,
 * single-use handle server-side, so a client can't fabricate "already paid". */
export const CoverLetterSchema = ApplyAiBaseSchema.extend({
  reservationHandle: z.string().max(200).optional(),
}).refine((v) => Boolean(v.jobId) || Boolean(v.jdText), {
  message: "Either jobId or jdText is required",
});

export type ResumeOptimizeRequest = z.infer<typeof ResumeOptimizeSchema>;
export type CoverLetterRequest = z.infer<typeof CoverLetterSchema>;
