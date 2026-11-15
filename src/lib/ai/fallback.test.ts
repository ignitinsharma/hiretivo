import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withTenant } from "@/lib/tenancy/context";
import { AiProvider } from "@/generated/prisma/enums";
import type { SettingsData } from "@/lib/settings";

import type { AiConfig } from "./config";
import { AiError } from "./errors";
import { FallbackProvider, fallbackRoutes } from "./fallback";
import type { AIProvider } from "./provider";

const saved = vi.hoisted(() => ({ create: vi.fn(async () => ({})) }));
vi.mock("@/lib/prisma", () => ({ prisma: { aiFallbackEvent: { create: saved.create } } }));
vi.mock("./api-key", () => ({ decryptApiKey: () => "key" }));

const request = { task: "extract-posting" as const, system: "Read it", messages: [{ role: "user" as const, content: "Posting" }] };
const primary = (): AiConfig => ({ provider: AiProvider.GEMINI, baseUrl: "https://google.example/v1", model: "gemini-test", apiKey: "key", apiKeyProblem: null, timeoutMs: 10_000 });

function makeSettings(cost: "free" | "paid" = "free"): SettingsData {
  return {
    aiFallbackRoutes: [
      { kind: "primary" },
      { kind: "model", id: randomUUID(), provider: AiProvider.GROQ, baseUrl: "https://groq.example/v1", model: "groq-test", apiKeyEnc: "encrypted", cost, approvedAt: new Date().toISOString() },
    ],
    aiPrimaryCost: "free",
    aiPrimaryFallbackApproval: { provider: AiProvider.GEMINI, baseUrl: "https://google.example/v1", model: "gemini-test", approvedAt: new Date().toISOString() },
  } as SettingsData;
}

function provider(kind: AiProvider, answer: () => Promise<string>): AIProvider {
  return { kind, model: "test", complete: answer, listModels: async () => [], test: async () => ({ model: "test", latencyMs: 1 }) };
}

beforeEach(() => {
  saved.create.mockClear();
  (globalThis as unknown as { aiFallbackCooldowns?: Map<string, number> }).aiFallbackCooldowns?.clear();
});

afterEach(() => vi.unstubAllEnvs());

describe("automatic AI fallback", () => {
  it("keeps a hosted account's rate-limit cooldown private to that account", async () => {
    vi.stubEnv("HIRETIVO_DEPLOYMENT_MODE", "hosted");
    const config = { ...primary(), baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" };
    const settings = makeSettings();
    settings.aiPrimaryFallbackApproval!.baseUrl = config.baseUrl;
    const additional = settings.aiFallbackRoutes[1];
    if (additional.kind === "model") additional.baseUrl = "https://api.groq.com/openai/v1";
    const first = vi.fn().mockRejectedValueOnce(AiError.of("rate-limited")).mockResolvedValue("primary answer");
    const second = vi.fn().mockResolvedValue("fallback answer");
    const router = new FallbackProvider(fallbackRoutes(settings, config), false, (route) => route.provider === "GEMINI" ? provider(route.provider, first) : provider(route.provider, second));
    expect(await withTenant("account-a", () => router.complete(request))).toBe("fallback answer");
    expect(await withTenant("account-b", () => router.complete(request))).toBe("primary answer");
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledOnce();
  });
  it("uses the next approved model after a rate limit and records the switch", async () => {
    const first = vi.fn().mockRejectedValue(AiError.of("rate-limited"));
    const second = vi.fn().mockResolvedValue("done");
    const routes = fallbackRoutes(makeSettings(), primary());
    const router = new FallbackProvider(routes, false, (config) => config.provider === AiProvider.GEMINI ? provider(config.provider, first) : provider(config.provider, second));
    expect(await router.complete(request)).toBe("done");
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(saved.create).toHaveBeenCalledWith({ data: expect.objectContaining({ fromProvider: "GEMINI", toProvider: "GROQ", reason: "rate-limited" }) });
  });

  it("never uses a paid fallback without the separate switch", async () => {
    const first = vi.fn().mockRejectedValue(AiError.of("rate-limited"));
    const second = vi.fn().mockResolvedValue("paid answer");
    const routes = fallbackRoutes(makeSettings("paid"), primary());
    const router = new FallbackProvider(routes, false, (config) => config.provider === AiProvider.GEMINI ? provider(config.provider, first) : provider(config.provider, second));
    await expect(router.complete(request)).rejects.toMatchObject({ kind: "rate-limited" });
    expect(second).not.toHaveBeenCalled();
  });

  it("uses a paid model only after opt-in and skips a recently limited route", async () => {
    const first = vi.fn().mockRejectedValue(AiError.of("rate-limited", undefined, 120_000));
    const second = vi.fn().mockResolvedValue("paid answer");
    const routes = fallbackRoutes(makeSettings("paid"), primary());
    const router = new FallbackProvider(routes, true, (config) => config.provider === AiProvider.GEMINI ? provider(config.provider, first) : provider(config.provider, second));
    expect(await router.complete(request)).toBe("paid answer");
    expect(await router.complete(request)).toBe("paid answer");
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledTimes(2);
    expect(saved.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ reason: "cooldown", toProvider: "GROQ" }) });
  });

  it("stops on an invalid key instead of hiding the configuration failure", async () => {
    const first = vi.fn().mockRejectedValue(AiError.of("auth"));
    const second = vi.fn().mockResolvedValue("done");
    const routes = fallbackRoutes(makeSettings(), primary());
    const router = new FallbackProvider(routes, false, (config) => config.provider === AiProvider.GEMINI ? provider(config.provider, first) : provider(config.provider, second));
    await expect(router.complete(request)).rejects.toMatchObject({ kind: "auth" });
    expect(second).not.toHaveBeenCalled();
  });

  it("does not send a cancelled request to any provider", async () => {
    const first = vi.fn().mockResolvedValue("done");
    const routes = fallbackRoutes(makeSettings(), primary());
    const router = new FallbackProvider(routes, false, (config) => provider(config.provider, first));
    const controller = new AbortController();
    controller.abort();
    await expect(router.complete({ ...request, signal: controller.signal })).rejects.toMatchObject({ kind: "cancelled" });
    expect(first).not.toHaveBeenCalled();
  });

  it("does not reuse a primary approval after its model or endpoint changes", () => {
    const settings = makeSettings();
    expect(fallbackRoutes(settings, primary())[0].approved).toBe(true);
    expect(fallbackRoutes(settings, { ...primary(), model: "another-model" })[0].approved).toBe(false);
    expect(fallbackRoutes(settings, { ...primary(), baseUrl: "https://another.example/v1" })[0].approved).toBe(false);
  });
});
