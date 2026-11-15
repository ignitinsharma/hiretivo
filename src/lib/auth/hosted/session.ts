import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { authPool } from "./store";
import { env } from "@/lib/env";
import type { Session } from "../session";

const tokenHash = (token: string) => createHmac("sha256", env.HIRETIVO_SECRET).update(token).digest("hex");
export async function createHostedSession(userId: string, persistent: boolean, expectedPasswordHash: string): Promise<string> {
  const token = `hst_${randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + (persistent ? 30 : 1) * 24 * 60 * 60_000);
  const db = await authPool().connect();
  try {
    await db.query("BEGIN");
    const user = (await db.query<{ passwordHash: string }>('SELECT "passwordHash" FROM public."HostedUser" WHERE id=$1 AND "verifiedAt" IS NOT NULL FOR UPDATE', [userId])).rows[0];
    if (!user || user.passwordHash !== expectedPasswordHash) throw new Error("Account credentials changed. Sign in again.");
    await db.query('INSERT INTO public."HostedSession" ("tokenHash","userId",persistent,"expiresAt") VALUES ($1,$2,$3,$4)', [tokenHash(token), userId, persistent, expiresAt]);
    await db.query("COMMIT");
    return token;
  } catch (error) { await db.query("ROLLBACK"); throw error; }
  finally { db.release(); }
}
export async function readHostedSession(token: string | undefined): Promise<Session | null> {
  if (!token || !/^hst_[\w-]{43}$/.test(token)) return null;
  const row = (await authPool().query<{ userId: string; email: string; persistent: boolean; createdAt: Date; expiresAt: Date }>('SELECT s."userId",u.email,s.persistent,s."createdAt",s."expiresAt" FROM public."HostedSession" s JOIN public."HostedUser" u ON u.id=s."userId" WHERE s."tokenHash"=$1 AND s."expiresAt">now() AND u."verifiedAt" IS NOT NULL', [tokenHash(token)])).rows[0];
  return row ? { userId: row.userId, email: row.email, persistent: row.persistent, issuedAt: row.createdAt, expiresAt: row.expiresAt } : null;
}
export async function revokeHostedSession(token: string | undefined): Promise<void> {
  if (token?.startsWith("hst_")) await authPool().query('DELETE FROM public."HostedSession" WHERE "tokenHash"=$1', [tokenHash(token)]);
}
