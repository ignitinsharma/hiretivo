import { createHash, randomUUID } from 'crypto';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { getAppUrl } from '@/lib/config';

const RESET_EXPIRY_MINUTES = 30;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Hiretivo <noreply@hiretivo.com>';
const IDENTIFIER_PREFIX = 'password-reset:';

// Only the sha256 digest is stored — a DB leak never yields usable tokens.
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export type PasswordResetMode = 'reset' | 'set';

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomUUID();
  const identifier = `${IDENTIFIER_PREFIX}${email}`;
  const expires = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: sha256(token), expires },
  });

  return token;
}

export async function consumePasswordResetToken(
  email: string,
  token: string,
): Promise<boolean> {
  const identifier = `${IDENTIFIER_PREFIX}${email}`;
  const where = { identifier_token: { identifier, token: sha256(token) } };
  const row = await prisma.verificationToken.findUnique({ where });

  if (!row) return false;

  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where }).catch(() => undefined);
    return false;
  }

  await prisma.verificationToken.delete({ where });
  return true;
}

export async function sendPasswordResetEmail(
  email: string,
  mode: PasswordResetMode = 'reset',
): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const token = await createPasswordResetToken(normalizedEmail);
  const url = `${getAppUrl()}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}${mode === 'set' ? '&mode=set' : ''}`;

  const isSet = mode === 'set';

  await sendEmail({
    from: FROM_EMAIL,
    to: normalizedEmail,
    subject: isSet
      ? 'Set a password for your Hiretivo account'
      : 'Reset your Hiretivo password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${isSet ? 'Set your password' : 'Reset your password'}</h2>
        <p>${isSet
          ? 'Your Hiretivo account was created with a social login and has no password yet. Create one so you can sign in with your email and password.'
          : 'Click the link below to choose a new password.'}</p>
        <p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#5952e5;color:white;border-radius:9999px;text-decoration:none;font-weight:600;">${isSet ? 'Set password' : 'Reset password'}</a>
        </p>
        <p style="color:#888;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `${isSet
      ? 'Set a password for your Hiretivo account by visiting'
      : 'Reset your Hiretivo password by visiting'}: ${url}\nExpires in ${RESET_EXPIRY_MINUTES} minutes.`,
  });
}
