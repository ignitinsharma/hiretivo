import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

import { TenantClientCache } from "./client-cache";
import { tenantSchema } from "./context";

const shared = globalThis as unknown as { hiretivoTenantClientCache?: TenantClientCache<PrismaClient> };
const clients = shared.hiretivoTenantClientCache ??= new TenantClientCache<PrismaClient>(8, (userId) => {
    const schema = tenantSchema(userId);
    if (env.DATABASE_URL.startsWith("file:")) throw new Error("Hosted accounts require PostgreSQL.");
    const url = new URL(env.DATABASE_URL);
    url.searchParams.delete("schema");
    return new PrismaClient({ adapter: new PrismaPg({
      connectionString: url.toString(),
      options: `-c search_path=${schema},public`,
      max: 2,
      idleTimeoutMillis: 30_000,
      allowExitOnIdle: true,
    }, { schema }) });
}, (client) => client.$disconnect());

/** Only available while a routed operation holds this account's client lease. */
export function tenantDbForUser(userId: string): PrismaClient {
  const client = clients.peek(userId);
  if (!client) throw new Error("A hosted database operation requires an account lease.");
  return client;
}

export function withTenantDb<T>(userId: string, run: (client: PrismaClient) => PromiseLike<T> | T): Promise<T> {
  return clients.use(userId, run);
}

export function disconnectTenant(userId: string): Promise<void> { return clients.remove(userId); }
