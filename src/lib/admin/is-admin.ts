import type { Session } from "next-auth";

/*
 * isAdminSession
 * Returns true when the session belongs to an admin user.
 *
 * Two paths (in priority order):
 * 1. isAdmin fast-path: session.user.isAdmin === true (DB-backed boolean, forwarded
 *    through the JWT + session callbacks). This is the primary check post-migration.
 * 2. ADMIN_EMAIL fallback: case-insensitive email comparison against the ADMIN_EMAIL
 *    env var. Retained permanently so the operator can never be locked out during or
 *    after the isAdmin boolean migration (D-02).
 *
 * Returns false when both paths fail, session is null, or required env/fields are absent.
 *
 * @param session - The current Auth.js session, or null if unauthenticated.
 * @returns boolean — true if the session user has admin access.
 */
export function isAdminSession(session: Session | null): boolean {
  if (session?.user?.isAdmin === true) return true;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  const userEmail = session?.user?.email?.trim().toLowerCase();
  if (!userEmail) return false;
  return userEmail === adminEmail;
}
