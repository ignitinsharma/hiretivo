import OpenAI from 'openai';

const provider = process.env.AI_PROVIDER ?? 'openrouter';

/*
 * Both OpenRouter and Gemini support the OpenAI-compatible API — same SDK, different baseURL + key.
 * Switch provider by changing AI_PROVIDER + AI_MODEL + the corresponding API key env var.
 * OpenRouter pricing: ~10% markup over base model price (convenience, model variety)
 * Gemini direct pricing: Google's price, no markup (generativelanguage.googleapis.com/v1beta/openai/)
 */
export const openrouter = provider === 'gemini'
  ? new OpenAI({
      apiKey: process.env.GEMINI_API_KEY ?? '',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    })
  : new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY ?? '',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://hiretivo.com',
        'X-Title': 'Hiretivo',
      },
    });

/*
 * AI_MODEL config per task type.
 * Gemini 2.5 Flash = primary model for parsing, tailoring, cover-letter generation.
 * Gemini 2.5 Flash-Lite = low-stakes classification (URL confidence, etc.).
 * Override with env vars for dev/testing.
 */
const MODEL_DEFAULTS = {
  primary: 'google/gemini-2.5-flash',
  lite: 'google/gemini-2.5-flash-lite',
} as const;

export function getAIModel(): string {
  return process.env.AI_MODEL ?? MODEL_DEFAULTS.primary;
}

export function getLiteAIModel(): string {
  return process.env.AI_LITE_MODEL ?? MODEL_DEFAULTS.lite;
}
