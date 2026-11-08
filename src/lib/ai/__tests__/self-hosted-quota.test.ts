import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

/* Verifies local generation never needs a hosted subscription or quota row. */
before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  mock.module("@/lib/prisma", {
    namedExports: {
      prisma: {
        user: { findUnique: () => { throw new Error("subscription query"); } },
        generationQuota: {
          findUnique: () => { throw new Error("quota query"); },
          upsert: () => { throw new Error("quota write"); },
        },
      },
    },
  });
});

after(() => {
  delete process.env.NEXT_PUBLIC_SELF_HOSTED;
  mock.restoreAll();
});

it("allows resume and cover letter generation without reading or writing plan records", async () => {
  const { checkGenerationQuota, consumeGenerationQuota, QuotaType } = await import("../generation-quota");
  for (const type of [QuotaType.RESUME, QuotaType.COVER_LETTER]) {
    const quota = await checkGenerationQuota("local-user", type);
    assert.equal(quota.allowed, true);
    await consumeGenerationQuota("local-user", type);
  }
});
