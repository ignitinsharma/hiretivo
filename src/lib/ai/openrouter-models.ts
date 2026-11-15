// OpenRouter's catalogue, without the server-only bits so the model select can
// use it too. Its API gives each model's price per token as strings; a model
// is free when those are both zero, which its `:free` variants also say in
// their name. Free models are listed first, and the warning in Settings → AI
// provider says what routing to a free model can mean for the data.

import type { ModelOption } from "./provider";

/** Offered before a key is saved, best first: a free one, then a paid one. */
export const OPENROUTER_FALLBACK_MODELS: readonly string[] = ["meta-llama/llama-4.1-8b:free", "openai/gpt-6.1-terra"];

/** What OpenRouter's `/models` says about a model, besides its id. */
export type OpenRouterModel = {
  id?: unknown;
  pricing?: { prompt?: unknown; completion?: unknown };
};

/** Media and embedding models can't write a resume, so the picker leaves them out. */
const NOT_TEXT = /embedding|moderation|whisper|tts|audio|image|video/i;

/** Whether a model costs nothing: a `:free` id, or zero for both prompt and completion. */
export function isOpenRouterFreeModel(model: OpenRouterModel): boolean {
  const id = String(model.id ?? "");
  if (id.endsWith(":free")) return true;
  const price = (value: unknown) => (value === undefined || value === null || value === "" ? Number.NaN : Number(value));
  return model.pricing !== undefined && price(model.pricing.prompt) === 0 && price(model.pricing.completion) === 0;
}

/** The chat models to offer, free ones first and labelled, then the rest by name. */
export function openRouterModelOptions(models: readonly OpenRouterModel[]): ModelOption[] {
  const options = new Map<string, ModelOption>();
  for (const model of models) {
    const id = typeof model.id === "string" ? model.id.trim() : "";
    if (!id || !id.includes("/") || NOT_TEXT.test(id)) continue;
    options.set(id, { id, freeTier: isOpenRouterFreeModel({ ...model, id }) });
  }
  return [...options.values()].sort((a, b) => Number(b.freeTier) - Number(a.freeTier) || a.id.localeCompare(b.id));
}

/** The same order as `openRouterModelOptions`, for a provider's `listModels`. */
export function openRouterModelNames(models: readonly OpenRouterModel[]): string[] {
  return openRouterModelOptions(models).map((model) => model.id);
}
