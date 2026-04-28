import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const LIVE_SOURCES = [
  "src/app/api/recruiter/talent/route.ts",
  "src/app/api/recruiter/talent/[id]/route.ts",
  "src/modules/recruiter/talent/components/TalentPoolClient.tsx",
  "src/modules/recruiter/talent/components/TalentProfileDialog.tsx",
  "src/modules/recruiter/talent/queries/use-fetch-talent.ts",
  "src/modules/recruiter/talent/types/talent.types.ts",
  "prisma/schema.prisma",
];

describe("recruiter talent pool shortlist removal", () => {
  it("does not expose shortlist API, state, or persistence in live talent pool code", () => {
    for (const sourcePath of LIVE_SOURCES) {
      const source = readFileSync(sourcePath, "utf8");

      assert.doesNotMatch(source, /TalentShortlist/);
      assert.doesNotMatch(source, /talentShortlist/);
      assert.doesNotMatch(source, /shortlisted/i);
      assert.doesNotMatch(source, /shortlist/i);
      assert.doesNotMatch(source, /isShortlisted/);
    }

    assert.equal(
      existsSync("src/app/api/recruiter/talent/[id]/shortlist/route.ts"),
      false,
    );
  });
});
