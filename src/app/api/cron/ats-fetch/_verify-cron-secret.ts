import { NextRequest } from "next/server";

/*
 * verifyCronSecret
 * Validates the Vercel Cron Authorization header (Bearer {CRON_SECRET}).
 * @returns true if the request is from Vercel Cron, false otherwise.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
