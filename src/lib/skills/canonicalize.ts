const EXPLICIT_SKILL_ALIASES: Record<string, string> = {
  "reactjs": "React",
  "react.js": "React",
  "react js": "React",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "node js": "Node.js",
  "nextjs": "Next.js",
  "next.js": "Next.js",
  "next js": "Next.js",
  "backend": "Backend",
  "back-end": "Backend",
  "back end": "Backend",
  "ecommerce": "E-Commerce",
  "e-commerce": "E-Commerce",
  "e commerce": "E-Commerce",
};

/*
 * normalizeSkillInput
 * Trims and collapses whitespace in user-entered skill names.
 */
export function normalizeSkillInput(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/*
 * canonicalizeSkillName
 * Applies explicit semantic aliases while preserving unknown skill names.
 * Aliases are intentionally explicit so C# and C++ are never collapsed.
 */
export function canonicalizeSkillName(name: string): string {
  const normalizedName = normalizeSkillInput(name);
  const aliasKey = normalizedName.toLowerCase();
  return EXPLICIT_SKILL_ALIASES[aliasKey] ?? normalizedName;
}

/*
 * slugifySkillName
 * Converts a canonical skill name into a stable URL-safe slug.
 */
export function slugifySkillName(name: string): string {
  const normalizedName = canonicalizeSkillName(name);
  const slug = normalizedName
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `skill-${Array.from(normalizedName)
    .map((character) => character.codePointAt(0)?.toString(36) ?? "")
    .filter(Boolean)
    .join("-")}`;
}

/*
 * uniqueCanonicalSkillNames
 * Deduplicates after canonicalization while preserving first-seen order.
 */
export function uniqueCanonicalSkillNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  names.forEach((name) => {
    const canonicalName = canonicalizeSkillName(name);
    const key = slugifySkillName(canonicalName);
    if (!canonicalName || seen.has(key)) return;
    seen.add(key);
    result.push(canonicalName);
  });

  return result;
}
