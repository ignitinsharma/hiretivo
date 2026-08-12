import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGreenhouseJobReference } from "@/lib/ai/jd-parser";

describe("Greenhouse job URLs", () => {
  it("extracts the board and job ID from a Trustpilot custom domain", () => {
    assert.deepEqual(
      getGreenhouseJobReference(
        "https://corporate.trustpilot.com/careers/job/7984603?gh_jid=7984603",
      ),
      { boardToken: "trustpilot", jobId: "7984603" },
    );
  });

  it("extracts the board and job ID from a standard Greenhouse URL", () => {
    assert.deepEqual(
      getGreenhouseJobReference("https://job-boards.greenhouse.io/trustpilot/jobs/7984603"),
      { boardToken: "trustpilot", jobId: "7984603" },
    );
  });
});
