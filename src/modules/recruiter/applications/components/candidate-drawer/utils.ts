import type { FitLevel } from "@/services/recruiter.service";
import type { CandidateApplication } from "./types";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-brand-success";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-amber-600";
  return "text-brand-danger";
}

export function calculateProfileStrength(
  profile?: CandidateApplication["candidateProfile"],
): number {
  if (!profile) return 0;

  let score = 0;
  if (profile.headline) score += 15;
  if (profile.location) score += 10;
  if (profile.yearsExperience != null) score += 15;
  if (profile.skills && profile.skills.length > 0) score += 20;
  if (profile.workExperiences && profile.workExperiences.length > 0)
    score += 25;
  if (profile.educations && profile.educations.length > 0) score += 15;

  return Math.min(score, 100);
}

export function formatDateRange(
  start: string,
  end: string | null,
  isCurrent: boolean,
): string {
  const startText = normalizeMonthYear(start);
  const endText = isCurrent ? "Present" : end ? normalizeMonthYear(end) : "Present";

  return `${startText} - ${endText}`;
}

function normalizeMonthYear(input: string): string {
  const trimmed = input.trim();
  const match = /^(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return trimmed;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12 || year < 1900 || year > 2100) return trimmed;

  return `${String(month).padStart(2, "0")}/${year}`;
}

export function formatInterviewDuration(
  startsAt: string,
  endsAt: string,
): string {
  const mins = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
  return `${mins} min`;
}

export function getFitBadge(fitLevel: FitLevel): {
  label: string;
  className: string;
} {
  switch (fitLevel) {
    case "excellent":
      return {
        label: "Excellent Fit",
        className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      };
    case "good":
      return {
        label: "Good Fit",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
      };
    case "moderate":
      return {
        label: "Moderate Fit",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
      };
    case "low":
      return {
        label: "Low Fit",
        className: "bg-red-100 text-red-700 border border-red-200",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-gray-100 text-gray-700 border border-brand-border",
      };
  }
}

export function getSkillsBreakdown(
  jobSkills: string[],
  candidateSkills: string[],
): { matchedSkills: string[]; missingSkills: string[] } {
  const matchedSkills = jobSkills.filter((skill) =>
    candidateSkills.some(
      (candidateSkill) => candidateSkill.toLowerCase() === skill.toLowerCase(),
    ),
  );

  const missingSkills = jobSkills.filter(
    (skill) =>
      !candidateSkills.some(
        (candidateSkill) =>
          candidateSkill.toLowerCase() === skill.toLowerCase(),
      ),
  );

  return { matchedSkills, missingSkills };
}

export function getExperienceLabel(yearsExperience: number): string {
  if (yearsExperience === 0) return "< 1 Year";
  if (yearsExperience === 10) return "10+ Years";
  return `${yearsExperience} ${yearsExperience === 1 ? "Year" : "Years"}`;
}
