import { describe, expect, it } from "vitest";

import { getVerificationReadiness } from "./readiness";

const completeProfile = {
  name: "Asha Sharma",
  image: "avatar-key",
  seekerProfile: {
    bio: "Senior frontend engineer",
    primaryRole: "Frontend Engineer",
    yearsExperience: 5,
    salaryMin: 70000,
    salaryMax: 110000,
    currency: "USD",
    availability: "15_DAYS",
    skills: [{ id: "skill-1" }],
    workExperiences: [{ id: "work-1" }],
    topProjects: [
      {
        name: "Hiring dashboard",
        description: "Built recruiter analytics and pipeline workflows.",
        sourceUrl: "https://github.com/example/hiring-dashboard",
      },
    ],
  },
};

describe("getVerificationReadiness", () => {
  it("marks a complete practical profile ready", () => {
    expect(getVerificationReadiness(completeProfile).isReady).toBe(true);
  });

  it("requires an avatar", () => {
    const readiness = getVerificationReadiness({ ...completeProfile, image: null });
    expect(readiness.isReady).toBe(false);
    expect(readiness.missingFields).toContain("Profile photo");
  });

  it("requires work history", () => {
    const readiness = getVerificationReadiness({
      ...completeProfile,
      seekerProfile: { ...completeProfile.seekerProfile, workExperiences: [] },
    });
    expect(readiness.missingFields).toContain("One work history item");
  });

  it("requires a project with a source or case-study URL", () => {
    const readiness = getVerificationReadiness({
      ...completeProfile,
      seekerProfile: { ...completeProfile.seekerProfile, topProjects: [] },
    });
    expect(readiness.missingFields).toContain("One project with source or case-study URL");
  });

  it("requires bio length between 20 and 150 characters", () => {
    const shortBio = getVerificationReadiness({
      ...completeProfile,
      seekerProfile: { ...completeProfile.seekerProfile, bio: "Too short" },
    });
    const longBio = getVerificationReadiness({
      ...completeProfile,
      seekerProfile: {
        ...completeProfile.seekerProfile,
        bio: "x".repeat(151),
      },
    });

    expect(shortBio.missingFields).toContain("Bio (20-150 characters)");
    expect(longBio.missingFields).toContain("Bio (20-150 characters)");
  });
});
