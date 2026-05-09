import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AiMessageRole, UserRole, PlanTier } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { AiSummaryParamsSchema } from "@/lib/validations/ai-summary.schema";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  buildCandidateSummaryMessages,
  CANDIDATE_SUMMARY_CONFIG,
} from "@/lib/ai-prompts";
import { isAiTrialActive } from "@/lib/ai-trial";

const aiSummaryRateLimiter = createRateLimiter("ai-summary", 10, "1 m");

type FitLevel = "excellent" | "good" | "moderate" | "low";

function calculateFitLevel(score: number): FitLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "moderate";
  return "low";
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

  // 4. Plan gate (D-07): FREE plan cannot access AI summaries (bypass during trial)
  if (session.user.plan === PlanTier.FREE && !isAiTrialActive()) {
    return NextResponse.json(
      { error: "AI candidate summaries require a PRO or ENTERPRISE plan." },
      { status: 403 },
    );
  }

  // 5. Param validation
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

  // 8. Cache hit — return without calling OpenRouter
  if (application.aiSummary !== null) {
    return NextResponse.json(
      {
        data: {
          summary: application.aiSummary,
          fitScore,
          fitLevel,
        },
      },
      { status: 200 },
    );
  }

  // 9. Generate summary via OpenRouter
  const { system, user } = buildCandidateSummaryMessages({
    skills,
    jobSkills,
    matchScore,
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

  const summary =
    completion.choices[0]?.message?.content?.trim() ??
    '<p class="summary-intro">Summary generation failed. Please try again.</p>';

  // 10. Write-back (D-04): cache on Application — continue even if write fails
  try {
    await prisma.application.update({
      where: { id: parsed.data.id },
      data: { aiSummary: summary },
    });
  } catch (err) {
    console.error("[ai-summary] write-back failed:", err);
  }

  // 11. Return summary with fit score
  return NextResponse.json(
    { data: { summary, fitScore, fitLevel } },
    { status: 200 },
  );
}
