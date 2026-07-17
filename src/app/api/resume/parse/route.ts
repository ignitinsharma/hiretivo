import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/r2";
import { parseResumeWithVision } from "@/lib/ai/resume-parser";

/*
 * POST /api/resume/parse
 * Parses the uploaded resume PDF with Gemini Vision and saves the result as MasterResume.
 * Called asynchronously from the dashboard after onboarding completes.
 *
 * Flow: fetch file from R2 → vision parse → validate schema → upsert MasterResume
 */
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { resumeKey: true },
  });

  if (!profile?.resumeKey) {
    return NextResponse.json(
      { error: "No resume uploaded yet. Please upload a resume first." },
      { status: 400 },
    );
  }

  const signedUrl = await getSignedFileUrl(profile.resumeKey);
  if (!signedUrl) {
    return NextResponse.json(
      { error: "Could not access uploaded file. Try uploading again." },
      { status: 502 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuffer);
    console.log("[parse] File fetched successfully, size:", pdfBuffer.length, "bytes");
  } catch (err) {
    console.error("[parse] File fetch failed:", err);
    return NextResponse.json(
      { error: "Could not read uploaded file. Try uploading again." },
      { status: 502 },
    );
  }

  const parsed = await parseResumeWithVision(pdfBuffer);

  if (!parsed) {
    console.error("[parse] parseResumeWithVision returned null — see [parseResumeWithVision] logs above");
    return NextResponse.json(
      { error: "Could not parse resume. Please try a different file." },
      { status: 422 },
    );
  }

  console.log("[parse] Resume parsed and validated successfully");

  parsed.profileId = session.user.id;

  await prisma.masterResume.upsert({
    where: { userId: session.user.id },
    update: { resumeJson: parsed },
    create: { userId: session.user.id, resumeJson: parsed },
  });

  return NextResponse.json({
    data: { parsed: true },
  });
}
