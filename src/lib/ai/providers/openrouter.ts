import "server-only";

import type { UsageSink } from "@/lib/usage";

import { AiError } from "../errors";
import { OPENROUTER_FALLBACK_MODELS, openRouterModelOptions, type OpenRouterModel } from "../openrouter-models";
import type { ChatAnswer, ChatCall, ModelOption } from "../provider";
import { keyGuardedFetch } from "./guarded-fetch";
import { OpenAICompatibleProvider } from "./openai-compatible";

/**
 * OpenRouter's catalogue through its own API (#207). It speaks OpenAI's chat
 * format, so the base class does the work; what differs is the key's name,
 * the data-collection setting (servers.ts), and the model list, whose prices
 * say which models are free.
 */
export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor(baseURL: string, private readonly apiKey: string | null, model: string | null, timeoutMs: number, onUsage?: UsageSink) {
    super("OPENROUTER", baseURL, apiKey, model, timeoutMs, onUsage);
  }

  protected override async chat(call: ChatCall): Promise<ChatAnswer> {
    if (!this.apiKey) throw AiError.config("Add your OpenRouter API key in Settings → AI provider first.");
    return super.chat(call);
  }

  protected override thinkingRoom(): number {
    // The free router changes the backing model per request. Keep its retry
    // within the selected task budget instead of adding 12k output tokens.
    return this.model === "openrouter/free" ? 0 : super.thinkingRoom();
  }

  override listModelOptions(signal?: AbortSignal): Promise<ModelOption[]> {
    return this.guard("", signal, (combined) => this.fetchCatalog(combined));
  }

  protected override async fetchModels(signal: AbortSignal): Promise<string[]> {
    return (await this.fetchCatalog(signal)).map(({ id }) => id);
  }

  /** OpenRouter's list with its prices, or the small fallback when it can't be had. */
  private async fetchCatalog(signal: AbortSignal): Promise<ModelOption[]> {
    if (!this.apiKey) return fallbackOptions();
    try {
      const response = await keyGuardedFetch()(`${this.baseURL}/models`, {
        signal,
        headers: { Accept: "application/json", Authorization: `Bearer ${this.apiKey}`, ...this.server?.headers?.() },
      });
      if (!response.ok) return fallbackOptions();
      const body = (await response.json()) as { data?: OpenRouterModel[] };
      const options = openRouterModelOptions(Array.isArray(body.data) ? body.data : []);
      return options.length > 0 ? options : fallbackOptions();
    } catch (error) {
      // A refused redirect is a configuration problem, not a reason to guess.
      if (error instanceof AiError && error.kind === "config") throw error;
      return fallbackOptions();
    }
  }
}

function fallbackOptions(): ModelOption[] {
  return openRouterModelOptions(OPENROUTER_FALLBACK_MODELS.map((id) => ({ id })));
}
