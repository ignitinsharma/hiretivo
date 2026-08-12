import { openrouter, getJDParseModel } from "@/lib/openrouter";
import { withRetry } from "@/lib/ai/with-retry";
import { stripHtml } from "@/lib/utils";

export interface ParsedJob {
  title: string;
  company: string;
  description: string;
  skills: string[];
}

interface JobPostingJsonLd {
  title: string;
  company: string;
  description: string;
}

interface FetchedPage {
  text: string;
  jsonLd: JobPostingJsonLd | null;
}

const MAX_PAGE_CHARS = 20000;
const FETCH_TIMEOUT_MS = 15_000;
const STRIP_TAGS = ["script", "style", "noscript", "nav", "footer", "header"];
// SPA shells (Ashby, Workday, …) leave near-empty text after stripping
// noscript/boilerplate. A real JD is hundreds of chars minimum.
const MIN_MEANINGFUL_CHARS = 300;

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

async function fetchPageText(url: string): Promise<FetchedPage | null> {
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

    const text = extractTextFromHtml(html);
    // SPA shells (Ashby, Workday, …) leave near-empty visible text, but many
    // still embed the full JD as schema.org JobPosting JSON-LD — use it.
    const jsonLd = text.length < MIN_MEANINGFUL_CHARS ? extractJobPostingJsonLd(html) : null;
    if (text.length < MIN_MEANINGFUL_CHARS && !jsonLd) {
      return logAndNull(`js-app-shell or too short (extracted ${text.length} chars)`, url);
    }
    return { text, jsonLd };
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
  const result = await withRetry(async (signal) => {
      const completion = await openrouter.chat.completions.create({
      model: getJDParseModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `TEXT:\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 16000,
    }, { signal });

    return {
      content: completion.choices?.[0]?.message?.content ?? "",
      finishReason: completion.choices?.[0]?.finish_reason ?? null,
    };
  }, { timeoutMs: 20_000, maxRetries: 1 });

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
 * ── Ashby ────────────────────────────────────────────────
 * Ashby job pages (jobs.ashbyhq.com) are client-rendered SPAs — a plain fetch
 * returns only the app shell + <noscript> fallback. Resolve via Ashby's public
 * posting API instead, which returns structured job data (no JS, no LLM needed).
 */

const ASHBY_URL_RE =
  /^https?:\/\/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]+)(?:\/application)?(?:[?#].*)?\/?$/i;

export function isAshbyUrl(url: string): boolean {
  return ASHBY_URL_RE.test(url);
}

function deriveCompanyNameFromBoardToken(boardToken: string): string {
  const name = boardToken.replace(/^join/i, "");
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : boardToken;
}

interface AshbyPosting {
  id: string;
  title?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
}

async function parseAshbyJobFromUrl(url: string): Promise<ParsedJob | null> {
  const match = url.match(ASHBY_URL_RE);
  if (!match) return null;
  const [, boardToken, jobId] = match;

  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardToken)}?includeCompensation=true`,
      { headers: { "User-Agent": "Hiretivo/1.0" } },
    );
    if (!res.ok) return logAndNull(`ashby HTTP ${res.status}`, url);
    const data: { jobs?: AshbyPosting[]; nodes?: AshbyPosting[] } = await res.json();
    const job = (data.jobs || data.nodes || []).find((j) => j.id === jobId);
    if (!job) return logAndNull(`ashby job not listed (${jobId})`, url);

    const description =
      (job.descriptionPlain || "").trim() || stripHtml(job.descriptionHtml || "");
    if (description.length < MIN_MEANINGFUL_CHARS) {
      return logAndNull(`ashby description too short (${description.length} chars)`, url);
    }
    return {
      title: job.title || "",
      company: deriveCompanyNameFromBoardToken(boardToken),
      description,
      skills: [],
    };
  } catch (err) {
    return logAndNull("ashby fetch error", url, err);
  }
}

/*
 * ── JSON-LD ───────────────────────────────────────────────
 * JS-rendered boards often SSR the full JD only as schema.org JobPosting
 * JSON-LD (Ashby does this). Extract it so SPA shells still parse — no LLM.
 */

function flattenLdNodes(data: unknown): unknown[] {
  const nodes: unknown[] = [];
  if (Array.isArray(data)) {
    for (const item of data) nodes.push(...flattenLdNodes(item));
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj["@graph"]) nodes.push(...flattenLdNodes(obj["@graph"]));
    nodes.push(obj);
  }
  return nodes;
}

function cleanJsonLdText(s: string): string {
  return cleanWhitespace(
    decodeEntities(s).replace(/<[^>]*>/g, " ").replace(/[\t\r\n]+/g, "\n"),
  ).slice(0, MAX_PAGE_CHARS);
}

export function extractJobPostingJsonLd(html: string): JobPostingJsonLd | null {
  const scriptRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    for (const node of flattenLdNodes(parsed)) {
      if (!node || typeof node !== "object") continue;
      const obj = node as Record<string, unknown>;
      const type = obj["@type"];
      const types = Array.isArray(type) ? type : [type];
      if (!types.includes("JobPosting")) continue;
      const description = cleanJsonLdText(
        typeof obj.description === "string" ? obj.description : "",
      );
      if (description.length < MIN_MEANINGFUL_CHARS) continue;
      const hiring = obj.hiringOrganization as Record<string, unknown> | undefined;
      return {
        title: typeof obj.title === "string" ? obj.title : "",
        company: typeof hiring?.name === "string" ? hiring.name : "",
        description,
      };
    }
  }
  return null;
}

/*
 * ── Public API ───────────────────────────────────────────
 */

const JS_APP_DOMAINS = [
  "workday", "myworkdayjobs",
  "taleo",
  "successfactors", "sapsf",
  "icims",
];

const GREENHOUSE_CUSTOM_BOARDS: Record<string, string> = {
  "corporate.trustpilot.com": "trustpilot",
};

export interface GreenhouseJobReference {
  boardToken: string;
  jobId: string;
}

export function getGreenhouseJobReference(url: string): GreenhouseJobReference | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const standardHost = host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io";
    const pathMatch = parsed.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/i);

    if (standardHost && pathMatch) {
      return { boardToken: pathMatch[1], jobId: pathMatch[2] };
    }

    const boardToken = GREENHOUSE_CUSTOM_BOARDS[host];
    const jobId = parsed.searchParams.get("gh_jid")?.match(/^\d+$/)?.[0];
    if (boardToken && jobId) return { boardToken, jobId };
  } catch {
    return null;
  }

  return null;
}

interface GreenhouseJob {
  title?: string;
  company_name?: string;
  content?: string;
}

async function parseGreenhouseJobFromUrl(url: string): Promise<ParsedJob | null> {
  const reference = getGreenhouseJobReference(url);
  if (!reference) return null;

  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(reference.boardToken)}/jobs/${reference.jobId}`,
      { headers: { "User-Agent": "Hiretivo/1.0" } },
    );
    if (!response.ok) return logAndNull(`greenhouse HTTP ${response.status}`, url);

    const job = (await response.json()) as GreenhouseJob;
    const description = stripHtml(job.content ?? "").trim();
    if (description.length < MIN_MEANINGFUL_CHARS) {
      return logAndNull(`greenhouse description too short (${description.length} chars)`, url);
    }

    return {
      title: job.title ?? "",
      company: (job.company_name ?? "").trim(),
      description,
      skills: [],
    };
  } catch (error) {
    return logAndNull("greenhouse fetch error", url, error);
  }
}

function isUnsupportedAtsDomain(url: string): boolean {
  return JS_APP_DOMAINS.some((d) => url.includes(d));
}

export { isUnsupportedAtsDomain };

export async function parseJobFromUrl(url: string): Promise<ParsedJob | null> {
  if (isUnsupportedAtsDomain(url)) {
    console.warn(`[jd-parser] Unsupported JS-heavy ATS domain — ${url}`);
    return null;
  }
  if (isAshbyUrl(url)) {
    const ashbyJob = await parseAshbyJobFromUrl(url);
    if (ashbyJob) return ashbyJob;
    // API miss (closed posting / custom-domain board): fall through to the
    // generic fetch — live pages still SSR JobPosting JSON-LD.
  }
  const greenhouseJob = await parseGreenhouseJobFromUrl(url);
  if (greenhouseJob) return greenhouseJob;
  const page = await fetchPageText(url);
  if (!page) return null;
  if (page.jsonLd) {
    return {
      title: page.jsonLd.title,
      company: page.jsonLd.company,
      description: page.jsonLd.description,
      skills: [],
    };
  }
  return callExtractionLlm(page.text, "url");
}

export async function parseJobFromText(
  text: string,
): Promise<ParsedJob | null> {
  return callExtractionLlm(text, "text");
}
