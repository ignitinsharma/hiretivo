import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  computeWeightedJobMatch,
  computeBestJobMatchForEngineer,
} from "@/lib/match";
import type { EngineerMatchProfile, JobMatchProfile } from "@/lib/match";

/*
 * Tests for computeWeightedJobMatch — 5-component weighted match formula
 * Weights: skills(50%) + salary(20%) + experience(15%) + timezone(10%) + availability(5%)
 * Null handling: if component inputs are null → skip weight, renormalize remaining to 100%
 */

describe("computeWeightedJobMatch", () => {
  beforeAll(() => {
    // Pin "now" to a known date so availableFrom calculations are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("should compute skills-only score when all other inputs are null/undefined", () => {
    /*
     * engineerSkills: ['ts','react']
     * jobRequiredSkills: ['ts','react','node']
     * skills: 2/3 ≈ 0.667 × 50 = 33.33
     * salary: null (skipped)
     * exp: null (skipped)
     * tz: null (skipped)
     * avail: null → 1.0 × 5 = 5
     * active weight: 55
     * raw = (33.33 + 5) / 55 ≈ 0.697
     * result = Math.round(69.7) = 70
     */
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react"],
      jobRequiredSkills: ["ts", "react", "node"],
    });
    expect(result).toBe(70);
  });

  it("should return 100 when all components are a perfect match", () => {
    /*
     * engineerSkills = jobRequiredSkills → 1.0 × 50 = 50
     * salary ranges overlap → 1.0 × 20 = 20
     * exp: same bucket → 1.0 × 15 = 15
     * tz: engineer(8) >= job(4) → 1.0 × 10 = 10
     * avail: engineerAvailableFrom ≤ now → 1.0 × 5 = 5
     * raw = (50 + 20 + 15 + 10 + 5) / 100 = 1.0
     * result = 100
     */
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react", "node", "python"],
      jobRequiredSkills: ["ts", "react", "node", "python"],
      engineerSalaryMin: 80_000,
      engineerSalaryMax: 120_000,
      jobSalaryMin: 90_000,
      jobSalaryMax: 130_000,
      engineerYearsExp: 4,
      jobYearsExpRequired: 4,
      engineerTimezoneOverlapHours: 8,
      jobTimezoneOverlapHours: 4,
      engineerAvailableFrom: new Date("2024-06-01"),
    });
    expect(result).toBe(100);
  });

  it("should return 0 for salary component when salary ranges do not overlap", () => {
    /*
     * skills: 2/3 ≈ 0.667 × 50
     * salary: no overlap → 0.0 × 20
     * exp: same bucket → 1.0 × 15
     * tz: 8 >= 4 → 1.0 × 10
     * avail: null → 1.0 × 5
     * raw = (33.33 + 0 + 15 + 10 + 5) / 100 = 63.33 / 100 = 0.633
     * result = 63
     */
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react"],
      jobRequiredSkills: ["ts", "react", "node"],
      engineerSalaryMin: 50_000,
      engineerSalaryMax: 70_000,
      jobSalaryMin: 100_000,
      jobSalaryMax: 130_000,
      engineerYearsExp: 4,
      jobYearsExpRequired: 4,
      engineerTimezoneOverlapHours: 8,
      jobTimezoneOverlapHours: 4,
    });
    // Salary score 0.0 should bring the total down noticeably
    expect(result).toBeLessThan(80);
  });

  it("should score 0.5 for timezone when engineer overlap is less than job requirement", () => {
    /*
     * skills: perfect → 1.0 × 50
     * salary: overlap → 1.0 × 20
     * exp: same → 1.0 × 15
     * tz: 4 < 8 → 0.5 × 10 = 5
     * avail: null → 1.0 × 5
     * raw = (50 + 20 + 15 + 5 + 5) / 100 = 95/100 = 0.95
     * result = 95
     */
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react", "node"],
      jobRequiredSkills: ["ts", "react", "node"],
      engineerSalaryMin: 80_000,
      engineerSalaryMax: 120_000,
      jobSalaryMin: 90_000,
      jobSalaryMax: 130_000,
      engineerYearsExp: 4,
      jobYearsExpRequired: 4,
      engineerTimezoneOverlapHours: 4,
      jobTimezoneOverlapHours: 8,
    });
    expect(result).toBe(95);
  });

  it("should treat null availableFrom as immediate availability (1.0)", () => {
    /*
     * avail: null → 1.0 × 5
     */
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react", "node"],
      jobRequiredSkills: ["ts", "react", "node"],
      engineerAvailableFrom: null,
    });
    // avail active at 1.0, so better than if it were skipped
    expect(result).toBeGreaterThanOrEqual(90);
  });

  it("should score 0.8 for availability when availableFrom is 20 days from now", () => {
    /*
     * 20 days from Jan 15 = Feb 4
     * daysUntil = 20 → ≤30 → availScore = 0.8
     * skills: perfect → 1.0 × 50
     * salary: null (skipped)
     * exp: null (skipped)
     * tz: null (skipped)
     * avail: 0.8 × 5 = 4
     * active weight: 55
     * raw = (50 + 4) / 55 = 54/55 = 0.982
     * result = 98
     */
    const future = new Date("2025-02-04T00:00:00Z"); // 20 days from Jan 15
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react", "node"],
      jobRequiredSkills: ["ts", "react", "node"],
      engineerAvailableFrom: future,
    });
    expect(result).toBe(98);
  });

  it("should score 0.6 for availability when availableFrom is 45 days from now", () => {
    /*
     * 45 days from Jan 15 = Mar 1
     * daysUntil = 45 → ≤60 → availScore = 0.6
     * active weight: 55
     * raw = (50 + 0.6*5) / 55 = 53/55 = 0.964
     * result = 96
     */
    const future = new Date("2025-03-01T00:00:00Z"); // 45 days from Jan 15
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react", "node"],
      jobRequiredSkills: ["ts", "react", "node"],
      engineerAvailableFrom: future,
    });
    expect(result).toBe(96);
  });

  it("should score 0.3 for availability when availableFrom is 90 days from now", () => {
    /*
     * 90 days from Jan 15 = Apr 15
     * daysUntil = 90 → >60 → availScore = 0.3
     * active weight: 55
     * raw = (50 + 0.3*5) / 55 = 51.5/55 = 0.936
     * result = 94
     */
    const future = new Date("2025-04-15T00:00:00Z"); // 90 days from Jan 15
    const result = computeWeightedJobMatch({
      engineerSkills: ["ts", "react", "node"],
      jobRequiredSkills: ["ts", "react", "node"],
      engineerAvailableFrom: future,
    });
    expect(result).toBe(94);
  });

  it("should handle all components null/undefined gracefully by returning 0", () => {
    const result = computeWeightedJobMatch({
      engineerSkills: [],
      jobRequiredSkills: [],
    });
    expect(result).toBe(0);
  });
});

describe("computeBestJobMatchForEngineer", () => {
  it("should return null when given an empty jobs array", () => {
    const profile: EngineerMatchProfile = {
      skills: ["ts", "react"],
    };
    const result = computeBestJobMatchForEngineer(profile, []);
    expect(result).toBeNull();
  });

  it("should return the highest-scoring job from 3 candidates", () => {
    /*
     * engineer has all skills → job with most skills matches best
     * job A: 'go' (1/3 match → skills 0.33)
     * job B: 'ts','react','python' (3/3 match → skills 1.0)
     * job C: 'ts','react' (2/3 match → skills 0.67)
     * job B should be the best match
     */
    const profile: EngineerMatchProfile = {
      skills: ["ts", "react", "node"],
    };
    const jobs: JobMatchProfile[] = [
      { id: "job-a", title: "Go Engineer", requiredSkills: ["go"] },
      {
        id: "job-b",
        title: "Full Stack Engineer",
        requiredSkills: ["ts", "react", "python"],
      },
      {
        id: "job-c",
        title: "Frontend Engineer",
        requiredSkills: ["ts", "react"],
      },
    ];

    const result = computeBestJobMatchForEngineer(profile, jobs);
    expect(result).not.toBeNull();
    expect(result!.jobId).toBe("job-b");
    expect(result!.jobTitle).toBe("Full Stack Engineer");
    expect(result!.score).toBeGreaterThanOrEqual(80);
  });

  it("should prefer a job with better salary match over one with worse salary match when skills are equal", () => {
    const profile: EngineerMatchProfile = {
      skills: ["ts", "react"],
      salaryMin: 80_000,
      salaryMax: 120_000,
    };
    const jobs: JobMatchProfile[] = [
      {
        id: "job-a",
        title: "Engineer A",
        requiredSkills: ["ts", "react"],
        salaryMin: 30_000,
        salaryMax: 50_000, // no overlap
      },
      {
        id: "job-b",
        title: "Engineer B",
        requiredSkills: ["ts", "react"],
        salaryMin: 90_000,
        salaryMax: 130_000, // overlap
      },
    ];

    const result = computeBestJobMatchForEngineer(profile, jobs);
    expect(result).not.toBeNull();
    expect(result!.jobId).toBe("job-b");
  });
});
