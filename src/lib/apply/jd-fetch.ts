import dns from "node:dns/promises";
import net from "node:net";
import { AiMessageRole, AtsSource } from "@/constants/enums";
import { detectAtsFromUrl } from "@/lib/ats/registry";
import { fetchGreenhouseJobs } from "@/lib/ats/normalizers/greenhouse.normalizer";
import { fetchLeverJobs } from "@/lib/ats/normalizers/lever.normalizer";
import { fetchAshbyJobs } from "@/lib/ats/normalizers/ashby.normalizer";
import { extractSkillsFromText } from "@/lib/ats/skill-extractor";
import { stripHtml } from "@/lib/utils";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { buildJdExtractMessages, JD_EXTRACT_CONFIG } from "@/lib/ai-prompts";
import { JdExtractOutputSchema } from "@/lib/validations/apply-from-link.schema";

const LOGIN_WALL_HOSTS = ["linkedin.com", "indeed.com", "glassdoor.com"];
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 2_000_000; // 2MB cap before we ever strip/truncate — bounds memory on a hostile response

/*
 * isPrivateOrReservedIp
 * True for loopback/private/link-local/reserved ranges (incl. cloud metadata
 * hosts at 169.254.169.254) — anything a public job posting should never
 * resolve to.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("::ffff:")) return isPrivateOrReservedIp(lower.slice(7));
    return false;
  }
  return true; // unrecognized host — treat as unsafe
}

/*
 * assertPublicHttpUrl
 * Rejects non-http(s) schemes and resolves the hostname (or reads it
 * directly when it's already a literal IP) to block SSRF into
 * loopback/private/link-local/cloud-metadata addresses. Re-run on every
 * redirect hop, not just the initial URL.
 */
async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsupported URL scheme");
  }
  const hostname = parsed.hostname;
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new Error("Blocked host");
    return parsed;
  }
  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0 || records.some((r) => isPrivateOrReservedIp(r.address))) {
    throw new Error("Blocked host");
  }
  return parsed;
}

/*
 * safeFetchHtml
 * Fetches a seeker-pasted URL with SSRF and resource-exhaustion guards:
 * scheme + DNS-resolved-IP validated on every redirect hop (redirects are
 * followed manually, never automatically), and the body is streamed with a
 * hard byte cap instead of buffered via res.text().
 * @returns { ok:true, body } on a safe, readable text/html response, else { ok:false }
 */
async function safeFetchHtml(rawUrl: string): Promise<{ ok: true; body: string } | { ok: false }> {
  let currentUrl = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let target: URL;
    try {
      target = await assertPublicHttpUrl(currentUrl);
    } catch {
      return { ok: false };
    }

    const res = await fetch(target, {
      headers: { "User-Agent": "Hiretivo/1.0 (+https://hiretivo.com)" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return { ok: false };
      currentUrl = new URL(location, target).toString();
      continue;
    }

    if (!res.ok) return { ok: false };
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return { ok: false };

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) return { ok: false };

    const reader = res.body?.getReader();
    if (!reader) return { ok: false };
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false };
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
    return { ok: true, body };
  }
  return { ok: false };
}

/* Which path produced the ParsedJd (or why parsing could not complete). */
export enum JdParseStrategy {
  ATS = "ATS",
  GENERIC_HTML = "GENERIC_HTML",
  AI = "AI",
  MANUAL_PASTE = "MANUAL_PASTE",
}

/* Normalised JD ready to persist as a PASTED_LINK Application and feed the wizard. */
export interface ParsedJd {
  title: string;
  company: string | null;
  description: string;
  skills: string[];
  strategy: JdParseStrategy;
  atsSource: AtsSource | null;
}

/* Discriminated result: either a usable JD, or a signal that the UI must ask for manual paste. */
export type JdFetchResult =
  | { ok: true; jd: ParsedJd }
  | { ok: false; needsManualPaste: true; reason: string };

/*
 * aiExtractJd
 * Runs buildJdExtractMessages over raw text and validates the model's JSON
 * output. Returns null (never throws) on any parse/schema failure so callers
 * can fall back to a manual-paste signal.
 */
async function aiExtractJd(
  rawText: string,
  sourceUrl: string | null,
): Promise<{ title: string; company: string | null; description: string; skills: string[] } | null> {
  try {
    const { system, user } = buildJdExtractMessages({ rawText, sourceUrl });
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      ...JD_EXTRACT_CONFIG,
      response_format: { type: "json_object" },
      messages: [
        { role: AiMessageRole.SYSTEM, content: system },
        { role: AiMessageRole.USER, content: user },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JdExtractOutputSchema.safeParse(JSON.parse(cleaned) as unknown);
    if (!parsed.success || !parsed.data.description) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/*
 * fetchViaAts
 * Fetches the matched ATS board and selects the posting matching postingId
 * (falls back to the first posting when the URL had no parseable id).
 * @returns ParsedJd on success, null to fall through to the generic path.
 */
async function fetchViaAts(
  match: NonNullable<ReturnType<typeof detectAtsFromUrl>>,
  skills: Array<{ id: string; name: string }>,
): Promise<ParsedJd | null> {
  const companyName = match.company?.name ?? match.boardToken;
  const companyWebsite = match.company?.website ?? "";
  const companyLogoUrl = match.company?.logoUrl ?? null;

  try {
    let jobs;
    if (match.ats === AtsSource.GREENHOUSE) {
      jobs = await fetchGreenhouseJobs(match.boardToken, companyName, companyWebsite, companyLogoUrl, skills);
    } else if (match.ats === AtsSource.LEVER) {
      jobs = await fetchLeverJobs(match.boardToken, companyName, companyWebsite, companyLogoUrl, skills);
    } else {
      jobs = await fetchAshbyJobs(match.boardToken, companyName, companyWebsite, companyLogoUrl, skills);
    }

    const posting = match.postingId
      ? (jobs.find((j) => j.atsSourceId === match.postingId) ?? jobs[0])
      : jobs[0];
    if (!posting) return null;

    return {
      title: posting.title,
      company: companyName,
      description: posting.description,
      skills: posting.skillMatches,
      strategy: JdParseStrategy.ATS,
      atsSource: match.ats,
    };
  } catch {
    return null;
  }
}

/*
 * fetchJdFromLink
 * Turns a pasted job URL (or pasted JD text) into a ParsedJd, or signals that manual paste is required.
 * @param url        - the job-posting URL the seeker pasted (used for ATS detection + provenance)
 * @param pastedText - optional raw JD text; when present, fetch is skipped and this is AI-structured (MANUAL_PASTE)
 * @param skills     - the Skill catalogue rows for skill matching (id + name), loaded once by the caller
 * @returns JdFetchResult — ok:true with a ParsedJd, or ok:false needsManualPaste for the UI to re-prompt
 */
export async function fetchJdFromLink(
  url: string,
  pastedText: string | null,
  skills: Array<{ id: string; name: string }>,
): Promise<JdFetchResult> {
  try {
    // Manual-paste short-circuit: seeker already gave us the JD text.
    if (pastedText) {
      const extracted = await aiExtractJd(pastedText, url);
      if (!extracted) {
        return { ok: false, needsManualPaste: true, reason: "Could not read the pasted job description." };
      }
      const heuristicSkills = extractSkillsFromText(`${extracted.title} ${extracted.description}`, skills);
      const mergedSkills = [...new Set([...extracted.skills, ...heuristicSkills])];
      return {
        ok: true,
        jd: {
          title: extracted.title,
          company: extracted.company,
          description: extracted.description,
          skills: mergedSkills,
          strategy: JdParseStrategy.MANUAL_PASTE,
          atsSource: null,
        },
      };
    }

    // ATS path: reuse the existing normalizer fetchers, no re-implementation.
    const match = detectAtsFromUrl(url);
    if (match) {
      const viaAts = await fetchViaAts(match, skills);
      if (viaAts) return { ok: true, jd: viaAts };
      // Board fetch failed or posting not found — fall through to generic.
    }

    // Generic HTML path.
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return { ok: false, needsManualPaste: true, reason: "That doesn't look like a valid URL." };
    }
    if (LOGIN_WALL_HOSTS.some((blocked) => host.endsWith(blocked))) {
      return {
        ok: false,
        needsManualPaste: true,
        reason: "This site blocks automated reading — paste the job description instead.",
      };
    }

    const fetched = await safeFetchHtml(url);
    if (!fetched.ok) {
      return {
        ok: false,
        needsManualPaste: true,
        reason: "This site blocks automated reading — paste the job description instead.",
      };
    }

    const stripped = stripHtml(fetched.body);
    if (stripped.length < 200) {
      return {
        ok: false,
        needsManualPaste: true,
        reason: "We could not read that page. Paste the job description to continue.",
      };
    }

    const heuristicSkills = extractSkillsFromText(stripped, skills);
    const extracted = await aiExtractJd(stripped, url);
    if (!extracted) {
      return {
        ok: false,
        needsManualPaste: true,
        reason: "We could not read that link. Paste the job description to continue.",
      };
    }

    const mergedSkills = [...new Set([...extracted.skills, ...heuristicSkills])];
    return {
      ok: true,
      jd: {
        title: extracted.title,
        company: extracted.company,
        description: extracted.description,
        skills: mergedSkills,
        strategy: JdParseStrategy.AI,
        atsSource: null,
      },
    };
  } catch {
    return {
      ok: false,
      needsManualPaste: true,
      reason: "We could not read that link. Paste the job description to continue.",
    };
  }
}
