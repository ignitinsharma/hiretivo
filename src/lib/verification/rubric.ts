export const VERIFICATION_RUBRIC = [
  { key: "github", label: "GitHub/code evidence", max: 30 },
  { key: "projects", label: "Projects", max: 25 },
  { key: "workHistory", label: "Work history/seniority", max: 20 },
  { key: "profile", label: "Profile completeness/clarity", max: 15 },
  { key: "trust", label: "Trust signals/video/social consistency", max: 10 },
] as const;

export type VerificationRubricKey = (typeof VERIFICATION_RUBRIC)[number]["key"];
export type VerificationRubricScores = Record<VerificationRubricKey, number>;

export function calculateVerificationRubricTotal(
  scores: Partial<VerificationRubricScores>,
): number {
  return VERIFICATION_RUBRIC.reduce((total, item) => {
    const score = scores[item.key] ?? 0;
    return total + Math.min(Math.max(score, 0), item.max);
  }, 0);
}

export function createRubricFromAiScore(score: number | null | undefined): VerificationRubricScores {
  const safeScore = Math.min(Math.max(score ?? 0, 0), 100);

  return VERIFICATION_RUBRIC.reduce((result, item) => {
    result[item.key] = Math.round((safeScore * item.max) / 100);
    return result;
  }, {} as VerificationRubricScores);
}
