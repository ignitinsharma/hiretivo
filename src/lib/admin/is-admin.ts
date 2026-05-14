import type { Session } from "next-auth";

/*
 * isAdminSession
 * Returns true when the session belongs to the configured admin user.
 * Admin identity is gated by the ADMIN_EMAIL env var (case-insensitive compare).
 * Returns false when env is missing, session is null, or email mismatch.
 */
export function isAdminSession(session: Session | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  const userEmail = session?.user?.email?.trim().toLowerCase();
  if (!userEmail) return false;
  return userEmail === adminEmail;
}
