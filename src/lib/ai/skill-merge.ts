import { uniqueCanonicalSkillNames, slugifySkillName } from "@/lib/skills/canonicalize";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

/*
 * Common English words and resume boilerplate that are never skills.
 * A capitalized token in this list is a sentence-leading word, not a keyword.
 */
const STOPLIST = new Set([
  "the", "and", "with", "using", "for", "from", "into", "that", "this", "their",
  "team", "role", "work", "project", "projects", "including", "such", "experience",
  "years", "year", "company", "managed", "management", "responsible", "build",
  "built", "develop", "developed", "design", "designed", "lead", "led", "support",
  "supported", "ensure", "improve", "improved", "help", "helped", "create",
  "created", "customer", "customers", "client", "clients", "business", "product",
  "system", "systems", "data", "new", "old", "first", "last", "level", "senior",
  "junior", "daily", "monthly", "quarterly", "end", "end-to-end", "production",
  "environment", "cross-functional", "agile", "scrum", "planning", "delivery",
  "process", "processes", "quality", "best", "practices", "version", "code",
  "deploy", "deployed", "review", "release", "releases", "service", "services",
  "application", "applications", "user", "users", "feature", "features",
  "internal", "external", "high", "low", "performance", "availability",
  "security", "testing", "tested", "tests", "automation", "automated", "tools",
  "tool", "platform", "platforms", "solutions", "solution", "implementation",
  "implemented", "implementing", "integration", "integrated", "architecture",
  "architect", "optimization", "optimize", "optimized", "scalability", "scalable",
  "reliability", "reliable", "maintain", "maintained", "maintenance",
  "coordinate", "coordinated", "collaborate", "collaborated", "communicate",
  "communication", "stakeholder", "stakeholders", "vendor", "vendors", "report",
  "reports", "reporting", "analytics", "analysis", "analyst", "operations",
  "operational", "infrastructure", "network", "database", "databases",
  "frontend", "front-end", "backend", "back-end", "fullstack", "full-stack",
  "web", "mobile", "desktop", "software", "hardware", "technology",
  "technologies", "programming", "language", "computer", "science", "degree",
  "bachelor", "master", "certification", "certified",
]);

const MAX_ADDED_SKILLS = 40;

/*
 * mergeExtractedSkills
 * Safety net: harvests skill-like tokens (capitalized words, not sentence
 * starts, not stoplist words) from experience/project bullets and the summary,
 * and appends any not already listed to the "Tools & Technologies" category.
 * Guarantees keywords surface as skills even when the model omits them.
 * // ponytail: heuristic — may occasionally add a proper noun; skills are
 * // user-editable, and the exhaustive prompt is the primary fix.
 * @param doc - parsed ResumeDocument
 * @returns a new ResumeDocument with merged skills; input is untouched
 */
export function mergeExtractedSkills(doc: ResumeDocument): ResumeDocument {
  const existing = new Set(
    doc.skills.categories.flatMap((c) => c.items).map((s) => slugifySkillName(s)),
  );
  const candidates: string[] = [];

  const scan = (text: string) => {
    const tokens = text.match(/[A-Z][A-Za-z0-9+#.()-]{1,31}/g) ?? [];
    for (const raw of tokens) {
      const word = raw.trim();
      if (word.length < 2 || word.length > 32) continue;
      if (STOPLIST.has(word.toLowerCase())) continue;
      candidates.push(word);
    }
  };

  doc.experience.forEach((exp) => exp.bullets.forEach((b) => scan(b.text)));
  doc.projects.forEach((p) => p.bullets.forEach((b) => scan(b.text)));
  scan(doc.summary);

  const fresh = uniqueCanonicalSkillNames(candidates).filter(
    (s) => !existing.has(slugifySkillName(s)),
  );

  if (fresh.length === 0) return doc;

  const categories = [...doc.skills.categories];
  const toolsCat = categories.find(
    (c) => c.name.toLowerCase().includes("tool") || c.name.toLowerCase().includes("technolog"),
  );
  const items = uniqueCanonicalSkillNames(
    (toolsCat?.items ?? []).concat(fresh.slice(0, MAX_ADDED_SKILLS)),
  );
  const merged = categories.filter((c) => c !== toolsCat);
  merged.push({ name: toolsCat?.name ?? "Tools & Technologies", items });

  return { ...doc, skills: { categories: merged } };
}
