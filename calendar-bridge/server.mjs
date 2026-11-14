import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const publicUrl = process.env.BRIDGE_PUBLIC_URL?.replace(/\/+$/, "");
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
let validPublicUrl = false;
try {
  const url = new URL(publicUrl);
  validPublicUrl = url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
} catch { /* Missing or invalid URL. */ }
if (!validPublicUrl || !clientId || !clientSecret) {
  throw new Error("Set BRIDGE_PUBLIC_URL (HTTPS), GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
}

const callbackUrl = `${publicUrl}/google/callback`;
const scopes = [
  "openid", "email",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];
const pending = new Map();
const tickets = new Map();
const expiresAfter = 10 * 60_000;
const tokenEndpoint = "https://oauth2.googleapis.com/token";
setInterval(() => {
  for (const [key, value] of pending) if (value.expires < Date.now()) pending.delete(key);
  for (const [key, value] of tickets) if (value.expires < Date.now()) tickets.delete(key);
}, 60_000).unref();

function nonce() { return randomBytes(32).toString("base64url"); }
function challenge(verifier) { return createHash("sha256").update(verifier).digest("base64url"); }
function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}
function redirect(response, url) {
  response.writeHead(302, { location: url, "cache-control": "no-store" });
  response.end();
}
function callbackAllowed(value) {
  try {
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (url.protocol === "https:" || (loopback && url.protocol === "http:")) &&
      !url.username && !url.password && url.pathname === "/api/google/bridge/callback" && !url.search && !url.hash;
  } catch { return false; }
}
function fresh(map, key) {
  const value = map.get(key);
  if (!value || value.expires < Date.now()) { map.delete(key); return null; }
  return value;
}
async function body(request) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 16_384) throw new Error("body too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function googleToken(fields) {
  const response = await fetch(tokenEndpoint, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...fields, client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw Object.assign(new Error("Google refused the token request"), { status: response.status });
  return response.json();
}

export const server = createServer(async (request, response) => {
  const url = new URL(request.url, publicUrl);
  try {
    if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true });
    if (request.method === "GET" && url.pathname === "/start") {
      const callback = url.searchParams.get("callback");
      const proof = url.searchParams.get("challenge");
      if (!callbackAllowed(callback) || !/^[A-Za-z0-9_-]{43}$/.test(proof ?? "")) return json(response, 400, { error: "invalid_request" });
      if (pending.size >= 1000) return json(response, 503, { error: "busy" });
      const state = nonce();
      pending.set(state, { callback, proof, expires: Date.now() + expiresAfter });
      const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      google.search = new URLSearchParams({ client_id: clientId, redirect_uri: callbackUrl, response_type: "code", scope: scopes.join(" "), access_type: "offline", prompt: "consent", state }).toString();
      return redirect(response, google.toString());
    }
    if (request.method === "GET" && url.pathname === "/google/callback") {
      const state = url.searchParams.get("state");
      const entry = fresh(pending, state);
      if (!entry) return json(response, 400, { error: "expired" });
      pending.delete(state);
      const local = new URL(entry.callback);
      if (url.searchParams.has("error")) {
        local.searchParams.set("error", url.searchParams.get("error"));
        return redirect(response, local.toString());
      }
      const code = url.searchParams.get("code");
      if (!code) return json(response, 400, { error: "missing_code" });
      let tokens;
      try { tokens = await googleToken({ code, redirect_uri: callbackUrl, grant_type: "authorization_code" }); }
      catch {
        local.searchParams.set("error", "failed");
        return redirect(response, local.toString());
      }
      if (!tokens.refresh_token) return json(response, 502, { error: "no_refresh_token" });
      const ticket = nonce();
      tickets.set(ticket, { tokens, proof: entry.proof, expires: Date.now() + expiresAfter });
      local.searchParams.set("ticket", ticket);
      return redirect(response, local.toString());
    }
    if (request.method === "POST" && url.pathname === "/redeem") {
      const { ticket, verifier } = await body(request);
      if (typeof ticket !== "string" || typeof verifier !== "string") return json(response, 400, { error: "invalid_request" });
      const entry = fresh(tickets, ticket);
      if (!entry) return json(response, 400, { error: "expired" });
      const actual = Buffer.from(challenge(verifier));
      const expected = Buffer.from(entry.proof);
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return json(response, 403, { error: "wrong_install" });
      tickets.delete(ticket);
      return json(response, 200, entry.tokens);
    }
    if (request.method === "POST" && url.pathname === "/refresh") {
      const { refresh_token } = await body(request);
      if (typeof refresh_token !== "string" || !refresh_token) return json(response, 400, { error: "invalid_request" });
      try { return json(response, 200, await googleToken({ refresh_token, grant_type: "refresh_token" })); }
      catch (error) { return json(response, error.status === 400 ? 401 : 502, { error: "refresh_failed" }); }
    }
    if (request.method === "POST" && url.pathname === "/revoke") {
      const { token } = await body(request);
      if (typeof token !== "string" || !token) return json(response, 400, { error: "invalid_request" });
      const revoked = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }), signal: AbortSignal.timeout(10_000),
      });
      return json(response, revoked.ok ? 200 : 502, { ok: revoked.ok });
    }
    return json(response, 404, { error: "not_found" });
  } catch {
    return json(response, 502, { error: "unavailable" });
  }
});

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  server.listen(Number(process.env.PORT || 8080));
}
