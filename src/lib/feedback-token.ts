/*
 * feedback-token
 * Utilities for signing and verifying employer feedback JWT tokens.
 * Uses jose (Edge-compatible) — NOT jsonwebtoken.
 * Token payload: { engineerId, recruiterId, jobId, feedbackRequestId }
 * Token TTL: 90 days. Stored as sha256(token) in FeedbackRequest.tokenHash.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHash } from "crypto";

export interface FeedbackTokenPayload {
  engineerId: string;
  recruiterId: string;
  jobId: string;
  feedbackRequestId: string;
}

/*
 * getSecret
 * Returns the HMAC secret key derived from FEEDBACK_SECRET env var.
 * Throws if FEEDBACK_SECRET is not set.
 */
function getSecret(): Uint8Array {
  const secret = process.env.FEEDBACK_SECRET;
  if (!secret) {
    throw new Error("FEEDBACK_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

/*
 * hashToken
 * Returns a hex-encoded SHA-256 hash of the given token string.
 * Used for deterministic lookup without storing the raw JWT.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/*
 * signFeedbackToken
 * Creates a signed JWT with the feedback payload.
 * Token expires in 90 days. Uses HS256 algorithm.
 * Returns the signed JWT string.
 */
export async function signFeedbackToken(
  payload: FeedbackTokenPayload
): Promise<string> {
  const secret = getSecret();

  return await new SignJWT({
    engineerId: payload.engineerId,
    recruiterId: payload.recruiterId,
    jobId: payload.jobId,
    feedbackRequestId: payload.feedbackRequestId,
  } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("90d")
    .sign(secret);
}

/*
 * verifyFeedbackToken
 * Verifies and decodes a feedback JWT token.
 * Returns the payload on success.
 * Throws JWTExpired if the token has expired, JWSInvalid if the signature is bad.
 * Let callers catch and handle specific errors.
 */
export async function verifyFeedbackToken(
  token: string
): Promise<FeedbackTokenPayload> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);

  return {
    engineerId: payload.engineerId as string,
    recruiterId: payload.recruiterId as string,
    jobId: payload.jobId as string,
    feedbackRequestId: payload.feedbackRequestId as string,
  };
}
