import OpenAI from 'openai';
import { AIProvider } from '@prisma/client';
import { SELF_HOSTED } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { decryptProviderSecret } from '@/lib/ai/provider-secret';

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
 * GPT 5.6 Luna = primary model for generation (tailoring, cover letters, JD extraction)
 * and low-stakes tasks (skill extraction, resume text parse). Fast + cheap + clean JSON.
 * Override with env vars for dev/testing.
 */
const MODEL_DEFAULTS = {
  primary: 'openai/gpt-5.6-luna',
  lite: 'openai/gpt-5.6-luna',
} as const;

export function getAIModel(): string {
  return process.env.AI_MODEL ?? MODEL_DEFAULTS.primary;
}

export function getLiteAIModel(): string {
  return process.env.AI_LITE_MODEL ?? MODEL_DEFAULTS.lite;
}

/*
 * RESUME_MODEL — model for resume generation tasks (tailoring, cover letters, rewrites).
 * Defaults to GPT 5.6 Luna (fast, cheap, clean JSON — fits the 60s Vercel ceiling).
 * Override via RESUME_MODEL env var. This is the only knob for tailoring.
 */
export function getResumeModel(): string {
  const model = process.env.RESUME_MODEL?.trim();
  return model || 'openai/gpt-5.6-luna';
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

export type AITask = 'resume' | 'parse' | 'lite' | 'jd';

export class ModelNotConfiguredError extends Error {
  constructor() { super('Choose an AI model in Settings before using this feature.'); }
}

/* Resolve a model for one user and task without sharing their credential globally. */
export async function getUserAIContext(userId: string, task: AITask): Promise<{ client: OpenAI; model: string; supportsFile: boolean }> {
  if (!SELF_HOSTED) {
    const model = task === 'resume' ? getResumeModel() : task === 'parse' ? getResumeParseModel()
      : task === 'lite' ? getLiteAIModel() : getJDParseModel();
    return { client: openrouter, model, supportsFile: true };
  }
  const settings = await prisma.aISettings.findUnique({ where: { userId } });
  if (!settings?.encryptedApiKey || settings.provider !== AIProvider.OPENROUTER) throw new ModelNotConfiguredError();
  const client = new OpenAI({
    apiKey: decryptProviderSecret(settings.encryptedApiKey),
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'HTTP-Referer': 'https://hiretivo.com', 'X-Title': 'Hiretivo' },
  });
  return { client, model: settings.model, supportsFile: settings.supportsFile };
}
