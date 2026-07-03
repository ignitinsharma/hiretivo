/**
 * Central source of truth for all AI prompt templates used across Hiretivo.
 * Each prompt is typed, documented, and tuned for its specific use case.
 * Routes import from here — never inline prompts in route handlers.
 */

import { OptimizeMode } from "@/constants/enums";
import type {
  ResumeContact,
  ResumeDocument,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeSkillGroup,
} from "@/modules/seeker/profile/types/resume-document.types";

// ---------------------------------------------------------------------------
// Candidate Summary (INT-01)
// ---------------------------------------------------------------------------

export interface CandidateSummaryInput {
  skills: string[];
  jobSkills: string[];
  matchScore: number;
  /** Deterministic verdict label derived from fitLevel by the route — never AI-decided. */
  verdictLabel: string;
  headline: string | null;
  primaryRole: string | null;
  yearsExperience: number | null;
  bio: string | null;
  recentWork: Array<{ title: string; company: string }>;
  education: { degree: string | null; institution: string | null } | null;
  jobTitle: string;
}

/**
 * Structured candidate-insight payload the model returns and the drawer renders.
 * Section strings may carry inline <mark> (matched skills) / <em> (gaps) tags —
 * they are sanitized before render. Persisted as a JSON string in Application.aiSummary.
 */
export interface AiSummaryData {
  summary: string;
  skillMatch: string;
  whyFit: string;
  areasToExplore: string;
  screeningQuestions: string[];
}

/*
 * parseCandidateSummary
 * Defensively parses a stored/generated candidate-summary string into AiSummaryData.
 * Strips optional ```json fences, validates the four section strings + questions array.
 * @param raw - Raw model output or cached DB value (may be legacy HTML)
 * @returns AiSummaryData when valid JSON of the expected shape, else null
 */
export function parseCandidateSummary(raw: string): AiSummaryData | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<AiSummaryData>;
    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.skillMatch !== "string" ||
      typeof parsed.whyFit !== "string" ||
      typeof parsed.areasToExplore !== "string" ||
      !Array.isArray(parsed.screeningQuestions)
    ) {
      return null;
    }
    return {
      summary: parsed.summary,
      skillMatch: parsed.skillMatch,
      whyFit: parsed.whyFit,
      areasToExplore: parsed.areasToExplore,
      screeningQuestions: parsed.screeningQuestions
        .filter((q): q is string => typeof q === "string")
        .slice(0, 3),
    };
  } catch {
    return null;
  }
}

/*
 * buildCandidateSummaryMessages
 * Constructs the system + user message pair for the candidate AI summary feature.
 * @param input - Candidate skills, job skills, match score, verdict, headline, and role
 * @returns { system, user } message objects for the Anthropic messages API
 */
export function buildCandidateSummaryMessages(input: CandidateSummaryInput) {
  const {
    skills,
    jobSkills,
    matchScore,
    verdictLabel,
    headline,
    primaryRole,
    yearsExperience,
    bio,
    recentWork,
    education,
    jobTitle,
  } = input;

  const skillList = skills.length > 0 ? skills.join(", ") : "No skills listed";
  const jobSkillList =
    jobSkills.length > 0 ? jobSkills.join(", ") : "Not specified";
  const headlineText = headline ?? "Not provided";
  const roleText = primaryRole ?? "Professional";
  const expText =
    yearsExperience != null
      ? `${yearsExperience} ${yearsExperience === 1 ? "year" : "years"}`
      : "Experience not specified";
  const bioText = (bio ?? "").slice(0, 1000);
  const workText =
    recentWork.length > 0
      ? recentWork.map((w) => `${w.title} at ${w.company}`).join("; ")
      : "No work history available";
  const eduText =
    education?.degree && education?.institution
      ? `${education.degree} from ${education.institution}`
      : "Education not specified";

  return {
    system: `You are an expert recruitment analyst creating decision-ready candidate insights for hiring managers screening for a specific role.

Your output must help a recruiter decide in 5 seconds whether to screen this candidate, understand the skill fit, and walk into the interview prepared.

OUTPUT FORMAT — return ONLY a valid JSON object (no markdown, no code fences, no prose outside the JSON) with EXACTLY these keys:

{
  "summary": "2 concise sentences on who this candidate is — background, current/most-recent role, level. Plain text, no tags.",
  "skillMatch": "Which required skills they match and what extra they bring. Wrap each skill that appears in the job requirements in <mark>…</mark>. Mention additional non-required skills as plain text.",
  "whyFit": "One-line rationale for the verdict, grounded in THIS job. Wrap missing / weak / must-verify skills in <em>…</em>.",
  "areasToExplore": "What's unproven or absent for this role — gaps to probe in interview. Plain text.",
  "screeningQuestions": ["exactly 3 questions, each targeting a skill gap or an unverified must-have requirement"]
}

WORKED EXAMPLE (structure + tag usage only — NEVER copy this content; always use the real candidate + job data):
{
  "summary": "Senior frontend engineer with 6 years building consumer web apps, most recently scaling a design system at Acme. Strong product sensibility, no backend track record.",
  "skillMatch": "Matches <mark>React</mark>, <mark>TypeScript</mark>, and <mark>GraphQL</mark> from the requirements. Also brings Next.js, Storybook, and accessibility expertise.",
  "whyFit": "Worth screening — strong frontend match, but no <em>PostgreSQL</em> or <em>backend</em> experience listed for a full-stack role.",
  "areasToExplore": "No evidence of backend or relational-database work; team-lead scope is unclear.",
  "screeningQuestions": [
    "Walk me through a backend service you've owned end-to-end — what database did you use?",
    "The role requires PostgreSQL; how have you worked with relational data so far?",
    "Describe the largest team you've technically led and your scope of ownership."
  ]
}

RULES:
- whyFit: BEGIN with the verdict label provided in the input VERBATIM (e.g. "Worth screening — …"). Do NOT invent or change the label. The rationale after the em dash is yours, grounded in real skills.
- skillMatch: ALWAYS wrap job-relevant required skills in <mark> tags.
- whyFit & areasToExplore: ALWAYS wrap skill gaps / things to assess in <em> tags.
- Be SPECIFIC and EVIDENCE-BASED: name real skills, companies, and roles from the data. NEVER invent seniority, achievements, or experience not present in the input.
- Be SUBSTANTIVE but tight. Fill every field — never leave one empty.
- screeningQuestions: exactly 3, each tied to a concrete gap or unverified requirement. No generic "tell me about yourself" questions.
- Never use filler phrases like "This candidate..." or "Based on their profile..."
- Mention years of experience naturally; if <2 years note early-career, if >7 years highlight seniority/leadership potential.
- ONLY allowed HTML inside string values: <mark> and <em>. No other tags. The values are otherwise plain text.
- Output the JSON object and NOTHING else.`,

    user: `=== CANDIDATE DATA ===
Headline: ${headlineText}
Primary Role: ${roleText}
Years of Experience: ${expText}
Bio: ${bioText}

=== CANDIDATE SKILLS ===
${skillList}

=== JOB REQUIREMENTS ===
Job Title: ${jobTitle}
Required Skills: ${jobSkillList}

=== CAREER HISTORY ===
${workText}

=== EDUCATION ===
${eduText}

=== MATCH SCORE ===
${matchScore}%

=== VERDICT LABEL (use verbatim as the verdict <strong> text) ===
${verdictLabel}

Generate the candidate insights as a single JSON object following the specified structure.`,
  };
}

export const CANDIDATE_SUMMARY_CONFIG = {
  max_tokens: 800,
  temperature: 0.3,
} as const;

// ---------------------------------------------------------------------------
// JD Generator (CONTEXT.md — JD Generator feature)
// ---------------------------------------------------------------------------

export interface JdGeneratorInput {
  title: string;
  shortDesc: string;
  vibe?: string;
  isRegeneration?: boolean;
}

/*
 * buildJdGeneratorMessages
 * Constructs the system + user message pair for the AI job description generator.
 * @param input - Job title, short description brief, optional vibe, and regeneration flag
 * @returns { system, user } message objects for the Anthropic messages API
 */
export function buildJdGeneratorMessages(input: JdGeneratorInput) {
  const { title, shortDesc, vibe, isRegeneration } = input;

  return {
    system: `You are a senior technical recruiter and copywriter who writes job descriptions that attract high-quality candidates while being honest and precise.

Write a complete job description as HTML. Sections MUST appear in this EXACT order, each under an <h2> heading:
1. About the Role
2. Responsibilities
3. Requirements
4. Nice to Have
5. What We Offer

SECTION CONTENT RULES:
- About the Role: a single <p>, 2–3 sentences — what the role does, why it matters, and what success looks like in the first 90 days.
- Responsibilities: <ul> with 6–8 <li>, each starting with a strong verb (Build, Design, Own, Lead, Collaborate). Concrete tasks, no vague entries.
- Requirements: <ul> with AT MOST 5 <li> — true must-haves only. Be specific ("3+ years of TypeScript", not "programming experience"). Anything beyond a genuine dealbreaker belongs in Nice to Have, not here.
- Nice to Have: <ul> with 3–5 <li> — skills that elevate a candidate but aren't dealbreakers.
- What We Offer: <ul> with 4–6 <li> covering compensation, growth, and culture. Use these placeholders EXACTLY as written where the recruiter must fill in: [SALARY RANGE], [LOCATION / REMOTE POLICY], [JOINING DATE].

WORKED EXAMPLE (structure + tone only — generate fresh content for the real role):
<h2>About the Role</h2>
<p>We're hiring a <strong>Senior Backend Engineer</strong> to own our payments platform. You'll shape architecture decisions that thousands of merchants depend on, and in your first 90 days ship a measurable reliability improvement.</p>
<h2>Responsibilities</h2>
<ul>
  <li>Design and build scalable services in <strong>Go</strong> and <strong>PostgreSQL</strong>.</li>
  <li>Own end-to-end delivery of payment features from spec to production.</li>
</ul>
<h2>Requirements</h2>
<ul>
  <li>5+ years building production backend systems.</li>
  <li>Deep experience with <strong>PostgreSQL</strong> and distributed systems.</li>
</ul>
<h2>Nice to Have</h2>
<ul>
  <li>Experience with payment rails (Stripe, Adyen).</li>
</ul>
<h2>What We Offer</h2>
<ul>
  <li>Competitive salary: [SALARY RANGE]</li>
  <li>[LOCATION / REMOTE POLICY]</li>
  <li>Start date: [JOINING DATE]</li>
</ul>

TONE & QUALITY RULES:
- Calibrate seniority to the role title: "Senior"/"Staff"/"Lead" → emphasize scope, ownership, architecture, mentorship; "Junior"/"Associate" → emphasize growth, mentorship, learning. Default to mid-level if unspecified.
- Match the vibe/culture notes if provided (default: professional and direct).
- INCLUSIVE LANGUAGE: no gendered terms ("he", "guys", "rockstar", "ninja"), no ageist phrasing, no "10+ years" walls that needlessly exclude. Avoid corporate jargon ("synergy").
- Bold every key technology on first mention with <strong> (e.g., <strong>React</strong>, <strong>PostgreSQL</strong>).
- ONLY use these HTML tags: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>.
- ${isRegeneration ? "This is a regeneration request. Write a fresh alternative draft with different phrasing and examples while preserving the same facts, constraints, section order, and HTML rules." : "This is the first draft request. Write the strongest complete JD from the provided role facts."}

Return ONLY the job description HTML — no preamble, no "Here is your JD:", no explanation. Do NOT wrap the HTML in markdown code fences.`,

    user: `Role title: ${title}
What this role is about: ${shortDesc}${vibe ? `\nCompany culture / vibe: ${vibe}` : ""}`,
  };
}

export const JD_GENERATOR_CONFIG = {
  max_tokens: 1800,
  temperature: 0.55,
} as const;

// ---------------------------------------------------------------------------
// Skill Suggestions (CONTEXT.md — Auto Skill Suggestions feature)
// ---------------------------------------------------------------------------

export interface SkillSuggestInput {
  descriptionText: string;
}

/*
 * buildSkillSuggestMessages
 * Constructs the system + user message pair for the AI skill suggestion feature.
 * @param input - Job description text (truncated to 3000 chars)
 * @returns { system, user } message objects for the Anthropic messages API
 */
export function buildSkillSuggestMessages(input: SkillSuggestInput) {
  const text = input.descriptionText.slice(0, 3000);

  return {
    system: `You are a technical skills extraction engine for a job portal.

Given a job description, extract the relevant technical skills a candidate should have, split into two tiers:
- "core": the must-have skills central to doing this job. Max 6.
- "secondary": adjacent or nice-to-have skills that strengthen a candidate but aren't dealbreakers. Max 6.

Rules:
- Return ONLY a valid JSON object with exactly these keys: {"core":[...],"secondary":[...]} — no markdown, no code fences, no explanation
- Each array contains strings only. Order each array by importance (most critical first)
- A skill must appear in only ONE tier, never both
- Skills must be specific and standardised (e.g. "TypeScript" not "type-safe JavaScript", "PostgreSQL" not "databases")
- Include hard technical skills AND relevant frameworks/tools — NOT soft skills like "communication"
- Use common industry names candidates would search for (e.g. "React" not "ReactJS", "Node.js" not "NodeJS")
- If the JD is too vague to extract skills, return {"core":[],"secondary":[]}

Example output: {"core":["TypeScript","React","Node.js","PostgreSQL"],"secondary":["Docker","AWS","GraphQL","Redis"]}`,

    user: text,
  };
}

export const SKILL_SUGGEST_CONFIG = {
  max_tokens: 350,
  temperature: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Resume Parse (Pivot Phase 1c — progressive onboarding)
// ---------------------------------------------------------------------------

export interface ResumeParseInput {
  resumeText: string;
}

/*
 * buildResumeParseMessages
 * System+user messages instructing the model to extract a structured profile
 * from raw resume text. Extraction only — NEVER fabricate. Empty over invented.
 * @param input - { resumeText } (caller truncates to a safe length)
 * @returns { system, user } for openrouter.chat.completions
 */
export function buildResumeParseMessages(input: ResumeParseInput) {
  const text = input.resumeText.slice(0, 12000);

  return {
    system: `You are a resume extraction engine. Extract ONLY information explicitly present in the resume text. NEVER fabricate, guess, or embellish — if a field is not present, leave it empty rather than inventing a value.

Return ONLY a valid JSON object with exactly these keys: {"fullName":"","headline":"","bio":"","primaryRole":"","location":"","skills":[],"workExperiences":[],"educations":[]} — no markdown, no code fences, no explanation.

Rules:
- "fullName": the candidate's name as it appears on the resume
- "headline": a short professional title/tagline if present (e.g. "Senior Backend Engineer"), else ""
- "bio": a short professional summary drawn ONLY from an existing summary/objective section, else ""
- "primaryRole": the candidate's most recent or most prominent job title
- "location": city/region/country as stated, else ""
- "skills": array of skill strings exactly as named in the resume (max 50)
- "workExperiences": array of { "company", "title", "startDate", "endDate", "isCurrent", "description" }. Dates are free-text as written on the resume (e.g. "Jan 2021", "2021"). "endDate" is null and "isCurrent" is true only if the resume says "Present"/"Current". "description" is a short summary of responsibilities, or null.
- "educations": array of { "institution", "degree", "major", "graduationDate" }. Any missing sub-field is null.
- Every field tolerates being empty/null — never invent a company, date, or credential that isn't in the text.`,

    user: text,
  };
}

/* temperature 0 — extraction, not generation. */
export const RESUME_PARSE_CONFIG = {
  max_tokens: 2000,
  temperature: 0,
} as const;

// ---------------------------------------------------------------------------
// Resume Optimize + Cover Letter (Pivot Phase 4 — apply-faster wizard)
// ---------------------------------------------------------------------------

/*
 * SeekerProfileForAi
 * The seeker-side context fed to both prompts. Reuses the Phase 3b resume
 * building blocks (ResumeContact/ResumeSkillGroup/ResumeProject) instead of
 * redefining shapes — this IS the seeker's real, non-fabricatable data.
 */
export interface SeekerProfileForAi {
  fullName: string;
  headline: string | null;
  primaryRole: string | null;
  yearsExperience: number | null;
  bio: string | null;
  location: string | null;
  contact: ResumeContact;
  skillGroups: ResumeSkillGroup[];
  workExperiences: Array<{
    company: string;
    title: string;
    startDate: string; // "MM/YYYY"
    endDate: string | null; // null = current
    description: string | null;
  }>;
  educations: Array<{
    institution: string;
    degree: string | null;
    major: string | null;
    graduationDate: string | null;
  }>;
  certifications: Array<{ name: string; issuer?: string; issueDate?: string }>;
  projects: ResumeProject[];
}

export interface JobForAi {
  title: string;
  company: string;
  descriptionText: string; // JD plain text
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface ResumeOptimizeInput {
  profile: SeekerProfileForAi;
  job: JobForAi;
  matchedSkills: string[]; // from computeKeywordStats — weight these
  missingSkills: string[]; // from computeKeywordStats — DO NOT fabricate; may surface as gaps
  tone: OptimizeMode;
}

export interface CoverLetterInput {
  profile: SeekerProfileForAi;
  job: JobForAi;
  matchedSkills: string[];
  tone: OptimizeMode;
}

const HONESTY_GUARDRAIL = `HONESTY INVARIANT (never break this, no exceptions):
- NEVER invent employers, job titles, dates, degrees, institutions, or skills that are not present in the candidate data below.
- You MAY reorder, re-emphasize, rephrase, and quantify REAL experience to better match the job. You may NOT fabricate metrics, outcomes, or responsibilities not implied by the real description.
- Missing skills listed below are gaps — you may acknowledge transferable/adjacent real experience, but never claim the candidate has a skill absent from their profile.
- "Tailor, never fabricate" is the product's core promise to the candidate and their future employer.`;

function formatProfileForPrompt(profile: SeekerProfileForAi): string {
  const skillsText = profile.skillGroups
    .map((g) => `${g.category}: ${g.skills.join(", ")}`)
    .join("\n");
  const experienceText = profile.workExperiences
    .map(
      (e) =>
        `- ${e.title} at ${e.company} (${e.startDate} – ${e.endDate ?? "Present"}): ${e.description ?? "No description provided"}`,
    )
    .join("\n");
  const educationText = profile.educations
    .map((e) => `- ${e.degree ?? "Degree"} ${e.major ? `in ${e.major}` : ""} — ${e.institution} (${e.graduationDate ?? "n/a"})`)
    .join("\n");
  const certificationsText = profile.certifications
    .map((c) => `- ${c.name}${c.issuer ? ` (${c.issuer})` : ""}${c.issueDate ? `, ${c.issueDate}` : ""}`)
    .join("\n");
  const projectsText = profile.projects
    .map((p) => `- ${p.title}${p.description ? `: ${p.description}` : ""}`)
    .join("\n");

  return `Full name: ${profile.fullName}
Headline: ${profile.headline ?? "Not provided"}
Primary role: ${profile.primaryRole ?? "Not provided"}
Years of experience: ${profile.yearsExperience ?? "Not provided"}
Location: ${profile.location ?? "Not provided"}
Bio: ${profile.bio ?? "Not provided"}

SKILLS (real, do not add to this list):
${skillsText || "None listed"}

WORK EXPERIENCE (real — tailor phrasing only, never invent entries):
${experienceText || "None listed"}

EDUCATION (real):
${educationText || "None listed"}

CERTIFICATIONS (real):
${certificationsText || "None listed"}

PROJECTS (real):
${projectsText || "None listed"}`;
}

function formatJobForPrompt(job: JobForAi): string {
  return `Job title: ${job.title}
Company: ${job.company}
Required skills: ${job.requiredSkills.join(", ") || "Not specified"}
Preferred skills: ${job.preferredSkills.join(", ") || "Not specified"}

Job description:
${job.descriptionText.slice(0, 6000)}`;
}

/*
 * buildResumeOptimizeMessages
 * Constructs the system + user message pair for JD-tailored resume
 * generation. Model must return ONLY a JSON object matching ResumeDocument
 * (Phase 3b's contract — reordered/reworded from real data, never fabricated).
 * @param input - seeker profile, job, matched/missing skills, tone
 * @returns { system, user } message objects for the chat completions API
 */
export function buildResumeOptimizeMessages(input: ResumeOptimizeInput): {
  system: string;
  user: string;
} {
  const { profile, job, matchedSkills, missingSkills, tone } = input;
  const toneInstruction =
    tone === OptimizeMode.AGGRESSIVE
      ? "AGGRESSIVE tone: use strong action verbs and confident, achievement-forward framing — still 100% truthful, never overstated beyond what the real description supports."
      : "HONEST tone: plain, factual, understated phrasing — state accomplishments directly without embellishment.";

  return {
    system: `You are an expert resume writer tailoring a candidate's REAL resume to a specific job description.

${HONESTY_GUARDRAIL}

OUTPUT FORMAT — return ONLY a valid JSON object (no markdown, no code fences, no prose outside the JSON) with EXACTLY these keys, matching this shape:
{
  "fullName": string,
  "headline": string,
  "contact": { "email"?: string, "location"?: string, "websiteUrl"?: string, "linkedinUrl"?: string, "githubUrl"?: string },
  "summary": string,
  "skillGroups": [{ "category": string, "skills": string[] }],
  "experience": [{ "company": string, "title": string, "startDate": string, "endDate": string | null, "isCurrent": boolean, "bullets": string[] }],
  "education": [{ "institution": string, "degree"?: string, "major"?: string, "graduationDate"?: string }],
  "certifications": [{ "name": string, "issuer"?: string, "issueDate"?: string }],
  "projects": [{ "title": string, "url"?: string, "description"?: string }]
}

WORKED EXAMPLE (structure only — never copy this content; always use the real candidate + job data):
{
  "fullName": "Jordan Lee",
  "headline": "Senior Backend Engineer",
  "contact": { "email": "jordan@example.com", "location": "Remote" },
  "summary": "Backend engineer with 6 years building scalable payment systems, direct hands-on experience with the required Postgres and distributed-systems stack.",
  "skillGroups": [{ "category": "Engineering", "skills": ["PostgreSQL", "Go", "Kubernetes"] }],
  "experience": [{ "company": "Acme", "title": "Backend Engineer", "startDate": "01/2021", "endDate": null, "isCurrent": true, "bullets": ["Owned payments service handling 2M transactions/day on PostgreSQL", "Led migration to Kubernetes reducing deploy time 40%"] }],
  "education": [{ "institution": "State University", "degree": "B.S. Computer Science" }],
  "certifications": [],
  "projects": []
}

TAILORING RULES:
- Reorder each skillGroup's "skills" array so JD-matched skills (${matchedSkills.join(", ") || "none"}) appear first — never add or remove skills from what's listed in the candidate data.
- Rewrite each experience's bullets from the REAL description, quantifying and emphasizing JD-relevant work. Never invent numbers/outcomes not implied by the real text.
- "summary" is a 2-3 sentence professional summary tailored to this job, grounded in the real background.
- ${toneInstruction}
- Gaps for these skills exist and must NOT be claimed as candidate strengths: ${missingSkills.join(", ") || "none"}.
- "contact", "education", "certifications", "projects" pass through unchanged from the candidate data except omitting empty optional fields.
- Output the JSON object and NOTHING else.`,

    user: `=== CANDIDATE (REAL DATA — do not deviate) ===
${formatProfileForPrompt(profile)}

=== TARGET JOB ===
${formatJobForPrompt(job)}

Generate the tailored resume as a single JSON object following the specified ResumeDocument structure.`,
  };
}

/*
 * buildCoverLetterMessages
 * Constructs the system + user message pair for a JD-specific cover letter.
 * Output is plain prose (no JSON, no markdown fences) — used directly.
 * @param input - seeker profile, job, matched skills, tone
 * @returns { system, user } message objects for the chat completions API
 */
export function buildCoverLetterMessages(input: CoverLetterInput): {
  system: string;
  user: string;
} {
  const { profile, job, matchedSkills, tone } = input;
  const toneInstruction =
    tone === OptimizeMode.AGGRESSIVE
      ? "AGGRESSIVE tone: confident, achievement-forward, still fully truthful."
      : "HONEST tone: warm, direct, understated — no overselling.";

  return {
    system: `You are writing a short, JD-specific cover letter on behalf of a job candidate.

${HONESTY_GUARDRAIL}

FORMAT:
- 3-4 short paragraphs of plain prose. No markdown, no code fences, no bullet points, no headers.
- Address the letter to "${job.company}" (no "Dear Hiring Manager" placeholder text beyond that).
- Reference 2-3 of these matched skills, tied to specific REAL experience: ${matchedSkills.join(", ") || "the candidate's relevant background"}.
- ${toneInstruction}
- End with a brief, direct closing (no generic "I look forward to hearing from you" filler beyond one short sentence).
- Output the letter text and NOTHING else — no subject line, no signature block beyond the candidate's name.`,

    user: `=== CANDIDATE (REAL DATA — do not deviate) ===
${formatProfileForPrompt(profile)}

=== TARGET JOB ===
${formatJobForPrompt(job)}

Write the cover letter now.`,
  };
}

export const RESUME_OPTIMIZE_CONFIG = { max_tokens: 2200, temperature: 0.3 } as const;
export const COVER_LETTER_CONFIG = { max_tokens: 900, temperature: 0.5 } as const;

/*
 * parseResumeDocument
 * Defensively parses model output into a Phase-3b-compatible ResumeDocument.
 * Strips optional ```json fences, validates every required field/array shape
 * (mirroring parseCandidateSummary), coerces optional fields, drops malformed
 * array entries rather than failing the whole document.
 * @param raw - raw model output (should be a JSON object, may have fences)
 * @returns ResumeDocument when valid, else null
 */
export function parseResumeDocument(raw: string): ResumeDocument | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<ResumeDocument>;

    if (typeof parsed.fullName !== "string" || !parsed.fullName.trim()) return null;
    if (!Array.isArray(parsed.skillGroups)) return null;
    if (!Array.isArray(parsed.experience)) return null;
    if (!Array.isArray(parsed.education)) return null;
    if (!Array.isArray(parsed.certifications)) return null;
    if (!Array.isArray(parsed.projects)) return null;

    const skillGroups: ResumeSkillGroup[] = parsed.skillGroups
      .filter(
        (g): g is ResumeSkillGroup =>
          typeof g === "object" &&
          g !== null &&
          typeof (g as ResumeSkillGroup).category === "string" &&
          Array.isArray((g as ResumeSkillGroup).skills),
      )
      .map((g) => ({
        category: g.category,
        skills: g.skills.filter((s): s is string => typeof s === "string"),
      }));

    const experience: ResumeExperience[] = parsed.experience
      .filter(
        (e): e is ResumeExperience =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as ResumeExperience).company === "string" &&
          typeof (e as ResumeExperience).title === "string" &&
          typeof (e as ResumeExperience).startDate === "string" &&
          Array.isArray((e as ResumeExperience).bullets),
      )
      .map((e) => ({
        company: e.company,
        title: e.title,
        startDate: e.startDate,
        endDate: typeof e.endDate === "string" ? e.endDate : null,
        isCurrent: Boolean(e.isCurrent),
        bullets: e.bullets.filter((b): b is string => typeof b === "string"),
      }));

    const education: ResumeEducation[] = parsed.education
      .filter(
        (e): e is ResumeEducation =>
          typeof e === "object" && e !== null && typeof (e as ResumeEducation).institution === "string",
      )
      .map((e) => ({
        institution: e.institution,
        degree: typeof e.degree === "string" ? e.degree : undefined,
        major: typeof e.major === "string" ? e.major : undefined,
        graduationDate: typeof e.graduationDate === "string" ? e.graduationDate : undefined,
      }));

    const certifications = parsed.certifications.filter(
      (c): c is ResumeDocument["certifications"][number] =>
        typeof c === "object" && c !== null && typeof (c as { name?: unknown }).name === "string",
    );

    const projects = parsed.projects.filter(
      (p): p is ResumeDocument["projects"][number] =>
        typeof p === "object" && p !== null && typeof (p as { title?: unknown }).title === "string",
    );

    const contact: ResumeContact =
      typeof parsed.contact === "object" && parsed.contact !== null ? parsed.contact : {};

    return {
      fullName: parsed.fullName,
      headline: typeof parsed.headline === "string" ? parsed.headline : undefined,
      contact,
      summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
      skillGroups,
      experience,
      education,
      certifications,
      projects,
    };
  } catch {
    return null;
  }
}
