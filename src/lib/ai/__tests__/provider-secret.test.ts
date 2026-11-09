import assert from "node:assert/strict";
import { after, before, it } from "node:test";
import { decryptProviderSecret, encryptProviderSecret } from "../provider-secret";

before(() => { process.env.HIRETIVO_ENCRYPTION_KEY = "ab".repeat(32); });
after(() => { delete process.env.HIRETIVO_ENCRYPTION_KEY; });

it("round-trips a key without exposing it in stored ciphertext", () => {
  const encrypted = encryptProviderSecret("sk-openrouter-private");
  assert.ok(!encrypted.includes("sk-openrouter-private"));
  assert.equal(decryptProviderSecret(encrypted), "sk-openrouter-private");
  assert.notEqual(encryptProviderSecret("sk-openrouter-private"), encrypted);
});

it("rejects a modified credential", () => {
  const encrypted = encryptProviderSecret("secret");
  const parts = encrypted.split(".");
  parts[3] = Buffer.from("different").toString("base64url");
  assert.throws(() => decryptProviderSecret(parts.join(".")));
});
