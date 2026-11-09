import { getUserAIContext } from "@/lib/openrouter";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";
import { withRetry } from "@/lib/ai/with-retry";
import { buildCoverLetterPrompt } from "@/lib/ai-prompts";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { CoverLetterInput, CoverLetterOutput } from "@/lib/ai-prompts";

export type CoverLetterResult =
  | { status: "success"; content: string; raw: CoverLetterOutput }
  | { status: "ai_error"; reason: "timeout" | "malformed_response" }
  | { status: "validation_error"; details: string };

/*
 * generateCoverLetter
 * Generates a tailored cover letter from a resume JSON, job description, job title, and company name.
 * JSON parsing runs inside withRetry so malformed responses trigger a fresh AI call.
 * @param resumeJson - The parsed ResumeDocument (already validated)
 * @param jdText - Full job description text
 * @param jobTitle - Job title for personalization
 * @param company - Company name for personalization
 * @returns CoverLetterResult — success with content, or typed error
 */
export async function generateCoverLetter(
  userId: string,
  resumeJson: ResumeDocument,
  jdText: string,
  jobTitle: string,
  company: string,
): Promise<CoverLetterResult> {
  const input: CoverLetterInput = {
    jobTitle,
    company,
    jdText,
    resumeName: resumeJson.personalInfo.name,
    resumeSummary: resumeJson.summary,
    resumeSkills: resumeJson.skills.categories.flatMap((c) => c.items),
    experience: resumeJson.experience.slice(0, 3).map((exp) => ({
      title: exp.title,
      company: exp.company,
      period: [exp.startDate, exp.endDate ?? (exp.current ? "Present" : null)]
        .filter(Boolean)
        .join(" – "),
      bullets: exp.bullets.slice(0, 3).map((b) => b.text),
    })),
    projects: resumeJson.projects.slice(0, 2).map((proj) => ({
      name: proj.name,
      bullets: proj.bullets.slice(0, 3).map((b) => b.text),
    })),
  };

  const { system, user } = buildCoverLetterPrompt(input);
  const ai = await getUserAIContext(userId, "resume");

  const parsed = await withRetry(async (signal) => {
    const completion = await ai.client.chat.completions.create({
      model: ai.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 800,
      temperature: 0.7,
      reasoning: { effort: "low" },
    } as ChatCompletionCreateParamsNonStreaming, { signal });
    const text = completion.choices?.[0]?.message?.content;
    if (!text) return null;

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const obj = JSON.parse(cleaned) as CoverLetterOutput;
    if (!obj.greeting || !obj.body_paragraphs || !obj.closing || !obj.signoff) return null;

    return obj;
  }, { timeoutMs: 25_000, maxRetries: 1 });

  if (!parsed) {
    console.error("[cover-letter-generator] Failed after retries — AI returned unparseable or incomplete JSON");
    return { status: "ai_error", reason: "malformed_response" };
  }

  const content = [
    parsed.subject ? `Subject: ${parsed.subject}` : null,
    parsed.greeting,
    "",
    ...parsed.body_paragraphs,
    "",
    parsed.closing,
    "",
    parsed.signoff,
  ].filter((line): line is string => line !== null).join("\n");

  return { status: "success", content, raw: parsed };
}
