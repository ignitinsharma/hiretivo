import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkGenerationQuota, QuotaType } from "@/lib/ai/generation-quota";

/*
 * GET /api/generation-quota
 * Returns the authenticated user's current month generation quota info,
 * split by resume generations and cover letter generations.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resume, coverLetter] = await Promise.all([
    checkGenerationQuota(session.user.id, QuotaType.RESUME),
    checkGenerationQuota(session.user.id, QuotaType.COVER_LETTER),
  ]);
  return NextResponse.json({
    allowed: resume.allowed,
    used: resume.used,
    limit: resume.limit,
    resetsAt: resume.resetsAt,
    plan: resume.plan,
    coverLetter: {
      allowed: coverLetter.allowed,
      used: coverLetter.used,
      limit: coverLetter.limit,
    },
  });
}
