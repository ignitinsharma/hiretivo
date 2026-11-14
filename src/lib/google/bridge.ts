import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { env } from "@/lib/env";

import { GoogleError } from "./errors";
import type { TokenAnswer } from "./oauth";

export const bridgeUrl = () => env.HIRETIVO_CALENDAR_BRIDGE_URL;
export const newVerifier = () => randomBytes(32).toString("base64url");
export const verifierChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
  refresh_token: z.string().optional(),
  scope: z.string().default(""),
  id_token: z.string().optional(),
});

async function bridgePost<T>(path: string, payload: object): Promise<T> {
  const base = bridgeUrl();
  if (!base) throw new GoogleError("not-configured", "Calendar connection is not available on this install.");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new GoogleError("unavailable", "Couldn't reach the Calendar connection service. Try again in a moment.");
  }
  if (!response.ok) throw new GoogleError(response.status === 401 ? "revoked" : "rejected", "The Calendar connection service refused the request. Connect Calendar again.");
  return (await response.json()) as T;
}

async function bridgeToken(path: string, payload: object): Promise<TokenAnswer> {
  const parsed = tokenSchema.safeParse(await bridgePost<unknown>(path, payload));
  if (!parsed.success) throw new GoogleError("unavailable", "The Calendar connection service sent an invalid response.");
  return parsed.data;
}

export const redeemBridgeTicket = (ticket: string, verifier: string) => bridgeToken("/redeem", { ticket, verifier });
export const refreshBridgeToken = (refreshToken: string, signal?: AbortSignal) => {
  if (signal?.aborted) throw signal.reason;
  return bridgeToken("/refresh", { refresh_token: refreshToken });
};
export const revokeBridgeToken = (token: string) => bridgePost<{ ok: boolean }>("/revoke", { token });
