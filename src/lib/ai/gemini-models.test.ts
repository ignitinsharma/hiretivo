import { describe, expect, it } from "vitest";

import { GEMINI_FALLBACK_MODELS, geminiModelName, geminiModelNames, geminiModelOptions, isGeminiFreeTierModel, isGeminiTextModel } from "./gemini-models";

describe("Gemini's model catalog", () => {
  it("takes the models/ prefix off, idempotently", () => {
    expect(geminiModelName("models/gemini-3.8-flash")).toBe("gemini-3.8-flash");
    expect(geminiModelName("gemini-3.8-flash")).toBe("gemini-3.8-flash");
  });

  it("knows text models from media and embedding ones", () => {
    expect(isGeminiTextModel("gemini-3.8-flash")).toBe(true);
    expect(isGeminiTextModel("gemini-3.1-pro")).toBe(true);
    expect(isGeminiTextModel("text-embedding-004")).toBe(false);
    expect(isGeminiTextModel("imagen-4")).toBe(false);
    expect(isGeminiTextModel("veo-3")).toBe(false);
    expect(isGeminiTextModel("gemini-3.8-flash-image")).toBe(false);
  });

  it("marks Flash as the free tier, not Pro", () => {
    expect(isGeminiFreeTierModel("gemini-3.8-flash")).toBe(true);
    expect(isGeminiFreeTierModel("models/gemini-3.5-flash-lite")).toBe(true);
    expect(isGeminiFreeTierModel("gemini-3.1-pro")).toBe(false);
    expect(isGeminiFreeTierModel("gemini-3.8-flash-image")).toBe(false);
  });

  it("offers the text models, free first, deduplicated and without the prefix", () => {
    const options = geminiModelOptions(["gemini-3.1-pro", "models/gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "imagen-4"]);
    expect(options).toEqual([
      { id: "gemini-3.5-flash-lite", freeTier: true },
      { id: "gemini-3.8-flash", freeTier: true },
      { id: "gemini-3.1-pro", freeTier: false },
    ]);
    expect(geminiModelNames(options.map((option) => option.id))).toEqual(["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.1-pro"]);
  });

  it("ships a fallback list of free-tier models", () => {
    expect(GEMINI_FALLBACK_MODELS.length).toBeGreaterThanOrEqual(1);
    for (const model of GEMINI_FALLBACK_MODELS) expect(isGeminiFreeTierModel(model)).toBe(true);
  });
});
