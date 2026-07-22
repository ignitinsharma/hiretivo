import { openrouter, getLiteAIModel } from "@/lib/openrouter";
import { withRetry } from "@/lib/ai/with-retry";

export interface ParsedJob {
  title: string;
  company: string;
  description: string;
  skills: string[];
}

const MAX_PAGE_CHARS = 8000;
const FETCH_TIMEOUT_MS = 15_000;
const STRIP_TAGS = ["script", "style", "nav", "footer", "header"];

const ENTITY_MAP: Record<string, string> = {
  "&lt;": "<", "&gt;": ">", "&amp;": "&",
  "&quot;": '"', "&#39;": "'", "&#x27;": "'",
  "&#x2F;": "/", "&nbsp;": " ",
};

/*
 * ── Helpers ──────────────────────────────────────────────
 */

function stripBoilerplate(html: string): string {
  let s = html;
  for (const tag of STRIP_TAGS) {
    s = s.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
  }
  return s;
}

function decodeEntities(html: string): string {
  let s = html;
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    s = s.replaceAll(entity, char);
  }
  return s;
}

function cleanWhitespace(text: string): string {
  return text
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractTextFromHtml(html: string): string {
  const text = cleanWhitespace(
    decodeEntities(stripBoilerplate(html))
      .replace(/<[^>]*>/g, " ")
      .replace(/[\t\r\n]+/g, "\n"),
  );
  return text.slice(0, MAX_PAGE_CHARS);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPageText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html,*/*", "Accept-Language": "en" },
    });
    if (!res.ok) return logAndNull(`HTTP ${res.status}`, url);

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain/.test(contentType)) return logAndNull(`${contentType} content-type`, url);

    const html = await res.text();
    if (html.length < 100) return logAndNull(`only ${html.length} chars`, url);

    return extractTextFromHtml(html);
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "fetch error";
    return logAndNull(reason, url, err);
  } finally {
    clearTimeout(timer);
  }
}

function logAndNull(msg: string, url: string, err?: unknown): null {
  console.error(`[jd-parser] ${msg} — ${url}`);
  if (err) console.error(err);
  return null;
}

/*
 * ── Prompt ───────────────────────────────────────────────
 */

const SYSTEM_PROMPT = `You are a job description parser. Extract the job details from the text below.

Return a JSON object with:
- "title": the job title
- "company": the company name
- "description": the full job description (clean text, no HTML)
- "skills": an array of skill strings mentioned in the description

Only return valid JSON. No markdown formatting. No text before or after the JSON.`;

/*
 * ── AI call ──────────────────────────────────────────────
 */

async function callExtractionLlm(text: string, context: string): Promise<ParsedJob | null> {
  const result = await withRetry(async () => {
    const completion = await openrouter.chat.completions.create({
      model: getLiteAIModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `TEXT:\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    });

    return {
      content: completion.choices?.[0]?.message?.content ?? "",
      finishReason: completion.choices?.[0]?.finish_reason ?? null,
    };
  });

  if (!result) {
    console.error("[jd-parser] AI call failed after retries");
    return null;
  }

  if (result.finishReason === "length") {
    console.warn("[jd-parser] Truncated output — finish_reason=length", {
      context,
      textLength: text.length,
    });
  }

  return parseModelResponse(result.content, context);
}

function parseModelResponse(raw: string, context?: string): ParsedJob | null {
  try {
    const cleaned = extractJson(raw);
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
    console.error("[jd-parser] Response missing required fields:", Object.keys(parsed).join(", "), `(${context ?? "unknown"})`);
    return null;
  } catch (err) {
    console.error("[jd-parser] JSON parse failed:", err, `(${context ?? "unknown"})`, "\nRaw:", raw);
    return null;
  }
}

/*
 * extractJson — strips markdown fences and non-JSON text around the JSON object.
 * Finds the first '{' and last '}' to survive model verbosity before/after the JSON.
 */
function extractJson(raw: string): string {
  let s = raw.trim();

  s = s.replace(/^```(?:json)?\s*/i, "");
  s = s.replace(/\s*```$/i, "");

  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }

  return s;
}

/*
 * ── Public API ───────────────────────────────────────────
 */

export async function parseJobFromUrl(url: string): Promise<ParsedJob | null> {
  const pageText = await fetchPageText(url);
  return pageText ? callExtractionLlm(pageText, "url") : null;
}

export async function parseJobFromText(
  text: string,
): Promise<ParsedJob | null> {
  return callExtractionLlm(text, "text");
}
