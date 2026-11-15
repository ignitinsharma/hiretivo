import { describe, expect, it } from "vitest";

import { OPENROUTER_FALLBACK_MODELS, isOpenRouterFreeModel, openRouterModelNames, openRouterModelOptions } from "./openrouter-models";

describe("OpenRouter's model catalogue", () => {
  it("calls a model free from a :free id even when its listed price is odd", () => {
    expect(isOpenRouterFreeModel({ id: "meta-llama/llama-4.1-8b:free" })).toBe(true);
    expect(isOpenRouterFreeModel({ id: "meta-llama/llama-4.1-8b:free", pricing: { prompt: "0.1", completion: "0.1" } })).toBe(true);
  });

  it("calls a model free when both prices are zero", () => {
    expect(isOpenRouterFreeModel({ id: "zeta/free", pricing: { prompt: "0", completion: "0" } })).toBe(true);
    expect(isOpenRouterFreeModel({ id: "paid/model", pricing: { prompt: "0", completion: "0.000002" } })).toBe(false);
    expect(isOpenRouterFreeModel({ id: "paid/model", pricing: { prompt: "0.000001", completion: "0" } })).toBe(false);
    expect(isOpenRouterFreeModel({ id: "unknown/model" })).toBe(false);
    expect(isOpenRouterFreeModel({ id: "unknown/model", pricing: { prompt: null, completion: null } })).toBe(false);
  });

  it("lists chat models with free ones first, labelled and without duplicates", () => {
    const options = openRouterModelOptions([
      { id: "paid/first", pricing: { prompt: "0.1", completion: "0.2" } },
      { id: "zeta/free", pricing: { prompt: "0", completion: "0" } },
      { id: "alpha/free:free", pricing: { prompt: "0.1", completion: "0.2" } },
      { id: "zeta/free", pricing: { prompt: "0", completion: "0" } },
      { id: "some/embedding", pricing: { prompt: "0", completion: "0" } },
      { id: "not-a-model" },
      { id: "paid/second", pricing: { prompt: "0.1", completion: "0.2" } },
    ]);
    expect(options).toEqual([
      { id: "alpha/free:free", freeTier: true },
      { id: "zeta/free", freeTier: true },
      { id: "paid/first", freeTier: false },
      { id: "paid/second", freeTier: false },
    ]);
    expect(options.map(({ id }) => id)).toEqual(["alpha/free:free", "zeta/free", "paid/first", "paid/second"]);
    expect(
      openRouterModelNames([
        { id: "paid/first", pricing: { prompt: "0.1", completion: "0.2" } },
        { id: "alpha/free:free" },
        { id: "zeta/free", pricing: { prompt: "0", completion: "0" } },
      ]),
    ).toEqual(["alpha/free:free", "zeta/free", "paid/first"]);
  });

  it("ships a fallback list that starts with a free model", () => {
    expect(OPENROUTER_FALLBACK_MODELS.length).toBeGreaterThanOrEqual(2);
    expect(OPENROUTER_FALLBACK_MODELS[0]).toMatch(/:free$/);
  });
});
