import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/r2";
import { parseResumeWithVision, isResumeSuspiciouslyThin } from "@/lib/ai/resume-parser";
import { SELF_HOSTED } from "@/lib/config";
import { readLocalFile } from "@/lib/storage/local-files";

export const maxDuration = 60;

/*
 * POST /api/resume/parse
 * Parses the uploaded resume PDF with Gemini Vision and saves the result as MasterResume.
 * Called asynchronously from the dashboard after onboarding completes.
 *
 * Flow: fetch file from R2 → vision parse → validate schema → upsert MasterResume
 */
export async function POST(_req: NextRequest) {
  try {
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

    let pdfBuffer: Buffer;
    try {
      if (SELF_HOSTED && !profile.resumeKey.startsWith("data:")) {
        pdfBuffer = await readLocalFile(profile.resumeKey);
      } else {
        const signedUrl = await getSignedFileUrl(profile.resumeKey);
        const res = await fetch(signedUrl);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        pdfBuffer = Buffer.from(await res.arrayBuffer());
      }
      console.log("[parse] File fetched successfully, size:", pdfBuffer.length, "bytes");
    } catch (err) {
      console.error("[parse] File fetch failed:", err);
      return NextResponse.json(
        { error: "Could not read uploaded file. Try uploading again." },
        { status: 502 },
      );
    }

    const result = await parseResumeWithVision(pdfBuffer);

    if (result.status === "error") {
      console.error(
        `[parse] parseResumeWithVision error — reason=${result.reason}`,
        "see [parseResumeWithVision] logs above",
      );
      return NextResponse.json(
        { error: "Could not parse resume. Please try a different file." },
        { status: 422 },
      );
    }

    if (result.status === "truncated") {
      console.error("[parse] parseResumeWithVision truncated — resume too long after all tiers");
      return NextResponse.json(
        {
          error: "resume_too_long",
          message:
            "Your resume is very long — we couldn't parse it in full. Try a more concise version.",
        },
        { status: 422 },
      );
    }

    const parsed = result.data;

    console.log("[parse] Resume parsed and validated successfully");

    const warnings = isResumeSuspiciouslyThin(parsed);
    if (warnings.length > 0) {
      console.warn("[parse] Thin resume detected:", warnings);
    }

    parsed.profileId = session.user.id;

    // Merge profile social links into any fields the parser missed (PDF URLs
    // are often not extractable), so re-uploads never drop LinkedIn/GitHub.
    const social = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { linkedinUrl: true, githubUrl: true, websiteUrl: true },
    });
    if (social) {
      parsed.personalInfo = {
        ...parsed.personalInfo,
        linkedin: parsed.personalInfo.linkedin || social.linkedinUrl || null,
        github: parsed.personalInfo.github || social.githubUrl || null,
        websiteUrl: parsed.personalInfo.websiteUrl || social.websiteUrl || null,
      };
    }

    await prisma.masterResume.upsert({
      where: { userId: session.user.id },
      update: { resumeJson: parsed },
      create: { userId: session.user.id, resumeJson: parsed },
    });

    return NextResponse.json({
      data: { parsed: true, ...(warnings.length > 0 ? { warnings } : {}) },
    });
  } catch (error) {
    console.error("[parse] Unhandled error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while parsing your resume. Please try again." },
      { status: 500 },
    );
  }
}
