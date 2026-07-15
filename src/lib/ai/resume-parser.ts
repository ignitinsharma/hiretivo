import { openrouter, getAIModel } from "@/lib/openrouter";
import { ResumeDocumentSchema, type ResumeDocument } from "@/lib/validations/resume.schema";

/*
 * USER_ID_PLACEHOLDER
 * Placeholder used before a user has a profileId — replaced on save.
 */
export const USER_ID_PLACEHOLDER = "__profile_placeholder__";

/*
 * parseResumeWithVision
 * Sends a PDF file (as buffer) to Gemini 2.5 Flash vision model for parsing.
 * Returns a validated ResumeDocument, or null on failure.
 *
 * The PDF is sent as base64-encoded data — sidesteps text-extraction libraries
 * and handles two-column layouts and scanned/image PDFs natively.
 */
export async function parseResumeWithVision(
  pdfBuffer: Buffer,
): Promise<ResumeDocument | null> {
  const base64 = pdfBuffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const systemPrompt = `You are a resume parsing engine. Given a PDF resume, extract its contents into a structured JSON object following the exact schema below.

Rules:
- Extract ALL text content from the resume — do not summarize or rewrite
- Preserve the original wording of bullet points, summaries, and descriptions
- Capture experience dates exactly as shown (MMM YYYY format)
- Assign priority 1 to every bullet (the AI optimizer will reorder later)
- Generate a unique id (cuid-like string) for each experience, project, education, certification, and language entry
- For skills, group them into meaningful categories (e.g. "Languages", "Frameworks & Libraries", "Tools", "Cloud & DevOps")
- personalInfo: extract name, email, phone, location, and any URLs found (linkedin, github, website, twitter)
- If a field is not found in the resume, use null (never fabricate data)
- matchMeta: set matchScore to null (no JD to match against), empty arrays for keywords, 0 for counts

Return ONLY valid JSON matching this structure — no markdown, no code fences, no explanation.`;

  const userPrompt = `Parse the attached PDF resume into the canonical resume JSON schema. Extract every section you can find.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text" as const, text: userPrompt },
            { type: "image_url" as const, image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    return parseAndValidate(raw);
  } catch {
    return null;
  }
}

function parseAndValidate(raw: string): ResumeDocument | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    const doc = {
      ...parsed,
      profileId: USER_ID_PLACEHOLDER,
      resumeVersionId: null,
      applicationId: null,
      sourceType: "uploaded" as const,
      generatedAt: new Date().toISOString(),
    };

    const result = ResumeDocumentSchema.safeParse(doc);
    return result.success ? (result.data as ResumeDocument) : null;
  } catch {
    return null;
  }
}
