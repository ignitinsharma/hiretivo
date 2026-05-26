import { normalizeCodingProfiles } from "@/lib/verification/coding-profiles";

interface VerificationAiSkill {
  skill: { name: string };
}

interface VerificationAiWorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  skills: string[];
}

interface VerificationAiProfile {
  headline: string | null;
  bio: string | null;
  primaryRole: string | null;
  location: string | null;
  yearsExperience: number | null;
  availability: string | null;
  githubUsername: string | null;
  githubUrl?: string | null;
  videoIntroUrl: string | null;
  topProjects: unknown;
  codingProfiles: unknown;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  skills: VerificationAiSkill[];
  workExperiences: VerificationAiWorkExperience[];
}

export interface VerificationAiEngineerInput {
  id: string;
  name: string | null;
  email: string | null;
  timezone: string | null;
  timezoneOverlapHours: number | null;
  availableFrom: Date | null;
  seekerProfile: VerificationAiProfile | null;
}

export interface VerificationGithubSnapshot {
  username: string | null;
  profileUrl: string | null;
  status: "ok" | "missing" | "inaccessible" | "private";
  repos: number;
  languages: string[];
  lastCommit: string | null;
  starCount: number;
}

export interface VerificationAiEvidenceSnapshot {
  profile: {
    name: string | null;
    headline: string | null;
    primaryRole: string | null;
    location: string | null;
    yearsExperience: number | null;
    bio: string | null;
    availability: string | null;
    timezone: string | null;
    timezoneOverlapHours: number | null;
    availableFrom: string | null;
    salaryMinUsd: number | null;
    salaryMaxUsd: number | null;
    hasVideoIntro: boolean;
  };
  skills: string[];
  workHistory: Array<{
    title: string;
    company: string;
    dates: string;
    isCurrent: boolean;
    description: string | null;
    skills: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    sourceUrl: string;
    liveUrl: string | null;
  }>;
  github: VerificationGithubSnapshot;
  codingProfiles: Array<{
    platform: string;
    profileUrl: string;
    handle: string | null;
    evidenceSummary: string | null;
  }>;
}

function trimText(value: string | null | undefined, maxLength: number): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function normalizeProjects(value: unknown): VerificationAiEvidenceSnapshot["projects"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((project): project is Record<string, unknown> => {
      return typeof project === "object" && project !== null;
    })
    .map((project) => ({
      name: trimText(typeof project.name === "string" ? project.name : null, 100) ?? "",
      description:
        trimText(
          typeof project.description === "string" ? project.description : null,
          500,
        ) ?? "",
      sourceUrl:
        trimText(
          typeof project.sourceUrl === "string"
            ? project.sourceUrl
            : typeof project.url === "string"
              ? project.url
              : null,
          500,
        ) ?? "",
      liveUrl: trimText(
        typeof project.liveUrl === "string" ? project.liveUrl : null,
        500,
      ),
    }))
    .filter((project) => project.name || project.description || project.sourceUrl)
    .slice(0, 3);
}

export function buildVerificationAiEvidenceSnapshot(
  engineer: VerificationAiEngineerInput,
  github: VerificationGithubSnapshot,
): VerificationAiEvidenceSnapshot {
  const profile = engineer.seekerProfile;

  return {
    profile: {
      name: trimText(engineer.name, 100),
      headline: trimText(profile?.headline, 200),
      primaryRole: trimText(profile?.primaryRole, 100),
      location: trimText(profile?.location, 200),
      yearsExperience: profile?.yearsExperience ?? null,
      bio: trimText(profile?.bio, 800),
      availability: trimText(profile?.availability, 100),
      timezone: trimText(engineer.timezone, 100),
      timezoneOverlapHours: engineer.timezoneOverlapHours,
      availableFrom: engineer.availableFrom?.toISOString() ?? null,
      salaryMinUsd: profile?.salaryMinUsd ?? null,
      salaryMaxUsd: profile?.salaryMaxUsd ?? null,
      hasVideoIntro: Boolean(profile?.videoIntroUrl?.trim()),
    },
    skills: (profile?.skills ?? [])
      .map((entry) => entry.skill.name)
      .filter(Boolean)
      .slice(0, 30),
    workHistory: (profile?.workExperiences ?? []).slice(0, 5).map((entry) => ({
      title: trimText(entry.title, 120) ?? "",
      company: trimText(entry.company, 120) ?? "",
      dates: `${entry.startDate}${entry.endDate ? ` - ${entry.endDate}` : ""}`,
      isCurrent: entry.isCurrent,
      description: trimText(entry.description, 800),
      skills: entry.skills.slice(0, 20),
    })),
    projects: normalizeProjects(profile?.topProjects),
    github,
    codingProfiles: normalizeCodingProfiles(profile?.codingProfiles),
  };
}
