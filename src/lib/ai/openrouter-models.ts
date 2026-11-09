import { z } from "zod";

const modelResponse = z.object({
  data: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    context_length: z.number().nullable().optional(),
    architecture: z.object({
      input_modalities: z.array(z.string()).optional(),
      output_modalities: z.array(z.string()).optional(),
    }).optional(),
    pricing: z.object({ prompt: z.string().optional(), completion: z.string().optional() }).optional(),
  })),
});

export interface OpenRouterModelOption {
  id: string;
  name: string;
  isFree: boolean;
  supportsFile: boolean;
  contextLength: number | null;
  promptPricePerMillion: number | null;
  completionPricePerMillion: number | null;
}

/* Fetch current chat models; free availability and capabilities can change. */
export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModelOption[]> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Could not load OpenRouter models. Check your API key and try again.");
  const parsed = modelResponse.safeParse(await response.json());
  if (!parsed.success) throw new Error("OpenRouter returned an unexpected model list.");
  return parsed.data.data.filter((model) =>
    model.architecture?.input_modalities?.includes("text") &&
    model.architecture?.output_modalities?.includes("text"),
  ).map((model) => ({
    id: model.id,
    name: model.name ?? model.id,
    isFree: Number(model.pricing?.prompt) === 0 && Number(model.pricing?.completion) === 0,
    supportsFile: model.architecture?.input_modalities?.includes("file") ?? false,
    contextLength: model.context_length ?? null,
    promptPricePerMillion: model.pricing?.prompt === undefined ? null : Number(model.pricing.prompt) * 1_000_000,
    completionPricePerMillion: model.pricing?.completion === undefined ? null : Number(model.pricing.completion) * 1_000_000,
  }));
}
