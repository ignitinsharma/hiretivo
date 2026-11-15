import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(), userByEmail: vi.fn(), takeAuthAttempt: vi.fn(), consumeEmailToken: vi.fn(),
  sendAccountEmail: vi.fn(), provisionTenant: vi.fn(), startHostedSession: vi.fn(),
  hashPassword: vi.fn(), verifyPassword: vi.fn(), query: vi.fn(), mode: "hosted",
}));
vi.mock("@/lib/deployment-mode", () => ({ deploymentMode: () => mocks.mode }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw Object.assign(new Error(path), { redirect: true }); },
  unstable_rethrow: (error: unknown) => { if (error && typeof error === "object" && "redirect" in error) throw error; },
}));
vi.mock("@/lib/log", () => ({ logServerError: vi.fn() }));
vi.mock("@/lib/tenancy/provision", () => ({ provisionTenant: mocks.provisionTenant }));
vi.mock("../session", () => ({ startHostedSession: mocks.startHostedSession }));
vi.mock("../password-hash", () => ({ hashPassword: mocks.hashPassword, verifyPassword: mocks.verifyPassword }));
vi.mock("./mail", () => ({ sendAccountEmail: mocks.sendAccountEmail }));
vi.mock("./store", () => ({
  createUser: mocks.createUser, userByEmail: mocks.userByEmail, takeAuthAttempt: mocks.takeAuthAttempt,
  consumeEmailToken: mocks.consumeEmailToken, normalizeEmail: (s: string) => s.trim().toLowerCase(),
}));
import { hostedSignIn, signup, verifyEmail, resetPassword, requestPasswordReset, resendVerification } from "./actions";
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };
const user = { id: "123", email: "person@example.com", passwordHash: "hashed", verifiedAt: new Date() };
beforeEach(() => {
  vi.resetAllMocks(); mocks.mode = "hosted";
  mocks.takeAuthAttempt.mockResolvedValue(true);
  mocks.hashPassword.mockResolvedValue("hashed"); mocks.verifyPassword.mockResolvedValue(true);
  mocks.userByEmail.mockResolvedValue(user); mocks.createUser.mockResolvedValue(user);
});
describe("hosted account flows", () => {
  it("creates an unverified account and waits for email verification before issuing a session", async () => {
    await expect(signup(null, form({ email: user.email, password: "correct horse battery", confirmPassword: "correct horse battery" }))).rejects.toThrow("/verify-email-pending");
    expect(mocks.sendAccountEmail).toHaveBeenCalledWith(user.id, user.email, "verify");
    expect(mocks.startHostedSession).not.toHaveBeenCalled();
  });
  it("keeps failed email delivery recoverable without claiming the email was sent", async () => {
    mocks.sendAccountEmail.mockRejectedValueOnce(new Error("mail failed"));
    expect(await signup(null, form({ email: user.email, password: "correct horse battery", confirmPassword: "correct horse battery" }))).toMatchObject({ error: expect.stringContaining("account was created") });
  });
  it("does not sign in an unverified account even with the correct password", async () => {
    mocks.userByEmail.mockResolvedValueOnce({ ...user, verifiedAt: null });
    expect(await hostedSignIn(null, form({ email: user.email, password: "correct horse battery" }))).toMatchObject({ verificationRequired: true });
    expect(mocks.sendAccountEmail).not.toHaveBeenCalled();
    expect(mocks.startHostedSession).not.toHaveBeenCalled();
  });
  it("sends verified users to the dashboard and rejects off-site next redirects", async () => {
    await expect(hostedSignIn(null, form({ email: user.email, password: "correct horse battery", next: "https://evil.example", remember: "on" }))).rejects.toThrow("/dashboard");
    expect(mocks.startHostedSession).toHaveBeenCalledWith(user.id, true, user.passwordHash);
  });
  it("stops credential checks when throttled or in self-hosted mode", async () => {
    mocks.takeAuthAttempt.mockResolvedValueOnce(false);
    expect(await hostedSignIn(null, form({ email: user.email, password: "secret" }))).toMatchObject({ error: expect.stringContaining("Too many attempts") });
    expect(mocks.userByEmail).not.toHaveBeenCalled();
    mocks.mode = "self-hosted";
    expect(await signup(null, form({}))).toHaveProperty("error");
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it("keeps failed workspace setup retryable without marking the email verified", async () => {
    mocks.consumeEmailToken.mockImplementation(async (_token, _purpose, apply) => apply({ query: mocks.query }, user.id));
    mocks.provisionTenant.mockRejectedValueOnce(new Error("connection rejected"));
    expect(await verifyEmail(null, form({ token: "a".repeat(43) }))).toMatchObject({ error: expect.stringContaining("Try this verification link again") });
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("provisions private data before marking the email verified", async () => {
    mocks.consumeEmailToken.mockImplementation(async (_token, _purpose, use) => use({ query: mocks.query }, user.id));
    const result = await verifyEmail(null, form({ token: "a".repeat(43) }));
    expect(result).toHaveProperty("message");
    expect(mocks.provisionTenant).toHaveBeenCalledWith(user.id);
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('"verifiedAt"'), [user.id]);
    expect(mocks.provisionTenant.mock.invocationCallOrder[0]).toBeLessThan(mocks.query.mock.invocationCallOrder[0]);
  });
  it("rejects expired or replayed email tokens", async () => {
    mocks.consumeEmailToken.mockResolvedValueOnce(undefined);
    expect(await verifyEmail(null, form({ token: "a".repeat(43) }))).toMatchObject({ error: expect.stringContaining("expired") });
    expect(mocks.provisionTenant).not.toHaveBeenCalled();
  });
  it("resets the password and revokes all sessions inside the token transaction", async () => {
    mocks.consumeEmailToken.mockImplementation(async (_token, _purpose, use) => use({ query: mocks.query }, user.id));
    expect(await resetPassword(null, form({ token: "a".repeat(43), password: "new correct horse", confirmPassword: "new correct horse" }))).toHaveProperty("message");
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('"passwordHash"'), ["hashed", user.id]);
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM public."HostedSession"'), [user.id]);
  });
  it("uses generic reset and resend responses for unknown accounts", async () => {
    mocks.userByEmail.mockResolvedValue(undefined);
    expect(await requestPasswordReset(null, form({ email: "unknown@example.com" }))).toHaveProperty("message");
    expect(await resendVerification(null, form({ email: "unknown@example.com" }))).toHaveProperty("message");
    expect(mocks.sendAccountEmail).not.toHaveBeenCalled();
  });
});
