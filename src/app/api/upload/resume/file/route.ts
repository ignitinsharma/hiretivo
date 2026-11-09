import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { SELF_HOSTED } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { readLocalFile } from "@/lib/storage/local-files";

/* Serve the signed-in user's uploaded resume without exposing local volume paths. */
export async function GET() {
  if (!SELF_HOSTED) return new NextResponse(null, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return new NextResponse(null, { status: 403 });
  if (!(await dataFetchRateLimiter.limit(session.user.id)).success) return new NextResponse(null, { status: 429 });

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { resumeKey: true },
  });
  const key = profile?.resumeKey;
  if (!key || !key.startsWith(`resumes/${session.user.id}/`)) return new NextResponse(null, { status: 404 });
  const extension = key.endsWith(".pdf") ? "pdf" : key.endsWith(".docx") ? "docx" : key.endsWith(".doc") ? "doc" : null;
  if (!extension) return new NextResponse(null, { status: 404 });
  const contentType = extension === "pdf" ? "application/pdf" : extension === "doc"
    ? "application/msword" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  try {
    const body = await readLocalFile(key);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="resume.${extension}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new NextResponse(null, { status: 404 });
    throw error;
  }
}
