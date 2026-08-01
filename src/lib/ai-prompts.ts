/**
 * Central source of truth for all AI prompt templates used across Hiretivo.
 * Each prompt is typed, documented, and tuned for its specific use case.
 * Routes import from here — never inline prompts in route handlers.
 */

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

export interface MatchAnalysis {
  matched_requirements: string[];
  missing_requirements: string[];
  match_score: number;
}

export interface CoverLetterOutput {
  greeting: string;
  body_paragraphs: string[];
  closing: string;
  signoff: string;
}

export interface CoverLetterInput {
  jobTitle: string;
  company: string;
  jdText: string;
  resumeName: string;
  resumeSummary: string;
  resumeSkills: string[];
}

export function buildCoverLetterPrompt(input: CoverLetterInput): { system: string; user: string } {
  return {
    system: `You are a professional cover letter writer. Write a compelling, concise cover letter tailored to the job description and candidate profile.

Rules:
- Return ONLY a valid JSON object with exactly these keys: {"greeting": "...", "body_paragraphs": ["..."], "closing": "...", "signoff": "..."}
- greeting: A professional salutation (e.g. "Dear Hiring Team,")
- body_paragraphs: 2-3 concise paragraphs connecting the candidate's experience to the job requirements
- closing: A brief closing statement
- signoff: The candidate's name and any contact info
- No markdown, no code fences, no explanation — only valid JSON
- Keep each paragraph under 4 sentences
- Be specific to the job and company — avoid generic templates`,
    user: `Job Title: ${input.jobTitle}
Company: ${input.company}
Job Description: ${input.jdText}

Candidate Name: ${input.resumeName}
Candidate Summary: ${input.resumeSummary}
Candidate Skills: ${input.resumeSkills.join(", ")}`,
  };
}

export const SKILL_SUGGEST_CONFIG = {
  max_tokens: 350,
  temperature: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Resume Tailoring (Phase 1 — core generation engine)
// ---------------------------------------------------------------------------

export interface TailorResumePromptInput {
  resumeJson: string;  // serialized ResumeDocument
  jdText: string;
  jobSkills?: string[];
  jobTitle?: string;
}

/*
 * buildTailorResumeMessages
 * Constructs the system + user message pair for AI resume tailoring.
 * The model receives the full master resume JSON and job description,
 * then returns a tailored resume in the same Phase 0 schema shape.
 * matchMeta and missingSkills are computed server-side after generation.
 *
 * CRITICAL CONSTRAINT: the model must ONLY rewrite/reorder/rephrase data that
 * exists in the input resume. It must NEVER invent companies, titles, dates,
 * metrics, or other experience not present in the input.
 */
export function buildTailorResumeMessages(input: TailorResumePromptInput) {
  const skillsSection = input.jobSkills?.length
    ? input.jobSkills.join(", ")
    : "None extracted — infer relevant skills from the JD text below";

  return {
    system: `You are an expert resume optimiser. Your job is to tailor a candidate's resume to a specific job description — rewriting bullet points, reordering experience, and adjusting the summary to maximise keyword match — while NEVER fabricating experience that isn't in the source resume.

INPUT:
- resumeJson: the candidate's master resume (canonical JSON)
- jdText: the full job description to tailor for
- jobTitle: the target role title from the job description

OUTPUT FORMAT — CRITICAL: Return a JSON object with "resume" as the primary key. The top-level object MUST have "resume". Do NOT place resume fields directly at the top level.

RESUME SHAPE — the value of "resume" must follow this structure (truncated example):

{
  "resume": {
    "personalInfo": {
      "name": "...",
      "email": "...",
      ...
    },
    "summary": "...",
    "experience": [ ... ],
    "education": [ ... ],
    "skills": { "categories": [...] },
    "projects": [ ... ],
    "certifications": [ ... ],
    "languages": [ ... ]
  }
}

ALL resume fields go INSIDE "resume", never at the top level directly.

Modifications allowed inside the resume object:
- Rewrite bullet points to use stronger action verbs and include JD keywords naturally
- Reorder experience entries so the most relevant roles appear first
- Rewrite the summary to match the JD's tone and emphasis
- Adjust skill category order to put relevant skills first
- Assign priority (1=highest) to each bullet — used for fit-to-one-page trimming

SKILLS SECTION RULE:
- The Skills section MUST include EVERY skill present in the input resume JSON that is relevant to this job description — search the existing skills section, experience bullets, projects, and certifications, not just the skills list. If a skill from a bullet is relevant to this JD, it MUST appear in the Skills section.
- You may ONLY include skills that appear explicitly in the input resume JSON — never infer or invent skills.
- Do NOT add skills absent from the input resume even if listed in REQUIRED SKILLS or the job description.

TITLE & SUMMARY ALIGNMENT RULE:
- Compare jobTitle against the FULL breadth of the candidate's real experience in the input resume JSON — across all employment, projects, and skills — not just their current summary framing or stated job titles.
- If the candidate's real experience supports a broader or adjacent framing that better matches jobTitle (e.g. resume is titled "Frontend Developer" but experience includes backend work like Node.js APIs, Prisma, PostgreSQL, and jobTitle is "Full Stack Engineer"), rewrite the summary and reorder/re-emphasize existing bullets to reflect that broader framing.
- You are REORDERING AND REFRAMING existing truthful content. Never add new skills, technologies, accomplishments, or job titles not present in the source resume.
- If the candidate's real experience does NOT support the JD's target role framing (e.g. jobTitle is "Senior DevOps Engineer" but the resume has zero infrastructure, CI/CD, or cloud-ops experience anywhere), do NOT force the framing — keep the honest framing and let the natural match score reflect the gap.

HARD RULES:
- NEVER invent companies, titles, dates, numeric metrics, or any experience not present in the input resume
- Do NOT remove or change dates, company names, or job titles
- You may rephrase bullet text and write stronger descriptions, but the factual content (what the person did) must remain faithful to the source
- Bullet priority: 1 = most important/relevant to this JD, higher numbers = less relevant
- The resume object must include all the same top-level keys as the input (personalInfo, summary, experience, education, skills, projects, certifications, languages)
- Return valid JSON only — no markdown, no code fences, no explanation`,
    user: `=== MASTER RESUME (JSON) ===
${input.resumeJson}

=== TARGET ROLE ===
${input.jobTitle ?? "Not specified"}

=== REQUIRED SKILLS (from job description) ===
${skillsSection}

=== JOB DESCRIPTION ===
${input.jdText}

Generate the tailored resume as a single JSON object following the structure above.`,
  };
}

export const TAILOR_RESUME_CONFIG = {
  max_tokens: 4096,
  temperature: 0.3,
} as const;
