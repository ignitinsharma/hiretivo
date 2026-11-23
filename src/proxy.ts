import { NextResponse, type NextRequest } from "next/server";

import { deploymentMode } from "@/lib/deployment-mode";
import { readHostedSession } from "@/lib/auth/hosted/session";
import { decodeSession, SESSION_COOKIE, sessionTokenOptions } from "@/lib/auth/session";
import { contentSecurityPolicy, createNonce } from "@/lib/csp";
import { messages } from "@/lib/messages";
import { PRINT_TOKEN_HEADER, verifyPrintToken } from "@/lib/pdf/print-token";

/** The Claude connector's endpoint, its sign-in and the metadata that points to them. */
const CONNECTOR_PATHS = /^\/(?:api\/(?:mcp|oauth)(?:\/|$)|\.well-known\/oauth-(?:authorization-server|protected-resource)(?:\/|$))/;

/**
 * Sends signed-out visitors to /login before a page renders (PRD AUTH-1),
 * and gives every page its Content-Security-Policy (E11-5). The sign-in check
 * is only the optimistic one (a valid, unexpired cookie; no database): pages,
 * layouts, actions and route handlers still check the session themselves, so
 * a matcher mistake can't expose data.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hosted = deploymentMode() === "hosted";
  if (hosted && process.env.VERCEL === "1" && pathname === "/api/internal/queued-job") return pass(request);
  if (pathname === "/login" || pathname === "/pricing" || pathname === "/features") return pass(request);
  if (hosted && ["/", "/signup", "/verify-email", "/verify-email-pending", "/forgot-password", "/reset-password"].includes(pathname)) return pass(request);
  // The Claude connector (#221) brings its own credentials, an OAuth token,
  // which its routes check; they answer 404 while it's off.
  if (CONNECTOR_PATHS.test(pathname)) return pass(request);
  // The desktop app signing itself in (desktop.ts); the route checks its token.
  if (pathname === "/api/desktop/sign-in") return pass(request);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = hosted ? await readHostedSession(token) : await decodeSession(token, sessionTokenOptions());
  if (session) return pass(request);

  // Server Actions answer a signed-out call with a friendly error themselves
  // (see action()); a redirect here would break their response.
  if (request.headers.has("next-action")) return pass(request);

  // The PDF renderer's headless Chromium opens print pages with a token
  // instead of a cookie; the page checks it again. The token is for the page
  // with its query: Fit to one page's steps are /print/base?fit=1 and so on.
  if (
    pathname.startsWith("/print/") &&
    (await verifyPrintToken(request.headers.get(PRINT_TOKEN_HEADER), `${pathname}${search}`))
  ) {
    return pass(request, `${pathname}${search}`);
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: messages.signedOut }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

/**
 * Lets the request through. Pages get the policy on the response, and on the
 * request too: that's where Next.js finds the nonce for its scripts. API
 * answers (JSON, files) need none.
 */
function pass(request: NextRequest, printPath?: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.delete("x-hiretivo-print-verified-path");
  if (printPath) headers.set("x-hiretivo-print-verified-path", printPath);
  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next({ request: { headers } });
  // Behind a reverse proxy that ends TLS, only the forwarded header knows.
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? request.nextUrl.protocol.replace(/:$/, "");
  const policy = contentSecurityPolicy(createNonce(), { dev: process.env.NODE_ENV === "development", https: protocol === "https" });
  headers.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", policy);
  return response;
}

export const config = {
  matcher: [
    // Everything except the health check, Next.js' own assets (scripts,
    // styles, fonts, images), the dev server's hot-reload socket and public
    // files.
    "/((?!api/health(?:/|$)|_next/static/|_next/image|_next/hmr|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
