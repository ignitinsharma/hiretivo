import type { JobStatus, JobType, SkillLevel, WorkType } from "@/constants/enums";

/*
 * AdminJobListItem
 * Lightweight job record returned by GET /admin/jobs.
 * Used to populate the admin jobs list table.
 */
export interface AdminJobListItem {
  id: string;
  title: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  status: JobStatus;
  createdAt: string;
  publishedAt: string | null;
  applicantCount: number;
}

/*
 * AdminJobSkillSnapshot
 * Skill entry embedded in AdminJobDetail.
 * Mirrors the DB join: JobSkill → Skill.
 */
export interface AdminJobSkillSnapshot {
  skillId: string;
  level: SkillLevel;
  skill: { id: string; name: string; slug: string };
}

/*
 * AdminJobDetail
 * Full job record returned by GET /admin/jobs/[id] and mutation responses.
 * Includes all company override fields and skill snapshots.
 */
export interface AdminJobDetail {
  id: string;
  title: string;
  description: string;
  jobType: JobType;
  workType: WorkType | null;
  externalApplyUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  experienceLevel: string | null;
  category: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyWebsite: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyFunding: string | null;
  isAdminPosted: boolean;
  status: JobStatus;
  publishedAt: string | null;
  skills: AdminJobSkillSnapshot[];
}

/*
 * CompanySuggestion
 * Autocomplete result from GET /admin/companies/suggest.
 * Contains company metadata fields that can be auto-filled in the form.
 */
export interface CompanySuggestion {
  companyName: string;
  companyLogoUrl: string | null;
  companyWebsite: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyFunding: string | null;
}

/*
 * AdminJobPagination
 * Pagination metadata returned alongside the job list.
 */
export interface AdminJobPagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

/*
 * AdminJobsListResponse
 * Full response shape from GET /api/admin/jobs.
 */
export interface AdminJobsListResponse {
  jobs: AdminJobListItem[];
  pagination: AdminJobPagination;
}

/*
 * AdminJobFormValues
 * Uncontrolled form state shape for the admin job create/edit form.
 * Salary fields are strings to accommodate empty/partial input;
 * they are coerced to numbers before submission.
 * selectedSkillIds drives the multi-skill picker.
 */
export interface AdminJobFormValues {
  // Company
  companyName: string;
  companyLogoUrl: string;
  companyWebsite: string;
  companySize: string;
  companyIndustry: string;
  companyFunding: string;
  // Job
  title: string;
  description: string;
  jobType: JobType | "";
  workType: WorkType | "";
  externalApplyUrl: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  experienceLevel: string;
  category: string;
  selectedSkillIds: string[];
}
