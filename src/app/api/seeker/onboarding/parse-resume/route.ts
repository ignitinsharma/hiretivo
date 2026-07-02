import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AiFeature, AiMessageRole, PlanTier, ResumeMimeType, UserRole } from "@/constants/enums";
import { openrouter, getAIModel } from "@/lib/openrouter";
import { uploadFile } from "@/lib/r2";
import { extractResumeText } from "@/lib/resume/extract-text";
import { buildResumeParseMessages, RESUME_PARSE_CONFIG } from "@/lib/ai-prompts";
import { ParsedResumeSchema } from "@/lib/validations/resume-parse.schema";
import { createRateLimiter } from "@/lib/rate-limit";
import { consumeFreeDailyAiQuota, consumePaidDailyAiCap } from "@/lib/billing/ai-daily-limit";
import { isAdminSession } from "@/lib/admin/is-admin";

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_RESUME_TYPES = [ResumeMimeType.PDF, ResumeMimeType.DOCX] as const;

const parseResumeRateLimiter = createRateLimiter("parse-resume", 5, "1 m");

/*
 * POST /api/seeker/onboarding/parse-resume
 * Upload a resume (PDF/DOCX), persist it to R2, extract its text, and ask the
 * LLM to return a structured draft profile for the seeker to review/correct.
 * Never fabricates — extraction only, temperature 0.
 * Image-only PDFs (no text layer) and LLM/parse failures both degrade to a
 * `{ fallback: "manual" }` response rather than dead-ending the user; the AI
 * quota is only consumed once we know a real LLM call is about to happen.
 * @returns { data: { parsed, resumeKey } } | { data: { fallback: "manual", resumeKey } } | { error }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = isAdminSession(session);
  if (!admin && session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success: withinRate } = await parseResumeRateLimiter.limit(session.user.id);
  if (!withinRate) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const resumeFile = formData?.get("resumeFile");
  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
  }
  if (resumeFile.size > MAX_RESUME_SIZE) {
    return NextResponse.json({ error: "Resume must be under 5MB" }, { status: 400 });
  }
  if (!ALLOWED_RESUME_TYPES.includes(resumeFile.type as ResumeMimeType)) {
    return NextResponse.json({ error: "Only PDF and DOCX files are allowed" }, { status: 400 });
  }

  const ext = resumeFile.type === ResumeMimeType.DOCX ? "docx" : "pdf";
  const resumeKey = `resumes/${session.user.id}/resume.${ext}`;
  const buffer = Buffer.from(await resumeFile.arrayBuffer());

  try {
    await uploadFile(resumeFile, resumeKey);
  } catch (err) {
    console.error("[parse-resume] R2 upload failed:", err);
    return NextResponse.json({ error: "Resume upload failed. Please try again." }, { status: 500 });
  }

  const { text, hasTextLayer } = await extractResumeText(buffer, resumeFile.type);
  if (!hasTextLayer) {
    return NextResponse.json({ data: { fallback: "manual", resumeKey } }, { status: 200 });
  }

  // Quota is consumed only now — after we know a real LLM call is happening —
  // so image-PDF fallbacks above never burn a credit.
  if (!admin && session.user.plan === PlanTier.FREE) {
    const allowed = await consumeFreeDailyAiQuota(AiFeature.PARSE_RESUME, session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "You've used your free resume parses today. Try again tomorrow, or fill your profile manually." },
        { status: 403 },
      );
    }
  } else if (!admin) {
    const withinCap = await consumePaidDailyAiCap(AiFeature.PARSE_RESUME, session.user.id);
    if (!withinCap) {
      return NextResponse.json(
        { error: "Daily AI usage limit reached. Please try again tomorrow." },
        { status: 429 },
      );
    }
  }

  try {
    const { system, user } = buildResumeParseMessages({ resumeText: text });
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      ...RESUME_PARSE_CONFIG,
      response_format: { type: "json_object" },
      messages: [
        { role: AiMessageRole.SYSTEM, content: system },
        { role: AiMessageRole.USER, content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
    const parsedJson = JSON.parse(cleaned) as unknown;

    const result = ParsedResumeSchema.safeParse(parsedJson);
    if (!result.success) {
      console.error("[parse-resume] LLM output failed schema validation:", result.error.flatten());
      return NextResponse.json({ data: { fallback: "manual", resumeKey } }, { status: 200 });
    }

    return NextResponse.json({ data: { parsed: result.data, resumeKey } }, { status: 200 });
  } catch (err) {
    console.error("[parse-resume] LLM parse failed:", err);
    return NextResponse.json({ data: { fallback: "manual", resumeKey } }, { status: 200 });
  }
}
