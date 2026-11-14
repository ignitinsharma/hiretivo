import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import type { AiProvider as AiProviderKind } from "@/generated/prisma/enums";
import { currentTenantId } from "@/lib/tenancy/context";
import { deploymentMode } from "@/lib/deployment-mode";
import { hostedAiProblem } from "./hosted-policy";
import { logServerError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import type { AiFallbackRoute, SettingsData } from "@/lib/settings";

import { decryptApiKey } from "./api-key";
import type { AiConfig } from "./config";
import { AiError } from "./errors";
import type { AIProvider, CompletionRequest, JsonCompletionRequest } from "./provider";
import { providerOption } from "./provider-options";

export type FallbackNotice = {
  fromProvider: string;
  fromModel: string;
  toProvider: string;
  toModel: string;
  reason: string;
};

const jobContext = new AsyncLocalStorage<string>();
export const withAiJob = <T>(id: string, run: () => Promise<T>) => jobContext.run(id, run);

type Route = { id: string; config: AiConfig; cost: "free" | "paid"; approved: boolean; usable: boolean };
type ProviderFactory = (config: AiConfig) => AIProvider;

const globalForCooldowns = globalThis as unknown as { aiFallbackCooldowns?: Map<string, number> };
const cooldowns = (globalForCooldowns.aiFallbackCooldowns ??= new Map<string, number>());
const TEMPORARY = new Set(["rate-limited", "busy", "timeout", "unreachable"]);

/** The user's order, with a separate encrypted key for every added model. */
export function fallbackRoutes(settings: SettingsData, primary: AiConfig): Route[] {
  const order: AiFallbackRoute[] = settings.aiFallbackRoutes.length ? settings.aiFallbackRoutes : [{ kind: "primary" }];
  return order.map((entry) => {
    if (entry.kind === "primary") {
      return {
        id: `primary:${primary.provider}:${primary.baseUrl}:${primary.model}`,
        config: primary,
        cost: settings.aiPrimaryCost,
        approved: providerOption(primary.provider).local ||
          (settings.aiPrimaryFallbackApproval?.provider === primary.provider && settings.aiPrimaryFallbackApproval.baseUrl === primary.baseUrl && settings.aiPrimaryFallbackApproval.model === primary.model),
        usable: Boolean(primary.model && !primary.apiKeyProblem && (!needsKey(primary.provider) || primary.apiKey)),
      };
    }
    let apiKey: string | null = null;
    let apiKeyProblem: string | null = null;
    if (entry.apiKeyEnc) {
      try {
        apiKey = decryptApiKey(entry.apiKeyEnc);
      } catch {
        apiKeyProblem = "This model's saved API key can't be read. Enter it again in Settings → AI provider.";
      }
    }
    return {
      id: `${entry.id}:${entry.provider}:${entry.baseUrl}:${entry.model}`,
      config: { provider: entry.provider, baseUrl: entry.baseUrl, model: entry.model, apiKey, apiKeyProblem, timeoutMs: primary.timeoutMs },
      cost: entry.cost,
      approved: providerOption(entry.provider).local || entry.approvedAt !== null,
      usable: Boolean(entry.model && !apiKeyProblem && (!needsKey(entry.provider) || apiKey) && (deploymentMode() !== "hosted" || !hostedAiProblem(entry.provider, entry.baseUrl))),
    };
  });
}

export function hasEligibleFallback(settings: SettingsData, primary: AiConfig): boolean {
  return fallbackRoutes(settings, primary).some((route, index) => route.approved && route.usable &&
    (index === 0 || route.cost === "free" || settings.aiPaidFallbackEnabled));
}

/** Tries only approved, user-configured models. A paid fallback requires its separate opt-in. */
export class FallbackProvider implements AIProvider {
  readonly kind: AiProviderKind;
  readonly model: string | null;

  constructor(
    private readonly routes: Route[],
    private readonly paidFallbackEnabled: boolean,
    private readonly create: ProviderFactory,
  ) {
    this.kind = routes[0].config.provider;
    this.model = routes[0].config.model;
  }

  complete(request: CompletionRequest): Promise<string>;
  complete<T>(request: JsonCompletionRequest<T>): Promise<T>;
  async complete<T>(request: CompletionRequest | JsonCompletionRequest<T>): Promise<string | T> {
    const tenant = await currentTenantId();
    const preferred = this.routes[0];
    let firstFailure: AiError | null = null;
    let lastFailure: AiError | null = null;
    let eligible = 0;
    const attempted: string[] = [];
    for (const [index, route] of this.routes.entries()) {
      if (request.signal?.aborted) throw AiError.of("cancelled");
      if (!route.approved || !route.usable) continue;
      if (index > 0 && route.cost === "paid" && !this.paidFallbackEnabled) continue;
      eligible++;
      if ((cooldowns.get(`${tenant}:${route.id}`) ?? 0) > Date.now()) continue;
      attempted.push(`${route.config.provider} ${route.config.model}`);
      try {
        const provider = this.create(route.config);
        const result = "schema" in request ? await provider.complete(request) : await provider.complete(request);
        if (route !== preferred) {
          await recordFallback({
            fromProvider: preferred.config.provider,
            fromModel: preferred.config.model ?? "",
            toProvider: route.config.provider,
            toModel: route.config.model ?? "",
            reason: firstFailure?.kind ?? (preferred.usable ? "cooldown" : "unconfigured"),
          }, request.task);
        }
        return result;
      } catch (error) {
        if (!(error instanceof AiError) || !TEMPORARY.has(error.kind)) throw error;
        firstFailure ??= error;
        lastFailure = error;
        cooldowns.set(`${tenant}:${route.id}`, Date.now() + (error.retryAfterMs ?? (error.kind === "rate-limited" ? 60_000 : 30_000)));
      }
    }
    if (lastFailure || eligible > 0) {
      throw new AiError(
        lastFailure?.kind ?? "rate-limited",
        attempted.length
          ? `All available AI models were unavailable (${attempted.join(", ")}). Retry, or change the fallback order in Settings → AI provider.`
          : "All available AI models are cooling down. Retry shortly, or change the fallback order in Settings → AI provider.",
      );
    }
    throw AiError.config("No approved AI model is available. Check your fallback order and paid-model setting in Settings → AI provider.");
  }

  listModels(signal?: AbortSignal): Promise<string[]> {
    return this.create(this.routes[0].config).listModels(signal);
  }

  async listModelOptions(signal?: AbortSignal) {
    const provider = this.create(this.routes[0].config);
    return provider.listModelOptions ? provider.listModelOptions(signal) : (await provider.listModels(signal)).map((id) => ({ id, freeTier: false }));
  }

  test(signal?: AbortSignal) {
    return this.create(this.routes[0].config).test(signal);
  }
}

function needsKey(provider: AiProviderKind): boolean {
  return (deploymentMode() === "hosted" && provider === "OPENAI") || provider === "ANTHROPIC" || provider === "MISTRAL" || provider === "GEMINI" || provider === "GROQ" || provider === "OPENROUTER";
}

async function recordFallback(notice: FallbackNotice, task: string): Promise<void> {
  try {
    await prisma.aiFallbackEvent.create({ data: { ...notice, task, jobId: jobContext.getStore() ?? null } });
  } catch (error) {
    logServerError("AI fallback history", error);
  }
}
