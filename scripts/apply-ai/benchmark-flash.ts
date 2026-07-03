import { openrouter } from "@/lib/openrouter";
import {
  buildResumeOptimizeMessages,
  buildCoverLetterMessages,
  parseResumeDocument,
  RESUME_OPTIMIZE_CONFIG,
  COVER_LETTER_CONFIG,
  type SeekerProfileForAi,
  type JobForAi,
} from "@/lib/ai-prompts";
import { computeKeywordStats } from "@/lib/apply/keyword-match";
import { OptimizeMode, AiMessageRole } from "@/constants/enums";

/*
 * Benchmark: Gemini 2.5 Flash vs Gemini 2.5 Flash-Lite (OpenRouter ids).
 *
 * DEVIATION from plan: the plan asked to benchmark 2.5 Flash vs 2.0 Flash.
 * Verified live (2026-07-03) that gemini-2.0-flash / gemini-2.0-flash-001 no
 * longer serve on Google's direct API (400s with a valid-shaped key path) OR
 * on OpenRouter ("404 No endpoints found for google/gemini-2.0-flash-001") —
 * Google shut the model down 2026-06-01. Flash-Lite is the real live cheaper
 * tier today and serves the plan's actual intent ("downshift if quality
 * holds"), so it replaces 2.0 Flash as the comparison target.
 *
 * Uses OpenRouter (this env's configured AI_PROVIDER) for both models, which
 * conveniently returns real per-call `usage.cost` in USD — ground-truth
 * pricing instead of a hardcoded table that goes stale (as the 2.0 Flash
 * figures in the design doc already have).
 */

const MODELS = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"] as const;

const PROFILE: SeekerProfileForAi = {
  fullName: "Ada Lovelace",
  headline: "Senior Backend Engineer",
  primaryRole: "Backend Engineer",
  yearsExperience: 8,
  bio: "Backend engineer with 8 years building distributed payments and data systems.",
  location: "Remote",
  contact: { email: "ada@example.com", location: "Remote", githubUrl: "https://github.com/ada" },
  skillGroups: [
    { category: "Engineering", skills: ["Go", "Node.js", "PostgreSQL", "Kubernetes", "TypeScript"] },
    { category: "Data", skills: ["Redis", "Kafka"] },
  ],
  workExperiences: [
    {
      company: "Analytical Engines",
      title: "Staff Engineer",
      startDate: "01/2020",
      endDate: null,
      description:
        "Led a rewrite of the payments processing pipeline on PostgreSQL, cut p99 latency 40% via connection pooling and query batching. Mentored 3 engineers.",
    },
    {
      company: "Babbage Co",
      title: "Senior Engineer",
      startDate: "06/2016",
      endDate: "12/2019",
      description: "Built the event ingestion pipeline handling 5M events/day using Node.js and Kafka.",
    },
  ],
  educations: [{ institution: "University of London", degree: "BSc", major: "Mathematics", graduationDate: "2015" }],
  certifications: [{ name: "Certified Kubernetes Administrator", issuer: "CNCF", issueDate: "2022" }],
  projects: [],
};
const REAL_COMPANIES = new Set(PROFILE.workExperiences.map((e) => e.company));
const REAL_SKILLS = new Set(PROFILE.skillGroups.flatMap((g) => g.skills));

const JOBS: JobForAi[] = [
  {
    title: "Backend Engineer (Worldwide Remote)",
    company: "Supabase",
    descriptionText:
      "We're a fully remote, worldwide team building the open-source Postgres platform. Looking for a Backend Engineer to own core database features. Requirements: strong PostgreSQL internals knowledge, Go or similar systems language, comfort with distributed systems. Nice to have: Kubernetes, Redis.",
    requiredSkills: ["PostgreSQL", "Go"],
    preferredSkills: ["Kubernetes", "Redis"],
  },
  {
    title: "Senior Backend Engineer (US Only)",
    company: "Stripe",
    descriptionText:
      "US-based role owning core payments infrastructure. Design and build scalable services in Go and PostgreSQL, own end-to-end delivery of payment features, work with the platform team on Kubernetes deployments. Requirements: 5+ years production backend systems, deep PostgreSQL and distributed systems experience, Kubernetes familiarity. Nice to have: Redis, gRPC.",
    requiredSkills: ["Go", "PostgreSQL", "Kubernetes"],
    preferredSkills: ["Redis", "gRPC"],
  },
  {
    title: "Staff Backend Engineer",
    company: "Linear",
    descriptionText:
      "Staff-level role shaping architecture for our sync engine and data layer. You'll lead technical decisions across the backend org, mentor senior engineers, and own our event/data pipeline. Requirements: 8+ years backend experience, deep expertise in distributed data systems (Kafka or similar), TypeScript or Go, track record mentoring engineers. Nice to have: Redis, PostgreSQL internals.",
    requiredSkills: ["Kafka", "TypeScript"],
    preferredSkills: ["Redis", "PostgreSQL"],
  },
];

interface RunResult {
  model: string;
  jobTitle: string;
  resumeLatencyMs: number;
  resumeCost: number | null;
  resumeOutputTokens: number | null;
  resumeParsed: boolean;
  resumeFabricationFree: boolean;
  coverLatencyMs: number;
  coverCost: number | null;
  coverOutputTokens: number | null;
  coverNonEmpty: boolean;
}

function checkFabricationFree(doc: ReturnType<typeof parseResumeDocument>): boolean {
  if (!doc) return false;
  const companiesOk = doc.experience.every((e) => REAL_COMPANIES.has(e.company));
  const skillsOk = doc.skillGroups.every((g) => g.skills.every((s) => REAL_SKILLS.has(s)));
  return companiesOk && skillsOk;
}

async function runOne(model: string, job: JobForAi): Promise<RunResult> {
  const { requiredMatchedSkills, requiredMissingSkills, preferredMatchedSkills } = computeKeywordStats(
    job.requiredSkills,
    job.preferredSkills,
    Array.from(REAL_SKILLS),
  );
  const matchedSkills = [...requiredMatchedSkills, ...preferredMatchedSkills];

  const resumeMessages = buildResumeOptimizeMessages({
    profile: PROFILE,
    job,
    matchedSkills,
    missingSkills: requiredMissingSkills,
    tone: OptimizeMode.HONEST,
  });
  const resumeStart = Date.now();
  const resumeCompletion = await openrouter.chat.completions.create({
    model,
    ...RESUME_OPTIMIZE_CONFIG,
    messages: [
      { role: AiMessageRole.SYSTEM, content: resumeMessages.system },
      { role: AiMessageRole.USER, content: resumeMessages.user },
    ],
  });
  const resumeLatencyMs = Date.now() - resumeStart;
  const resumeDoc = parseResumeDocument(resumeCompletion.choices[0]?.message?.content ?? "");
  const usage = resumeCompletion.usage as unknown as { completion_tokens?: number; cost?: number } | undefined;

  const coverMessages = buildCoverLetterMessages({
    profile: PROFILE,
    job,
    matchedSkills,
    tone: OptimizeMode.HONEST,
  });
  const coverStart = Date.now();
  const coverCompletion = await openrouter.chat.completions.create({
    model,
    ...COVER_LETTER_CONFIG,
    messages: [
      { role: AiMessageRole.SYSTEM, content: coverMessages.system },
      { role: AiMessageRole.USER, content: coverMessages.user },
    ],
  });
  const coverLatencyMs = Date.now() - coverStart;
  const coverLetter = coverCompletion.choices[0]?.message?.content?.trim() ?? "";
  const coverUsage = coverCompletion.usage as unknown as { completion_tokens?: number; cost?: number } | undefined;

  return {
    model,
    jobTitle: job.title,
    resumeLatencyMs,
    resumeCost: usage?.cost ?? null,
    resumeOutputTokens: usage?.completion_tokens ?? null,
    resumeParsed: resumeDoc !== null,
    resumeFabricationFree: checkFabricationFree(resumeDoc),
    coverLatencyMs,
    coverCost: coverUsage?.cost ?? null,
    coverOutputTokens: coverUsage?.completion_tokens ?? null,
    coverNonEmpty: coverLetter.length > 0,
  };
}

async function main(): Promise<void> {
  const results: RunResult[] = [];
  for (const model of MODELS) {
    for (const job of JOBS) {
      // eslint-disable-next-line no-await-in-loop -- sequential to avoid rate-limit bursts against a single model
      const r = await runOne(model, job);
      results.push(r);
      console.log(JSON.stringify(r));
    }
  }

  console.log("\n=== SUMMARY ===");
  for (const model of MODELS) {
    const rows = results.filter((r) => r.model === model);
    const avgResumeLatency = rows.reduce((s, r) => s + r.resumeLatencyMs, 0) / rows.length;
    const avgCoverLatency = rows.reduce((s, r) => s + r.coverLatencyMs, 0) / rows.length;
    const totalCost = rows.reduce((s, r) => s + (r.resumeCost ?? 0) + (r.coverCost ?? 0), 0);
    const avgCostPerJob = totalCost / rows.length;
    const parseSuccessRate = rows.filter((r) => r.resumeParsed).length / rows.length;
    const fabricationFreeRate = rows.filter((r) => r.resumeFabricationFree).length / rows.length;
    const coverSuccessRate = rows.filter((r) => r.coverNonEmpty).length / rows.length;
    console.log(
      `${model}: avgResumeLatency=${avgResumeLatency.toFixed(0)}ms avgCoverLatency=${avgCoverLatency.toFixed(0)}ms avgCostPerJob=$${avgCostPerJob.toFixed(5)} parseSuccessRate=${parseSuccessRate} fabricationFreeRate=${fabricationFreeRate} coverSuccessRate=${coverSuccessRate}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
