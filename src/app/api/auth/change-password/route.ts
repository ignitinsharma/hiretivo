import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordSchema } from "@/lib/validations/interview.schema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const passwordChangeRateLimiter = createRateLimiter("change-password", 5, "1 m");

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting — 5 password changes/min (security-sensitive)
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await passwordChangeRateLimiter.limit(ip);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Password change is not available for OAuth-only accounts" },
      { status: 400 },
    );
  }

  const isCurrentValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!isCurrentValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  // 12 rounds matches Phase 1 decision for bcrypt cost factor (bcrypt 12 rounds for security + Vercel latency balance)
  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
