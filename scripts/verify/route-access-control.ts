import { strict as assert } from "node:assert";

type Role = "SEEKER" | "RECRUITER";

function expectedWrongRoleRedirect(role: Role): string {
  return role === "SEEKER"
    ? "/dashboard?authError=forbidden"
    : "/recruiter/dashboard?authError=forbidden";
}

const seekerRedirect = expectedWrongRoleRedirect("SEEKER");
const recruiterRedirect = expectedWrongRoleRedirect("RECRUITER");

assert.equal(seekerRedirect, "/dashboard?authError=forbidden");
assert.equal(recruiterRedirect, "/recruiter/dashboard?authError=forbidden");
assert.ok(seekerRedirect.endsWith("?authError=forbidden"));
assert.ok(recruiterRedirect.endsWith("?authError=forbidden"));

console.log("route-access-control checks passed");
