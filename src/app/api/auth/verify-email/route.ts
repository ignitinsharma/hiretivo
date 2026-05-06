import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function resultRedirect(status: string): NextResponse {
  return NextResponse.redirect(`${APP_URL}/auth/verify-email?status=${status}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return resultRedirect("missing-token");
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return resultRedirect("invalid");
  }

  const normalizedEmail = email.toLowerCase();
  if (verificationToken.identifier.toLowerCase() !== normalizedEmail) {
    return resultRedirect("invalid");
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return resultRedirect("expired");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return resultRedirect("invalid");
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  return resultRedirect("success");
}
