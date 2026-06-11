import type { ApplicationStatus, InterviewStatus, PlanTier, VerificationStatus } from "@/constants/enums";
import type { FitLevel } from "@/services/recruiter.service";

export type TabKey = "summary" | "experience" | "education";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
];

export interface CandidateWorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  positionType: string | null;
  skills: string[];
}

export interface CandidateEducation {
  id: string;
  institution: string;
  graduationDate: string | null;
  degree: string | null;
  major: string | null;
}

export interface CandidateApplication {
  id: string;
  jobId?: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string | null;
  /** Hiretivo verification state — drives the verified badge on recruiter surfaces. */
  verificationStatus?: VerificationStatus;
  jobTitle: string;
  matchScore: number;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  jobSkills: string[];
  candidateProfile?: {
    primaryRole: string | null;
    headline: string | null;
    location: string | null;
    skills: string[];
    yearsExperience?: number | null;
    websiteUrl?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    twitterUrl?: string | null;
    videoIntroUrl?: string | null;
    workExperiences?: CandidateWorkExperience[];
    educations?: CandidateEducation[];
  };
  appliedAt?: string;
  updatedAt?: string;
  plan?: PlanTier;
  /** FREE plan: true when applicant is beyond the visible 5/job window (PII redacted server-side). */
  locked?: boolean;
  canScheduleInterviews?: boolean;
  canUseAi?: boolean;
  scheduledInterview?: {
    id: string;
    status: InterviewStatus;
    startsAt: string | null;
    endsAt: string | null;
    meetLink: string | null;
    notes: string | null;
    scheduledTimeZone?: string | null;
  } | null;
}

export interface DrawerLinks {
  href: string;
  label: string;
  icon: "website" | "linkedin" | "github" | "twitter";
}

export interface AiState {
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  /** Structured AI insight sections (undefined until the summary resolves). */
  summary?: string;
  skillMatch?: string;
  whyFit?: string;
  areasToExplore?: string;
  screeningQuestions?: string[];
  fitScore?: number;
  fitLevel?: FitLevel;
  isPlanGated: boolean;
}
