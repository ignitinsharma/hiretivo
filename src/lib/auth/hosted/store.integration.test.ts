import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const testUrl = process.env.HOSTED_AUTH_TEST_DATABASE_URL;
if (testUrl && (!/^postgres(?:ql)?:/.test(testUrl) || !new URL(testUrl).pathname.endsWith("_test"))) throw new Error("Hosted authentication integration tests require a disposable PostgreSQL database ending in _test.");
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: process.env.HOSTED_AUTH_TEST_DATABASE_URL, HIRETIVO_SECRET: "hosted-auth-test-secret".repeat(3) } }));
import { authPool, consumeEmailToken, createEmailToken, createUser, digest, takeAuthAttempt, userByEmail } from "./store";
import { createHostedSession, readHostedSession, revokeHostedSession } from "./session";

/** Opt in with HOSTED_AUTH_TEST_DATABASE_URL; never uses the app's configured database. */
describe.skipIf(!testUrl)("hosted authentication against PostgreSQL", () => {
  const ids: string[] = [];
  async function account(verified = false) {
    const user = await createUser(`auth-${randomUUID()}@example.test`, "old-hash");
    if (!user) throw new Error("Test account was not created.");
    ids.push(user.id);
    if (verified) await authPool().query('UPDATE public."HostedUser" SET "verifiedAt"=now() WHERE id=$1', [user.id]);
    return user;
  }
  beforeAll(async () => { await authPool().query(await readFile(new URL("../../../../prisma/hosted/auth.sql", import.meta.url), "utf8")); });
  afterAll(async () => {
    await authPool().query('DELETE FROM public."HostedUser" WHERE id=ANY($1::uuid[])', [ids]);
    await authPool().end();
  });
  it("keeps normalized emails unique and refuses sessions before verification", async () => {
    const user = await account();
    expect(await userByEmail(user.email.toUpperCase())).toMatchObject({ id: user.id });
    expect(await createUser(user.email.toUpperCase(), "different-hash")).toBeUndefined();
    await expect(createHostedSession(user.id, false, "old-hash")).rejects.toThrow("credentials changed");
  });
  it("stores only email-token hashes and lets exactly one concurrent consumer succeed", async () => {
    const user = await account();
    const token = await createEmailToken(user.id, "verify");
    const stored = (await authPool().query('SELECT "tokenHash" FROM public."HostedToken" WHERE "userId"=$1', [user.id])).rows[0];
    expect(stored.tokenHash).toBe(digest(token));
    expect(stored.tokenHash).not.toBe(token);
    const results = await Promise.all([consumeEmailToken(token, "verify", async () => true), consumeEmailToken(token, "verify", async () => true)]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });
  it("rejects expired, wrong-purpose and replaced tokens", async () => {
    const user = await account();
    const old = await createEmailToken(user.id, "verify");
    const current = await createEmailToken(user.id, "verify");
    expect(await consumeEmailToken(old, "verify", async () => true)).toBeUndefined();
    expect(await consumeEmailToken(current, "reset", async () => true)).toBeUndefined();
    await authPool().query('UPDATE public."HostedToken" SET "expiresAt"=now()-interval \'1 second\' WHERE "userId"=$1', [user.id]);
    expect(await consumeEmailToken(current, "verify", async () => true)).toBeUndefined();
  });
  it("rolls token consumption back when the account update fails", async () => {
    const user = await account();
    const token = await createEmailToken(user.id, "verify");
    await expect(consumeEmailToken(token, "verify", async () => { throw new Error("provision failed"); })).rejects.toThrow("provision failed");
    expect(await consumeEmailToken(token, "verify", async () => true)).toBe(true);
  });
  it("revokes sessions on logout and resets, and refuses stale credentials after reset", async () => {
    const user = await account(true);
    const first = await createHostedSession(user.id, false, "old-hash");
    expect(await readHostedSession(first)).toMatchObject({ userId: user.id, persistent: false });
    await revokeHostedSession(first);
    expect(await readHostedSession(first)).toBeNull();
    const second = await createHostedSession(user.id, true, "old-hash");
    const token = await createEmailToken(user.id, "reset");
    await consumeEmailToken(token, "reset", async (db, userId) => {
      await db.query('UPDATE public."HostedUser" SET "passwordHash"=$1 WHERE id=$2', ["new-hash", userId]);
      await db.query('DELETE FROM public."HostedSession" WHERE "userId"=$1', [userId]);
      return true;
    });
    expect(await readHostedSession(second)).toBeNull();
    await expect(createHostedSession(user.id, false, "old-hash")).rejects.toThrow("credentials changed");
    expect(await readHostedSession(await createHostedSession(user.id, false, "new-hash"))).toMatchObject({ userId: user.id });
  });
  it("does not issue an old-password session when a reset holds the account lock", async () => {
    const user = await account(true);
    const db = await authPool().connect();
    try {
      await db.query("BEGIN");
      await db.query('SELECT id FROM public."HostedUser" WHERE id=$1 FOR UPDATE', [user.id]);
      const login = createHostedSession(user.id, false, "old-hash").then((token) => ({ token, error: undefined }), (error: Error) => ({ token: undefined, error }));
      await db.query('UPDATE public."HostedUser" SET "passwordHash"=$1 WHERE id=$2', ["new-hash", user.id]);
      await db.query('DELETE FROM public."HostedSession" WHERE "userId"=$1', [user.id]);
      await db.query("COMMIT");
      const result = await login;
      expect(result.token).toBeUndefined();
      expect(result.error?.message).toContain("credentials changed");
    } catch (error) { await db.query("ROLLBACK"); throw error; }
    finally { db.release(); }
  });
  it("enforces throttles under concurrent requests", async () => {
    const identity = randomUUID();
    const results = await Promise.all(Array.from({ length: 20 }, () => takeAuthAttempt("integration", identity, 3, 60_000)));
    expect(results.filter(Boolean)).toHaveLength(3);
    await authPool().query('DELETE FROM public."HostedAuthThrottle" WHERE key=$1', [`integration:${digest(identity)}`]);
  });
});
