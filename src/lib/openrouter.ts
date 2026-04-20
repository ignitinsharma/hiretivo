import OpenAI from 'openai';

const provider = process.env.AI_PROVIDER ?? 'openrouter';

// Both OpenRouter and Gemini support the OpenAI-compatible API — same SDK, different baseURL + key.
// Switch provider by changing AI_PROVIDER + AI_MODEL + the corresponding API key env var.
// OpenRouter pricing: ~10% markup over base model price (convenience, model variety)
// Gemini direct pricing: Google's price, no markup (generativelanguage.googleapis.com/v1beta/openai/)
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

export function getAIModel(): string {
  return process.env.AI_MODEL ?? 'minimax/minimax-m2.5:free';
}
