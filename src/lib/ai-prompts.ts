/**
 * Central source of truth for all AI prompt templates used across Hiretivo.
 * Each prompt is typed, documented, and tuned for its specific use case.
 * Routes import from here — never inline prompts in route handlers.
 */

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
