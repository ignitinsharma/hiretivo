import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resumeUploadKey, uploadFile } from "@/lib/r2";
import { resumeUploadLimiter } from "@/lib/rate-limit";
import {
  RESUME_MAX_BYTES,
  RESUME_MIME_TYPES,
} from "@/lib/validations/upload.schema";
import { sniffedTypeAllowed } from "@/lib/validations/file-signature";
import { SELF_HOSTED } from "@/lib/config";

/*
 * POST /api/resume/upload
 * Uploads a resume to the selected persistent file store.
 * Parsing happens asynchronously after onboarding — see POST /api/resume/parse.
 */
export async function POST(req: NextRequest) {
  try {
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

    const r2configured = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    const key = !SELF_HOSTED && !r2configured
      ? `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`
      : resumeUploadKey(session.user.id, file.type);
    if (!key.startsWith("data:")) await uploadFile(file, key);

    await prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      update: { resumeKey: key },
      create: { userId: session.user.id, resumeKey: key },
    });

    // ponytail: force re-parse on next dashboard load for the new resume
    await prisma.masterResume.delete({ where: { userId: session.user.id } }).catch(() => {});

    return NextResponse.json({
      data: { key },
    });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Failed to upload resume. Please try again." }, { status: 500 });
  }
}
