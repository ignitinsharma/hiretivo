import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";

import { deploymentMode } from "@/lib/deployment-mode";

const shared = globalThis as unknown as { hiretivoTenantContext?: AsyncLocalStorage<string> };
const context = shared.hiretivoTenantContext ??= new AsyncLocalStorage<string>();

/** A server-verified account identity, carried into work outside the request. */
export function withTenant<T>(userId: string, run: () => T): T {
  if (!userId || userId === "local") {
    if (deploymentMode() === "hosted") throw new Error("A hosted task requires an account.");
  }
  return context.run(userId, run);
}

/** For APIs already entered through action()/route() or a background scope. */
export function currentTenantIdSync(): string {
  if (deploymentMode() === "self-hosted") return "local";
  const userId = context.getStore();
  if (!userId) throw new Error("An explicit hosted account context is required.");
  return userId;
}

export async function currentTenantId(): Promise<string> {
  if (deploymentMode() === "self-hosted") return "local";
  const explicit = context.getStore();
  if (explicit) return explicit;
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    // Chromium print requests carry a narrowly scoped signed token, not a session.
    const { printRequestOwner } = await import("@/lib/pdf/print-token");
    const printOwner = await printRequestOwner();
    if (printOwner) return printOwner;
    throw new Error("A verified account is required to access hosted data.");
  }
  return userId;
}

/** Hashing keeps schema names bounded and prevents SQL identifier injection. */
export function tenantSchema(userId: string): string {
  if (!userId || userId === "local") throw new Error("A hosted account id is required.");
  return `ht_${createHash("sha256").update(userId).digest("hex").slice(0, 40)}`;
}
