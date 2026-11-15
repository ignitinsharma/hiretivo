import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { routedClient } from "./routed-client";

describe("hosted data routing", () => {
  it("binds queries to the identity at creation, keeping queries lazy", async () => {
    let identity = "alice";
    const alice = { setting: { findMany: vi.fn().mockResolvedValue([{ value: "alice-key" }]) } };
    const bob = { setting: { findMany: vi.fn().mockResolvedValue([{ value: "bob-key" }]) } };
    const db = routedClient(() => Promise.resolve(identity), (id) => (id === "alice" ? alice : bob) as unknown as PrismaClient);
    const pending = db.setting.findMany();
    identity = "bob";
    expect(alice.setting.findMany).not.toHaveBeenCalled();
    expect(await pending).toEqual([{ value: "alice-key" }]);
    expect(await db.setting.findMany()).toEqual([{ value: "bob-key" }]);
  });

  it("fails closed without an account rather than falling back to shared data", async () => {
    const clientFor = vi.fn();
    const db = routedClient(async () => { throw new Error("sign in"); }, clientFor);
    await expect(db.setting.findMany()).rejects.toThrow("sign in");
    expect(clientFor).not.toHaveBeenCalled();
  });

  it("rebinds array transactions to one account and refuses mixed accounts", async () => {
    let identity = "alice";
    const target = { setting: { deleteMany: vi.fn().mockReturnValue("delete-query") }, $transaction: vi.fn().mockResolvedValue([{ count: 1 }]) };
    const db = routedClient(() => Promise.resolve(identity), () => target as unknown as PrismaClient);
    await expect(db.$transaction([db.setting.deleteMany()])).resolves.toEqual([{ count: 1 }]);
    expect(target.$transaction).toHaveBeenCalledWith(["delete-query"], undefined);
    const aliceQuery = db.setting.deleteMany();
    identity = "bob";
    await expect(db.$transaction([aliceQuery])).rejects.toThrow("cannot cross account");
  });

  it("gives interactive transactions the actual scoped client", async () => {
    const tx = { profileField: { findMany: vi.fn().mockResolvedValue([]) } };
    const target = { $transaction: vi.fn(async (run) => run(tx)) };
    const db = routedClient(async () => "alice", () => target as unknown as PrismaClient);
    await db.$transaction((scoped) => scoped.profileField.findMany());
    expect(tx.profileField.findMany).toHaveBeenCalledOnce();
  });
});
