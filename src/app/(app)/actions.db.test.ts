import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { loadSettings } from "@/lib/settings-data";
import { createTestClient, resetDatabase } from "@/test/db";

import { rememberDashboardPeriod } from "./actions";

// The dashboard's actions run against the test database, signed in.
const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const prisma = () => db.client!;

beforeEach(async () => {
  await resetDatabase(prisma());
});
afterAll(() => prisma().$disconnect());

describe("the dashboard's settings", () => {
  it("remembers the period (E9-8)", async () => {
    expect(await rememberDashboardPeriod({ period: "90d" })).toEqual({ ok: true, data: null });
    expect((await loadSettings()).dashboardPeriod).toBe("90d");
  });

});
