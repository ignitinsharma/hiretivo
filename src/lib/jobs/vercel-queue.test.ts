import { beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@vercel/queue", () => ({ send }));
vi.mock("@/lib/env", () => ({ env: { HIRETIVO_SECRET: "test-secret-for-vercel-queue-signatures" } }));

import { publishQueuedJob, readQueuedJob } from "./vercel-queue";

const job = {
  owner: "de305d54-75b4-431b-adb2-eb6b9e546014",
  id: "cmiz3sr350000gmxp4hy78o1a",
  attempt: "2026-11-23T16:00:00.000Z",
};

describe("Vercel job messages", () => {
  beforeEach(() => send.mockClear());

  it("signs the account, job and attempt and deduplicates publish retries", async () => {
    await publishQueuedJob(job);
    await publishQueuedJob(job);
    expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
    expect(readQueuedJob(send.mock.calls[0][1])).toMatchObject(job);
  });

  it("rejects a signed message whose account or attempt was changed", async () => {
    await publishQueuedJob(job);
    const original = send.mock.calls[0][1];
    expect(() => readQueuedJob({ ...original, owner: "9c225637-a7f3-4be2-89ee-47a75b8a8399" })).toThrow("signature");
    expect(() => readQueuedJob({ ...original, attempt: "2026-11-23T17:00:00.000Z" })).toThrow("signature");
  });
});
