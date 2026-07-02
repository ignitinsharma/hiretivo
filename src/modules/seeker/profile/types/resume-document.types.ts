import type { ResumeSectionHeading } from "@/constants/enums";

/*
 * ResumeContact
 * Header contact line. Optional fields render only when present (ATS-safe:
 * missing fields are omitted, never rendered as empty labels).
 */
export interface ResumeContact {
  email?: string;
  location?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

/*
 * ResumeSkillGroup
 * One skill category ("Engineering", "Data", …) and its flat skill names.
 * Rendered as a single wrapping <Text> line per group (never a grid).
 */
export interface ResumeSkillGroup {
  category: string;
  skills: string[];
}

/*
 * ResumeExperience
 * One work-history entry. Dates are pre-formatted display strings
 * ("Jan 2023"), never Date objects — freeform "MM/YYYY" origin.
 */
export interface ResumeExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null; // null => "Present"
  isCurrent: boolean;
  bullets: string[]; // description split into ATS-friendly bullet lines
}

/*
 * ResumeEducation
 * One education entry. All optional except institution.
 */
export interface ResumeEducation {
  institution: string;
  degree?: string;
  major?: string;
  graduationDate?: string;
}

/*
 * ResumeCertification
 * One certification. Supplied by the caller (Phase 3a Certification rows or
 * parsed data) — not read from Prisma inside the renderer.
 */
export interface ResumeCertification {
  name: string;
  issuer?: string;
  issueDate?: string;
}

/*
 * ResumeProject
 * One portfolio project. Maps from SeekerProfile.topProjects Json
 * ({ title?, url?, description? }).
 */
export interface ResumeProject {
  title: string;
  url?: string;
  description?: string;
}

/*
 * ResumeDocument
 * The complete, render-ready resume model. This is the Phase 3b <-> Phase 4
 * <-> Phase 5 contract: Phase 4 AI produces/tailors this; Phase 5 passes it to
 * renderResumePdf(). Fully typed, no `any`, no Prisma types leaking through.
 * Sections render in RESUME_SECTION_ORDER; a section is skipped entirely when
 * its array is empty (or summary is blank).
 */
export interface ResumeDocument {
  fullName: string;
  headline?: string; // e.g. "Senior Backend Engineer"
  contact: ResumeContact;
  summary?: string;
  skillGroups: ResumeSkillGroup[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  projects: ResumeProject[];
}

/*
 * ResumeSectionKey
 * Re-export alias so template code can key section renderers by heading.
 */
export type ResumeSectionKey = ResumeSectionHeading;
