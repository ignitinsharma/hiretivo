import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkGenerationQuota } from "@/lib/ai/generation-quota";

/*
 * GET /api/generation-quota
 * Returns the authenticated user's current month generation quota info.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await checkGenerationQuota(session.user.id);
  return NextResponse.json(quota);
}
