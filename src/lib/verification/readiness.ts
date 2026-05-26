export interface VerificationProjectInput {
  name?: string | null;
  description?: string | null;
  sourceUrl?: string | null;
  liveUrl?: string | null;
  url?: string | null;
}

export interface VerificationReadinessProfile {
  name?: string | null;
  image?: string | null;
  seekerProfile?: {
    bio?: string | null;
    primaryRole?: string | null;
    yearsExperience?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency?: string | null;
    availability?: string | null;
    topProjects?: unknown;
    skills?: unknown[] | null;
    workExperiences?: unknown[] | null;
  } | null;
}

export interface VerificationReadinessResult {
  isReady: boolean;
  missingFields: string[];
  completedFields: string[];
}

const READINESS_LABELS = {
  avatar: "Profile photo",
  fullName: "Full name",
  primaryRole: "Primary role",
  yearsExperience: "Years of experience",
  skills: "Skills",
  salary: "Salary range",
  availability: "Availability",
  bio: "Bio (20-150 characters)",
  workHistory: "One work history item",
  project: "One project with source or case-study URL",
} as const;

type ReadinessKey = keyof typeof READINESS_LABELS;

export function normalizeVerificationProjects(value: unknown): VerificationProjectInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((project): project is Record<string, unknown> => {
      return typeof project === "object" && project !== null;
    })
    .map((project) => ({
      name: typeof project.name === "string" ? project.name : "",
      description:
        typeof project.description === "string" ? project.description : "",
      sourceUrl:
        typeof project.sourceUrl === "string"
          ? project.sourceUrl
          : typeof project.url === "string"
            ? project.url
            : "",
      liveUrl: typeof project.liveUrl === "string" ? project.liveUrl : "",
    }));
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasHttpsUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;

  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

function hasReadyProject(value: unknown): boolean {
  return normalizeVerificationProjects(value).some((project) => {
    return (
      hasText(project.name) &&
      hasText(project.description) &&
      hasHttpsUrl(project.sourceUrl)
    );
  });
}

export function getVerificationReadiness(
  user: VerificationReadinessProfile,
): VerificationReadinessResult {
  const profile = user.seekerProfile;
  const bioLength = profile?.bio?.trim().length ?? 0;
  const checks: Record<ReadinessKey, boolean> = {
    avatar: hasText(user.image),
    fullName: hasText(user.name),
    primaryRole: hasText(profile?.primaryRole),
    yearsExperience: profile?.yearsExperience != null,
    skills: Boolean(profile?.skills?.length),
    salary: profile?.salaryMin != null && profile.salaryMax != null && hasText(profile.currency),
    availability: hasText(profile?.availability),
    bio: bioLength >= 20 && bioLength <= 150,
    workHistory: Boolean(profile?.workExperiences?.length),
    project: hasReadyProject(profile?.topProjects),
  };

  const completedFields: string[] = [];
  const missingFields: string[] = [];

  Object.entries(checks).forEach(([key, isComplete]) => {
    const label = READINESS_LABELS[key as ReadinessKey];
    if (isComplete) {
      completedFields.push(label);
    } else {
      missingFields.push(label);
    }
  });

  return {
    isReady: missingFields.length === 0,
    missingFields,
    completedFields,
  };
}
