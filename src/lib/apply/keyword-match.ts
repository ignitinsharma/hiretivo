import { SKILL_ALIASES, extractSkillsFromText } from "@/lib/ats/skill-extractor";

/* Deterministic JD-vs-profile keyword overlap. Phase 5 shows these counts;
 * the resume prompt uses matched/missing lists to weight tailoring. */
export interface KeywordStats {
  requiredMatched: number;
  preferredMatched: number;
  total: number; // requiredMatched + preferredMatched
}

export interface KeywordMatchResult {
  stats: KeywordStats;
  requiredMatchedSkills: string[];
  requiredMissingSkills: string[];
  preferredMatchedSkills: string[];
}

/* Reverse alias index: lowercased alias/name -> canonical skill name, built
 * once from SKILL_ALIASES (skill-extractor.ts) so "reactjs"/"react.js" both
 * normalize to "React" the same way ATS-side extraction does. */
const ALIAS_TO_CANONICAL: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    map.set(canonical.toLowerCase(), canonical);
    for (const alias of aliases) {
      map.set(alias.toLowerCase(), canonical);
    }
  }
  return map;
})();

/*
 * normalizeSkillName
 * Resolves a skill name to its canonical alias-normalized, lowercased form
 * so "reactjs" and "React" compare equal.
 * @param name - raw skill name from either JD or seeker profile
 * @returns lowercased canonical form
 */
function normalizeSkillName(name: string): string {
  const lower = name.trim().toLowerCase();
  return (ALIAS_TO_CANONICAL.get(lower) ?? name).toLowerCase();
}

/*
 * computeKeywordStats
 * Compares a JD's required/preferred skills against the seeker's skill names,
 * reusing extractSkillsFromText's alias table for normalization and Set
 * intersection (à la match.ts) for overlap. Case-insensitive, alias-aware.
 * @param requiredSkills  - JD required skill names (from JobSkill / extraction)
 * @param preferredSkills - JD preferred / nice-to-have skill names
 * @param seekerSkills    - seeker's skill names
 * @returns KeywordMatchResult with counts + the matched/missing name lists
 */
export function computeKeywordStats(
  requiredSkills: string[],
  preferredSkills: string[],
  seekerSkills: string[],
): KeywordMatchResult {
  const seekerSet = new Set(seekerSkills.map(normalizeSkillName));

  const requiredMatchedSkills = requiredSkills.filter((s) =>
    seekerSet.has(normalizeSkillName(s)),
  );
  const requiredMissingSkills = requiredSkills.filter(
    (s) => !seekerSet.has(normalizeSkillName(s)),
  );
  const preferredMatchedSkills = preferredSkills.filter((s) =>
    seekerSet.has(normalizeSkillName(s)),
  );

  return {
    stats: {
      requiredMatched: requiredMatchedSkills.length,
      preferredMatched: preferredMatchedSkills.length,
      total: requiredMatchedSkills.length + preferredMatchedSkills.length,
    },
    requiredMatchedSkills,
    requiredMissingSkills,
    preferredMatchedSkills,
  };
}

/*
 * extractJdSkills
 * When a JD arrives as free text (pasted link / no structured JobSkill rows),
 * extract required-ish skills from the text against the known Skill catalog.
 * @param jdText  - raw JD text
 * @param catalog - [{ id, name }] from prisma.skill.findMany
 * @returns string[] of matched skill names
 */
export function extractJdSkills(
  jdText: string,
  catalog: Array<{ id: string; name: string }>,
): string[] {
  return extractSkillsFromText(jdText, catalog);
}
