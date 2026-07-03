import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { ProjectsPayloadSchema, type ProjectInput } from "@/lib/validations/project.schema";

const ProjectInputSchemaLoose = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
});

/*
 * parseTopProjects
 * Coerces SeekerProfile.topProjects Json into typed ProjectInput[], dropping
 * malformed entries. Mirrors lib/resume/map-profile-to-resume.ts's tolerance.
 */
function parseTopProjects(raw: unknown): ProjectInput[] {
  if (!Array.isArray(raw)) return [];
  const parsed = z.array(ProjectInputSchemaLoose).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

/*
 * GET /api/seeker/projects
 * Returns the authenticated seeker's projects, parsed from
 * SeekerProfile.topProjects Json (no dedicated Project model shipped).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { topProjects: true },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { projects: parseTopProjects(seekerProfile.topProjects) } });
}

/*
 * PUT /api/seeker/projects
 * Full-replaces SeekerProfile.topProjects Json with the validated project list.
 * @returns { data: { success: true } } or auth/validation/rate-limit errors
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = ProjectsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  await prisma.seekerProfile.update({
    where: { id: seekerProfile.id },
    data: {
      topProjects: parsed.data.projects.map((p) => ({
        title: p.title,
        description: p.description || null,
        url: p.url || null,
        skills: p.skills,
      })),
    },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
