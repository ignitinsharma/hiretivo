import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { CertificationsPayloadSchema } from "@/lib/validations/certification.schema";

/*
 * GET /api/seeker/certifications
 * Returns the authenticated seeker's certifications, oldest-created first.
 * @returns { data: { certifications } } or auth/rate-limit/not-found errors
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
    select: {
      certifications: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { certifications: seekerProfile.certifications } });
}

/*
 * PUT /api/seeker/certifications
 * Full-replaces the authenticated seeker's certification list (delete-all +
 * recreate), matching the settings route's work-experience pattern.
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
  const parsed = CertificationsPayloadSchema.safeParse(body);
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

  await prisma.$transaction([
    prisma.certification.deleteMany({ where: { seekerProfileId: seekerProfile.id } }),
    ...parsed.data.certifications.map((cert) =>
      prisma.certification.create({
        data: {
          seekerProfileId: seekerProfile.id,
          name: cert.name,
          issuer: cert.issuer || null,
          issueDate: cert.issueDate || null,
          expiryDate: cert.expiryDate || null,
          credentialUrl: cert.credentialUrl || null,
        },
      }),
    ),
  ]);

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
