import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { decryptApiKey, encryptApiKey } from "@/lib/ai/api-key";
import { loadSettings, saveSettings } from "@/lib/settings-data";
import { createTestClient, resetDatabase } from "@/test/db";

import { loadFallbackSettingsView, moveFallbackRoute, saveFallbackRoute, saveFallbackSwitches, savePrimaryFallbackPolicy } from "./fallback-actions";

const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }),
  verifySession: async () => ({}),
}));
vi.mock("@/lib/env", () => ({ env: { HIRETIVO_SECRET: "a".repeat(32) } }));

beforeEach(async () => {
  await resetDatabase(db.client!);
  await saveSettings({ provider: "GEMINI", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-test", apiKeyEnc: encryptApiKey("gemini-secret") });
});
afterAll(() => db.client?.$disconnect());

describe("fallback settings", () => {
  it("requires approval, encrypts separate keys, and preserves the primary setting", async () => {
    const unapproved = await saveFallbackRoute({ provider: "GROQ", baseUrl: "https://api.groq.com/openai/v1", model: "groq-test", key: "groq-secret", cost: "free", approved: false });
    expect(unapproved).toMatchObject({ ok: false });
    const added = await saveFallbackRoute({ provider: "GROQ", baseUrl: "https://api.groq.com/openai/v1", model: "groq-test", key: "groq-secret", cost: "free", approved: true });
    expect(added).toMatchObject({ ok: true, data: { routes: [expect.objectContaining({ primary: true }), expect.objectContaining({ provider: "GROQ", keyState: "set" })] } });
    expect(JSON.stringify(added)).not.toContain("groq-secret");
    const settings = await loadSettings();
    expect(settings).toMatchObject({ provider: "GEMINI", model: "gemini-test" });
    const route = settings.aiFallbackRoutes[1];
    expect(route.kind).toBe("model");
    if (route.kind === "model") expect(decryptApiKey(route.apiKeyEnc!)).toBe("groq-secret");
  });

  it("keeps fallback off until approved, then lets users reorder and opt into paid models", async () => {
    await saveFallbackRoute({ provider: "OPENROUTER", baseUrl: "https://openrouter.ai/api/v1", model: "example/paid", key: "router-secret", cost: "paid", approved: true });
    expect(await saveFallbackSwitches({ enabled: true })).toMatchObject({ ok: false });
    await savePrimaryFallbackPolicy({ cost: "free", approved: true });
    expect(await saveFallbackSwitches({ enabled: true })).toMatchObject({ ok: false });
    expect(await saveFallbackSwitches({ enabled: true, paidEnabled: true })).toMatchObject({ ok: true, data: { enabled: true, paidEnabled: true } });
    const route = (await loadFallbackSettingsView()).routes[1];
    const moved = await moveFallbackRoute({ id: route.id, direction: "up" });
    expect(moved).toMatchObject({ ok: true, data: { routes: [expect.objectContaining({ provider: "OPENROUTER" }), expect.objectContaining({ primary: true })] } });
  });
});
