import { AIProvider } from "@prisma/client";
import { z } from "zod";

export type DirectProvider = typeof AIProvider.OPENAI | typeof AIProvider.ANTHROPIC | typeof AIProvider.GOOGLE;

const baseUrls: Record<DirectProvider, string> = {
  OPENAI: "https://api.openai.com/v1",
  ANTHROPIC: "https://api.anthropic.com/v1",
  GOOGLE: "https://generativelanguage.googleapis.com/v1beta/openai",
};

const modelResponse = z.object({ data: z.array(z.object({ id: z.string().min(1) }).passthrough()) });

export function isDirectProvider(value: string): value is DirectProvider {
  return value === AIProvider.OPENAI || value === AIProvider.ANTHROPIC || value === AIProvider.GOOGLE;
}

export function directProviderBaseUrl(provider: DirectProvider): string { return baseUrls[provider]; }

export function completionTokenLimit(provider: AIProvider | undefined, tokens: number): { max_tokens: number } | { max_completion_tokens: number } {
  return provider === AIProvider.OPENAI ? { max_completion_tokens: tokens } : { max_tokens: tokens };
}

function isTextModel(provider: DirectProvider, id: string): boolean {
  if (provider === AIProvider.ANTHROPIC) return id.startsWith("claude-");
  if (provider === AIProvider.GOOGLE) return id.startsWith("gemini-") && !/(image|audio|tts|live|transcribe|embedding)/i.test(id);
  return /^(gpt-|o\d)/i.test(id) && !/(audio|realtime|transcribe|tts|image|embedding|search|codex)/i.test(id);
}

export async function fetchDirectModels(provider: DirectProvider, apiKey: string): Promise<string[]> {
  const response = await fetch(`${baseUrls[provider]}/models`, {
    headers: { Authorization: `Bearer ${apiKey}`, ...(provider === AIProvider.ANTHROPIC ? { "anthropic-version": "2026-10-21" } : {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "The API key was rejected." : "Could not load models from this provider.");
  const parsed = modelResponse.safeParse(await response.json());
  if (!parsed.success) throw new Error("The provider returned an invalid model list.");
  return parsed.data.data.map((model) => model.id).filter((id) => isTextModel(provider, id)).sort();
}
