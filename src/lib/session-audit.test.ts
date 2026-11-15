import { globSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// E11-5: every way into the server checks the session itself, so a proxy
// matcher mistake can't expose data. Server Actions go through action(),
// route handlers through route(); these are the only exceptions.
const SIGNED_OUT_ACTIONS = new Map([
  // publicAction: signing in, and the same through the form's own submit (#187)
  ["src/app/login/actions.ts", ["signIn", "signInWithForm"]],
  ["src/lib/auth/hosted/actions.ts", ["signup", "hostedSignIn", "resendVerification", "verifyEmail", "requestPasswordReset", "resetPassword"]],
  ["src/lib/auth/actions.ts", ["signOut"]], // only clears the cookie
]);
// Read-only server loaders can return their typed view directly, but must verify
// the session before loading any private data. Keep these exceptions exact.
const SESSION_CHECKED_ACTIONS = new Map([
  ["src/app/(app)/settings/fallback-actions.ts", ["loadFallbackSettingsView"]],
]);
const OPEN_ROUTES = new Set([
  "src/app/api/health/route.ts", // for health checks; says nothing private
  // Google's redirect comes from Google's site, so route()'s same-origin check
  // would refuse it; it checks the session and its signed state itself (E15-1).
  "src/app/api/google/callback/route.ts",
  "src/app/api/google/bridge/callback/route.ts", // session plus one-time bridge ticket/verifier
  // The Claude connector (#221) is called by Claude, not the browser: it
  // checks its OAuth token instead, and answers 404 while it's off.
  "src/app/api/mcp/route.ts",
  "src/app/api/oauth/metadata/route.ts",
  "src/app/api/oauth/protected-resource/route.ts",
  "src/app/api/oauth/register/route.ts",
  "src/app/api/oauth/token/route.ts",
  // How the desktop app signs in, on a server it started: it starts a session, so
  // there's none to check yet. It checks its launch's token, and answers 404 without it.
  "src/app/api/desktop/sign-in/route.ts",
]);

const PUBLIC_PAGES = new Set([
  "src/app/page.tsx", "src/app/pricing/page.tsx", "src/app/login/page.tsx",
  "src/app/signup/page.tsx", "src/app/verify-email/page.tsx", "src/app/verify-email-pending/page.tsx",
  "src/app/forgot-password/page.tsx", "src/app/reset-password/page.tsx",
]);

const sources = globSync("src/**/*.{ts,tsx}").filter((file) => !/\.test\.tsx?$/.test(file) && !file.startsWith("src/generated/"));
const read = (file: string) => readFileSync(file, "utf8");
const isActionFile = (source: string) => /^\s*["']use server["'];?/.test(source);
const exportsOf = (source: string) => [...source.matchAll(/^export\s+(?:async\s+)?(?:const|function|let|var|default)\s*(\w*)\s*(?:=\s*(\w+))?/gm)];

describe("session checks (E11-5)", () => {
  const actionFiles = sources.filter((file) => isActionFile(read(file)));

  it("finds the Server Action files and route handlers", () => {
    expect(actionFiles.length).toBeGreaterThan(10);
    expect(globSync("src/app/**/route.ts").length).toBeGreaterThan(5);
  });

  it("defines every Server Action with action()", () => {
    const unchecked = actionFiles.flatMap((file) =>
      exportsOf(read(file))
        .filter(([, name, wrapper]) => wrapper !== "action" && !SIGNED_OUT_ACTIONS.get(file)?.includes(name) && !SESSION_CHECKED_ACTIONS.get(file)?.includes(name))
        .map(([line]) => `${file}: ${line}`),
    );
    expect(unchecked).toEqual([]);
  });

  it("requires direct server loaders to verify the session before doing any work", () => {
    for (const [file, names] of SESSION_CHECKED_ACTIONS) for (const name of names) {
      const source = read(file);
      const start = source.indexOf(`export async function ${name}`);
      expect(start, file).toBeGreaterThanOrEqual(0);
      expect(source.slice(start).split("\n")[1]?.trim(), `${file}: ${name}`).toBe("await verifySession();");
    }
  });

  it("marks whole files only, never single functions, as Server Actions", () => {
    const inline = sources.filter((file) => {
      const source = read(file);
      return source.match(/^\s*["']use server["'];?\s*$/gm)?.length !== (isActionFile(source) ? 1 : undefined);
    });
    expect(inline).toEqual([]);
  });

  it("checks the session on every private page outside the explicit public pages", () => {
    // The (app) layout checks for everything inside it; print pages take the renderer's token too.
    expect(read("src/app/(app)/layout.tsx")).toContain("await verifySession()");
    const unchecked = globSync("src/app/**/page.tsx").filter(
      (file) =>
        !file.startsWith("src/app/(app)/") &&
        !PUBLIC_PAGES.has(file) &&
        !/await (verifySession|verifyPrintAccess)\(/.test(read(file)),
    );
    expect(unchecked).toEqual([]);
  });

  it("checks the session in Google's callback itself", () => {
    const source = read("src/app/api/google/callback/route.ts");
    expect(source).toContain("await getSession()");
    expect(source).toContain("await verifyState(");
  });

  it("keeps hosted-only public authentication pages disabled on self-hosted installs", () => {
    for (const file of [...PUBLIC_PAGES].filter((file) => !["src/app/page.tsx", "src/app/pricing/page.tsx", "src/app/login/page.tsx"].includes(file))) {
      expect(read(file), file).toContain('if (deploymentMode() !== "hosted") notFound()');
    }
    const home = read("src/app/page.tsx");
    expect(home).toContain('deploymentMode() === "hosted"');
    expect(home).toContain('if (await getSession()) redirect("/dashboard")');
    expect(home).toContain("<AppLayout>");
    expect(read("src/lib/auth/hosted/actions.ts")).toContain('if (deploymentMode() !== "hosted") return true;');
  });

  it("checks the session and the one-time verifier in the Calendar bridge callback", () => {
    const source = read("src/app/api/google/bridge/callback/route.ts");
    expect(source).toContain('if (!(await getSession())) return back("expired")');
    expect(source).toContain('if (!ticket || !verifier) return back("expired")');
    expect(source).toContain("await redeemBridgeTicket(ticket, verifier)");
    expect(source.indexOf("await getSession()")).toBeLessThan(source.indexOf("await loadGoogleAccount()"));
  });

  it("checks the token and the switch in the Claude connector itself (#221)", () => {
    const mcp = read("src/app/api/mcp/route.ts");
    expect(mcp).toContain("await verifyAccessToken(");
    expect(mcp).toContain('withTenant(access.userId ?? "local"');
    const oauth = read("src/lib/connector/oauth.ts");
    expect(oauth).toContain("const since = await connectorSince()");
    expect(oauth).toContain("if (!since) return null");
    expect(oauth).toContain('inTokenAccount("access", token,');
    expect(oauth).toContain("claims.userId === current.userId");
    for (const file of [...OPEN_ROUTES].filter((entry) => /\/api\/(mcp|oauth)\//.test(entry))) {
      expect(read(file), file).toContain('if (deploymentMode() === "self-hosted" && !(await connectorSince())) return new Response(null, { status: 404 });');
    }
  });

  it("defines every route handler with route()", () => {
    const unchecked = globSync("src/app/**/route.ts")
      .filter((file) => !OPEN_ROUTES.has(file))
      .flatMap((file) =>
        exportsOf(read(file))
          .filter(([, name, wrapper]) => /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/.test(name) && wrapper !== "route")
          .map(([line]) => `${file}: ${line}`),
      );
    expect(unchecked).toEqual([]);
  });
});
