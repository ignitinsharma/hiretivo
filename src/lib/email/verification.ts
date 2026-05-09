import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const VERIFICATION_EXPIRY_HOURS = 24;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Hiretivo <noreply@hiretivo.com>";

interface SendVerificationEmailInput {
  email: string;
  recipientName?: string | null;
}

/*
 * createVerificationToken
 * Creates a single active email verification token for the provided email.
 * Returns the newly created token string and invalidates older tokens.
 */
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

/*
 * sendVerificationEmail
 * Sends account verification email with primary CTA and full URL fallback.
 * Accepts optional recipientName to personalize greeting copy.
 */
export async function sendVerificationEmail({
  email,
  recipientName,
}: SendVerificationEmailInput): Promise<void> {
  const token = await createVerificationToken(email);
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const greetingName = recipientName?.trim();
  const greeting = greetingName ? `Hi ${greetingName},` : "Hi there,";

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Hiretivo account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p style="color:#0a0a0a;font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
        <h2>Welcome to Hiretivo!</h2>
        <p>Please verify your email address to access your personalized job feed.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7560ff;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
            Verify Email
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px;">
          If the button opens in a different browser, copy and paste this full link into the browser where you use Hiretivo:
        </p>
        <p style="word-break:break-all;font-size:14px;line-height:1.6;margin:0 0 16px;">
          <a href="${verifyUrl}" style="color:#7560ff;text-decoration:underline;">${verifyUrl}</a>
        </p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
    text: `${greeting}\n\nWelcome to Hiretivo! Verify your email by visiting: ${verifyUrl}\n\nIf the button opens in another browser, copy and paste this full URL into the browser where you use Hiretivo.\n\nThis link expires in 24 hours.`,
  });
}
