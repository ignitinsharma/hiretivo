import "server-only";

import { deploymentMode } from "@/lib/deployment-mode";
import { assertHostedAiAllowed } from "./hosted-policy";
import { AiProvider } from "@/generated/prisma/enums";
import { recordUsage } from "@/lib/usage-data";
import { loadSettings } from "@/lib/settings-data";
import { env } from "@/lib/env";

import { resolveAiConfig, type AiConfig } from "./config";
import { fallbackRoutes, FallbackProvider } from "./fallback";
import { AiError } from "./errors";
import { providerOption } from "./provider-options";
import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";
import { LocalProvider } from "./providers/local";
import { LmStudioProvider } from "./providers/lmstudio";
import { MistralProvider } from "./providers/mistral";
import { OpenRouterProvider } from "./providers/openrouter";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";

export { AiError } from "./errors";
export type { AIProvider, ChatMessage, CompletionRequest, JsonCompletionRequest } from "./provider";

/**
 * A provider for `config`, keeping each answer's tokens for the Usage screen.
 * A saved key that can't be read stops hosted providers with a clear message.
 */
export function createProvider(config: AiConfig): AIProvider {
  const { provider, baseUrl, model, apiKey, apiKeyProblem, timeoutMs } = config;
  assertHostedAiAllowed(provider, baseUrl);
  if (deploymentMode() === "hosted" && !apiKey) throw AiError.config("Add your own API key in Settings → AI provider before using AI.");
  if (apiKeyProblem && providerOption(provider).apiKey) throw AiError.config(apiKeyProblem);
  switch (provider) {
    case AiProvider.LOCAL:
      return new LocalProvider(baseUrl, model, timeoutMs, recordUsage);
    case AiProvider.OPENAI:
      return new OpenAICompatibleProvider("OPENAI", baseUrl, apiKey, model, timeoutMs, recordUsage);
    case AiProvider.ANTHROPIC:
      return new AnthropicProvider(baseUrl, apiKey, model, timeoutMs, recordUsage);
    case AiProvider.MISTRAL:
      return new MistralProvider(baseUrl, apiKey, model, timeoutMs, recordUsage);
    case AiProvider.GEMINI:
      return new GeminiProvider(baseUrl, apiKey, model, timeoutMs, recordUsage);
    case AiProvider.GROQ:
      return new OpenAICompatibleProvider("GROQ", baseUrl, apiKey, model, timeoutMs, recordUsage);
    case AiProvider.OPENROUTER:
      return new OpenRouterProvider(baseUrl, apiKey, model, timeoutMs, recordUsage);
    case AiProvider.LMSTUDIO:
      return new LmStudioProvider(baseUrl, apiKey, model, timeoutMs, recordUsage);
  }
}

/** The provider configured in Settings, or by the HIRETIVO_AI_* variables. */
export async function getAiProvider(): Promise<AIProvider> {
  const settings = await loadSettings();
  const config = resolveAiConfig(settings, env);
  if (!settings.aiFallbackEnabled) return createProvider(config);
  return new FallbackProvider(fallbackRoutes(settings, config), settings.aiPaidFallbackEnabled, createProvider);
}
