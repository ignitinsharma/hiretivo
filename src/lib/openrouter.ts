import OpenAI from 'openai';

export const openrouter = new OpenAI({
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
