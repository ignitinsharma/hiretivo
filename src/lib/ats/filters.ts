import { createHash } from 'crypto';

/*
 * computeDescriptionHash
 * Generates a SHA256 hash from job description and metadata.
 * @param job - object with description, location, salaryMin, salaryMax, workType
 * @returns hex string hash
 */
export function computeDescriptionHash(job: {
  description: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  workType: string;
}): string {
  const payload = `${job.description}|${job.location}|${job.salaryMin}|${job.salaryMax}|${job.workType}`;
  return createHash('sha256').update(payload).digest('hex');
}

const TECH_TITLE_KEYWORDS = [
  'software engineer', 'swe', 'frontend', 'front-end', 'front end',
  'backend', 'back-end', 'back end', 'fullstack', 'full-stack', 'full stack',
  'devops', 'sre', 'site reliability', 'data scientist', 'data engineer',
  'data analyst', 'ml engineer', 'ai engineer', 'machine learning',
  'qa engineer', 'quality assurance', 'security engineer', 'platform engineer',
  'cloud engineer', 'infrastructure engineer', 'systems engineer',
  'network engineer', 'database engineer', 'mobile developer',
  'ios engineer', 'android engineer', 'web developer', 'web engineer',
  'product engineer', 'solutions architect', 'tech lead',
  'engineering manager', 'staff engineer', 'principal engineer',
  'growth engineer', 'data infrastructure',
  'product manager', 'product designer', 'ux designer', 'ui designer',
  'ux researcher', 'design engineer', 'developer advocate', 'devrel',
];

const EXECUTIVE_PREFIXES = ['vp ', 'chief ', 'director of ', 'head of '];

const TECH_DEPARTMENTS = [
  'engineering', 'product', 'design', 'data', 'technology',
  'security', 'infrastructure', 'research', 'development',
];

/*
 * isTechRole
 * Determines if a job is a technology role based on title, department, and extracted skills.
 * @param title - job title
 * @param department - job department (nullable)
 * @param extractedSkillNames - list of extracted skill names
 * @returns true if role is technology-focused
 */
export function isTechRole(
  title: string,
  department: string | null,
  extractedSkillNames: string[],
): boolean {
  const lowerTitle = title.toLowerCase().trim();

  // Check title keywords
  const titleMatch = TECH_TITLE_KEYWORDS.some((kw) => lowerTitle.includes(kw));
  if (titleMatch) return true;

  // Check department
  if (department) {
    const lowerDept = department.toLowerCase();
    if (TECH_DEPARTMENTS.some((d) => lowerDept.includes(d))) return true;
  }

  // Check extracted skills — if 2+ tech skills found, it's a tech role
  const techSkillCount = extractedSkillNames.filter((s) =>
    ['typescript', 'python', 'javascript', 'react', 'go', 'rust', 'java',
     'kubernetes', 'docker', 'aws', 'sql', 'node.js', 'html', 'css',
     'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'tensorflow',
     'pytorch', 'git', 'terraform', 'ansible', 'graphql', 'api',
     'redis', 'postgresql', 'mongodb', 'linux', 'bash', 'shell',
     'machine learning', 'deep learning', 'nlp', 'data pipeline',
     'ci/cd', 'microservices', 'rest', 'agile', 'scrum',
    ].includes(s.toLowerCase()),
  ).length;

  return techSkillCount >= 2;
}

/*
 * meetsQualityBar
 * Determines if a job posting meets quality criteria for inclusion in the feed.
 * Checks: description length, skill count, location classification, job type,
 * and role type (tech vs. non-tech/executive).
 * @param title - job title
 * @param description - job description
 * @param department - job department (nullable)
 * @param extractedSkillNames - list of extracted skill names
 * @param locationClass - location classification (nullable or undefined)
 * @param jobType - job type (e.g., INTERNSHIP, FULL_TIME)
 * @returns true if job meets quality bar
 */
export function meetsQualityBar(
  title: string,
  description: string,
  department: string | null,
  extractedSkillNames: string[],
  locationClass: string | null | undefined,
  jobType: string,
): boolean {
  // Must have description
  if (!description || description.length < 100) return false;

  // Must have at least 2 skills extracted
  if (extractedSkillNames.length < 2) return false;

  // Location must be classifiable
  if (!locationClass || locationClass === 'unknown') return false;

  // Skip internships
  if (jobType === 'INTERNSHIP') return false;

  // Must be a tech role
  if (!isTechRole(title, department, extractedSkillNames)) return false;

  // Skip pure executive titles (unless department confirms it's engineering)
  const lowerTitle = title.toLowerCase().trim();
  const isExecutiveTitle = EXECUTIVE_PREFIXES.some((p) => lowerTitle.startsWith(p));
  if (isExecutiveTitle && department) {
    const lowerDept = department.toLowerCase();
    const isTechDept = TECH_DEPARTMENTS.some((d) => lowerDept.includes(d));
    if (!isTechDept) return false;
  } else if (isExecutiveTitle && !department) {
    return false;
  }

  return true;
}
