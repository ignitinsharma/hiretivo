import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";

import { env } from "@/lib/env";

const shared = globalThis as unknown as { hostedAuthPool?: Pool };
export function authPool(): Pool {
  if (!/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL)) throw new Error("Hosted accounts require PostgreSQL.");
  return shared.hostedAuthPool ??= new Pool({ connectionString: env.DATABASE_URL, max: 4 });
}
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export type HostedUser = { id: string; email: string; passwordHash: string; verifiedAt: Date | null };
export async function userByEmail(email: string): Promise<HostedUser | undefined> {
  return (await authPool().query<HostedUser>('SELECT id, email, "passwordHash", "verifiedAt" FROM public."HostedUser" WHERE email = $1', [normalizeEmail(email)])).rows[0];
}
export async function createUser(email: string, passwordHash: string): Promise<HostedUser | undefined> {
  return (await authPool().query<HostedUser>('INSERT INTO public."HostedUser" (id,email,"passwordHash") VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id,email,"passwordHash","verifiedAt"', [randomUUID(), normalizeEmail(email), passwordHash])).rows[0];
}
export type TokenPurpose = "verify" | "reset";
export async function createEmailToken(userId: string, purpose: TokenPurpose): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const lifetime = purpose === "verify" ? 24 * 60 * 60_000 : 30 * 60_000;
  await authPool().query('INSERT INTO public."HostedToken" ("tokenHash","userId",purpose,"expiresAt") VALUES ($1,$2,$3,$4) ON CONFLICT ("userId",purpose) DO UPDATE SET "tokenHash" = EXCLUDED."tokenHash", "expiresAt" = EXCLUDED."expiresAt"', [digest(token), userId, purpose, new Date(Date.now() + lifetime)]);
  return token;
}
/** Callback and consumption are one transaction, including password/session changes. */
export async function consumeEmailToken<T>(token: string, purpose: TokenPurpose, apply: (db: PoolClient, userId: string) => Promise<T>): Promise<T | undefined> {
  if (!/^[\w-]{43}$/.test(token)) return undefined;
  const db = await authPool().connect();
  try {
    await db.query("BEGIN");
    const row = (await db.query<{ userId: string }>('DELETE FROM public."HostedToken" WHERE "tokenHash"=$1 AND purpose=$2 AND "expiresAt">now() RETURNING "userId"', [digest(token), purpose])).rows[0];
    if (!row) { await db.query("ROLLBACK"); return undefined; }
    const result = await apply(db, row.userId);
    await db.query("COMMIT");
    return result;
  } catch (error) { await db.query("ROLLBACK"); throw error; }
  finally { db.release(); }
}
/** Atomic counters stop concurrent requests from bypassing the limit. Keys contain no email/IP. */
export async function takeAuthAttempt(action: string, identity: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${action}:${digest(identity)}`;
  const row = (await authPool().query<{ count: number }>('INSERT INTO public."HostedAuthThrottle" (key,count,"windowStart") VALUES ($1,1,now()) ON CONFLICT (key) DO UPDATE SET count = CASE WHEN public."HostedAuthThrottle"."windowStart" < $2 THEN 1 ELSE public."HostedAuthThrottle".count+1 END, "windowStart" = CASE WHEN public."HostedAuthThrottle"."windowStart" < $2 THEN now() ELSE public."HostedAuthThrottle"."windowStart" END RETURNING count', [key, new Date(Date.now() - windowMs)])).rows[0];
  return row.count <= limit;
}
export async function cleanupAuthRecords(): Promise<void> {
  await authPool().query('DELETE FROM public."HostedSession" WHERE "expiresAt"<now()');
  await authPool().query('DELETE FROM public."HostedToken" WHERE "expiresAt"<now()');
  await authPool().query('DELETE FROM public."HostedAuthThrottle" WHERE "windowStart"<now()-interval \'2 days\'');
}
