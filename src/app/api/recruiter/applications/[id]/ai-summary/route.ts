import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AiMessageRole, UserRole, PlanTier, VerdictLabel, AiFeature } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { AiSummaryParamsSchema } from "@/lib/validations/ai-summary.schema";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  buildCandidateSummaryMessages,
  parseCandidateSummary,
  CANDIDATE_SUMMARY_CONFIG,
  type AiSummaryData,
} from "@/lib/ai-prompts";
import { consumeFreeDailyAiQuota, consumePaidDailyAiCap } from "@/lib/billing/ai-daily-limit";
import { isApplicationVisibleOnFree } from "@/lib/billing/applicant-visibility";

const aiSummaryRateLimiter = createRateLimiter("ai-summary", 10, "1 m");

type FitLevel = "excellent" | "good" | "moderate" | "low";

function calculateFitLevel(score: number): FitLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "moderate";
  return "low";
}

/*
 * getVerdictLabel
 * Maps the deterministic fit level to a recruiter-facing verdict label.
 * Fed verbatim into the summary prompt so the verdict never disagrees with the fit badge.
 */
function getVerdictLabel(fitLevel: FitLevel): VerdictLabel {
  if (fitLevel === "excellent") return VerdictLabel.STRONG_FIT;
  if (fitLevel === "good") return VerdictLabel.WORTH_SCREENING;
  return VerdictLabel.STRETCH_HIRE;
}

function calculateSkillMatchPercentage(
  candidateSkills: string[],
  jobSkills: string[],
): number {
  if (jobSkills.length === 0) return 100;
  if (candidateSkills.length === 0) return 0;

  const normalizedCandidate = candidateSkills.map((s) => s.toLowerCase());
  const matchedCount = jobSkills.filter((jobSkill) =>
    normalizedCandidate.some((cSkill) =>
      cSkill.includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(cSkill)
    )
  ).length;

  return Math.round((matchedCount / jobSkills.length) * 100);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Rate limit
  const { success } = await aiSummaryRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 4. Param validation
  const { id } = await params;
  const parsed = AiSummaryParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 6. Ownership check — return 404 to avoid leaking record existence (T-13-02)
  const application = await prisma.application.findUnique({
    where: { id: parsed.data.id },
    select: {
      aiSummary: true,
      matchScore: true,
      jobId: true,
      job: {
        select: {
          recruiterId: true,
          title: true,
          skills: {
            include: {
              skill: { select: { name: true } },
            },
          },
        },
      },
      seeker: {
        select: {
          seekerProfile: {
            select: {
              headline: true,
              primaryRole: true,
              yearsExperience: true,
              bio: true,
              skills: {
                include: {
                  skill: { select: { name: true } },
                },
              },
              workExperiences: {
                orderBy: { createdAt: "desc" },
                take: 2,
                select: {
                  title: true,
                  company: true,
                },
              },
              educations: {
                orderBy: { graduationDate: "desc" },
                take: 1,
                select: {
                  degree: true,
                  institution: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!application || application.job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 6b. Locked-applicant gate — FREE recruiters can only summarize their visible 25/job.
  // Blocks summarizing a locked candidate's PII even when the application id is known.
  if (
    session.user.plan === PlanTier.FREE &&
    !(await isApplicationVisibleOnFree(
      session.user.id,
      parsed.data.id,
      application.jobId,
    ))
  ) {
    return NextResponse.json(
      { error: "Upgrade to view this candidate." },
      { status: 403 },
    );
  }

  // 7. Build prompt inputs
  const skills = (application.seeker.seekerProfile?.skills ?? []).map(
    (s) => s.skill.name,
  );
  const jobSkills = (application.job.skills ?? []).map(
    (s) => s.skill.name,
  );
  const matchScore = application.matchScore;

  // Calculate skill-based fit score
  const skillMatchPercentage = calculateSkillMatchPercentage(skills, jobSkills);
  const fitScore = Math.round((matchScore + skillMatchPercentage) / 2);
  const fitLevel = calculateFitLevel(fitScore);

  // T-13-03: truncate headline to 200 chars and strip HTML to prevent prompt injection
  const rawHeadline = application.seeker.seekerProfile?.headline ?? null;
  const headline = rawHeadline
    ? rawHeadline.replace(/<[^>]*>/g, "").slice(0, 200)
    : null;

  // 8. Cache hit — return without calling OpenRouter.
  // Legacy rows store freeform HTML (not JSON); those fail parsing and fall through
  // to regeneration, self-healing into the structured format with no DB migration.
  if (application.aiSummary !== null) {
    const cached = parseCandidateSummary(application.aiSummary);
    if (cached) {
      return NextResponse.json(
        { data: { ...cached, fitScore, fitLevel } },
        { status: 200 },
      );
    }
  }

  // Daily quota: FREE plan gets FREE_AI_DAILY_LIMIT summaries/day (cache hits above don't count).
  // Bypassed for all paid plans.
  if (session.user.plan === PlanTier.FREE) {
    const allowed = await consumeFreeDailyAiQuota(AiFeature.SUMMARY, session.user.id);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "AI candidate summaries require a paid plan once your 3 free summaries today are used. Upgrade to continue.",
        },
        { status: 403 },
      );
    }
  } else {
    const withinCap = await consumePaidDailyAiCap(AiFeature.SUMMARY, session.user.id);
    if (!withinCap) {
      return NextResponse.json(
        { error: "Daily AI usage limit reached. Please try again tomorrow." },
        { status: 429 },
      );
    }
  }

  // 9. Generate summary via OpenRouter
  const { system, user } = buildCandidateSummaryMessages({
    skills,
    jobSkills,
    matchScore,
    verdictLabel: getVerdictLabel(fitLevel),
    headline,
    primaryRole: application.seeker.seekerProfile?.primaryRole ?? null,
    yearsExperience: application.seeker.seekerProfile?.yearsExperience ?? null,
    bio: application.seeker.seekerProfile?.bio ?? null,
    recentWork: application.seeker.seekerProfile?.workExperiences ?? [],
    education: application.seeker.seekerProfile?.educations?.[0] ?? null,
    jobTitle: application.job.title,
  });

  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...CANDIDATE_SUMMARY_CONFIG,
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const insights: AiSummaryData = parseCandidateSummary(raw) ?? {
    summary: "Summary generation failed. Please try again.",
    skillMatch: "",
    whyFit: "",
    areasToExplore: "",
    screeningQuestions: [],
  };

  // 10. Write-back (D-04): cache structured JSON on Application — continue even if write fails
  try {
    await prisma.application.update({
      where: { id: parsed.data.id },
      data: { aiSummary: JSON.stringify(insights) },
    });
  } catch (err) {
    console.error("[ai-summary] write-back failed:", err);
  }

  // 11. Return structured insights with fit score
  return NextResponse.json(
    { data: { ...insights, fitScore, fitLevel } },
    { status: 200 },
  );
}
