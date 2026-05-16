/*
 * REJECTION_REASONS
 * 14 predefined admin rejection reasons for engineer verification.
 * keys are stored in VerificationReview.notes.reasons[]; labels shown in admin UI.
 */
export const REJECTION_REASONS = [
  { key: "no_public_repos", label: "No public repositories found" },
  { key: "forks_only", label: "All repos are forks or tutorial clones" },
  { key: "inactive_github", label: "No commits in last 6 months (inactive)" },
  { key: "no_production_code", label: "Projects don't show production-level code" },
  { key: "skills_mismatch", label: "Skills claimed don't match GitHub repos" },
  { key: "bio_missing", label: "Bio missing or too short (<100 words)" },
  { key: "no_work_experience", label: "Work experience not added" },
  { key: "no_projects", label: "Top projects not described" },
  { key: "no_real_project", label: "No real-world/production project (only practice)" },
  { key: "vague_descriptions", label: "Project descriptions too vague" },
  { key: "broken_links", label: "Project links broken or missing" },
  { key: "name_mismatch", label: "Name on profile doesn't match GitHub name" },
  { key: "incomplete_profile", label: "Profile feels incomplete - needs more detail" },
  { key: "too_junior", label: "Less than 2 years experience - reapply when more senior" },
] as const;

export type RejectionReasonKey = (typeof REJECTION_REASONS)[number]["key"];
