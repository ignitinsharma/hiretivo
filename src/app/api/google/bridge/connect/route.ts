import { NextResponse } from "next/server";

import { bridgeUrl, newVerifier, verifierChallenge } from "@/lib/google/bridge";
import { loadGoogleAccount } from "@/lib/google/account";
import { publicOrigin } from "@/lib/google/origin";
import { route } from "@/lib/route";

/** Starts an explicitly chosen Calendar-only connection through the shared bridge. */
export const GET = route(async (request) => {
  const base = bridgeUrl();
  const origin = publicOrigin(request);
  if (!base) return NextResponse.redirect(new URL("/settings?section=google&google=not-configured", origin));
  if ((await loadGoogleAccount())?.authMode === "own") return NextResponse.redirect(new URL("/settings?section=google&google=already-connected", origin));
  const askedReturn = request.nextUrl.searchParams.get("return");
  const returnTo = askedReturn && /^\/welcome(\?|$)/.test(askedReturn) ? askedReturn : "/settings?section=google";
  const verifier = newVerifier();
  const url = new URL(`${base}/start`);
  url.searchParams.set("callback", `${origin}/api/google/bridge/callback`);
  url.searchParams.set("challenge", verifierChallenge(verifier));
  const response = NextResponse.redirect(url);
  response.cookies.set("hiretivo_calendar_connect", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    path: "/api/google/bridge",
    maxAge: 600,
  });
  response.cookies.set("hiretivo_calendar_return", returnTo, {
    httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), path: "/api/google/bridge", maxAge: 600,
  });
  response.headers.set("cache-control", "private, no-store");
  return response;
});
