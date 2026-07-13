import { openrouter, getAIModel } from "@/lib/openrouter";

export interface ParsedJob {
  title: string;
  company: string;
  description: string;
  skills: string[];
}

function parseModelResponse(raw: string): ParsedJob | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.title === "string" &&
      typeof parsed.company === "string" &&
      typeof parsed.description === "string" &&
      Array.isArray(parsed.skills)
    ) {
      return {
        title: parsed.title,
        company: parsed.company,
        description: parsed.description,
        skills: parsed.skills,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function parseJobFromUrl(url: string): Promise<ParsedJob | null> {
  const prompt = `You are a job description parser. Fetch the content from the following URL and extract the job details.

URL: ${url}

Return a JSON object with:
- "title": the job title
- "company": the company name
- "description": the full job description (clean text, no HTML)
- "skills": an array of skill strings mentioned in the description

Only return valid JSON. No markdown formatting.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    return parseModelResponse(raw);
  } catch {
    return null;
  }
}

export async function parseJobFromText(
  text: string,
): Promise<ParsedJob | null> {
  const prompt = `You are a job description parser. Extract the job details from the following text.

TEXT:
${text}

Return a JSON object with:
- "title": the job title
- "company": the company name
- "description": the full job description (clean text, no HTML)
- "skills": an array of skill strings mentioned in the description

Only return valid JSON. No markdown formatting.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    return parseModelResponse(raw);
  } catch {
    return null;
  }
}
