import { openrouter, getResumeModel } from "@/lib/openrouter";
import { withRetry } from "@/lib/ai/with-retry";
import { buildCoverLetterPrompt } from "@/lib/ai-prompts";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { CoverLetterInput } from "@/lib/ai-prompts";

interface CoverLetterResponse {
  greeting: string;
  body_paragraphs: string[];
  closing: string;
  signoff: string;
}

export type CoverLetterResult =
  | { status: "success"; content: string; raw: CoverLetterResponse }
  | { status: "ai_error"; reason: "timeout" | "malformed_response" }
  | { status: "validation_error"; details: string };

export async function generateCoverLetter(
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
  };

  const { system, user } = buildCoverLetterPrompt(input);

  const response = await withRetry(async () => {
    const completion = await openrouter.chat.completions.create({
      model: getResumeModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });
    const text = completion.choices?.[0]?.message?.content;
    if (!text) return null;
    return text;
  });

  if (!response) {
    return { status: "ai_error", reason: "timeout" };
  }

  let parsed: CoverLetterResponse;
  try {
    const cleaned = response
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
    if (!parsed.greeting || !parsed.body_paragraphs || !parsed.closing || !parsed.signoff) {
      return { status: "ai_error", reason: "malformed_response" as const };
    }
  } catch (err) {
    console.error("[cover-letter-generator] JSON parse failed:", err, "\nRaw:", response);
    return { status: "ai_error", reason: "malformed_response" as const };
  }

  const content = [
    parsed.greeting,
    "",
    ...parsed.body_paragraphs,
    "",
    parsed.closing,
    "",
    parsed.signoff,
  ].join("\n");

  return { status: "success", content, raw: parsed };
}
