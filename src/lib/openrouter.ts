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
 * DeepSeek V4 Pro = primary model for generation (tailoring, cover letters, JD extraction).
 * Gemini 2.5 Flash-Lite = low-stakes classification (URL confidence, etc.).
 * Override with env vars for dev/testing.
 */
const MODEL_DEFAULTS = {
  primary: 'deepseek/deepseek-v4-pro',
  lite: 'google/gemini-2.5-flash-lite',
} as const;

export function getAIModel(): string {
  return process.env.AI_MODEL ?? MODEL_DEFAULTS.primary;
}

export function getLiteAIModel(): string {
  return process.env.AI_LITE_MODEL ?? MODEL_DEFAULTS.lite;
}

/*
 * RESUME_MODEL — model for resume generation tasks (tailoring, cover letters, rewrites).
 * Defaults to DeepSeek V4 Pro (reasoning model, best for text generation).
 * Override via RESUME_MODEL env var.
 */
export function getResumeModel(): string {
  const model = process.env.RESUME_MODEL?.trim();
  return model || 'deepseek/deepseek-v4-pro';
}

/*
 * RESUME_PARSE_MODEL — model for PDF resume parsing (extracting structured JSON).
 * Defaults to Gemini 2.5 Flash (native file input, no reasoning overhead).
 * Override via RESUME_PARSE_MODEL env var.
 */
export function getResumeParseModel(): string {
  const model = process.env.RESUME_PARSE_MODEL?.trim();
  return model || 'google/gemini-2.5-flash';
}

/*
 * JD_PARSE_MODEL — model for job description extraction from URLs and pasted text.
 * Defaults to Gemini 2.5 Flash (fast, reliable extraction).
 * Override via JD_PARSE_MODEL env var.
 */
export function getJDParseModel(): string {
  const model = process.env.JD_PARSE_MODEL?.trim();
  return model || 'google/gemini-2.5-flash';
}
