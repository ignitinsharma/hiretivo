import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveJobCompany,
  type JobCompanyInput,
} from "../resolve-job-company";

/*
 * Fixtures for common test inputs.
 */

const RECRUITER_PROFILE = {
  id: "profile-1",
  companyName: "Acme Corp",
  logo: "acme-logo.png",
  companySize: "51-200",
  industry: "TECHNOLOGY",
  fundingType: "SERIES_A",
} as const;

function makeJob(overrides: Partial<JobCompanyInput> = {}): JobCompanyInput {
  return {
    companyName: null,
    companyLogoUrl: null,
    companySize: null,
    companyIndustry: null,
    companyFunding: null,
    recruiter: {
      recruiterProfile: RECRUITER_PROFILE,
    },
    ...overrides,
  };
}

describe("resolveJobCompany", () => {
  describe("admin override path", () => {
    it("uses admin companyName and sets companyId to null", () => {
      const job = makeJob({ companyName: "Admin Co" });
      const result = resolveJobCompany(job);
      assert.equal(result.companyName, "Admin Co");
      assert.equal(result.companyId, null);
    });

    it("uses admin companyLogoUrl and sets rawRecruiterLogo to null", () => {
      const job = makeJob({
        companyName: "Admin Co",
        companyLogoUrl: "https://cdn.example.com/logo.png",
      });
      const result = resolveJobCompany(job);
      assert.equal(result.companyLogoUrl, "https://cdn.example.com/logo.png");
      assert.equal(result.rawRecruiterLogo, null);
    });

    it("uses admin companySize, companyIndustry, companyFunding overrides", () => {
      const job = makeJob({
        companyName: "Admin Co",
        companySize: "201-500",
        companyIndustry: "FINANCE",
        companyFunding: "SERIES_B",
      });
      const result = resolveJobCompany(job);
      assert.equal(result.companySize, "201-500");
      assert.equal(result.companyIndustry, "FINANCE");
      assert.equal(result.companyFundingType, "SERIES_B");
    });
  });

  describe("recruiter profile fallback path", () => {
    it("uses recruiter profile companyName and sets companyId from profile", () => {
      const job = makeJob(); // no admin overrides
      const result = resolveJobCompany(job);
      assert.equal(result.companyName, "Acme Corp");
      assert.equal(result.companyId, "profile-1");
    });

    it("sets rawRecruiterLogo from recruiter profile when no admin logo URL", () => {
      const job = makeJob();
      const result = resolveJobCompany(job);
      assert.equal(result.rawRecruiterLogo, "acme-logo.png");
      assert.equal(result.companyLogoUrl, null);
    });

    it("uses recruiter profile size, industry, and fundingType", () => {
      const job = makeJob();
      const result = resolveJobCompany(job);
      assert.equal(result.companySize, "51-200");
      assert.equal(result.companyIndustry, "TECHNOLOGY");
      assert.equal(result.companyFundingType, "SERIES_A");
    });
  });

  describe("unknown fallback", () => {
    it("returns 'Unknown' when both admin companyName and recruiter profile are null", () => {
      const job: JobCompanyInput = {
        companyName: null,
        companyLogoUrl: null,
        companySize: null,
        companyIndustry: null,
        companyFunding: null,
        recruiter: { recruiterProfile: null },
      };
      const result = resolveJobCompany(job);
      assert.equal(result.companyName, "Unknown");
      assert.equal(result.companyId, null);
    });

    it("returns null for all optional fields when both admin and profile are null", () => {
      const job: JobCompanyInput = {
        companyName: null,
        companyLogoUrl: null,
        companySize: null,
        companyIndustry: null,
        companyFunding: null,
        recruiter: { recruiterProfile: null },
      };
      const result = resolveJobCompany(job);
      assert.equal(result.companyLogoUrl, null);
      assert.equal(result.rawRecruiterLogo, null);
      assert.equal(result.companySize, null);
      assert.equal(result.companyIndustry, null);
      assert.equal(result.companyFundingType, null);
    });
  });

  describe("recruiter logo fallback path", () => {
    it("provides rawRecruiterLogo and null companyLogoUrl when no admin URL", () => {
      const job = makeJob({ companyLogoUrl: null });
      const result = resolveJobCompany(job);
      assert.equal(result.rawRecruiterLogo, "acme-logo.png");
      assert.equal(result.companyLogoUrl, null);
    });

    it("provides null rawRecruiterLogo when recruiter profile logo is null", () => {
      const job = makeJob({
        recruiter: {
          recruiterProfile: { ...RECRUITER_PROFILE, logo: null },
        },
      });
      const result = resolveJobCompany(job);
      assert.equal(result.rawRecruiterLogo, null);
      assert.equal(result.companyLogoUrl, null);
    });

    it("admin logo URL takes full precedence over recruiter logo", () => {
      const job = makeJob({
        companyName: "Admin Co",
        companyLogoUrl: "https://cdn.example.com/admin-logo.png",
      });
      const result = resolveJobCompany(job);
      assert.equal(result.companyLogoUrl, "https://cdn.example.com/admin-logo.png");
      assert.equal(result.rawRecruiterLogo, null);
    });
  });

  describe("mixed admin and profile fields", () => {
    it("admin size overrides recruiter profile size", () => {
      const job = makeJob({
        companyName: "Admin Co",
        companySize: "500+",
      });
      const result = resolveJobCompany(job);
      assert.equal(result.companySize, "500+");
    });

    it("falls back to recruiter profile size when admin size is null", () => {
      const job = makeJob({
        companyName: "Admin Co",
        companySize: null,
      });
      const result = resolveJobCompany(job);
      assert.equal(result.companySize, "51-200");
    });
  });
});
