import dns from "node:dns";
import http from "node:http";
import https from "node:https";
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
 * pinnedLookup
 * Custom `lookup` for http(s).request — Node's net module calls this to
 * resolve the host and connects to whatever address it returns, so
 * validating here (instead of a separate dns.lookup-then-fetch) closes the
 * DNS-rebinding TOCTOU window: there is no gap between "resolve" and
 * "connect" for an attacker's DNS to flip the record in.
 * Honors `options.all` — Happy Eyeballs (autoSelectFamily, on by default)
 * calls net's default lookup with `all:true` and expects the array-form
 * callback; passing back the single-address form in that case makes net.js
 * blow up with a cryptic "Invalid IP address: undefined".
 */
function pinnedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback:
    | ((err: NodeJS.ErrnoException | null, address: string, family: number) => void)
    | ((err: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void),
): void {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return (callback as (e: NodeJS.ErrnoException) => void)(err);
    if (!addresses || addresses.length === 0) {
      return (callback as (e: NodeJS.ErrnoException) => void)(new Error("DNS resolution failed") as NodeJS.ErrnoException);
    }
    if (addresses.some((a) => isPrivateOrReservedIp(a.address))) {
      return (callback as (e: NodeJS.ErrnoException) => void)(new Error("Blocked host") as NodeJS.ErrnoException);
    }
    if (options.all) {
      (callback as (err: null, addresses: dns.LookupAddress[]) => void)(null, addresses);
      return;
    }
    const chosen = addresses[0];
    (callback as (err: null, address: string, family: number) => void)(null, chosen.address, chosen.family);
  });
}

/*
 * fetchOnce
 * Single HTTP(S) request (no redirect following) using pinnedLookup to
 * connect only to a pre-validated, non-private address while still sending
 * the real hostname (Host header, TLS SNI/servername) so cert validation
 * and virtual-hosted sites work normally. Body is streamed with a hard byte
 * cap instead of buffered unbounded.
 */
function fetchOnce(
  target: URL,
): Promise<{ status: number; location: string | null; contentType: string; body: Buffer } | null> {
  return new Promise((resolve) => {
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      resolve(null);
      return;
    }
    const hostnameIsIp = net.isIP(target.hostname) !== 0;
    if (hostnameIsIp && isPrivateOrReservedIp(target.hostname)) {
      resolve(null);
      return;
    }

    const client = target.protocol === "https:" ? https : http;
    const req = client.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: "GET",
        headers: { "User-Agent": "Hiretivo/1.0 (+https://hiretivo.com)", Host: target.host },
        timeout: 8000,
        // Literal-IP URLs skip the lookup (nothing to resolve); pinnedLookup
        // handles hostnames and is what actually closes the TOCTOU gap.
        lookup: hostnameIsIp ? undefined : pinnedLookup,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        const contentType = res.headers["content-type"] ?? "";
        const contentLength = res.headers["content-length"];
        if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
          res.destroy();
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_BODY_BYTES) {
            res.destroy();
            resolve(null);
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ status, location, contentType, body: Buffer.concat(chunks) }));
        res.on("error", () => resolve(null));
      },
    );
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(null));
    req.end();
  });
}

/*
 * safeFetchHtml
 * Fetches a seeker-pasted URL with SSRF and resource-exhaustion guards:
 * every redirect hop connects only to a pinned, pre-validated non-private
 * address (see pinnedLookup — no separate lookup-then-fetch TOCTOU window),
 * and the body is capped at MAX_BODY_BYTES instead of buffered unbounded.
 * @returns { ok:true, body } on a safe, readable text/html response, else { ok:false }
 */
async function safeFetchHtml(rawUrl: string): Promise<{ ok: true; body: string } | { ok: false }> {
  let currentUrl = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let target: URL;
    try {
      target = new URL(currentUrl);
    } catch {
      return { ok: false };
    }

    const res = await fetchOnce(target);
    if (!res) return { ok: false };

    if (res.status >= 300 && res.status < 400) {
      if (!res.location) return { ok: false };
      currentUrl = new URL(res.location, target).toString();
      continue;
    }

    if (res.status < 200 || res.status >= 300) return { ok: false };
    if (!res.contentType.includes("text/html")) return { ok: false };

    return { ok: true, body: res.body.toString("utf-8") };
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
