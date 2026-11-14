import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ mode: "hosted", userId: "", printOwner: null as string | null }));
vi.mock("@/lib/deployment-mode", () => ({ deploymentMode: () => state.mode }));
vi.mock("@/lib/auth/session", () => ({ getSession: async () => state.userId ? { userId: state.userId } : null }));
vi.mock("@/lib/pdf/print-token", () => ({ printRequestOwner: async () => state.printOwner }));

import { currentTenantId, currentTenantIdSync, tenantSchema, withTenant } from "./context";

describe("account identity context", () => {
  it("rejects hosted data access without a verified session", async () => {
    await expect(currentTenantId()).rejects.toThrow("verified account");
    expect(() => currentTenantIdSync()).toThrow("explicit hosted account");
    expect(() => withTenant("local", () => undefined)).toThrow("requires an account");
  });

  it("preserves each asynchronous background identity without contaminating siblings", async () => {
    const result = await Promise.all(["alice", "bob"].map((owner) => withTenant(owner, async () => {
      await Promise.resolve();
      return [await currentTenantId(), currentTenantIdSync()];
    })));
    expect(result).toEqual([["alice", "alice"], ["bob", "bob"]]);
    await expect(currentTenantId()).rejects.toThrow("verified account");
  });

  it("uses session identity or a separately verified print request", async () => {
    state.userId = "alice";
    expect(await currentTenantId()).toBe("alice");
    state.userId = "";
    state.printOwner = "bob";
    expect(await currentTenantId()).toBe("bob");
    state.printOwner = null;
  });

  it("never interpolates user-controlled ids into schema identifiers", () => {
    expect(tenantSchema('user"; DROP SCHEMA public;--')).toMatch(/^ht_[a-f0-9]{40}$/);
    expect(tenantSchema("alice")).not.toBe(tenantSchema("bob"));
    expect(tenantSchema("alice")).toBe(tenantSchema("alice"));
    expect(() => tenantSchema("local")).toThrow();
  });

  it("keeps self-hosted ENV installs on their existing local owner", async () => {
    state.mode = "self-hosted";
    expect(await currentTenantId()).toBe("local");
    expect(currentTenantIdSync()).toBe("local");
    state.mode = "hosted";
  });
});
