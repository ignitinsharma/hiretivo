import "server-only";

import { Pool } from "pg";

import { deploymentMode } from "@/lib/deployment-mode";
import { env } from "@/lib/env";
import { BUILT_IN_THEMES } from "@/lib/themes";
import { withTenantDb } from "./database";
import { logServerError } from "@/lib/log";

import { tenantSchema, withTenant } from "./context";
import schema from "./schema.json";

const shared = globalThis as unknown as { hiretivoTenantAdmin?: Pool; hiretivoTenantRegistry?: Promise<void> };
function pool(): Pool {
  return shared.hiretivoTenantAdmin ??= new Pool({ connectionString: env.DATABASE_URL, max: 2, idleTimeoutMillis: 30_000, allowExitOnIdle: true });
}

async function registry(): Promise<void> {
  shared.hiretivoTenantRegistry ??= pool().query(`CREATE TABLE IF NOT EXISTS public."HostedTenant" (
    "userId" TEXT PRIMARY KEY, "schemaName" TEXT NOT NULL UNIQUE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  )`).then(() => undefined).catch((error) => { shared.hiretivoTenantRegistry = undefined; throw error; });
  return shared.hiretivoTenantRegistry;
}

/** Creates or upgrades an account's complete namespace before its first use. */
export async function provisionTenant(userId: string): Promise<void> {
  if (deploymentMode() !== "hosted") throw new Error("Account provisioning is only available in hosted mode.");
  if (env.DATABASE_URL.startsWith("file:")) throw new Error("Hosted accounts require PostgreSQL.");
  await registry();
  const name = tenantSchema(userId);
  const db = await pool().connect();
  try {
    // One account can be verified/retried concurrently without racing DDL.
    await db.query("SELECT pg_advisory_lock(hashtext($1))", [name]);
    await db.query("CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public");
    const existing = await db.query('SELECT "schemaName" FROM public."HostedTenant" WHERE "userId" = $1', [userId]);
    await db.query("BEGIN");
    await db.query(`CREATE SCHEMA IF NOT EXISTS "${name}"`);
    await db.query(`SET LOCAL search_path TO "${name}", public`);
    if (!existing.rowCount) {
      // The snapshot is generated from the same schema used by Prisma. Every
      // table, enum, unique constraint, and FK lives inside this namespace.
      await db.query(schema.sql);
      await db.query(`CREATE TABLE "_HiretivoMigrations" ("name" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL)`);
      for (const migration of schema.migrations) {
        await db.query('INSERT INTO "_HiretivoMigrations" ("name", "checksum") VALUES ($1, $2)', [migration.name, migration.checksum]);
      }
      await db.query('INSERT INTO public."HostedTenant" ("userId", "schemaName") VALUES ($1, $2)', [userId, name]);
      await db.query("COMMIT");
    } else {
      await db.query("COMMIT");
      for (const migration of schema.migrations) {
        const applied = await db.query(`SELECT "checksum" FROM "${name}"."_HiretivoMigrations" WHERE "name" = $1`, [migration.name]);
        if (applied.rowCount) {
          if (applied.rows[0].checksum !== migration.checksum) throw new Error("An applied tenant migration has changed.");
          continue;
        }
        // Commit each migration independently, including newly added enum values.
        await db.query("BEGIN");
        await db.query(`SET LOCAL search_path TO "${name}", public`);
        await db.query(migration.sql.replace(/CREATE EXTENSION IF NOT EXISTS citext;/g, ""));
        await db.query('INSERT INTO "_HiretivoMigrations" ("name", "checksum") VALUES ($1, $2)', [migration.name, migration.checksum]);
        await db.query("COMMIT");
      }
    }
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await db.query("SELECT pg_advisory_unlock(hashtext($1))", [name]).catch(() => {});
    db.release();
  }
  // The schema snapshot contains structure, not the built-in resume themes
  // normally installed by prisma/seed.ts for a self-hosted installation.
  await withTenantDb(userId, (tenant) => tenant.$transaction(BUILT_IN_THEMES.map(({ id, ...theme }) =>
    tenant.theme.upsert({ where: { id }, create: { id, ...theme }, update: theme }))));
}

/** Scheduler tasks must enter every namespace explicitly, never use public app tables. */
export async function eachTenant(run: () => Promise<unknown>): Promise<void> {
  if (deploymentMode() === "self-hosted") { await run(); return; }
  await registry();
  const result = await pool().query<{ userId: string }>('SELECT t."userId" FROM public."HostedTenant" t JOIN public."HostedUser" u ON u."id"::text = t."userId" WHERE u."verifiedAt" IS NOT NULL ORDER BY t."createdAt"');
  for (const { userId } of result.rows) {
    await withTenant(userId, run).catch((error: unknown) => logServerError("account background task", error));
  }
}

export async function upgradeAllTenants(): Promise<void> {
  await registry();
  const result = await pool().query<{ userId: string }>('SELECT t."userId" FROM public."HostedTenant" t JOIN public."HostedUser" u ON u."id"::text = t."userId" WHERE u."verifiedAt" IS NOT NULL ORDER BY t."createdAt"');
  for (const { userId } of result.rows) await provisionTenant(userId);
}

const timers = globalThis as unknown as { hiretivoAuthCleanupTimer?: ReturnType<typeof setInterval> };
/** Shared auth records are maintenance data, separate from every account's app schema. */
export function startAuthCleanup(): void {
  if (deploymentMode() !== "hosted" || timers.hiretivoAuthCleanupTimer) return;
  const clean = () => void import("@/lib/auth/hosted/store")
    .then(({ cleanupAuthRecords }) => cleanupAuthRecords())
    .catch((error: unknown) => logServerError("authentication cleanup", error));
  clean();
  timers.hiretivoAuthCleanupTimer = setInterval(clean, 60 * 60_000);
  timers.hiretivoAuthCleanupTimer.unref?.();
}
