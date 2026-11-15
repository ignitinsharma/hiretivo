import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ origin: "https://hiretivo.com", set: vi.fn(), revoke: vi.fn(), read: vi.fn(), create: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.set, get: () => ({ value: "hst_test" }), delete: vi.fn() }), headers: async () => new Headers() }));
vi.mock("@/lib/env", () => ({ env: { HIRETIVO_SECRET: "x".repeat(32), get HIRETIVO_PUBLIC_URL() { return mocks.origin; } } }));
vi.mock("./session", () => ({ createHostedSession: mocks.create, readHostedSession: mocks.read, revokeHostedSession: mocks.revoke }));
import { endSession, getSession, startHostedSession, startSession } from "../session";
beforeEach(() => {
  mocks.origin = "https://hiretivo.com";
  vi.resetAllMocks(); vi.stubEnv("HIRETIVO_DEPLOYMENT_MODE", "hosted"); mocks.create.mockResolvedValue("hst_token");
});
afterEach(() => vi.unstubAllEnvs());
describe("hosted session cookies", () => {
  it("always sets a secure cookie, regardless of an untrusted forwarded-proto header", async () => {
    await startHostedSession("owner", true, "hash");
    expect(mocks.set).toHaveBeenCalledWith("hiretivo_session", "hst_token", expect.objectContaining({ httpOnly: true, sameSite: "lax", secure: true, maxAge: 30 * 24 * 60 * 60 }));
  });
  it("permits a non-secure cookie only for development loopback", async () => {
    mocks.origin = "http://localhost:3000";
    vi.stubEnv("NODE_ENV", "development");
    await startHostedSession("owner", false, "hash");
    expect(mocks.set).toHaveBeenLastCalledWith("hiretivo_session", "hst_token", expect.objectContaining({ secure: false, httpOnly: true }));
    vi.stubEnv("NODE_ENV", "production");
    await startHostedSession("owner", false, "hash");
    expect(mocks.set).toHaveBeenLastCalledWith("hiretivo_session", "hst_token", expect.objectContaining({ secure: true }));
  });
  it("does not permit the ENV password session flow in hosted mode", async () => {
    await expect(startSession({ persistent: false })).rejects.toThrow("ENV login is disabled");
  });
  it("reads and revokes hosted sessions through the shared identity store", async () => {
    mocks.read.mockResolvedValue({ userId: "owner" });
    expect(await getSession()).toMatchObject({ userId: "owner" });
    await endSession();
    expect(mocks.revoke).toHaveBeenCalledWith("hst_test");
  });
});
