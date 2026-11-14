import { beforeEach, describe, expect, it, vi } from "vitest";

import { cancel, retry } from "./actions";
import { cancelJob, retryJob } from "./runner";

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }),
}));
const db = vi.hoisted(() => ({ findUnique: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { job: db } }));
vi.mock("./runner", () => ({ retryJob: vi.fn(), cancelJob: vi.fn() }));

beforeEach(() => {
  db.findUnique.mockReset().mockResolvedValue({ type: "extract-posting" });
  db.findFirst.mockReset().mockResolvedValue(null);
  vi.mocked(retryJob).mockReset();
  vi.mocked(cancelJob).mockReset();
});

describe("job actions (E6-7)", () => {
  it("retries a failed job", async () => {
    vi.mocked(retryJob).mockResolvedValue(true);
    expect(await retry({ id: "job-1" })).toEqual({ ok: true, data: null });
    expect(retryJob).toHaveBeenCalledWith("job-1");
  });

  it("says so when there's nothing to retry", async () => {
    vi.mocked(retryJob).mockResolvedValue(false);
    expect(await retry({ id: "job-1" })).toEqual({ ok: false, error: "This can't be retried: it's still running or already done." });
  });

  it("does not retry an automatic application while another is being prepared", async () => {
    db.findUnique.mockResolvedValue({ type: "automatic-application" });
    db.findFirst.mockResolvedValue({ id: "another-job" });
    expect(await retry({ id: "job-1" })).toEqual({ ok: false, error: "Another application is being prepared. Wait for it to finish before retrying." });
    expect(retryJob).not.toHaveBeenCalled();
    expect(db.findFirst).toHaveBeenCalledWith({ where: { type: "automatic-application", status: { in: ["RUNNING", "QUEUED"] }, id: { not: "job-1" } } });
  });

  it("retries an automatic application when no other preparation is active", async () => {
    db.findUnique.mockResolvedValue({ type: "automatic-application" });
    vi.mocked(retryJob).mockResolvedValue(true);
    expect(await retry({ id: "job-1" })).toEqual({ ok: true, data: null });
    expect(retryJob).toHaveBeenCalledWith("job-1");
  });

  it("cancels a job", async () => {
    expect(await cancel({ id: "job-1" })).toEqual({ ok: true, data: null });
    expect(cancelJob).toHaveBeenCalledWith("job-1");
  });
});
