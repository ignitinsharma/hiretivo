import type { SeekerSettingsData, CertificationItem } from "@/services/seeker.service";
import type { ProjectInput } from "@/lib/validations/project.schema";
import type { ProfileForAiSchema } from "@/lib/validations/apply-ai.schema";
import type { z } from "zod";

type ApplyAiProfile = z.infer<typeof ProfileForAiSchema>;

/*
 * buildApplyAiProfile
 * Maps the seeker's real settings/certifications/projects data into the
 * ProfileForAiSchema contract the apply-AI routes require. Skills have no
 * category grouping in SeekerSettingsData, so they're bundled under a
 * single "Skills" group — the AI prompts only read the flat skill names.
 * @param settings - GET /seeker/settings response
 * @param certifications - GET /seeker/certifications response
 * @param projects - GET /seeker/projects response
 * @returns ApplyAiProfile ready to send to optimize-resume / cover-letter
 */
export function buildApplyAiProfile(
  settings: SeekerSettingsData,
  certifications: CertificationItem[],
  projects: ProjectInput[],
): ApplyAiProfile {
  return {
    fullName: settings.name,
    headline: settings.headline || null,
    primaryRole: settings.primaryRole || null,
    yearsExperience: settings.yearsExperience,
    bio: settings.bio || null,
    location: settings.location,
    contact: {
      email: settings.email || undefined,
      location: settings.location ?? undefined,
      websiteUrl: settings.websiteUrl ?? undefined,
      linkedinUrl: settings.linkedinUrl ?? undefined,
      githubUrl: settings.githubUrl ?? undefined,
    },
    skillGroups: settings.skills.length
      ? [{ category: "Skills", skills: settings.skills.map((s) => s.name) }]
      : [],
    workExperiences: settings.workExperiences.map((w) => ({
      company: w.company,
      title: w.title,
      startDate: w.startDate,
      endDate: w.endDate,
      description: w.description,
    })),
    educations: settings.educations.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      major: e.major,
      graduationDate: e.graduationDate,
    })),
    certifications: certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer ?? undefined,
      issueDate: c.issueDate ?? undefined,
    })),
    projects: projects.map((p) => ({
      title: p.title,
      url: p.url ?? undefined,
      description: p.description ?? undefined,
    })),
  };
}
