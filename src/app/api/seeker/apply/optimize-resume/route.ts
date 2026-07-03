import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AiMessageRole, PlanTier, UserRole } from "@/constants/enums";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { createRateLimiter } from "@/lib/rate-limit";
import { ResumeOptimizeSchema } from "@/lib/validations/apply-ai.schema";
import { buildResumeOptimizeMessages, parseResumeDocument, RESUME_OPTIMIZE_CONFIG } from "@/lib/ai-prompts";
import { reserveSeekerCredit, refundSeekerCredit } from "@/lib/billing/ai-daily-limit";
import { computeKeywordStats, extractJdSkills } from "@/lib/apply/keyword-match";

const optimizeResumeRateLimiter = createRateLimiter("apply-optimize-resume", 5, "1 m");

/*
 * resolveJobDescriptionText
 * A pasted-link JD (no Job row) supplies jdText directly; a feed job supplies
 * jobId and this fetches Job.description, stripped of HTML tags for the
 * plain-text prompt context.
 * @returns plain-text JD, or null if neither source resolves
 */
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
 * POST /api/seeker/apply/optimize-resume
 * Generates a JD-tailored ResumeDocument (Phase 3b contract) for the given job
 * and the seeker's real profile data. Reserves ONE monthly AI credit before
 * generation; refunds it if generation fails before any model output arrives.
 * Response is a streamed `text/plain` body, but the model's tokens are
 * buffered server-side and emitted as a single complete JSON payload — partial
 * JSON is unusable client-side anyway, and buffering lets the route
 * deterministically overwrite contact/education/certifications/projects with
 * the real profile data (the model must never own facts it can only fumble).
 * Request body: ResumeOptimizeSchema. Response: single-chunk ResumeDocument JSON text.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const { success } = await optimizeResumeRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ResumeOptimizeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }

  const { jobId, jdText, jobTitle, company, tone, profile } = parsed.data;
  let { requiredSkills, preferredSkills } = parsed.data;

  const descriptionText = await resolveJobDescriptionText(jobId, jdText);
  if (!descriptionText) {
    return new Response(JSON.stringify({ error: "Job description could not be resolved" }), {
      status: 400,
    });
  }

  // JobSkill has no required/preferred split today — when the caller hasn't
  // supplied skills explicitly, extract from the JD text and treat as required.
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    const catalog = await prisma.skill.findMany({ select: { id: true, name: true } });
    requiredSkills = extractJdSkills(descriptionText, catalog);
  }

  const seekerSkillNames = profile.skillGroups.flatMap((g) => g.skills);
  const { requiredMatchedSkills, requiredMissingSkills, preferredMatchedSkills } =
    computeKeywordStats(requiredSkills, preferredSkills, seekerSkillNames);
  const matchedSkills = [...requiredMatchedSkills, ...preferredMatchedSkills];

  // session.user.plan is @prisma/client's PlanTier (next-auth.d.ts augmentation);
  // app code uses the mirrored src/constants/enums.ts PlanTier (same string
  // values, distinct nominal type) — cast at this boundary only.
  const plan = session.user.plan as unknown as PlanTier;
  const { allowed } = await reserveSeekerCredit(session.user.id, plan);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Monthly AI credit limit reached. Upgrade your plan for more.", remaining: 0 }),
      { status: 402 },
    );
  }

  const { system, user } = buildResumeOptimizeMessages({
    profile,
    job: { title: jobTitle, company, descriptionText, requiredSkills, preferredSkills },
    matchedSkills,
    missingSkills: requiredMissingSkills,
    tone,
  });

  const stream = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...RESUME_OPTIMIZE_CONFIG,
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  const encoder = new TextEncoder();
  const userId = session.user.id;
  let emittedContent = false;
  let raw = "";
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            emittedContent = true;
            raw += content;
            // Buffer + re-emit at the end so we can deterministically
            // override contact/education/certifications/projects below —
            // the model has no reason to touch real, already-known data and
            // has been observed dropping real fields (e.g. nulling a real
            // email) despite instructions. Real data always wins.
          }
        }
        const parsedDoc = parseResumeDocument(raw);
        const finalDoc = parsedDoc
          ? {
              ...parsedDoc,
              fullName: profile.fullName,
              contact: profile.contact,
              education: profile.educations.map((e) => ({
                institution: e.institution,
                degree: e.degree ?? undefined,
                major: e.major ?? undefined,
                graduationDate: e.graduationDate ?? undefined,
              })),
              certifications: profile.certifications,
              projects: profile.projects,
            }
          : null;
        if (!finalDoc) {
          if (!emittedContent) await refundSeekerCredit(userId);
          controller.error(new Error("Model output did not parse into a valid ResumeDocument"));
          return;
        }
        controller.enqueue(encoder.encode(JSON.stringify(finalDoc)));
        controller.close();
      } catch (error) {
        if (!emittedContent) {
          await refundSeekerCredit(userId);
        }
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
