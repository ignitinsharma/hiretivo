import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/*
 * POST /api/recruiter/talent/[id]/save
 * Saves an engineer to recruiter's saved list. Idempotent — no quota deducted.
 * Returns { saved: true } on success or if already saved.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER) return new Response("Forbidden", { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  await prisma.savedEngineer.upsert({
    where: { recruiterId_engineerId: { recruiterId: session.user.id, engineerId: params.id } },
    update: {},
    create: { recruiterId: session.user.id, engineerId: params.id },
  });

  return NextResponse.json({ data: { saved: true } });
}

/*
 * DELETE /api/recruiter/talent/[id]/save
 * Removes an engineer from recruiter's saved list.
 * Returns { saved: false } on success or if not saved.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER) return new Response("Forbidden", { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  await prisma.savedEngineer.deleteMany({
    where: { recruiterId: session.user.id, engineerId: params.id },
  });

  return NextResponse.json({ data: { saved: false } });
}
