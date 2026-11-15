import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => request.headers }));
vi.mock("@/lib/deployment-mode", () => ({ deploymentMode: () => "hosted" }));
vi.mock("@/lib/env", () => ({ env: { HIRETIVO_SECRET: "a-private-print-test-secret-at-least-32-characters" } }));

import { deriveKey } from "@/lib/keys";
import { CRYPTO_CONTEXT } from "@/lib/crypto-context";
import { withTenant } from "@/lib/tenancy/context";
import { PRINT_TOKEN_HEADER, printRequestOwner, signPrintToken, verifyPrintToken } from "./print-token";

beforeEach(() => { request.headers = new Headers(); });

describe("hosted print-token identity", () => {
  it("binds the signed token to both account and exact print path", async () => {
    const token = await withTenant("alice", () => signPrintToken("/print/base?fit=1"));
    expect(await verifyPrintToken(token, "/print/base?fit=1")).toBe(true);
    expect(await verifyPrintToken(token, "/print/base")).toBe(false);
    request.headers.set(PRINT_TOKEN_HEADER, token);
    // A bearer print token alone cannot become an account session.
    expect(await printRequestOwner()).toBeNull();
    request.headers.set("x-hiretivo-print-verified-path", "/print/base?fit=1");
    expect(await printRequestOwner()).toBe("alice");
    request.headers.set("x-hiretivo-print-verified-path", "/print/resume/somebody-else");
    expect(await printRequestOwner()).toBeNull();
    request.headers.set("x-hiretivo-print-verified-path", "/settings");
    expect(await printRequestOwner()).toBeNull();
  });

  it("rejects tampered and unowned legacy print tokens in hosted mode", async () => {
    const token = await new SignJWT({ path: "/print/base" }).setProtectedHeader({ alg: "HS256" })
      .setAudience(CRYPTO_CONTEXT.print).setExpirationTime("60s").sign(deriveKey("print-token"));
    expect(await verifyPrintToken(token, "/print/base")).toBe(false);
    request.headers.set(PRINT_TOKEN_HEADER, `${token}tampered`);
    request.headers.set("x-hiretivo-print-verified-path", "/print/base");
    expect(await printRequestOwner()).toBeNull();
  });
});
