import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";

import { accessToken, disconnectGoogle, googleConnection } from "./account";
import { refreshBridgeToken, revokeBridgeToken } from "./bridge";
import { refreshAccessToken } from "./oauth";

vi.mock("@/lib/prisma", () => ({ prisma: { googleAccount: { findUnique: vi.fn(), deleteMany: vi.fn() } } }));
vi.mock("@/lib/secrets", () => ({ decryptSecret: () => "refresh", encryptSecret: () => "encrypted", GOOGLE_TOKEN: "google", SecretUnreadable: class extends Error {} }));
vi.mock("./bridge", () => ({ bridgeUrl: () => "https://calendar.example", refreshBridgeToken: vi.fn(), revokeBridgeToken: vi.fn() }));
vi.mock("./oauth", () => ({ googleClient: async () => null, hasScopes: (_: string, group: string) => group === "calendar" || group === "list", refreshAccessToken: vi.fn(), revokeToken: vi.fn() }));

beforeEach(() => {
  vi.mocked(prisma.googleAccount.findUnique).mockResolvedValue({ id: "google", email: "jane@example.com", authMode: "bridge", scopes: "calendar", refreshTokenEnc: "encrypted" } as Awaited<ReturnType<typeof prisma.googleAccount.findUnique>>);
  vi.mocked(prisma.googleAccount.deleteMany).mockResolvedValue({ count: 1 });
  vi.mocked(refreshBridgeToken).mockReset().mockResolvedValue({ access_token: "bridge-access", expires_in: 3600, scope: "" });
  vi.mocked(revokeBridgeToken).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(refreshAccessToken).mockReset();
});

describe("bridged Calendar account", () => {
  it("works without a personal client and renews via the bridge", async () => {
    expect(await googleConnection()).toMatchObject({ status: "connected", authMode: "bridge", canUseCalendar: true, canSend: false });
    expect(await accessToken("calendar")).toBe("bridge-access");
    expect(refreshBridgeToken).toHaveBeenCalledWith("refresh", undefined);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("revokes through the bridge and forgets the local account", async () => {
    await disconnectGoogle();
    expect(revokeBridgeToken).toHaveBeenCalledWith("refresh");
    expect(prisma.googleAccount.deleteMany).toHaveBeenCalled();
  });
});
