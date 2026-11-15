import { describe, expect, it, vi } from "vitest";

import { TenantClientCache } from "./client-cache";

const gate = () => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  return { waiting, release };
};

describe("bounded tenant database clients", () => {
  it("evicts idle clients and keeps the cache within its capacity", async () => {
    const close = vi.fn(async () => undefined);
    const cache = new TenantClientCache(2, (owner) => ({ owner }), close);
    await cache.use("alice", async (client) => expect(client.owner).toBe("alice"));
    await cache.use("bob", async (client) => expect(client.owner).toBe("bob"));
    await cache.use("charlie", async (client) => expect(client.owner).toBe("charlie"));
    expect(close).toHaveBeenCalledOnce();
    expect(cache.peek("alice")).toBeUndefined();
    expect(cache.peek("bob")).toBeDefined();
    expect(cache.peek("charlie")).toBeDefined();
  });

  it("waits rather than disconnecting an active transaction", async () => {
    const close = vi.fn(async () => undefined);
    const cache = new TenantClientCache(1, (owner) => ({ owner }), close);
    const active = gate();
    let secondStarted = false;
    const first = cache.use("alice", async () => active.waiting);
    const second = cache.use("bob", async () => { secondStarted = true; });
    await Promise.resolve();
    expect(secondStarted).toBe(false);
    expect(close).not.toHaveBeenCalled();
    await expect(cache.remove("alice")).rejects.toThrow("active account transaction");
    active.release();
    await Promise.all([first, second]);
    expect(secondStarted).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });

  it("reuses one client's parallel leases and releases failed queries", async () => {
    const create = vi.fn((owner: string) => ({ owner }));
    const cache = new TenantClientCache(1, create, async () => undefined);
    const active = gate();
    const first = cache.use("alice", async () => active.waiting);
    await cache.use("alice", async (client) => expect(client.owner).toBe("alice"));
    expect(create).toHaveBeenCalledOnce();
    active.release();
    await first;
    await expect(cache.use("alice", async () => { throw new Error("rollback"); })).rejects.toThrow("rollback");
    await cache.use("bob", async (client) => expect(client.owner).toBe("bob"));
    expect(cache.peek("alice")).toBeUndefined();
  });
});
