import { type NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { redeemBridgeTicket } from "@/lib/google/bridge";
import { loadGoogleAccount, saveGoogleAccount } from "@/lib/google/account";
import { hasScopes, emailFromIdToken } from "@/lib/google/oauth";
import { publicOrigin } from "@/lib/google/origin";

/** The bridge returns a one-time ticket; only this install knows the verifier. */
export async function GET(request: NextRequest): Promise<Response> {
  const origin = publicOrigin(request);
  const askedReturn = request.cookies.get("hiretivo_calendar_return")?.value;
  const returnTo = askedReturn && /^\/welcome(\?|$)/.test(askedReturn) ? askedReturn : "/settings?section=google";
  const back = (outcome: string) => {
    const url = new URL(returnTo, origin);
    url.searchParams.set("google", outcome);
    const response = NextResponse.redirect(url);
    response.cookies.delete("hiretivo_calendar_connect");
    response.cookies.delete("hiretivo_calendar_return");
    response.headers.set("cache-control", "private, no-store");
    return response;
  };
  if (!(await getSession())) return back("expired");
  if ((await loadGoogleAccount())?.authMode === "own") return back("already-connected");
  if (request.nextUrl.searchParams.get("error") === "access_denied") return back("denied");
  const ticket = request.nextUrl.searchParams.get("ticket");
  const verifier = request.cookies.get("hiretivo_calendar_connect")?.value;
  if (!ticket || !verifier) return back("expired");
  try {
    const tokens = await redeemBridgeTicket(ticket, verifier);
    const email = emailFromIdToken(tokens.id_token);
    if (!email || !tokens.refresh_token || !hasScopes(tokens.scope, "calendar") || !hasScopes(tokens.scope, "list")) return back("failed");
    await saveGoogleAccount({ email, refreshToken: tokens.refresh_token, scopes: tokens.scope, authMode: "bridge" });
    return back("connected");
  } catch {
    return back("failed");
  }
}
