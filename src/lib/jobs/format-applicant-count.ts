/*
 * formatApplicantCount
 * Returns a human-friendly label for an application count.
 * Thresholds: 0 → "Be the first applicant", 1-5 → "Be among the first",
 * 6-99 → "{N} applicants", 100+ → "100+ applicants".
 * @param count - Number of applications for the job
 * @returns Human-readable applicant count string
 */
export function formatApplicantCount(count: number): string {
  if (count <= 0) return "Be the first applicant";
  if (count <= 5) return "Be among the first";
  if (count < 100) return `${count} applicants`;
  return "100+ applicants";
}
