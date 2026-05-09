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
  headline: string | null;
  primaryRole: string | null;
  yearsExperience: number | null;
  bio: string | null;
  recentWork: Array<{ title: string; company: string }>;
  education: { degree: string | null; institution: string | null } | null;
  jobTitle: string;
}

export function buildCandidateSummaryMessages(input: CandidateSummaryInput) {
  const {
    skills,
    jobSkills,
    matchScore,
    headline,
    primaryRole,
    yearsExperience,
    bio,
    recentWork,
    education,
    jobTitle,
  } = input;

  const skillList = skills.length > 0 ? skills.join(', ') : 'No skills listed';
  const jobSkillList = jobSkills.length > 0 ? jobSkills.join(', ') : 'Not specified';
  const headlineText = headline ?? 'Not provided';
  const roleText = primaryRole ?? 'Professional';
  const expText = yearsExperience != null
    ? `${yearsExperience} ${yearsExperience === 1 ? 'year' : 'years'}`
    : 'Experience not specified';
  const bioText = bio ?? '';
  const workText = recentWork.length > 0
    ? recentWork
        .map((w) => `${w.title} at ${w.company}`)
        .join('; ')
    : 'No work history available';
  const eduText = education?.degree && education?.institution
    ? `${education.degree} from ${education.institution}`
    : 'Education not specified';

  return {
    system: `You are an expert recruitment analyst creating comprehensive, insightful candidate profiles for hiring managers.

Create a rich, detailed candidate summary in HTML format. The summary should help recruiters quickly understand:
1. Who this candidate is professionally
2. How well their skills match the job requirements
3. Their career trajectory and highlights
4. Any notable gaps or areas to explore

OUTPUT FORMAT (use EXACT HTML structure):
<div class="summary-container">
  <p class="summary-header"><strong>{roleText}</strong> — {expText}</p>
  <p class="summary-intro">{1-2 sentence professional overview based on headline, bio, and career trajectory}</p>
  <p class="summary-skills"><span class="matched-skills">{matched skills with <mark>skill</mark> tags}</span>. <span class="additional-skills">{additional relevant skills from profile that weren't explicitly required}</span>.</p>
  <p class="summary-career">Career highlights: {work history summary}. {one key strength or achievement}</p>
  {if gaps exist: <p class="summary-gaps">Areas to explore: <em>{1-2 notable skill gaps or areas needing assessment}</em></p>}
</div>

RULES:
- ALWAYS use <mark> tags around skills that are relevant to the job
- ALWAYS use <strong> tags for the candidate's role/designation
- ALWAYS use <em> tags for skill gaps or areas needing assessment
- Be SPECIFIC: mention actual skill names, companies, and technologies
- Be SUBSTANTIVE: 3-4 paragraphs, not one sentence
- Never use filler phrases like "This candidate..." or "Based on their profile..."
- Focus on what makes this candidate unique or noteworthy
- Compare candidate skills against the job requirements
- Mention years of experience naturally in context
- If experience is <2 years, note it's an early-career role
- If experience is >7 years, highlight seniority and leadership potential
- Output HTML only — no markdown, no explanations outside the HTML`,

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

Generate the candidate summary in HTML format following the specified structure.`,
  };
}

export const CANDIDATE_SUMMARY_CONFIG = {
  max_tokens: 600,
  temperature: 0.3,
} as const;

// ---------------------------------------------------------------------------
// JD Generator (CONTEXT.md — JD Generator feature)
// ---------------------------------------------------------------------------

export interface JdGeneratorInput {
  title: string;
  shortDesc: string;
  vibe?: string;
}

export function buildJdGeneratorMessages(input: JdGeneratorInput) {
  const { title, shortDesc, vibe } = input;

  return {
    system: `You are a senior technical recruiter and copywriter who writes job descriptions that attract high-quality candidates while being honest and precise.

Write a complete, professional job description using EXACTLY this HTML structure:

<h2>About the Role</h2>
<p>2–3 sentences. What the role does, why it matters to the company, and what success looks like in 90 days.</p>

<h2>Responsibilities</h2>
<ul>
  <li>Build and maintain...</li>
  <li>Design and architect...</li>
</ul>
6–8 bullet points. Concrete, action-oriented tasks. Start each with a strong verb (Build, Design, Own, Lead, Collaborate). No vague entries.

<h2>Requirements</h2>
<ul>
  <li>3+ years of TypeScript...</li>
  <li>Experience with React and Node.js...</li>
</ul>
5–7 bullet points. Must-have technical skills and experience. Be specific (e.g., "3+ years of TypeScript" not "programming experience"). Use [YEARS OF EXPERIENCE] as a placeholder where appropriate.

<h2>Nice to Have</h2>
<ul>
  <li>Experience with GraphQL...</li>
  <li>Open source contributions...</li>
</ul>
3–5 bullet points. Skills that would elevate the candidate but aren't dealbreakers.

<h2>What We Offer</h2>
<ul>
  <li>Competitive salary: [SALARY RANGE]</li>
  <li>[LOCATION / REMOTE POLICY]</li>
  <li>Start date: [JOINING DATE]</li>
  <li>...</li>
</ul>
4–6 bullet points covering compensation, growth, and culture. Use these placeholders exactly as written.

Tone rules:
- Match the vibe/culture notes provided (default: professional and direct)
- Avoid corporate jargon ("synergy", "rockstar", "ninja")
- Write for a senior engineer audience — be specific, not hyperbolic
- Use <strong> tags to highlight key technologies, tools, and important qualifications
- Bold every key technology name on first mention (e.g., <strong>React</strong>, <strong>TypeScript</strong>, <strong>PostgreSQL</strong>)
- Use HTML tags exactly as shown above: <h2> for headings, <p> for paragraphs, <ul>/<li> for bullet lists
- ONLY use these HTML tags: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>
- Make it scannable: use clear section breaks, strong section headings, and bold key terms

Return ONLY the job description HTML — no preamble, no "Here is your JD:", no explanation.`,

    user: `Role title: ${title}
What this role is about: ${shortDesc}${vibe ? `\nCompany culture / vibe: ${vibe}` : ''}`,
  };
}

export const JD_GENERATOR_CONFIG = {
  max_tokens: 1000,
  temperature: 0.55,
} as const;

// ---------------------------------------------------------------------------
// Skill Suggestions (CONTEXT.md — Auto Skill Suggestions feature)
// ---------------------------------------------------------------------------

export interface SkillSuggestInput {
  descriptionText: string;
}

export function buildSkillSuggestMessages(input: SkillSuggestInput) {
  const text = input.descriptionText.slice(0, 3000);

  return {
    system: `You are a technical skills extraction engine for a job portal.

Given a job description, extract the most relevant technical skills a candidate should have.

Rules:
- Return ONLY a valid JSON array of strings — no markdown, no code fences, no explanation
- Include 8–10 skills
- Skills must be specific and standardised (e.g. "TypeScript" not "type-safe JavaScript", "PostgreSQL" not "databases")
- Order by importance: most critical skills first
- Include both hard technical skills AND relevant frameworks/tools (not soft skills like "communication")
- Use common industry names candidates would search for (e.g. "React" not "ReactJS", "Node.js" not "NodeJS")
- If the JD is too vague to extract skills, return an empty array: []

Example output format: ["TypeScript","React","Node.js","PostgreSQL","REST APIs","Docker","AWS","GraphQL"]`,

    user: text,
  };
}

export const SKILL_SUGGEST_CONFIG = {
  max_tokens: 200,
  temperature: 0.1,
} as const;
