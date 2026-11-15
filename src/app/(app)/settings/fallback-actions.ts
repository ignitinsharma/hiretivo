"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { AiProvider } from "@/generated/prisma/enums";
import { verifySession } from "@/lib/auth/session";
import { action, ActionError } from "@/lib/action";
import { createProvider } from "@/lib/ai";
import { ApiKeyUnreadable, apiKeyState, decryptApiKey, encryptApiKey } from "@/lib/ai/api-key";
import { resolveAiConfig } from "@/lib/ai/config";
import { AiError } from "@/lib/ai/errors";
import { fallbackRoutes } from "@/lib/ai/fallback";
import { providerOption, type KeyState } from "@/lib/ai/provider-options";
import { deploymentMode } from "@/lib/deployment-mode";
import { hostedAiProblem } from "@/lib/ai/hosted-policy";
import { env } from "@/lib/env";
import { loadSettings, saveSettings } from "@/lib/settings-data";
import type { AiFallbackRoute, SettingsData } from "@/lib/settings";

export type FallbackRouteView = {
  id: string;
  primary: boolean;
  provider: AiProvider;
  baseUrl: string;
  model: string;
  cost: "free" | "paid";
  approved: boolean;
  keyState: KeyState;
};

export type FallbackSettingsView = {
  hosted?: boolean;
  routes: FallbackRouteView[];
  enabled: boolean;
  paidEnabled: boolean;
};

function view(settings: SettingsData): FallbackSettingsView {
  const primary = resolveAiConfig(settings, env);
  const order: AiFallbackRoute[] = settings.aiFallbackRoutes.length ? settings.aiFallbackRoutes : [{ kind: "primary" }];
  return {
    hosted: deploymentMode() === "hosted",
    enabled: settings.aiFallbackEnabled,
    paidEnabled: settings.aiPaidFallbackEnabled,
    routes: order.map((entry) => entry.kind === "primary"
      ? {
          id: "primary", primary: true, provider: primary.provider, baseUrl: primary.baseUrl, model: primary.model ?? "",
          cost: settings.aiPrimaryCost,
          approved: providerOption(primary.provider).local ||
            (settings.aiPrimaryFallbackApproval?.provider === primary.provider && settings.aiPrimaryFallbackApproval.baseUrl === primary.baseUrl && settings.aiPrimaryFallbackApproval.model === primary.model),
          keyState: settings.apiKeyEnc ? apiKeyState(settings.apiKeyEnc) : primary.apiKey ? "env" : "none",
        }
      : {
          id: entry.id, primary: false, provider: entry.provider, baseUrl: entry.baseUrl, model: entry.model,
          cost: entry.cost, approved: providerOption(entry.provider).local || entry.approvedAt !== null,
          keyState: apiKeyState(entry.apiKeyEnc),
        }),
  };
}

export async function loadFallbackSettingsView(): Promise<FallbackSettingsView> {
  await verifySession();
  return view(await loadSettings());
}

function hasTwoUsableRoutes(settings: SettingsData): boolean {
  return fallbackRoutes(settings, resolveAiConfig(settings, env)).filter((route, index) =>
    route.approved && route.usable && (index === 0 || route.cost === "free" || settings.aiPaidFallbackEnabled)).length >= 2;
}

const routeInput = z.object({
  id: z.uuid().optional(),
  provider: z.enum(AiProvider),
  baseUrl: z.url().max(500),
  model: z.string().trim().min(1).max(200),
  key: z.string().trim().max(1000),
  cost: z.enum(["free", "paid"]),
  approved: z.boolean(),
});

/** Saves one model and its encrypted key. Approval is tied to its provider and address. */
export const saveFallbackRoute = action(routeInput, async ({ id, provider, baseUrl, model, key, cost, approved }) => {
  const problem = deploymentMode() === "hosted" ? hostedAiProblem(provider, baseUrl) : null;
  if (problem) throw new ActionError(problem);
  const current = await loadSettings();
  const existing = current.aiFallbackRoutes.find((route) => route.kind === "model" && route.id === id);
  if (id && (!existing || existing.kind !== "model")) throw new ActionError("That fallback model no longer exists. Reload Settings.");
  if (!providerOption(provider).local && !approved) throw new ActionError("Approve this provider's data use before adding it to automatic fallback.");
  const apiKeyEnc = key ? encryptApiKey(key) : existing?.kind === "model" && existing.provider === provider && existing.baseUrl === baseUrl ? existing.apiKeyEnc : null;
  if (providerOption(provider).apiKey && !apiKeyEnc && (deploymentMode() === "hosted" || (provider !== AiProvider.LMSTUDIO && provider !== AiProvider.OPENAI))) {
    throw new ActionError("Enter an API key for this model.");
  }
  const route: AiFallbackRoute = {
    kind: "model", id: id ?? randomUUID(), provider, baseUrl, model, apiKeyEnc, cost,
    approvedAt: providerOption(provider).local || approved ? new Date().toISOString() : null,
  };
  const order = current.aiFallbackRoutes.length ? current.aiFallbackRoutes : [{ kind: "primary" } as const];
  if (order.length >= 20 && !id) throw new ActionError("You can add up to 19 fallback models.");
  const aiFallbackRoutes = id ? order.map((entry) => entry.kind === "model" && entry.id === id ? route : entry) : [...order, route];
  await saveSettings({ aiFallbackRoutes, aiFallbackEnabled: current.aiFallbackEnabled && hasTwoUsableRoutes({ ...current, aiFallbackRoutes }) });
  return view(await loadSettings());
});

export const removeFallbackRoute = action(z.object({ id: z.uuid() }), async ({ id }) => {
  const current = await loadSettings();
  const aiFallbackRoutes = current.aiFallbackRoutes.filter((entry) => entry.kind !== "model" || entry.id !== id);
  await saveSettings({ aiFallbackRoutes, aiFallbackEnabled: current.aiFallbackEnabled && hasTwoUsableRoutes({ ...current, aiFallbackRoutes }) });
  return view(await loadSettings());
});

export const moveFallbackRoute = action(z.object({ id: z.string(), direction: z.enum(["up", "down"]) }), async ({ id, direction }) => {
  const current = await loadSettings();
  const order = [...current.aiFallbackRoutes];
  const index = order.findIndex((entry) => entry.kind === "primary" ? id === "primary" : entry.id === id);
  const target = index + (direction === "up" ? -1 : 1);
  if (index < 0 || target < 0 || target >= order.length) return view(current);
  [order[index], order[target]] = [order[target], order[index]];
  await saveSettings({ aiFallbackRoutes: order, aiFallbackEnabled: current.aiFallbackEnabled && hasTwoUsableRoutes({ ...current, aiFallbackRoutes: order }) });
  return view(await loadSettings());
});

export const savePrimaryFallbackPolicy = action(z.object({ cost: z.enum(["free", "paid"]), approved: z.boolean() }), async ({ cost, approved }) => {
  const current = await loadSettings();
  const primary = resolveAiConfig(current, env);
  const aiPrimaryFallbackApproval = providerOption(primary.provider).local || approved
    ? { provider: primary.provider, baseUrl: primary.baseUrl, model: primary.model ?? "", approvedAt: new Date().toISOString() } : null;
  await saveSettings({ aiPrimaryCost: cost, aiPrimaryFallbackApproval,
    aiFallbackEnabled: current.aiFallbackEnabled && hasTwoUsableRoutes({ ...current, aiPrimaryCost: cost, aiPrimaryFallbackApproval }) });
  return view(await loadSettings());
});

export const saveFallbackSwitches = action(z.object({ enabled: z.boolean().optional(), paidEnabled: z.boolean().optional() }), async ({ enabled, paidEnabled }) => {
  const current = await loadSettings();
  if (enabled ?? current.aiFallbackEnabled) {
    const order = current.aiFallbackRoutes;
    if (order.length < 2 || order.filter((entry) => entry.kind === "primary").length !== 1) throw new ActionError("Add a fallback model first.");
    if (order.some((entry) => entry.kind === "primary" ? !view(current).routes.find((route) => route.primary)?.approved : !view(current).routes.find((route) => route.id === entry.id)?.approved)) {
      throw new ActionError("Approve each hosted provider before turning on automatic fallback.");
    }
    const paidAllowed = paidEnabled ?? current.aiPaidFallbackEnabled;
    if (!hasTwoUsableRoutes({ ...current, aiPaidFallbackEnabled: paidAllowed })) {
      throw new ActionError("Add two usable models, or allow automatic paid fallback for a model you marked paid.");
    }
  }
  await saveSettings({ ...(enabled === undefined ? {} : { aiFallbackEnabled: enabled }), ...(paidEnabled === undefined ? {} : { aiPaidFallbackEnabled: paidEnabled }) });
  return view(await loadSettings());
});

export const testFallbackRoute = action(z.object({ id: z.uuid() }), async ({ id }) => {
  const current = await loadSettings();
  const route = current.aiFallbackRoutes.find((entry) => entry.kind === "model" && entry.id === id);
  if (!route || route.kind !== "model") throw new ActionError("That fallback model no longer exists.");
  const primary = resolveAiConfig(current, env);
  try {
    const apiKey = route.apiKeyEnc ? decryptApiKey(route.apiKeyEnc) : null;
    const result = await createProvider({ provider: route.provider, baseUrl: route.baseUrl, model: route.model, apiKey, apiKeyProblem: null, timeoutMs: Math.min(primary.timeoutMs, 60_000) }).test();
    return { connected: true as const, ...result };
  } catch (error) {
    if (error instanceof AiError) return { connected: false as const, message: error.message };
    if (error instanceof ApiKeyUnreadable) return { connected: false as const, message: error.message };
    throw error;
  }
});
