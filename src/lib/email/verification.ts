import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const VERIFICATION_EXPIRY_HOURS = 24;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM_EMAIL = "Hiretivo <noreply@hiretivo.com>";

export async function createVerificationToken(email: string): Promise<string> {
  const token = randomUUID();
  const expires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete any existing tokens for this email before creating a new one
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

export async function sendVerificationEmail(email: string): Promise<void> {
  const token = await createVerificationToken(email);
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Hiretivo account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Hiretivo!</h2>
        <p>Please verify your email address to access your personalized job feed.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:6px;text-decoration:none;font-weight:600;">
            Verify Email Address
          </a>
        </p>
        <p style="color:#888;font-size:14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
    text: `Welcome to Hiretivo! Please verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}
