import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSession } from "@/lib/auth/session";
import { loadGoogleAccount, saveGoogleAccount } from "@/lib/google/account";
import { redeemBridgeTicket } from "@/lib/google/bridge";

import { GET as start } from "./connect/route";
import { GET as callback } from "./callback/route";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/google/account", () => ({ loadGoogleAccount: vi.fn(), saveGoogleAccount: vi.fn() }));
vi.mock("@/lib/google/bridge", () => ({ bridgeUrl: () => "https://calendar.example", newVerifier: () => "verifier", verifierChallenge: () => "challenge", redeemBridgeTicket: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { HIRETIVO_PUBLIC_URL: undefined } }));

const origin = "http://localhost:3000";
const request = (path: string, cookie?: string, returnTo?: string) => new NextRequest(`${origin}${path}`, { headers: { host: "localhost:3000", ...(cookie ? { cookie: `hiretivo_calendar_connect=${cookie}${returnTo ? `; hiretivo_calendar_return=${encodeURIComponent(returnTo)}` : ""}` } : {}) } });
const idToken = `h.${Buffer.from(JSON.stringify({ email: "jane@gmail.com" })).toString("base64url")}.s`;
const scope = "openid email https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly";

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ persistent: false, issuedAt: new Date(), expiresAt: new Date() });
  vi.mocked(loadGoogleAccount).mockResolvedValue(null);
  vi.mocked(saveGoogleAccount).mockReset().mockResolvedValue();
  vi.mocked(redeemBridgeTicket).mockReset().mockResolvedValue({ access_token: "access", expires_in: 3600, refresh_token: "refresh", id_token: idToken, scope });
});

describe("Calendar bridge routes", () => {
  it("starts only for signed-in installs without an existing personal connection", async () => {
    const response = await start(request("/api/google/bridge/connect"), undefined);
    const destination = new URL(response.headers.get("location")!);
    expect(destination.origin).toBe("https://calendar.example");
    expect(destination.searchParams.get("callback")).toBe(`${origin}/api/google/bridge/callback`);
    expect(destination.searchParams.get("challenge")).toBe("challenge");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    const welcome = await start(request(`/api/google/bridge/connect?return=${encodeURIComponent("/welcome?step=google")}`), undefined);
    expect(welcome.headers.get("set-cookie")).toContain("hiretivo_calendar_return");
    vi.mocked(loadGoogleAccount).mockResolvedValue({ authMode: "own" } as Awaited<ReturnType<typeof loadGoogleAccount>>);
    expect((await start(request("/api/google/bridge/connect"), undefined)).headers.get("location")).toContain("already-connected");
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await start(request("/api/google/bridge/connect"), undefined)).status).toBe(401);
  });

  it("redeems a ticket only with the local verifier and a session", async () => {
    expect((await callback(request("/api/google/bridge/callback?ticket=ticket"))).headers.get("location")).toContain("expired");
    expect(redeemBridgeTicket).not.toHaveBeenCalled();
    const response = await callback(request("/api/google/bridge/callback?ticket=ticket", "verifier"));
    expect(response.headers.get("location")).toContain("google=connected");
    expect(redeemBridgeTicket).toHaveBeenCalledWith("ticket", "verifier");
    expect(saveGoogleAccount).toHaveBeenCalledWith({ email: "jane@gmail.com", refreshToken: "refresh", scopes: scope, authMode: "bridge" });
    const welcome = await callback(request("/api/google/bridge/callback?ticket=second", "verifier", "/welcome?step=google"));
    expect(welcome.headers.get("location")).toBe(`${origin}/welcome?step=google&google=connected`);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await callback(request("/api/google/bridge/callback?ticket=ticket", "verifier"))).headers.get("location")).toContain("expired");
  });

  it("does not save a grant without all Calendar permissions", async () => {
    vi.mocked(redeemBridgeTicket).mockResolvedValue({ access_token: "access", expires_in: 3600, refresh_token: "refresh", id_token: idToken, scope: "openid email" });
    expect((await callback(request("/api/google/bridge/callback?ticket=ticket", "verifier"))).headers.get("location")).toContain("failed");
    expect(saveGoogleAccount).not.toHaveBeenCalled();
  });
});
