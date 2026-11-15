import "server-only";

import type { UsageSink } from "@/lib/usage";

import { AiError } from "../errors";
import type { ChatAnswer, ChatCall, ModelOption } from "../provider";
import { GEMINI_FALLBACK_MODELS, geminiModelNames, geminiModelOptions } from "../gemini-models";
import { OpenAICompatibleProvider } from "./openai-compatible";

/**
 * Google's Gemini through a Google AI Studio key. It speaks OpenAI's chat
 * format at its compatibility endpoint, so the base class does the work; what
 * differs is the key's name, the model catalog, and the free tier's limits.
 */
export class GeminiProvider extends OpenAICompatibleProvider {
  constructor(baseURL: string, private readonly apiKey: string | null, model: string | null, timeoutMs: number, onUsage?: UsageSink) {
    super("GEMINI", baseURL, apiKey, model, timeoutMs, onUsage);
  }

  protected override async chat(call: ChatCall): Promise<ChatAnswer> {
    if (!this.apiKey) throw AiError.config("Add your Google AI Studio API key in Settings → AI provider first.");
    return super.chat(call);
  }

  override async listModelOptions(signal?: AbortSignal): Promise<ModelOption[]> {
    return geminiModelOptions(await this.listModels(signal));
  }

  /** Google's own list, without embeddings and media models; the free ones first. */
  protected override async fetchModels(signal: AbortSignal): Promise<string[]> {
    if (!this.apiKey) return [...GEMINI_FALLBACK_MODELS];
    return geminiModelNames(await super.fetchModels(signal));
  }
}
