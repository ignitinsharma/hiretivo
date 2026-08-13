import { openrouter, getLiteAIModel } from "@/lib/openrouter";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";
import { withRetry } from "@/lib/ai/with-retry";
import { prisma } from "@/lib/prisma";

const DENYLIST = new Set([
  'communication', 'leadership', 'collaboration', 'problem-solving', 'problem solving',
  'teamwork', 'mentoring', 'time management', 'critical thinking', 'attention to detail',
  'organizational skills', 'interpersonal skills', 'analytical skills', 'adaptability',
  'creativity', 'self-motivated', 'self motivated', 'fast-paced', 'fast paced',
  'multitasking', 'agile', 'scrum', 'standup', 'sprint',
]);

export interface SkillCandidate {
  name: string;
  category: 'language' | 'framework' | 'database' | 'cloud' | 'tool' | 'platform';
}

export interface ReconcileResult {
  created: Array<{ id: string; name: string; category: string }>;
  aliasesAdded: Array<{ skillName: string; alias: string }>;
  rejected: Array<{ name: string; reason: string }>;
}

function deriveSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const EXTRACTION_PROMPT = {
  system: `You are a technical skill extractor. Given a job description, extract ONLY concrete technical skills, tools, programming languages, frameworks, platforms, and databases explicitly mentioned in the text.

Rules:
- Extract only named technical skills (e.g. "Kafka", "Docker", "PostgreSQL", "React", "AWS")
- Do NOT extract soft skills (communication, leadership, problem-solving, etc.)
- Do NOT extract responsibilities, duties, or generic phrases
- Do NOT extract "years of experience", "degree requirements", or similar non-skill text
- Each skill must clearly belong to one of these categories: language, framework, database, cloud, tool, platform
- If a term doesn't clearly fit a category, omit it rather than forcing one
- Use the exact casing as it appears in the text where reasonable (e.g. "TypeScript" not "typescript")

Output ONLY a valid JSON object with this exact shape:
{
  "skills": [
    { "name": "Skill Name", "category": "language" },
    { "name": "Another Skill", "category": "framework" }
  ]
}`,
};

export async function extractCandidateSkillsFromJD(
  jdText: string,
): Promise<SkillCandidate[]> {
  const text = jdText.slice(0, 5000);

  try {
    const completion = await withRetry(async (signal) => {
      return await openrouter.chat.completions.create({
        model: getLiteAIModel(),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACTION_PROMPT.system },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        reasoning: { effort: "low" },
      } as ChatCompletionCreateParamsNonStreaming, { signal });
    }, { timeoutMs: 30_000, maxRetries: 0 });

    const raw = completion?.choices?.[0]?.message?.content ?? "";
    if (!raw || !raw.trim()) {
      console.warn("[skill-catalog-extractor] LLM returned empty content");
      return [];
    }
    const parsed = JSON.parse(raw);
    const skills = parsed.skills ?? [];

    if (!Array.isArray(skills)) {
      console.warn("[skill-catalog-extractor] LLM response skills is not an array:", typeof skills);
      return [];
    }

    return skills.filter(
      (s: unknown): s is SkillCandidate =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as SkillCandidate).name === "string" &&
        typeof (s as SkillCandidate).category === "string",
    );
  } catch (err) {
    console.error("[skill-catalog-extractor] AI call failed:", err);
    return [];
  }
}

export async function reconcileAndInsertSkills(
  candidates: SkillCandidate[],
): Promise<ReconcileResult> {
  const result: ReconcileResult = { created: [], aliasesAdded: [], rejected: [] };

  if (candidates.length === 0) return result;

  const existing = await prisma.skill.findMany({
    select: { id: true, name: true, aliases: true, category: true },
  });

  // Batch-accumulated writes: one createMany + few alias updates instead of
  // one DB round-trip per candidate.
  const toCreate = new Map<string, { name: string; slug: string; category: string }>();
  const toAlias: Array<{ skillId: string; alias: string; skillName: string }> = [];

  for (const candidate of candidates) {
    const normalized = candidate.name.toLowerCase().trim();

    if (normalized.length < 2) {
      result.rejected.push({ name: candidate.name, reason: "too short" });
      continue;
    }

    if (DENYLIST.has(normalized)) {
      result.rejected.push({ name: candidate.name, reason: "denylisted" });
      continue;
    }

    const exactMatch = existing.find((s) => s.name.toLowerCase() === normalized);
    if (exactMatch) continue;

    const aliasMatch = existing.find((s) =>
      s.aliases.some((a) => a.toLowerCase() === normalized),
    );
    if (aliasMatch) continue;

    const candidateNorm = normalizeName(candidate.name);
    const closeMatch = existing.find(
      (s) => normalizeName(s.name) === candidateNorm,
    );
    if (closeMatch) {
      const alias = candidate.name;
      if (!toAlias.some((a) => a.skillId === closeMatch.id && a.alias === alias)) {
        toAlias.push({ skillId: closeMatch.id, alias, skillName: closeMatch.name });
        result.aliasesAdded.push({ skillName: closeMatch.name, alias });
        closeMatch.aliases.push(alias);
      }
      continue;
    }

    if (toCreate.has(candidateNorm)) continue;
    toCreate.set(candidateNorm, {
      name: candidate.name,
      slug: deriveSlug(candidate.name),
      category: candidate.category,
    });
  }

  if (toCreate.size > 0) {
    const newSkills = [...toCreate.values()];
    await prisma.skill.createMany({ data: newSkills, skipDuplicates: true });
    const createdRows = await prisma.skill.findMany({
      where: { name: { in: newSkills.map((s) => s.name) } },
      select: { id: true, name: true, category: true },
    });
    for (const row of createdRows) {
      result.created.push({ id: row.id, name: row.name, category: row.category });
    }
  }

  for (const a of toAlias) {
    await prisma.skill.update({
      where: { id: a.skillId },
      data: { aliases: { push: a.alias } },
    });
  }

  return result;
}
