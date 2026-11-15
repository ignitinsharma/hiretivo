import { AiProvider } from "@/generated/prisma/enums";
import { deploymentMode } from "@/lib/deployment-mode";

import { AiError } from "./errors";
import { PROVIDER_OPTIONS } from "./provider-options";

/** Hosted requests only reach these provider-owned endpoints. */
export const HOSTED_AI_ENDPOINTS: Partial<Record<AiProvider, string>> = {
  OPENAI: "https://api.openai.com/v1",
  ANTHROPIC: "https://api.anthropic.com",
  MISTRAL: "https://api.mistral.ai/v1",
  GEMINI: "https://generativelanguage.googleapis.com/v1beta/openai",
  GROQ: "https://api.groq.com/openai/v1",
  OPENROUTER: "https://openrouter.ai/api/v1",
};

export function hostedAiProblem(provider: AiProvider, baseUrl: string): string | null {
  const endpoint = HOSTED_AI_ENDPOINTS[provider];
  if (!endpoint) return "Local AI models are available when you self-host Hiretivo. Choose a cloud provider here, or see Pricing for local setup instructions.";
  if (baseUrl && baseUrl.replace(/\/+$/, "") !== endpoint) return "Hosted Hiretivo uses each provider's official server address. Custom AI endpoints are available when you self-host.";
  return null;
}

export function assertHostedAiAllowed(provider: AiProvider, baseUrl: string): void {
  if (deploymentMode() !== "hosted") return;
  const problem = hostedAiProblem(provider, baseUrl);
  if (problem) throw AiError.config(problem);
}

export function availableProviderOptions(hosted: boolean) {
  if (!hosted) return PROVIDER_OPTIONS;
  return PROVIDER_OPTIONS.filter((option) => HOSTED_AI_ENDPOINTS[option.value]).map((option) => option.value === AiProvider.OPENAI
    ? { ...option, name: "OpenAI", vendor: "OpenAI", description: "OpenAI models through your own API key.", tag: "Hosted · pay per use", defaultUrl: HOSTED_AI_ENDPOINTS.OPENAI! }
    : option);
}
