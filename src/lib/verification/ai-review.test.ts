import { describe, expect, it } from "vitest";

import { buildVerificationAiEvidenceSnapshot } from "./ai-review";

describe("verification AI evidence snapshot", () => {
  it("builds a sanitized profile evidence snapshot with coding profiles", () => {
    const snapshot = buildVerificationAiEvidenceSnapshot(
      {
        id: "user-1",
        name: "Nitin Sharma",
        email: "nitin@example.com",
        timezone: "Asia/Kolkata",
        timezoneOverlapHours: 5,
        availableFrom: new Date("2026-06-01T00:00:00.000Z"),
        seekerProfile: {
          headline: "Frontend Engineer",
          bio: "Builds React and TypeScript products with practical production experience.",
          primaryRole: "Frontend Developer",
          location: "India",
          yearsExperience: 4,
          availability: "Immediately",
          githubUsername: "nitin",
          githubUrl: "https://github.com/nitin",
          videoIntroUrl: "https://example.com/video",
          salaryMinUsd: 60000,
          salaryMaxUsd: 90000,
          topProjects: [
            {
              name: "Hiring Dashboard",
              description: "Built a dashboard for recruiters.",
              sourceUrl: "https://github.com/nitin/hiring-dashboard",
            },
          ],
          codingProfiles: [
            {
              platform: "LeetCode",
              profileUrl: "https://leetcode.com/u/nitin",
              handle: "nitin",
              evidenceSummary: "300 solved",
            },
          ],
          skills: [{ skill: { name: "React" } }, { skill: { name: "TypeScript" } }],
          workExperiences: [
            {
              company: "Acme",
              title: "Frontend Engineer",
              startDate: "01/2022",
              endDate: null,
              isCurrent: true,
              description: "Owned frontend architecture.",
              skills: ["React", "TypeScript"],
            },
          ],
        },
      },
      {
        username: "nitin",
        profileUrl: "https://github.com/nitin",
        status: "ok",
        repos: 10,
        languages: ["TypeScript"],
        lastCommit: "2026-05-01T00:00:00Z",
        starCount: 12,
      },
    );

    expect(snapshot.profile.name).toBe("Nitin Sharma");
    expect(snapshot.profile.hasVideoIntro).toBe(true);
    expect(snapshot.skills).toEqual(["React", "TypeScript"]);
    expect(snapshot.projects[0]?.sourceUrl).toBe(
      "https://github.com/nitin/hiring-dashboard",
    );
    expect(snapshot.github.repos).toBe(10);
    expect(snapshot.codingProfiles).toEqual([
      {
        platform: "LeetCode",
        profileUrl: "https://leetcode.com/u/nitin",
        handle: "nitin",
        evidenceSummary: "300 solved",
      },
    ]);
  });
});
