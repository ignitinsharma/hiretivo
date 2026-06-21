import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AiMessageRole, AiFeature, UserRole, VerificationStatus } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { consumePaidDailyAiCap } from "@/lib/billing/ai-daily-limit";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";
import { coarseLocation, redactName } from "@/lib/billing/talent-redaction";
import { resolveLogoUrl } from "@/lib/r2";
import { AiSearchSchema } from "@/lib/validations/ai-search.schema";
import type { ParsedFilters } from "@/lib/validations/ai-search.schema";
import { buildTalentQuery } from "@/modules/recruiter/talent/utils/build-talent-query";
import {
  buildTalentParseMessages,
  TALENT_PARSE_CONFIG,
  buildTalentRerankMessages,
  TALENT_RERANK_CONFIG,
  type TalentParseOutput,
  type CandidateSummary,
  type RerankEntry,
} from "@/lib/ai-prompts";
import type { Prisma } from "@prisma/client";

/* Per-user sliding-window rate limiter: 5 AI searches per minute. */
const aiSearchRateLimiter = createRateLimiter("ai-talent-search", 5, "1 m");

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/*
 * getBioExcerpt
 * Truncates long seeker bios for talent list cards.
 * Returns null for empty bios or a max-length excerpt.
 * @param bio - Raw bio string from seeker profile (may be null/undefined)
 * @returns Truncated excerpt string or null
 */
function getBioExcerpt(bio: string | null | undefined): string | null {
  if (!bio) {
    return null;
  }
  return bio.length > 180 ? `${bio.slice(0, 177)}...` : bio;
}

/*
 * parseTalentQuery
 * Calls the LLM parse step to convert a natural-language talent search query
 * into structured ParsedFilters. Strips optional JSON code fences from the response.
 * skills and keywords arrays default to [] if absent in the model output.
 * @param query - Raw natural-language query from the recruiter
 * @returns ParsedFilters object — throws on parse/LLM failure so caller falls back
 */
async function parseTalentQuery(query: string): Promise<ParsedFilters> {
  const { system, user } = buildTalentParseMessages(query);

  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...TALENT_PARSE_CONFIG,
    response_format: { type: "json_object" },
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
  const cleaned = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(cleaned) as TalentParseOutput;

  return {
    skills: Array.isArray(parsed.skills)
      ? parsed.skills.filter((s): s is string => typeof s === "string")
      : [],
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k): k is string => typeof k === "string")
      : [],
    minYears: typeof parsed.minYears === "number" ? parsed.minYears : undefined,
    maxYears: typeof parsed.maxYears === "number" ? parsed.maxYears : undefined,
    role: typeof parsed.role === "string" ? parsed.role : undefined,
    workPreference: undefined, // WorkType enum validation done only if needed downstream
    location: typeof parsed.location === "string" ? parsed.location : undefined,
    availability: typeof parsed.availability === "string" ? parsed.availability : undefined,
  };
}

/*
 * rerankCandidates
 * Calls the LLM rerank step to order a list of candidate summaries by fit to the query.
 * Validates the returned array: keeps only entries with id and reason strings,
 * deduplicates by id (first occurrence wins), filters out ids not in the input pool,
 * and truncates reason to 120 chars.
 * @param query     - Original natural-language search query
 * @param summaries - Up to 40 CandidateSummary objects to rank
 * @returns Ordered RerankEntry[] — throws on failure so caller falls back
 */
async function rerankCandidates(
  query: string,
  summaries: CandidateSummary[],
): Promise<RerankEntry[]> {
  const { system, user } = buildTalentRerankMessages(query, summaries);

  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...TALENT_RERANK_CONFIG,
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
  const cleaned = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Rerank response is not a JSON array");
  }

  const validIds = new Set(summaries.map((s) => s.id));
  const seenIds = new Set<string>();
  const entries: RerankEntry[] = [];

  for (const item of parsed) {
    if (
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).id === "string" &&
      typeof (item as Record<string, unknown>).reason === "string"
    ) {
      const entry = item as { id: string; reason: string };
      // Deduplicate by id — first occurrence wins
      if (seenIds.has(entry.id)) continue;
      // Only include ids that exist in the input pool
      if (!validIds.has(entry.id)) continue;
      seenIds.add(entry.id);
      entries.push({
        id: entry.id,
        reason: entry.reason.slice(0, 120),
      });
    }
  }

  return entries;
}

/*
 * buildCandidateFetchQuery
 * Maps ParsedFilters from the AI parse step to the existing buildTalentQuery helper.
 * Uses the first parsed skill as the deterministic substring skill filter; remaining
 * skills, keywords, and role are joined into the broad q text search term.
 * Falls back to rawQuery (capped at 100 chars) when no extra terms are derived.
 * @param filters  - Structured filters from the AI parse step (may be empty)
 * @param rawQuery - Original natural-language query as a fallback for q
 * @returns Prisma.UserWhereInput ready for use in prisma.user.findMany
 */
function buildCandidateFetchQuery(
  filters: ParsedFilters,
  rawQuery: string,
): Prisma.UserWhereInput {
  // Use the first skill from parsedFilters as the skill filter (deterministic substring match)
  const skill = filters.skills?.[0] ?? "";

  // Join remaining skills + keywords + role as a broad q search
  const extraTerms = [
    ...(filters.skills?.slice(1) ?? []),
    ...(filters.keywords ?? []),
    filters.role ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const q = extraTerms || rawQuery.slice(0, 100);
  const location = filters.location ?? "";
  const availability = filters.availability ?? "";

  return buildTalentQuery({ q, skill, location, availability });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

/*
 * POST /api/recruiter/talent/ai-search
 * AI-powered natural-language talent search for paid recruiters.
 * Pipeline: parse query → deterministic fetch (≤40) → LLM re-rank (≤25 results).
 * parsedFilters in body skips the parse step (chip-removal re-search).
 * Always falls back to deterministic order on any LLM failure — never 500.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Plan gate — AI search is paid-only (STARTER / GROWTH / SCALE)
  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!canAccessTalentPool(recruiter?.plan)) {
    return NextResponse.json(
      { error: "AI search requires a paid plan." },
      { status: 402 },
    );
  }

  // 3. Per-user rate limit
  const { success: rateLimitOk } = await aiSearchRateLimiter.limit(session.user.id);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 4. Daily AI cap
  const withinCap = await consumePaidDailyAiCap(AiFeature.SEARCH, session.user.id);
  if (!withinCap) {
    return NextResponse.json(
      { error: "AI search daily limit reached. Plain keyword search still works." },
      { status: 429 },
    );
  }

  // 5. Validate body
  const body = await req.json().catch(() => null);
  const parsed = AiSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { query, parsedFilters: incomingFilters } = parsed.data;

  // 6. Parse step — skipped when caller provides parsedFilters (chip-removal re-search)
  let filters: ParsedFilters = incomingFilters ?? {};
  let aiRanked = true;

  if (!incomingFilters) {
    try {
      filters = await parseTalentQuery(query);
    } catch {
      // Parse failure → fall through with empty filters → broad keyword fetch
      aiRanked = false;
    }
  }

  // 7. Fetch candidate pool (capped at 40)
  const POOL_CAP = 40;
  const where = buildCandidateFetchQuery(filters, query);
  const candidates = await prisma.user.findMany({
    where,
    take: POOL_CAP,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          location: true,
          yearsExperience: true,
          primaryRole: true,
          availability: true,
          resumeKey: true,
          skills: {
            select: { skill: { select: { name: true } } },
            orderBy: { skill: { name: "asc" } },
          },
        },
      },
    },
  });

  if (candidates.length === 0) {
    return NextResponse.json({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        demoCount: 0,
        isFreePlan: false,
        parsedFilters: filters,
        aiRanked: false,
      },
    });
  }

  // 8. Batch-load unlocks for this recruiter
  const candidateIds = candidates.map((c) => c.id);
  const existingUnlocks = await prisma.engineerUnlock.findMany({
    where: { recruiterId: session.user.id, engineerId: { in: candidateIds } },
    select: { engineerId: true },
  });
  const unlockedSet = new Set(existingUnlocks.map((u) => u.engineerId));

  // 9. Rerank step — on failure, fall back to deterministic order with no reasons
  let reasonMap = new Map<string, string>();

  if (aiRanked) {
    const summaries: CandidateSummary[] = candidates.map((c) => ({
      id: c.id,
      headline: c.seekerProfile?.headline ?? null,
      role: c.seekerProfile?.primaryRole ?? null,
      skills: c.seekerProfile?.skills.map((s) => s.skill.name) ?? [],
      yearsExperience: c.seekerProfile?.yearsExperience ?? null,
      location: c.seekerProfile?.location ?? null,
      bioSnippet: c.seekerProfile?.bio ? c.seekerProfile.bio.slice(0, 200) : null,
    }));

    try {
      const rankedEntries = await rerankCandidates(query, summaries);
      reasonMap = new Map(rankedEntries.map((e) => [e.id, e.reason]));

      // Re-sort candidates by ranked order; unranked ids go to end
      const rankIndex = new Map(rankedEntries.map((e, i) => [e.id, i]));
      candidates.sort((a, b) => {
        const ai = rankIndex.get(a.id) ?? Infinity;
        const bi = rankIndex.get(b.id) ?? Infinity;
        return ai - bi;
      });
    } catch {
      // Rerank failed — return in deterministic order, no reasons
      aiRanked = false;
    }
  }

  // 10. Map to TalentListItem shape (same field names as existing GET /talent route)
  const RESULT_CAP = 25;
  const items = candidates.slice(0, RESULT_CAP).map((c) => {
    const profile = c.seekerProfile;
    const isUnlocked = unlockedSet.has(c.id);

    return {
      id: c.id,
      isUnlocked,
      verificationStatus: VerificationStatus.VERIFIED,
      name: isUnlocked ? c.name : redactName(c.name),
      email: isUnlocked ? c.email : null,
      image: resolveLogoUrl(c.image),
      headline: profile?.headline ?? null,
      bioExcerpt: isUnlocked ? getBioExcerpt(profile?.bio) : null,
      location: isUnlocked ? (profile?.location ?? null) : coarseLocation(profile?.location),
      yearsExperience: profile?.yearsExperience ?? null,
      primaryRole: profile?.primaryRole ?? null,
      availability: profile?.availability ?? null,
      resumeKey: Boolean(profile?.resumeKey),
      skills: profile?.skills.map((s) => s.skill.name) ?? [],
      matchReason: reasonMap.get(c.id) ?? null,
    };
  });

  return NextResponse.json({
    data: {
      items,
      total: items.length,
      page: 1,
      limit: RESULT_CAP,
      demoCount: 0,
      isFreePlan: false,
      parsedFilters: filters,
      aiRanked,
    },
  });
}
