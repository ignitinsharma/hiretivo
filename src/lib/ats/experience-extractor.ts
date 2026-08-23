import { ExperienceLevel } from "@/constants/enums";

/*
 * EXPERIENCE_SIGNALS — keyword sets per level. Checked LEAD → SENIOR → MID → ENTRY.
 */

const ENTRY_PATTERNS: RegExp[] = [
  /\bjunior\b/i,
  /\bentry[\s-]?level\b/i,
  /\bnew\s+grad\b/i,
  /\b0[-\s]?2\s+years?\b/i,
  /\b1\+?\s+years?\b/i,
];

const MID_PATTERNS: RegExp[] = [
  /\bmid[-\s]?level\b/i,
  /\bintermediate\b/i,
  /\b[23]\+?\s+years?\b/i,
  /\b4\+?\s+years?\b/i,
];

const SENIOR_PATTERNS: RegExp[] = [
  /\bsenior\b/i,
  /\bsr\.?\b/i,
  /\b[567]\+?\s+years?\b/i,
];

const LEAD_PATTERNS: RegExp[] = [
  /\blead\b/i,
  /\bstaff\b/i,
  /\bprincipal\b/i,
  /\bmanager\b/i,
  /\bhead\s+of\b/i,
  /\b[89]\+?\s+years?\b/i,
  /\b1\d\+?\s+years?\b/i,
];

const LEVEL_ORDER: Array<{ level: ExperienceLevel; patterns: RegExp[] }> = [
  { level: ExperienceLevel.LEAD, patterns: LEAD_PATTERNS },
  { level: ExperienceLevel.SENIOR, patterns: SENIOR_PATTERNS },
  { level: ExperienceLevel.MID, patterns: MID_PATTERNS },
  { level: ExperienceLevel.ENTRY, patterns: ENTRY_PATTERNS },
];

/*
 * detectExperienceLevel
 * Infers experience level from title (strongest) and description fallback.
 * Title is checked first across all levels; description only if title gives nothing.
 */
export function detectExperienceLevel(title: string, description: string): ExperienceLevel | null {
  const titleText = title ?? "";
  const descText = description ?? "";
  if (!titleText && !descText) return null;
  for (const { level, patterns } of LEVEL_ORDER) {
    if (patterns.some((p) => p.test(titleText))) return level;
  }
  for (const { level, patterns } of LEVEL_ORDER) {
    if (patterns.some((p) => p.test(descText))) return level;
  }
  return null;
}
