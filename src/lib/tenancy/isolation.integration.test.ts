import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import { z } from "zod";
import { challengeOf, exchangeCode, issueCode, refresh, registerClient, verifyAccessToken } from "@/lib/connector/oauth";
import { saveSettings } from "@/lib/settings-data";
import { defineJob, getJob, retryJob, subscribeJob } from "@/lib/jobs/runner";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const testUrl = process.env.HIRETIVO_TENANCY_TEST_DATABASE_URL;
const identity = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/deployment-mode", () => ({ deploymentMode: () => "hosted" }));
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: process.env.HIRETIVO_TENANCY_TEST_DATABASE_URL, HIRETIVO_SECRET: "isolation-test-secret-only-32-characters", HIRETIVO_DATA_DIR: "/private/tmp/hiretivo-tenancy-test" } }));
vi.mock("@/lib/auth/session", () => ({ getSession: async () => identity.userId ? { userId: identity.userId } : null }));

import { prisma } from "@/lib/prisma";
import { currentTenantId, tenantSchema, withTenant } from "./context";
import { disconnectTenant } from "./database";
import { eachTenant, provisionTenant } from "./provision";

const suite = testUrl ? describe : describe.skip;
suite("PostgreSQL account isolation", () => {
  const alice = randomUUID();
  const bob = randomUUID();
  let admin: Pool;

  beforeAll(async () => {
    const url = new URL(testUrl!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.endsWith("_test")) {
      throw new Error("Isolation tests require a localhost database with an _test suffix.");
    }
    admin = new Pool({ connectionString: testUrl });
    await admin.query(`CREATE TABLE IF NOT EXISTS public."HostedUser" (
      id uuid PRIMARY KEY, email text NOT NULL UNIQUE, "passwordHash" text NOT NULL,
      "verifiedAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await admin.query('INSERT INTO public."HostedUser" (id, email, "passwordHash", "verifiedAt") VALUES ($1, $2, $3, now()), ($4, $5, $3, now())',
      [alice, `${alice}@example.test`, "unused-test-hash", bob, `${bob}@example.test`]);
    // Concurrent/repeated provisioning must not race or reset existing data.
    await Promise.all([provisionTenant(alice), provisionTenant(alice), provisionTenant(bob)]);
  }, 30_000);

  afterAll(async () => {
    if (!admin) return;
    for (const id of [alice, bob]) {
      await disconnectTenant(id);
      await admin.query(`DROP SCHEMA IF EXISTS "${tenantSchema(id)}" CASCADE`);
      await admin.query('DELETE FROM public."HostedTenant" WHERE "userId" = $1', [id]);
      await admin.query('DELETE FROM public."HostedUser" WHERE id = $1', [id]);
    }
    await admin.end();
  });

  it("isolates singleton settings and profiles with identical primary keys", async () => {
    for (const userId of [alice, bob]) {
      await withTenant(userId, async () => {
        await prisma.setting.upsert({ where: { key: "aiApiKeyEnc" }, create: { key: "aiApiKeyEnc", value: userId }, update: { value: userId } });
        await prisma.profileField.upsert({ where: { key: "name" }, create: { key: "name", value: userId }, update: { value: userId } });
      });
    }
    await provisionTenant(alice);
    for (const userId of [alice, bob]) {
      await withTenant(userId, async () => {
        expect((await prisma.setting.findUnique({ where: { key: "aiApiKeyEnc" } }))?.value).toBe(userId);
        expect((await prisma.profileField.findUnique({ where: { key: "name" } }))?.value).toBe(userId);
        expect(await prisma.theme.count({ where: { builtIn: true } })).toBeGreaterThan(0);
      });
    }
  });

  it("cannot read or write another account's guessed application id or nested documents", async () => {
    await withTenant(alice, () => prisma.application.create({ data: { id: "same-imported-id", company: "Alice private company" } }));
    await withTenant(bob, async () => {
      expect(await prisma.application.findUnique({ where: { id: "same-imported-id" }, include: { documents: true } })).toBeNull();
      expect((await prisma.application.updateMany({ where: { id: "same-imported-id" }, data: { company: "stolen" } })).count).toBe(0);
      expect((await prisma.application.deleteMany({ where: { id: "same-imported-id" } })).count).toBe(0);
      await prisma.application.create({ data: { id: "same-imported-id", company: "Bob private company" } });
    });
    expect(await withTenant(alice, () => prisma.application.findUnique({ where: { id: "same-imported-id" } }))).toMatchObject({ company: "Alice private company" });
  });

  it("preserves array and interactive transactions and rolls back only the owning account", async () => {
    await withTenant(alice, async () => {
      await prisma.$transaction([
        prisma.profileField.upsert({ where: { key: "city" }, create: { key: "city", value: "Alice city" }, update: { value: "Alice city" } }),
        prisma.profileField.upsert({ where: { key: "country" }, create: { key: "country", value: "Alice country" }, update: { value: "Alice country" } }),
      ]);
      await expect(prisma.$transaction(async (tx) => {
        await tx.profileField.update({ where: { key: "city" }, data: { value: "rolled back" } });
        throw new Error("rollback");
      })).rejects.toThrow("rollback");
      expect((await prisma.profileField.findUnique({ where: { key: "city" } }))?.value).toBe("Alice city");
      const rows = await prisma.$queryRaw<{ value: string }[]>`SELECT value FROM "ProfileField" WHERE key = 'city'`;
      expect(rows).toEqual([{ value: "Alice city" }]);
    });
    await withTenant(bob, async () => expect(await prisma.profileField.findUnique({ where: { key: "city" } })).toBeNull());
  });

  it("keeps queued jobs and progress listeners bound to their owners even with colliding ids", async () => {
    const jobId = "same-imported-job-id";
    const task = defineJob({
      type: "isolation-test-task",
      input: z.object({}),
      result: z.object({ owner: z.string() }),
      async run(_input, { step }) {
        await step("Reading this account's profile");
        return { owner: (await prisma.profileField.findUnique({ where: { key: "name" } }))!.value };
      },
    });
    const seen = { [alice]: [] as unknown[], [bob]: [] as unknown[] };
    const stops: (() => void)[] = [];
    try {
      for (const userId of [alice, bob]) await withTenant(userId, async () => {
        await prisma.job.create({ data: { id: jobId, type: task.type, input: {}, status: "FAILED" } });
        stops.push(subscribeJob(jobId, (view) => { if (view.status === "DONE") seen[userId].push(view.result); }));
        expect(await retryJob(jobId)).toBe(true);
      });
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline && (!seen[alice].length || !seen[bob].length)) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(seen[alice]).toEqual([{ owner: alice }]);
      expect(seen[bob]).toEqual([{ owner: bob }]);
      for (const userId of [alice, bob]) await withTenant(userId, async () => {
        expect((await getJob(jobId))?.result).toEqual({ owner: userId });
      });
    } finally { for (const stop of stops) stop(); }
  }, 15_000);

  it("binds connector tokens to the consenting account and atomically rejects code/refresh replay", async () => {
    const clientId = await registerClient({ name: "Isolation test", redirectUris: ["https://claude.ai/api/mcp/auth_callback"] });
    const verifier = "v".repeat(50);
    const consent = async (owner: string) => withTenant(owner, async () => {
      await saveSettings({ connectorEnabledAt: new Date().toISOString() });
      return issueCode({ clientId, redirectUri: "https://claude.ai/api/mcp/auth_callback", codeChallenge: challengeOf(verifier), resource: "https://hiretivo.test/api/mcp" });
    });
    const code = await consent(alice);
    const input = { code, clientId, redirectUri: "https://claude.ai/api/mcp/auth_callback", verifier };
    const attempts = await Promise.allSettled([withTenant(bob, () => exchangeCode(input)), withTenant(bob, () => exchangeCode(input))]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const issued = attempts.find((result) => result.status === "fulfilled");
    if (!issued || issued.status !== "fulfilled") throw new Error("No connector token issued.");
    const token = issued.value;
    const claims = await withTenant(bob, () => verifyAccessToken(token.access_token));
    expect(claims).toMatchObject({ userId: alice, clientId });
    const rotated = await refresh({ refreshToken: token.refresh_token, clientId });
    await expect(refresh({ refreshToken: token.refresh_token, clientId })).rejects.toThrow("already been used");
    expect(await verifyAccessToken(rotated.access_token)).toMatchObject({ userId: alice });
    await withTenant(alice, () => saveSettings({ connectorEnabledAt: null }));
    expect(await verifyAccessToken(rotated.access_token)).toBeNull();
  });

  it("rolls failed provisioning back without registering a partial account schema", async () => {
    const owner = randomUUID();
    const namespace = tenantSchema(owner);
    await admin.query(`CREATE SCHEMA "${namespace}"`);
    // A conflicting orphan table forces the snapshot to fail part way through.
    await admin.query(`CREATE TABLE "${namespace}"."Theme" (id text)`);
    try {
      await expect(provisionTenant(owner)).rejects.toThrow();
      const registry = await admin.query('SELECT 1 FROM public."HostedTenant" WHERE "userId" = $1', [owner]);
      expect(registry.rowCount).toBe(0);
      const partial = await admin.query("SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'ProfileField'", [namespace]);
      expect(partial.rowCount).toBe(0);
    } finally { await admin.query(`DROP SCHEMA "${namespace}" CASCADE`); }
  });

  it("keeps asynchronous scopes separate and enumerates only verified account tasks", async () => {
    const values = await Promise.all([alice, bob].map((userId) => withTenant(userId, async () => {
      await new Promise((resolve) => setTimeout(resolve, userId === alice ? 15 : 1));
      return { userId: await currentTenantId(), name: (await prisma.profileField.findUnique({ where: { key: "name" } }))?.value };
    })));
    expect(values).toEqual([{ userId: alice, name: alice }, { userId: bob, name: bob }]);
    const visited: string[] = [];
    await eachTenant(async () => { visited.push(await currentTenantId()); });
    expect(visited).toContain(alice);
    expect(visited).toContain(bob);
  });
});
