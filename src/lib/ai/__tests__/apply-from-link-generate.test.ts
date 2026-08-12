import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const FROM_LINK = "src/app/api/seeker/apply/from-link/route.ts";
const GENERATE = "src/app/api/applications/[id]/generate/route.ts";
const WORKER = "src/lib/generation/run-application-generation.ts";

const fromLinkSrc = readFileSync(FROM_LINK, "utf8");
const generateSrc = readFileSync(GENERATE, "utf8");
const workerSrc = readFileSync(WORKER, "utf8");

describe("from-link route: don't store garbage JDs", () => {
  it("opts into Vercel's 60s function timeout (staging previously lacked this)", () => {
    assert.match(fromLinkSrc, /export const maxDuration = 60;/);
  });

  it("rejects too-short descriptions before saving (paste-text path)", () => {
    assert.match(fromLinkSrc, /This job description is too short to use\. Paste the full job description\./);
  });

  it("rejects too-short descriptions before saving (URL path)", () => {
    assert.match(fromLinkSrc, /Paste the full job description instead\./);
  });

  it("tells users when an Ashby posting is no longer active", () => {
    assert.match(fromLinkSrc, /isn't publicly listed/);
    assert.match(fromLinkSrc, /isAshbyUrl/);
  });
});

describe("generate route: actionable errors", () => {
  it("returns immediately after queuing generation", () => {
    assert.match(generateSrc, /status: 202/);
    assert.match(generateSrc, /publishGenerationJob/);
  });

  it("returns a specific error for unreadable_jd instead of generic 'please try again'", () => {
    assert.match(workerSrc, /Job description unreadable — edit and paste manually/);
  });
});
