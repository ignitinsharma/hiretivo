export interface JobSkillInput {
  name: string;
}

export interface ResumeMatchResult {
  matchScore: number;
  requiredSkillsMatched: number;
  requiredSkillsTotal: number;
  preferredSkillsMatched: number;
  preferredSkillsTotal: number;
  addedKeywords: string[];
  missingKeywords: string[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBlob(
  tailoredResume: {
    summary: string;
    experience: { bullets: string[] }[];
    skills: { categories: { items: string[] }[] };
  },
): string {
  const summary = tailoredResume.summary ?? "";
  const bulletText = (tailoredResume.experience ?? [])
    .flatMap((exp) => exp.bullets ?? [])
    .join(" ");
  const skillItems = (tailoredResume.skills?.categories ?? [])
    .flatMap((cat) => cat.items ?? [])
    .join(" ");
  return [summary, bulletText, skillItems].join(" ").toLowerCase();
}

function appearsInText(skillName: string, text: string): boolean {
  const escaped = escapeRegex(skillName);
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function computeResumeMatch(
  tailoredResume: {
    summary: string;
    experience: { bullets: string[] }[];
    skills: { categories: { items: string[] }[] };
  },
  jobSkills: JobSkillInput[],
  masterResumeSkillNames: string[],
): ResumeMatchResult {
  if (jobSkills.length === 0) {
    return {
      matchScore: 0,
      requiredSkillsMatched: 0,
      requiredSkillsTotal: 0,
      preferredSkillsMatched: 0,
      preferredSkillsTotal: 0,
      addedKeywords: [],
      missingKeywords: [],
    };
  }

  const blob = buildBlob(tailoredResume);
  const masterSkillLower = masterResumeSkillNames.map((s) => s.toLowerCase());

  const addedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  let requiredMatched = 0;

  for (const js of jobSkills) {
    const found = appearsInText(js.name, blob);
    if (found) {
      requiredMatched++;
      if (!masterSkillLower.includes(js.name.toLowerCase())) {
        addedKeywords.push(js.name);
      }
    } else {
      missingKeywords.push(js.name);
    }
  }

  const totalRequired = jobSkills.length;
  const matchScore =
    totalRequired === 0
      ? 0
      : Math.round((requiredMatched / totalRequired) * 100);

  return {
    matchScore,
    requiredSkillsMatched: requiredMatched,
    requiredSkillsTotal: totalRequired,
    preferredSkillsMatched: 0,
    preferredSkillsTotal: 0,
    addedKeywords,
    missingKeywords,
  };
}
