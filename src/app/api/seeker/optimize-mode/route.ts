import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, OptimizeMode } from "@/constants/enums";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { OptimizeModeSchema } from "@/lib/validations/optimize-mode.schema";

/*
 * GET /api/seeker/optimize-mode
 * Returns the authenticated seeker's optimize mode (Honest by default —
 * ApplicationDefaults may not exist yet if the seeker hasn't saved it).
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
    select: { applicationDefaults: { select: { optimizeMode: true } } },
  });

  if (!seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: { optimizeMode: seekerProfile.applicationDefaults?.optimizeMode ?? OptimizeMode.HONEST },
  });
}

/*
 * PATCH /api/seeker/optimize-mode
 * Upserts the authenticated seeker's optimize mode onto ApplicationDefaults.
 * @returns { data: { success: true } } or auth/validation/rate-limit errors
 */
export async function PATCH(req: NextRequest) {
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
  const parsed = OptimizeModeSchema.safeParse(body);
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

  await prisma.applicationDefaults.upsert({
    where: { seekerProfileId: seekerProfile.id },
    create: { seekerProfileId: seekerProfile.id, optimizeMode: parsed.data.optimizeMode },
    update: { optimizeMode: parsed.data.optimizeMode },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
