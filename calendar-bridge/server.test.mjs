import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

process.env.BRIDGE_PUBLIC_URL = "https://bridge.example";
process.env.GOOGLE_CLIENT_ID = "client";
process.env.GOOGLE_CLIENT_SECRET = "secret";

const realFetch = globalThis.fetch;
const googleCalls = [];
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url === "https://oauth2.googleapis.com/token") {
    googleCalls.push(new URLSearchParams(init.body));
    return Response.json({ access_token: "access", expires_in: 3600, refresh_token: "refresh", scope: "openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.calendarlist.readonly", id_token: "h.e30.s" });
  }
  if (url === "https://oauth2.googleapis.com/revoke") return Response.json({});
  return realFetch(input, init);
};

const { server } = await import("./server.mjs");
let base;
before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  globalThis.fetch = realFetch;
});

test("consent tickets require the initiating install's verifier and can be redeemed once", async () => {
  const verifier = "local-install-secret";
  const proof = createHash("sha256").update(verifier).digest("base64url");
  const start = await realFetch(`${base}/start?callback=${encodeURIComponent("https://install.example/api/google/bridge/callback")}&challenge=${proof}`, { redirect: "manual" });
  assert.equal(start.status, 302);
  const google = new URL(start.headers.get("location"));
  assert.equal(google.origin, "https://accounts.google.com");
  assert.equal(google.searchParams.get("redirect_uri"), "https://bridge.example/google/callback");
  assert.equal(google.searchParams.get("scope").includes("gmail"), false);
  const state = google.searchParams.get("state");

  const returned = await realFetch(`${base}/google/callback?state=${state}&code=approved`, { redirect: "manual" });
  assert.equal(returned.status, 302);
  const callback = new URL(returned.headers.get("location"));
  assert.equal(callback.origin, "https://install.example");
  assert.equal(callback.searchParams.has("refresh_token"), false);
  const ticket = callback.searchParams.get("ticket");
  const redeem = (value) => realFetch(`${base}/redeem`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticket, verifier: value }) });
  assert.equal((await redeem("wrong-install")).status, 403);
  const tokens = await redeem(verifier);
  assert.equal(tokens.status, 200);
  assert.equal((await tokens.json()).refresh_token, "refresh");
  assert.equal((await redeem(verifier)).status, 400);
  assert.equal((await realFetch(`${base}/google/callback?state=${state}&code=replayed`, { redirect: "manual" })).status, 400);
  assert.equal(googleCalls.length, 1);
});

test("rejects untrusted callback URLs", async () => {
  const proof = createHash("sha256").update("secret").digest("base64url");
  for (const callback of ["http://remote.example/api/google/bridge/callback", "https://remote.example/other", "https://remote.example/api/google/bridge/callback?x=1"]) {
    const response = await realFetch(`${base}/start?callback=${encodeURIComponent(callback)}&challenge=${proof}`, { redirect: "manual" });
    assert.equal(response.status, 400);
  }
});

test("renews and revokes a Calendar token without keeping account data", async () => {
  const refresh = await realFetch(`${base}/refresh`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: "refresh" }) });
  assert.equal(refresh.status, 200);
  assert.equal((await refresh.json()).access_token, "access");
  assert.equal(googleCalls.at(-1).get("grant_type"), "refresh_token");
  const revoke = await realFetch(`${base}/revoke`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: "refresh" }) });
  assert.equal(revoke.status, 200);
});
