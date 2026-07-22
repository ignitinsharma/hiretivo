import { openrouter, getResumeModel } from "@/lib/openrouter";
import { withRetry } from "@/lib/ai/with-retry";
import { checkGenerationQuota, consumeGenerationQuota } from "@/lib/ai/generation-quota";
import { resumeGenFreeLimiter, resumeGenPaidLimiter } from "@/lib/rate-limit";
import { buildTailorResumeMessages, TAILOR_RESUME_CONFIG } from "@/lib/ai-prompts";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";
import type { ResumeDocument, ResumeMatchMeta } from "@/lib/validations/resume.schema";

export interface TailorResumeInput {
  userId: string;
  applicationId: string;
  masterResumeJson: ResumeDocument;
  jdText: string;
  jobSkills?: string[];
  jobTitle?: string;
}

export type TailorResumeResult =
  | { status: "success"; resumeVersion: ResumeVersionResponse }
  | { status: "quota_exceeded"; used: number; limit: number; resetsAt: string }
  | { status: "rate_limited"; retryAfterSeconds: number }
  | { status: "ai_error"; reason: "timeout" | "malformed_response" | "unreadable_jd" }
  | { status: "validation_error"; details: string };

export interface ResumeVersionResponse {
  id: string;
  version: number;
  resumeJson: ResumeDocument;
  matchMeta: ResumeMatchMeta;
}

interface AiTailorResponse {
  resume: ResumeDocument;
  matchMeta?: ResumeMatchMeta;
  missingSkills?: string[];
}

function parseAiResponse(raw: string): AiTailorResponse | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    if (!parsed.resume) {
      // Fallback: AI may return resume fields flat at top level (no "resume" wrapper)
      if (typeof parsed.summary === "string" || Array.isArray(parsed.experience)) {
        console.warn("[resume-tailor] AI returned flat resume — applying fallback");
        return { resume: parsed as ResumeDocument, matchMeta: undefined, missingSkills: parsed.missingSkills };
      }
      console.error("[resume-tailor] AI response missing resume field:", Object.keys(parsed).join(", "));
      return null;
    }

    return {
      resume: parsed.resume,
      matchMeta: parsed.matchMeta,
      missingSkills: parsed.missingSkills,
    } as AiTailorResponse;
  } catch (err) {
    console.error("[resume-tailor] JSON parse failed:", err, "\nRaw:", raw);
    return null;
  }
}

/*
 * tailorResume
 * The single most important AI call in the product.
 * Takes MasterResume.resumeJson + JD text → produces tailored resume.
 *
 * Ordering:
 * 1. Check generation quota (monthly) — block if exceeded
 * 2. Check hourly rate limit — block if exceeded (free: 5/hr, paid: 15/hr)
 * 3. Call Gemini 2.5 Flash via OpenRouter with retry
 * 4. Validate response against Phase 0 schema
 * 5. On success: consume quota, save as new ResumeVersion, return result
 */
export async function tailorResume(
  input: TailorResumeInput,
): Promise<TailorResumeResult> {
  const { userId, applicationId, masterResumeJson, jdText, jobSkills, jobTitle } = input;

  // 1. Quota check — before any AI call
  const quota = await checkGenerationQuota(userId);
  if (!quota.allowed) {
    return { status: "quota_exceeded", used: quota.used, limit: quota.limit, resetsAt: quota.resetsAt };
  }

  // 2. Rate limit check — before any AI call
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const isPaid = user?.plan && user.plan !== PlanTier.FREE;
  const limiter = isPaid ? resumeGenPaidLimiter : resumeGenFreeLimiter;
  const { success: rateOk, reset: rateReset } = await limiter.limit(userId);

  if (!rateOk) {
    const retryAfterSeconds = Math.ceil((rateReset - Date.now()) / 1000);
    return { status: "rate_limited", retryAfterSeconds };
  }

  // 3. JD quality check — bail early on unreadable input
  if (!jdText || jdText.trim().length < 50) {
    return { status: "ai_error", reason: "unreadable_jd" };
  }

  // 4. Call AI with retry
  const { system, user: userMessage } = buildTailorResumeMessages({
    resumeJson: JSON.stringify(masterResumeJson),
    jdText,
    jobSkills,
    jobTitle,
  });

  const aiResult = await withRetry(async () => {
    const completion = await openrouter.chat.completions.create({
      model: getResumeModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
      temperature: TAILOR_RESUME_CONFIG.temperature,
      max_tokens: TAILOR_RESUME_CONFIG.max_tokens,
    });

    return {
      content: completion.choices?.[0]?.message?.content ?? "",
      finishReason: completion.choices?.[0]?.finish_reason ?? null,
    };
  });

  if (!aiResult) {
    return { status: "ai_error", reason: "timeout" };
  }

  if (aiResult.finishReason === "length") {
    console.warn("[resume-tailor] Truncated output — finish_reason=length", {
      userId,
      jdLength: jdText.length,
    });
  }

  // 5. Parse AI response
  const parsed = parseAiResponse(aiResult.content);
  if (!parsed) {
    return { status: "ai_error", reason: "malformed_response" };
  }

  // 6. Validate against Phase 0 schema
  // Stitch the identity fields back in since the model shouldn't need to re-send them
  const tailored: ResumeDocument = {
    ...parsed.resume,
    profileId: masterResumeJson.profileId,
    resumeVersionId: null,
    applicationId,
    sourceType: "ai-generated",
    generatedAt: new Date().toISOString(),
    missingSkills: parsed.missingSkills,
  };

  const validation = ResumeDocumentSchema.safeParse(tailored);
  if (!validation.success) {
    console.error("[resume-tailor] Schema validation failed:", validation.error.format());
    return { status: "ai_error", reason: "malformed_response" };
  }

  // 7. Save as new ResumeVersion — never writes to MasterResume
  const existingVersions = await prisma.resumeVersion.count({
    where: { applicationId },
  });

  const resumeVersion = await prisma.resumeVersion.create({
    data: {
      applicationId,
      version: existingVersions + 1,
      resumeJson: validation.data,
      sourceType: "ai-generated",
    },
  });

  // 8. Update application: bump generationCount, set activeVersionId
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      generationCount: { increment: 1 },
      activeVersionId: resumeVersion.id,
    },
  });

  // 9. Consume quota — only on schema-valid success
  await consumeGenerationQuota(userId);

  return {
    status: "success",
    resumeVersion: {
      id: resumeVersion.id,
      version: resumeVersion.version,
      resumeJson: validation.data,
      matchMeta: parsed.matchMeta ?? {
        matchScore: 0,
        addedKeywords: [],
        missingKeywords: [],
        requiredSkillsMatched: 0,
        requiredSkillsTotal: 0,
        preferredSkillsMatched: 0,
        preferredSkillsTotal: 0,
      },
    },
  };
}
