import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";

/*
 * GET /api/resume/parse-status
 * Returns whether the user's resume has been parsed.
 * Used by the dashboard to show parsing state.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== UserRole.SEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [profile, masterResume] = await Promise.all([
      prisma.seekerProfile.findUnique({
        where: { userId: session.user.id },
        select: { resumeKey: true },
      }),
      prisma.masterResume.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      }),
    ]);

    if (masterResume) {
      return NextResponse.json({ status: "parsed" });
    }
    return NextResponse.json({ status: profile?.resumeKey ? "unparsed" : "no_resume" });
  } catch (error) {
    console.error("[parse-status] Error:", error);
    return NextResponse.json({ status: "no_resume" }, { status: 200 });
  }
}
