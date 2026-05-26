import { describe, expect, it } from "vitest";

import {
  CodingProfilesSchema,
  MAX_CODING_PROFILES,
  normalizeCodingProfiles,
} from "./coding-profiles";

describe("coding profile validation", () => {
  it("accepts up to five HTTPS coding profiles with optional evidence", () => {
    const result = CodingProfilesSchema.safeParse([
      {
        platform: "LeetCode",
        profileUrl: "https://leetcode.com/u/example",
        handle: "example",
        evidenceSummary: "Knight, 450 solved",
      },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects non-HTTPS profile URLs", () => {
    const result = CodingProfilesSchema.safeParse([
      {
        platform: "Codeforces",
        profileUrl: "http://codeforces.com/profile/example",
      },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects more than the maximum profile count", () => {
    const profiles = Array.from({ length: MAX_CODING_PROFILES + 1 }, (_, index) => ({
      platform: `Platform ${index}`,
      profileUrl: `https://example.com/${index}`,
    }));

    expect(CodingProfilesSchema.safeParse(profiles).success).toBe(false);
  });

  it("normalizes unknown JSON into safe coding profile entries", () => {
    expect(
      normalizeCodingProfiles([
        {
          platform: " LeetCode ",
          profileUrl: "https://leetcode.com/u/example",
          handle: "",
          evidenceSummary: " 250 solved ",
        },
        { platform: "", profileUrl: "not-a-url" },
      ]),
    ).toEqual([
      {
        platform: "LeetCode",
        profileUrl: "https://leetcode.com/u/example",
        handle: null,
        evidenceSummary: "250 solved",
      },
    ]);
  });
});
