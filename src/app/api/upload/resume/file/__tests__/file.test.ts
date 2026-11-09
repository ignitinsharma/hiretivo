import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

let userId: string | null = "owner";
let storedKey = "resumes/owner/resume.pdf";
let reads = 0;

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  mock.module("@/auth", { namedExports: { auth: async () => userId ? { user: { id: userId, role: "SEEKER" } } : null } });
  mock.module("@/lib/rate-limit", { namedExports: { dataFetchRateLimiter: { limit: async () => ({ success: true }) } } });
  mock.module("@/lib/prisma", { namedExports: { prisma: { seekerProfile: { findUnique: async () => ({ resumeKey: storedKey }) } } } });
  mock.module("@/lib/storage/local-files", { namedExports: { readLocalFile: async () => { reads++; return Buffer.from("%PDF-1.7 private"); } } });
});

after(() => {
  delete process.env.NEXT_PUBLIC_SELF_HOSTED;
  mock.restoreAll();
});

it("serves only the signed-in owner's resume without a public cache", async () => {
  const { GET } = await import("../route");
  const own = await GET();
  assert.equal(own.status, 200);
  assert.equal(own.headers.get("Cache-Control"), "private, no-store");
  assert.equal(reads, 1);

  storedKey = "resumes/someone-else/resume.pdf";
  assert.equal((await GET()).status, 404);
  assert.equal(reads, 1);

  userId = null;
  assert.equal((await GET()).status, 401);
  assert.equal(reads, 1);
});
