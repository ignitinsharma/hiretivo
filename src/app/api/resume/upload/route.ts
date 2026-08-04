import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { R2_KEYS, uploadFile } from "@/lib/r2";
import { resumeUploadLimiter } from "@/lib/rate-limit";
import {
  RESUME_MAX_BYTES,
  RESUME_MIME_TYPES,
} from "@/lib/validations/upload.schema";
import { sniffedTypeAllowed } from "@/lib/validations/file-signature";

/*
 * POST /api/resume/upload
 * Uploads a resume PDF to R2 for persistent storage.
 * Parsing happens asynchronously after onboarding — see POST /api/resume/parse.
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

  const r2configured = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  let key: string;

  if (r2configured) {
    key = R2_KEYS.resume(session.user.id);
    await uploadFile(file, key);
  } else {
    const base64 = Buffer.from(bytes).toString("base64");
    key = `data:${file.type};base64,${base64}`;
  }

  await prisma.seekerProfile.update({
    where: { userId: session.user.id },
    data: { resumeKey: key },
  });

  // ponytail: force re-parse on next dashboard load for the new resume
  await prisma.masterResume.delete({ where: { userId: session.user.id } }).catch(() => {});

  return NextResponse.json({
    data: { key },
  });
}
