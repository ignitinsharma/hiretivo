import { describe, expect, it } from "vitest";

import {
  calculateVerificationRubricTotal,
  createRubricFromAiScore,
  VERIFICATION_RUBRIC,
} from "./rubric";

describe("verification rubric", () => {
  it("calculates the 100-point total", () => {
    expect(
      calculateVerificationRubricTotal({
        github: 25,
        projects: 20,
        workHistory: 16,
        profile: 12,
        trust: 7,
      }),
    ).toBe(80);
  });

  it("prefills a manual fallback rubric from AI score", () => {
    const scores = createRubricFromAiScore(80);
    expect(calculateVerificationRubricTotal(scores)).toBe(80);
    expect(scores.github).toBe(24);
    expect(scores.projects).toBe(20);
  });

  it("clamps category values before totaling", () => {
    expect(
      calculateVerificationRubricTotal({
        github: 40,
        projects: 40,
        workHistory: 40,
        profile: 40,
        trust: 40,
      }),
    ).toBe(100);
  });

  it("keeps coding profile evidence inside the existing code evidence bucket", () => {
    expect(VERIFICATION_RUBRIC.map((item) => item.key)).toEqual([
      "github",
      "projects",
      "workHistory",
      "profile",
      "trust",
    ]);
  });
});
