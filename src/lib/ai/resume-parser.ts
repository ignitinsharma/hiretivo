import type OpenAI from "openai";
import { getUserAIContext } from "@/lib/openrouter";
import { withRetry } from "@/lib/ai/with-retry";
import { extractPdfText } from "@/lib/ai/pdf-text-extract";
import { ResumeDocumentSchema, type ResumeDocument } from "@/lib/validations/resume.schema";
import { mergeExtractedSkills } from "@/lib/ai/skill-merge";

export type ParseResult =
  | { status: "ok"; data: ResumeDocument }
  | { status: "truncated" }
  | { status: "error"; reason: "ai_unreachable" | "empty_response" | "malformed" | "unsupported_file" };

export function isResumeSuspiciouslyThin(resume: ResumeDocument): string[] {
  const warnings: string[] = [];
  if (resume.experience.length === 0) warnings.push("No experience entries parsed");
  if (resume.skills.categories.length === 0 || resume.skills.categories.every((c) => c.items.length === 0)) {
    warnings.push("No skills parsed");
  } else {
    const totalSkills = resume.skills.categories.reduce((sum, c) => sum + c.items.length, 0);
    if (totalSkills < 3) warnings.push("Very few skills parsed");
  }
  resume.experience.forEach((exp, i) => {
    if (!exp.bullets || exp.bullets.length === 0) {
      warnings.push(`Experience entry ${i} (${exp.company}) has no bullets`);
    }
  });
  return warnings;
}

export const USER_ID_PLACEHOLDER = "__profile_placeholder__";

const REASONING_CAP = 128;
const MAX_OUTPUT_TOKENS = 8192;

export const SYSTEM_PROMPT = `You are a resume parser. You extract structured JSON from PDF resumes. Follow the JSON template below exactly — fill in the values, keep the structure.

Rules:
- Extract ALL text verbatim — do not summarize or rewrite bullet points
- Preserve original wording of summaries and descriptions
- Capture dates exactly as shown (MMM YYYY format)
- Assign priority 1 to every bullet
- Generate a unique id (cuid-like string) for each array entry
- Group skills into categories (e.g. "Languages", "Frameworks & Libraries", "Tools", "Cloud & DevOps")
- Extract EVERY skill, tool, framework, library, technology, platform, and product mentioned anywhere in the document — including inside experience bullets, project descriptions, certifications, and the summary. Be exhaustive: when in doubt, include it. Never omit a keyword because it seems minor or appears once.
- Keep each extracted skill name exactly as written in the document (e.g. "React", "AWS Lambda", "CI/CD", "Node.js")
- For empty sections, use [] — never omit array fields
- For missing optional single-value fields, use null — never omit them

Return ONLY the JSON object — no markdown, no code fences, no explanation.

JSON template:
{
  "personalInfo": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "+1 234 567 890",
    "location": "City, State" or null,
    "linkedin": "https://linkedin.com/in/username" or null,
    "github": "https://github.com/username" or null,
    "websiteUrl": "https://example.com" or null,
    "twitter": null
  },
  "summary": "Full professional summary text from the resume or empty string",
  "experience": [
    {
      "id": "unique_id_1",
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State" or null,
      "startDate": "Jan 2020",
      "endDate": "Mar 2023" or null,
      "current": false,
      "bullets": [
        { "id": "bullet_1", "text": "Full bullet point text", "priority": 1 }
      ]
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "name": "Project Name",
      "link": "https://..." or null,
      "bullets": [
        { "id": "proj_bullet_1", "text": "Description of work", "priority": 1 }
      ]
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "institution": "University Name",
      "degree": "Bachelor of Science in Computer Science",
      "startDate": "Aug 2016",
      "endDate": "May 2020"
    }
  ],
  "skills": {
    "categories": [
      { "name": "Languages", "items": ["TypeScript", "Python"] }
    ]
  },
  "certifications": [
    {
      "id": "cert_1",
      "name": "Certification Name",
      "issuer": "Issuing Organization" or null,
      "date": "Jun 2022" or null
    }
  ],
  "languages": [
    {
      "id": "lang_1",
      "name": "Language Name",
      "proficiency": "Native" or null
    }
  ]
}`;

function condenseInstructions(): string {
  return `\n\nPRIORITIZATION (very long resume — condense to fit within output limits):
- Keep all roles from the last 10 years in full detail (every bullet, exact wording)
- For experience older than 10 years: keep company, title, dates only — drop ALL bullets
- Maximum 5 bullet points per experience entry
- Maximum 3 projects — pick the most relevant/recent ones
- Maximum 5 certifications — most recent/relevant only
- Do NOT omit any required fields — use [] for empty arrays, null for missing singles`;
}

const USER_PROMPT = `Parse this PDF resume into the JSON template shown above. Extract every section you can find, preserving original wording.`;

function braceSlice(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}

function parseAndValidate(raw: string): ParseResult {
  try {
    const parsed = JSON.parse(braceSlice(raw));

    // ponytail: matchMeta/missingSkills are computed server-side (resume-tailor.ts:150, resume-match.ts)
    // The parser never needs to produce them — they contradict the schema (matchScore: number vs null)
    delete parsed.matchMeta;
    delete parsed.missingSkills;

    const doc = {
      ...parsed,
      profileId: USER_ID_PLACEHOLDER,
      resumeVersionId: null,
      applicationId: null,
      sourceType: "uploaded" as const,
      generatedAt: new Date().toISOString(),
    };

    const result = ResumeDocumentSchema.safeParse(doc);
    if (!result.success) {
      console.error("[parseAndValidate] Schema validation failed:", result.error.format());
      return { status: "error", reason: "malformed" };
    }
    return { status: "ok", data: mergeExtractedSkills(result.data as ResumeDocument) };
  } catch (err) {
    console.error("[parseAndValidate] JSON parsing failed:", err instanceof Error ? err.message : "Invalid JSON");
    return { status: "error", reason: "malformed" };
  }
}

async function callModelText(
  text: string,
  model: string,
  condense: boolean,
  client: OpenAI,
): Promise<ParseResult> {
  const systemPrompt = condense ? SYSTEM_PROMPT + condenseInstructions() : SYSTEM_PROMPT;

  console.log(
    `[callModelText] model=${model} condense=${condense} text=${(text.length / 1024).toFixed(1)}KB`,
  );

  const aiResult = await withRetry(async (signal) => {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.1,
       reasoning: { max_tokens: REASONING_CAP },
       messages: [
         { role: "system", content: systemPrompt },
         { role: "user", content: `${USER_PROMPT}\n\nRESUME TEXT:\n${text}` },
        ],
     } as Parameters<typeof client.chat.completions.create>[0], { signal });

    const msg = (completion as { choices: Array<{ message?: { content?: string | null }; finish_reason?: string | null }> }).choices?.[0];
    return {
      content: msg?.message?.content ?? "",
      finishReason: msg?.finish_reason ?? null,
    };
  }, { timeoutMs: 20_000, maxRetries: 1 });

  return handleAiResult(aiResult, model);
}

async function callModelFile(
  pdfBuffer: Buffer,
  model: string,
  condense: boolean,
  client: OpenAI,
): Promise<ParseResult> {
  const base64 = pdfBuffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const systemPrompt = condense ? SYSTEM_PROMPT + condenseInstructions() : SYSTEM_PROMPT;

  console.log(
    `[callModelFile] model=${model} condense=${condense} base64=${(base64.length / 1024).toFixed(0)}KB`,
  );

  const aiResult = await withRetry(async (signal) => {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.1,
      reasoning: { max_tokens: REASONING_CAP },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text" as const, text: USER_PROMPT },
            {
              type: "file" as const,
              file: { filename: "resume.pdf", file_data: dataUrl },
            },
          ],
         },
        ],
     } as Parameters<typeof client.chat.completions.create>[0], { signal });

    const msg = (completion as { choices: Array<{ message?: { content?: string | null }; finish_reason?: string | null }> }).choices?.[0];
    return {
      content: msg?.message?.content ?? "",
      finishReason: msg?.finish_reason ?? null,
    };
  }, { timeoutMs: 20_000, maxRetries: 1 });

  return handleAiResult(aiResult, model);
}

function handleAiResult(
  aiResult: { content: string; finishReason: string | null } | null,
  model: string,
): ParseResult {
  if (!aiResult) {
    console.error(`[resume-parser] AI unreachable after retries (${model})`);
    return { status: "error", reason: "ai_unreachable" };
  }

  const { content, finishReason } = aiResult;

  if (finishReason === "length") {
    console.warn(`[resume-parser] Truncated output — finish_reason=length (${model})`);
    return { status: "truncated" };
  }

  if (!content) {
    console.error(`[resume-parser] Empty response from AI (${model})`);
    return { status: "error", reason: "empty_response" };
  }

  return parseAndValidate(content);
}

/*
 * parseResumeWithVision
 * Cascade: text-first (cheap) → file vision (strong) → condense on truncation.
 * Tier 1: extract PDF text locally and send plain text to the lite model —
 *         skips OpenRouter's slow server-side PDF pipeline (was ~50s, now ~5-15s).
 * Tier 2: file-based vision parse with the parse model — rescues scanned
 *         PDFs, two-column layouts, and thin Tier 1 results.
 * Tier 3: condense instructions on truncation (length is model-independent).
 */
export async function parseResumeWithVision(
  pdfBuffer: Buffer,
  userId: string,
): Promise<ParseResult> {
  const lite = await getUserAIContext(userId, "lite");
  const file = await getUserAIContext(userId, "parse");
  const liteModel = lite.model;
  const flashModel = file.model;

  const text = await extractPdfText(pdfBuffer);
  const hasText = text.length >= 150;

  if (hasText) {
    // Tier 1 — cheap, fast text parse
    console.log(`[parseResumeWithVision] Tier 1 text: ${liteModel}`);
    const r1 = await callModelText(text, liteModel, false, lite.client);
    if (r1.status === "ok") {
      const totalSkills = r1.data.skills.categories.reduce((sum, c) => sum + c.items.length, 0);
      if (totalSkills >= 3) {
        const warnings = isResumeSuspiciouslyThin(r1.data);
        if (warnings.length > 0) console.warn("[parseResumeWithVision] Tier 1 ok but thin:", warnings);
        return r1;
      }
      console.log("[parseResumeWithVision] Tier 1 thin skills → Tier 2 file");
      if (!file.supportsFile) return r1;
    } else if (r1.status === "truncated") {
      console.log(`[parseResumeWithVision] Tier 1 truncated → Tier 3 condense (${flashModel})`);
      if (!file.supportsFile) return { status: "error", reason: "unsupported_file" };
      return callModelFile(pdfBuffer, flashModel, true, file.client);
    } else {
      console.log(`[parseResumeWithVision] Tier 1 error:${r1.reason} → Tier 2 (${flashModel})`);
      if (!file.supportsFile) return r1;
    }
  } else {
    console.log("[parseResumeWithVision] No extractable text — scanned PDF, skipping to Tier 2");
  }

  if (!file.supportsFile) return { status: "error", reason: "unsupported_file" };

  // Tier 2 — file-based vision parse
  const r2 = await callModelFile(pdfBuffer, flashModel, false, file.client);
  if (r2.status === "ok") return r2;
  if (r2.status === "truncated") {
    console.log(`[parseResumeWithVision] Tier 2 truncated → Tier 3 condense (${flashModel})`);
    return callModelFile(pdfBuffer, flashModel, true, file.client);
  }

  console.log(`[parseResumeWithVision] All tiers exhausted — ${r2.status}:${r2.reason}`);
  return r2;
}
