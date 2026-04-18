/**
 * Shared seeker-dashboard helpers.
 * Pure functions are synchronous; helpers that need DB access are async.
 */

/**
 * Pure per-job helper used by the recommendation feed.
 * Returns the exact skill names the seeker is missing for a specific job.
 *
 * @param seekerSkillIds - Array of skill IDs the seeker already has.
 * @param jobSkills      - The job's required-skill rows (from Prisma include).
 * @returns Exact missing skill display names (original casing from the skill record).
 */
export function getMissingSkillNames(
  seekerSkillIds: string[],
  jobSkills: Array<{ skillId: string; skill: { name: string } }>,
): string[] {
  const owned = new Set(seekerSkillIds);
  return jobSkills
    .filter((js) => !owned.has(js.skillId))
    .map((js) => js.skill.name);
}
