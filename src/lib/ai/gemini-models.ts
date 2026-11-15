// Gemini's catalog, without the server-only bits so the model select can use
// it too. Google has no free-tier flag in its API: a Flash model is on the
// free tier, a Pro model isn't (Gemini API pricing, 2026). The note in
// Settings → AI provider tells people what the free tier means for their data.

/** The free-tier models Hiretivo offers before a key is saved, best first. */
export const GEMINI_FALLBACK_MODELS: readonly string[] = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];

/** Ids the API may return for models that aren't chat models. */
const NOT_TEXT = /embedding|aqa|imagen|image|veo|tts|audio|live|robotics|computer-use|learnlm/i;

/** Gemini ids come as `models/gemini-3.8-flash`; nothing else needs the prefix. */
export function geminiModelName(id: string): string {
  return id.replace(/^models\//, "");
}

/** Whether a model writes text, which is all the model select should offer. */
export function isGeminiTextModel(id: string): boolean {
  return id.startsWith("gemini-") && !NOT_TEXT.test(id);
}

/** Whether Google's free tier covers a model: its Flash models, not Pro or the media ones. */
export function isGeminiFreeTierModel(id: string): boolean {
  const name = geminiModelName(id);
  if (!isGeminiTextModel(name)) return false;
  return /flash/.test(name) && !/pro/.test(name);
}

export type GeminiModelOption = { id: string; freeTier: boolean };

/** The text models to offer, free-tier ones first and labelled, then the rest by name. */
export function geminiModelOptions(ids: readonly string[]): GeminiModelOption[] {
  const options = new Map<string, GeminiModelOption>();
  for (const raw of ids) {
    const id = geminiModelName(raw);
    if (!isGeminiTextModel(id)) continue;
    options.set(id, { id, freeTier: isGeminiFreeTierModel(id) });
  }
  return [...options.values()].sort((a, b) => Number(b.freeTier) - Number(a.freeTier) || a.id.localeCompare(b.id));
}

/** The same order as `geminiModelOptions`, for the setup guide's model picker. */
export function geminiModelNames(ids: readonly string[]): string[] {
  return geminiModelOptions(ids).map((option) => option.id);
}
