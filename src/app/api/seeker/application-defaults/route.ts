import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { ApplicationDefaultsSchema } from "@/lib/validations/application-defaults.schema";

/*
 * GET /api/seeker/application-defaults
 * Returns the authenticated seeker's ApplicationDefaults row, or
 * { data: null } when it hasn't been created yet.
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
    select: { applicationDefaults: true },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: seekerProfile.applicationDefaults });
}

/*
 * PUT /api/seeker/application-defaults
 * Upserts the authenticated seeker's ApplicationDefaults row (1:1 SeekerProfile).
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
  const parsed = ApplicationDefaultsSchema.safeParse(body);
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

  const data = {
    addressLine: parsed.data.addressLine || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    postalCode: parsed.data.postalCode || null,
    countryCode: parsed.data.countryCode || null,
    phone: parsed.data.phone || null,
    linkedinUrl: parsed.data.linkedinUrl || null,
    workAuth: parsed.data.workAuth || null,
    authorizedCountry: parsed.data.authorizedCountry || null,
    needsSponsorship: parsed.data.needsSponsorship ?? null,
    openToOnsite: parsed.data.openToOnsite ?? null,
    willingRelocate: parsed.data.willingRelocate ?? null,
    startImmediately: parsed.data.startImmediately ?? null,
    additionalNotes: parsed.data.additionalNotes || null,
  };

  await prisma.applicationDefaults.upsert({
    where: { seekerProfileId: seekerProfile.id },
    create: { seekerProfileId: seekerProfile.id, ...data },
    update: data,
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
