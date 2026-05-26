import { randomUUID } from 'crypto';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';

const RESET_EXPIRY_MINUTES = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Hiretivo <noreply@hiretivo.com>';
const IDENTIFIER_PREFIX = 'password-reset:';

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomUUID();
  const identifier = `${IDENTIFIER_PREFIX}${email}`;
  const expires = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumePasswordResetToken(
  email: string,
  token: string,
): Promise<boolean> {
  const identifier = `${IDENTIFIER_PREFIX}${email}`;
  const where = { identifier_token: { identifier, token } };
  const row = await prisma.verificationToken.findUnique({ where });

  if (!row) return false;

  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where }).catch(() => undefined);
    return false;
  }

  await prisma.verificationToken.delete({ where });
  return true;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const token = await createPasswordResetToken(normalizedEmail);
  const url = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: normalizedEmail,
    subject: 'Reset your Hiretivo password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to choose a new password. This link expires in ${RESET_EXPIRY_MINUTES} minutes.</p>
        <p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#5952e5;color:white;border-radius:9999px;text-decoration:none;font-weight:600;">Reset password</a>
        </p>
        <p style="color:#888;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Reset your Hiretivo password by visiting: ${url}\nExpires in ${RESET_EXPIRY_MINUTES} minutes.`,
  });
}
