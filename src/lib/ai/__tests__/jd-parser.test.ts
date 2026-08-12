import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { extractJobPostingJsonLd } from "../jd-parser";

const SOURCE = "src/lib/ai/jd-parser.ts";
const src = readFileSync(SOURCE, "utf8");

const LONG_DESC =
  "Build and ship features end to end. " +
  "You will collaborate with design, product, and backend engineers. " +
  "We value ownership, clear communication, and a bias for action. ".repeat(6);

function jsonLdPage(ld: unknown): string {
  return `<html><head><script type="application/ld+json">${JSON.stringify(ld)}</script></head><body><noscript>You need to enable JavaScript to run this app.</noscript></body></html>`;
}

describe("extractJobPostingJsonLd", () => {
  it("extracts title, company, and description from a JobPosting block", () => {
    const job = extractJobPostingJsonLd(
      jsonLdPage({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: "Full Stack Engineer",
        hiringOrganization: { "@type": "Organization", name: "Pogo Technologies, Inc." },
        description: LONG_DESC,
      }),
    );
    assert.equal(job?.title, "Full Stack Engineer");
    assert.equal(job?.company, "Pogo Technologies, Inc.");
    assert.match(job?.description ?? "", /Build and ship features/);
  });

  it("finds JobPosting inside an @graph array", () => {
    const job = extractJobPostingJsonLd(
      jsonLdPage({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebPage", name: "Jobs" },
          { "@type": "JobPosting", title: "Product Designer", description: LONG_DESC },
        ],
      }),
    );
    assert.equal(job?.title, "Product Designer");
  });

  it("returns null when the only JSON-LD type is not JobPosting", () => {
    assert.equal(
      extractJobPostingJsonLd(jsonLdPage({ "@type": "WebPage", name: "Jobs" })),
      null,
    );
  });

  it("returns null when description is too short to be a real JD", () => {
    assert.equal(
      extractJobPostingJsonLd(
        jsonLdPage({ "@type": "JobPosting", title: "X", description: "You need to enable JavaScript." }),
      ),
      null,
    );
  });

  it("returns null for a page with no JSON-LD at all", () => {
    assert.equal(extractJobPostingJsonLd("<html><body>plain</body></html>"), null);
  });

  it("strips tags from HTML descriptions", () => {
    const job = extractJobPostingJsonLd(
      jsonLdPage({
        "@type": "JobPosting",
        title: "T",
        description: `<p>${LONG_DESC}</p>`,
      }),
    );
    assert.match(job?.description ?? "", /Build and ship features/);
  });
});

describe("jd-parser: JS-rendered SPA safety net", () => {
  it("strips <noscript> so the 'enable JavaScript' fallback never reaches the LLM", () => {
    assert.match(src, /"noscript"/);
  });

  it("rejects near-empty extracted text (JS app shells) before the LLM call", () => {
    assert.match(src, /MIN_MEANINGFUL_CHARS/);
    assert.match(src, /js-app-shell or too short/);
  });

  it("caps the JD-parse LLM call at 20s (Vercel Hobby safety)", () => {
    assert.match(src, /\}, \{ timeoutMs: 20_000, maxRetries: 1 \}\);/);
  });
});

describe("jd-parser: Ashby API path (bypasses the SPA scrape)", () => {
  it("detects jobs.ashbyhq.com/{boardToken}/{jobId} URLs", () => {
    assert.match(src, /jobs\.ashbyhq\.com/);
    assert.match(src, /isAshbyUrl/);
  });

  it("calls Ashby's public board posting API, not the auth-gated single-job endpoint", () => {
    assert.match(src, /api\.ashbyhq\.com\/posting-api\/job-board\//);
  });

  it("matches the requested job by id from the board response", () => {
    assert.match(src, /j\.id === jobId/);
  });

  it("prefers descriptionPlain (clean text) over stripping descriptionHtml", () => {
    assert.match(src, /descriptionPlain/);
  });

  it("derives a company name from the board token", () => {
    assert.match(src, /deriveCompanyNameFromBoardToken/);
  });

  it("routes Ashby URLs to the API path inside parseJobFromUrl", () => {
    assert.match(src, /if \(isAshbyUrl\(url\)\)[\s\S]*?parseAshbyJobFromUrl\(url\)/);
  });
});
