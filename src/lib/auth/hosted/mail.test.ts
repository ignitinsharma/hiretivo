import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ origin: "https://hiretivo.com", createEmailToken: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { get HIRETIVO_PUBLIC_URL() { return mocks.origin; }, RESEND_API_KEY: "test-resend-secret", RESEND_FROM_EMAIL: "Hiretivo <noreply@hiretivo.com>" } }));
vi.mock("./store", () => ({ createEmailToken: mocks.createEmailToken }));
import { sendAccountEmail } from "./mail";
beforeEach(() => {
  mocks.origin = "https://hiretivo.com";
  vi.resetAllMocks(); vi.stubGlobal("fetch", mocks.fetch);
  mocks.createEmailToken.mockResolvedValue("safe-token");
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: "message-id" }) });
});
afterEach(() => vi.unstubAllGlobals());
describe("account email delivery", () => {
  it("sends a hosted verification link through Resend without putting credentials in the message", async () => {
    await sendAccountEmail("owner", "person@example.test", "verify");
    expect(mocks.createEmailToken).toHaveBeenCalledWith("owner", "verify");
    const [url, request] = mocks.fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request.headers.Authorization).toBe("Bearer test-resend-secret");
    const body = JSON.parse(request.body);
    expect(body.to).toBe("person@example.test");
    expect(body.text).toContain("https://hiretivo.com/verify-email?token=safe-token");
    expect(body.text).toContain("24 hours");
    expect(request.body).not.toContain("test-resend-secret");
  });
  it("uses the reset route and thirty-minute expiry for password recovery", async () => {
    await sendAccountEmail("owner", "person@example.test", "reset");
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).text).toContain("https://hiretivo.com/reset-password?token=safe-token");
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).text).toContain("30 minutes");
  });
  it("uses the configured localhost origin for both local email flows", async () => {
    mocks.origin = "http://localhost:3000";
    await sendAccountEmail("owner", "person@example.test", "verify");
    await sendAccountEmail("owner", "person@example.test", "reset");
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).text).toContain("http://localhost:3000/verify-email?token=safe-token");
    expect(JSON.parse(mocks.fetch.mock.calls[1][1].body).text).toContain("http://localhost:3000/reset-password?token=safe-token");
  });
  it("reports delivery failures instead of claiming success", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: false });
    await expect(sendAccountEmail("owner", "person@example.test", "verify")).rejects.toThrow("could not be delivered");
    mocks.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: null }) });
    await expect(sendAccountEmail("owner", "person@example.test", "verify")).rejects.toThrow("message ID");
  });
});
