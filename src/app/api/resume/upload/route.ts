import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { R2_KEYS, uploadFile } from "@/lib/r2";
import { resumeUploadLimiter } from "@/lib/rate-limit";
import { parseResumeWithVision } from "@/lib/ai/resume-parser";
import {
  RESUME_MAX_BYTES,
  RESUME_MIME_TYPES,
} from "@/lib/validations/upload.schema";
import { sniffedTypeAllowed } from "@/lib/validations/file-signature";

/*
 * POST /api/resume/upload
 * Uploads a resume PDF, parses it with Gemini Vision, saves as MasterResume.
 * Also updates SeekerProfile.resumeKey for backward compatibility.
 *
 * Flow: upload R2 → vision parse → validate schema → save MasterResume → return parsed data
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await resumeUploadLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!RESUME_MIME_TYPES.includes(file.type as (typeof RESUME_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (file.size > RESUME_MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffedTypeAllowed(bytes, "document")) {
    return NextResponse.json(
      { error: "File content does not match an allowed document type" },
      { status: 400 },
    );
  }

  // Upload to R2 for persistent storage
  const key = R2_KEYS.resume(session.user.id);
  await uploadFile(file, key);

  // Parse with Gemini Vision
  const pdfBuffer = Buffer.from(bytes);
  const parsed = await parseResumeWithVision(pdfBuffer);

  if (!parsed) {
    // Upload succeeded but parsing failed — save key anyway for backward compat
    await prisma.seekerProfile.update({
      where: { userId: session.user.id },
      data: { resumeKey: key },
    });

    return NextResponse.json(
      { error: "Could not parse resume. Please try a different file." },
      { status: 422 },
    );
  }

  // Replace placeholder with real profileId
  parsed.profileId = session.user.id;

  // Save as MasterResume (upsert — one per user)
  await prisma.masterResume.upsert({
    where: { userId: session.user.id },
    update: { resumeJson: parsed },
    create: { userId: session.user.id, resumeJson: parsed },
  });

  // Update SeekerProfile.resumeKey for backward compat
  await prisma.seekerProfile.update({
    where: { userId: session.user.id },
    data: { resumeKey: key },
  });

  return NextResponse.json({
    data: {
      parsed: true,
      resumeJson: parsed,
    },
  });
}
