import { createHmac, timingSafeEqual } from 'crypto';

/*
 * generateUnsubscribeToken
 * Creates HMAC-SHA256 token for a userId using UNSUBSCRIBE_SECRET.
 * Embed in email links — verifyUnsubscribeToken checks it server-side.
 * @param userId - The seeker's user ID
 * @returns hex string token
 */
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET env var is not set');
  return createHmac('sha256', secret).update(userId).digest('hex');
}

/*
 * verifyUnsubscribeToken
 * Timing-safe comparison of a candidate token against the expected HMAC.
 * Always returns false on length mismatch to prevent timing attacks.
 * @param userId - The uid query param from the unsubscribe URL
 * @param token  - The token query param from the unsubscribe URL
 * @returns true if token is valid
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  let expected: string;
  try {
    expected = generateUnsubscribeToken(userId);
  } catch {
    return false;
  }
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
}
