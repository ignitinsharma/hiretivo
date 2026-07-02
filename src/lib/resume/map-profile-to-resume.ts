import type {
  ResumeDocument,
  ResumeProject,
  ResumeSkillGroup,
} from "@/modules/seeker/profile/types/resume-document.types";

/*
 * MapProfileInput
 * Loosely-typed rows the mapper accepts. Certifications are passed in (Phase 3a
 * source), NOT read from Prisma here — keeps 3b independent of 3a's DB shape.
 */
export interface MapProfileInput {
  fullName: string;
  email?: string;
  profile: {
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    websiteUrl?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    topProjects?: unknown; // SeekerProfile.topProjects Json
  };
  skills: { name: string; category: string }[]; // flattened SeekerSkill+Skill
  experiences: {
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
  }[];
  educations: {
    institution: string;
    degree: string | null;
    major: string | null;
    graduationDate: string | null;
  }[];
  certifications: { name: string; issuer?: string; issueDate?: string }[];
}

/*
 * splitBullets
 * Splits a freeform description into ATS-friendly bullet lines: by newline, then
 * by "• " / "- " prefixes, trimming empties. Single-paragraph descriptions become
 * one bullet.
 * @param description - raw description text or null
 * @returns string[] bullet lines
 */
function splitBullets(description: string | null): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/\r?\n|(?:^|\s)[•\-]\s+/g)
    .map((l) => l.trim())
    .filter(Boolean);
}

/*
 * groupSkillsByCategory
 * Collapses flat skills into ResumeSkillGroup[] preserving first-seen category
 * order.
 * @param skills - flat name+category list
 * @returns grouped list
 */
function groupSkillsByCategory(
  skills: { name: string; category: string }[],
): ResumeSkillGroup[] {
  const order: string[] = [];
  const map = new Map<string, string[]>();
  for (const sk of skills) {
    if (!map.has(sk.category)) {
      map.set(sk.category, []);
      order.push(sk.category);
    }
    map.get(sk.category)!.push(sk.name);
  }
  return order.map((category) => ({ category, skills: map.get(category)! }));
}

/*
 * parseProjects
 * Coerces SeekerProfile.topProjects Json into typed ResumeProject[]. Drops
 * entries without a title.
 * @param raw - Json value
 * @returns ResumeProject[]
 */
function parseProjects(raw: unknown): ResumeProject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p): ResumeProject | null => {
      if (typeof p !== "object" || p === null) return null;
      const obj = p as { title?: unknown; url?: unknown; description?: unknown };
      if (typeof obj.title !== "string" || !obj.title.trim()) return null;
      return {
        title: obj.title,
        url: typeof obj.url === "string" ? obj.url : undefined,
        description:
          typeof obj.description === "string" ? obj.description : undefined,
      };
    })
    .filter((p): p is ResumeProject => p !== null);
}

/*
 * mapProfileToResumeDocument
 * Pure transform: normalises DB rows into the ResumeDocument contract.
 * - groups skills by category (SkillsSection wants ResumeSkillGroup[])
 * - splits experience.description into bullet lines
 * - parses topProjects Json ({title?,url?,description?}) → ResumeProject[]
 * @param input - MapProfileInput
 * @returns ResumeDocument
 */
export function mapProfileToResumeDocument(
  input: MapProfileInput,
): ResumeDocument {
  const { profile } = input;
  return {
    fullName: input.fullName,
    headline: profile.headline ?? undefined,
    contact: {
      email: input.email ?? undefined,
      location: profile.location ?? undefined,
      websiteUrl: profile.websiteUrl ?? undefined,
      linkedinUrl: profile.linkedinUrl ?? undefined,
      githubUrl: profile.githubUrl ?? undefined,
    },
    summary: profile.bio ?? undefined,
    skillGroups: groupSkillsByCategory(input.skills),
    experience: input.experiences.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      bullets: splitBullets(e.description),
    })),
    education: input.educations.map((ed) => ({
      institution: ed.institution,
      degree: ed.degree ?? undefined,
      major: ed.major ?? undefined,
      graduationDate: ed.graduationDate ?? undefined,
    })),
    certifications: input.certifications,
    projects: parseProjects(profile.topProjects),
  };
}
