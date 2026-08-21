import { strict as assert } from "node:assert";

async function main(): Promise<void> {
  const url = (process.argv[2] ?? process.env.VERCEL_URL ?? "").replace(/\/+$/, "");

  assert.ok(
    url,
    "Usage: tsx scripts/verify/oauth-provider.ts <deployment-url> (or set VERCEL_URL)",
  );

  const res = await fetch(`${url}/api/auth/providers`);
  assert.equal(res.status, 200, `providers endpoint returned ${res.status}`);

  const providers: Record<string, unknown> = await res.json();
  assert.ok(
    "google" in providers,
    `google provider missing on ${url}. Providers: ${Object.keys(providers).join(", ")}`,
  );

  console.log(`oauth-provider check passed: google provider present on ${url}`);
}

void main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});