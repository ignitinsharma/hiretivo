import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";

export interface EmailVerificationStatus {
  email: string | null;
  isVerified: boolean;
  requiresVerification: boolean;
  verifiedAt: string | null;
  hasGoogleAccount: boolean;
}

export function emailNotVerifiedResponse() {
  return NextResponse.json(
    {
      error: "Verify your email address before continuing.",
      code: EMAIL_NOT_VERIFIED_CODE,
    },
    { status: 403 },
  );
}

export async function getEmailVerificationStatus(
  userId: string,
): Promise<EmailVerificationStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      passwordHash: true,
      accounts: {
        select: { provider: true },
      },
    },
  });

  if (!user) return null;

  const hasGoogleAccount = user.accounts.some(
    (account) => account.provider === "google",
  );
  const isVerified = Boolean(user.emailVerified) || hasGoogleAccount;

  return {
    email: user.email,
    isVerified,
    requiresVerification: Boolean(user.passwordHash) && !isVerified,
    verifiedAt: user.emailVerified?.toISOString() ?? null,
    hasGoogleAccount,
  };
}

export async function isEmailVerifiedForTrustedAction(
  userId: string,
): Promise<boolean> {
  const status = await getEmailVerificationStatus(userId);
  return status?.isVerified === true;
}

export async function requireVerifiedEmailForTrustedAction(userId: string) {
  const isVerified = await isEmailVerifiedForTrustedAction(userId);
  return isVerified ? null : emailNotVerifiedResponse();
}
