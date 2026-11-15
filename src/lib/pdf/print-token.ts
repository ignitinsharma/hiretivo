import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { headers } from "next/headers";
import { deploymentMode } from "@/lib/deployment-mode";
import { currentTenantId } from "@/lib/tenancy/context";

import { CRYPTO_CONTEXT } from "@/lib/crypto-context";
import { deriveKey } from "@/lib/keys";

// Headless Chromium has no session cookie. It reaches a print page with a
// short-lived token instead, signed with a key derived from HIRETIVO_SECRET
// and bound to that one page, sent in a request header so it never shows up
// in a URL or a log.

export const PRINT_TOKEN_HEADER = CRYPTO_CONTEXT.printTokenHeader;
export const PRINT_TOKEN_LIFETIME_SECONDS = 60;

const AUDIENCE = CRYPTO_CONTEXT.print;

/** A token that opens `path` (e.g. "/print/base") for a minute. */
export async function signPrintToken(path: string, secret?: string): Promise<string> {
  const userId = deploymentMode() === "hosted" ? await currentTenantId() : undefined;
  return new SignJWT({ path, ...(userId ? { userId } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PRINT_TOKEN_LIFETIME_SECONDS}s`)
    .sign(deriveKey("print-token", secret));
}

/** Whether `token` is a valid, unexpired print token for exactly `path`. */
export async function verifyPrintToken(
  token: string | null | undefined,
  path: string,
  { secret, now }: { secret?: string; now?: Date } = {},
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, deriveKey("print-token", secret), {
      audience: AUDIENCE,
      algorithms: ["HS256"],
      currentDate: now,
    });
    return payload.path === path && (deploymentMode() !== "hosted" || typeof payload.userId === "string");
  } catch {
    return false;
  }
}

/** Only the proxy may set this header after checking the exact print URL. */
export async function printRequestOwner(): Promise<string | null> {
  const requestHeaders = await headers();
  const path = requestHeaders.get("x-hiretivo-print-verified-path");
  const token = requestHeaders.get(PRINT_TOKEN_HEADER);
  if (!path?.startsWith("/print/") || !token) return null;
  try {
    const { payload } = await jwtVerify(token, deriveKey("print-token"), { audience: AUDIENCE, algorithms: ["HS256"] });
    return payload.path === path && typeof payload.userId === "string" ? payload.userId : null;
  } catch { return null; }
}
