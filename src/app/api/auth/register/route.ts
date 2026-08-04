import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/lib/email/verification";
import { getRateLimitIp, registerRateLimiter } from "@/lib/rate-limit";

/*
 * POST /api/auth/register
 * Creates a seeker account after validating registration input.
 * Returns the created user identity or validation/conflict errors.
 */
export async function POST(req: NextRequest) {
  try {
    const { success } = await registerRateLimiter.limit(getRateLimitIp(req));
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    if (
      normalizedEmail === 'system@hiretivo.com' ||
      normalizedEmail.endsWith('@hiretivo.com')
    ) {
      return NextResponse.json(
        { error: 'This email address cannot be used for registration.' },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name ?? null,
        passwordHash,
        role: role as Role,
        onboardingStep: 1,
      },
      select: { id: true, email: true, role: true },
    });

    // Send verification email — non-blocking; don't fail registration if email fails
    sendVerificationEmail({
      email: normalizedEmail,
      recipientName: name,
    }).catch((err) => {
      console.error("[register] failed to send verification email:", err);
    });

    return NextResponse.json(
      { id: user.id, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
