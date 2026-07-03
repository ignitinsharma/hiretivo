import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AiMessageRole, PlanTier, UserRole } from "@/constants/enums";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { createRateLimiter } from "@/lib/rate-limit";
import { CoverLetterSchema } from "@/lib/validations/apply-ai.schema";
import { buildCoverLetterMessages, COVER_LETTER_CONFIG } from "@/lib/ai-prompts";
import { reserveSeekerCredit, refundSeekerCredit } from "@/lib/billing/ai-daily-limit";
import { computeKeywordStats, extractJdSkills } from "@/lib/apply/keyword-match";

const coverLetterRateLimiter = createRateLimiter("apply-cover-letter", 5, "1 m");

/* Same JD-resolution rule as optimize-resume: pasted-link JDs carry jdText;
 * feed jobs resolve Job.description via jobId, stripped of HTML. */
async function resolveJobDescriptionText(
  jobId: string | undefined,
  jdText: string | undefined,
): Promise<string | null> {
  if (jdText) return jdText;
  if (!jobId) return null;
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { description: true } });
  if (!job) return null;
  return job.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/*
 * POST /api/seeker/apply/cover-letter
 * Generates a short, JD-specific cover letter for the seeker's real profile.
 * A wizard run treats resume + cover as ONE credit: when `reuseReservation`
 * is true (the optimize-resume call already reserved it), this route skips
 * reservation; a standalone regeneration (reuseReservation=false) reserves
 * its own credit and refunds it on failure.
 * Request body: CoverLetterSchema. Response: { data: { coverLetter } }.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const { success } = await coverLetterRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CoverLetterSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }

  const { jobId, jdText, jobTitle, company, tone, profile, reuseReservation } = parsed.data;
  let { requiredSkills, preferredSkills } = parsed.data;

  const descriptionText = await resolveJobDescriptionText(jobId, jdText);
  if (!descriptionText) {
    return new Response(JSON.stringify({ error: "Job description could not be resolved" }), {
      status: 400,
    });
  }

  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    const catalog = await prisma.skill.findMany({ select: { id: true, name: true } });
    requiredSkills = extractJdSkills(descriptionText, catalog);
  }

  const seekerSkillNames = profile.skillGroups.flatMap((g) => g.skills);
  const { requiredMatchedSkills, preferredMatchedSkills } = computeKeywordStats(
    requiredSkills,
    preferredSkills,
    seekerSkillNames,
  );
  const matchedSkills = [...requiredMatchedSkills, ...preferredMatchedSkills];

  const userId = session.user.id;
  const plan = session.user.plan as unknown as PlanTier;

  if (!reuseReservation) {
    const { allowed } = await reserveSeekerCredit(userId, plan);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Monthly AI credit limit reached. Upgrade your plan for more.", remaining: 0 }),
        { status: 402 },
      );
    }
  }

  const { system, user } = buildCoverLetterMessages({
    profile,
    job: { title: jobTitle, company, descriptionText, requiredSkills, preferredSkills },
    matchedSkills,
    tone,
  });

  try {
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      ...COVER_LETTER_CONFIG,
      messages: [
        { role: AiMessageRole.SYSTEM, content: system },
        { role: AiMessageRole.USER, content: user },
      ],
    });
    const coverLetter = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!coverLetter) {
      if (!reuseReservation) await refundSeekerCredit(userId);
      return new Response(
        JSON.stringify({ error: "Generation failed, your credit was not used." }),
        { status: 502 },
      );
    }
    return Response.json({ data: { coverLetter } }, { status: 200 });
  } catch {
    if (!reuseReservation) await refundSeekerCredit(userId);
    return new Response(
      JSON.stringify({ error: "Generation failed, your credit was not used." }),
      { status: 502 },
    );
  }
}
