import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { ResumeDocumentSchema, type ResumeDocument } from "@/lib/validations/resume.schema";

/* Creates an empty canonical document for a user who has not uploaded a resume. */
function emptyResume(userId: string): ResumeDocument {
  return {
    profileId: userId,
    resumeVersionId: null,
    applicationId: null,
    sourceType: "manual-edit",
    generatedAt: new Date().toISOString(),
    personalInfo: {
      name: "", email: "", phone: "", location: null,
      linkedin: null, github: null, websiteUrl: null, twitter: null,
    },
    summary: "",
    experience: [], projects: [], education: [],
    skills: { categories: [] }, certifications: [], languages: [],
  };
}

/* GET /api/resume/base returns the signed-in seeker's canonical resume or an editable blank document. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });

  const master = await prisma.masterResume.findUnique({
    where: { userId: session.user.id },
    select: { id: true, resumeJson: true, updatedAt: true },
  });
  return NextResponse.json({ data: {
    id: master?.id ?? null,
    resumeJson: master?.resumeJson ?? emptyResume(session.user.id),
    updatedAt: master?.updatedAt?.toISOString() ?? null,
  } });
}

/* PUT /api/resume/base validates and saves only the signed-in seeker's canonical resume. */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const raw = body && typeof body === "object" && "resumeJson" in body ? body.resumeJson : undefined;
  const parsed = ResumeDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resume document", details: parsed.error.flatten() }, { status: 422 });
  }

  const { matchMeta: _matchMeta, missingSkills: _missingSkills, ...content } = parsed.data;
  const resumeJson: ResumeDocument = {
    ...content,
    profileId: session.user.id,
    resumeVersionId: null,
    applicationId: null,
    sourceType: "manual-edit",
  };

  const master = await prisma.masterResume.upsert({
    where: { userId: session.user.id },
    update: { resumeJson: resumeJson as Prisma.InputJsonValue },
    create: { userId: session.user.id, resumeJson: resumeJson as Prisma.InputJsonValue },
    select: { id: true, resumeJson: true, updatedAt: true },
  });
  return NextResponse.json({ data: {
    id: master.id,
    resumeJson: master.resumeJson,
    updatedAt: master.updatedAt.toISOString(),
  } });
}
