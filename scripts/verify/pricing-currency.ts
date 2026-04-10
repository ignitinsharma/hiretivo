import { strict as assert } from "node:assert";

function detectCurrency(cfIpCountry: string | null | undefined): "INR" | "USD" {
  return cfIpCountry === "IN" ? "INR" : "USD";
}

// India → INR
assert.equal(detectCurrency("IN"), "INR");
// US → USD
assert.equal(detectCurrency("US"), "USD");
// GB → USD
assert.equal(detectCurrency("GB"), "USD");
// null (header absent) → USD
assert.equal(detectCurrency(null), "USD");
// undefined → USD
assert.equal(detectCurrency(undefined), "USD");
// empty string → USD
assert.equal(detectCurrency(""), "USD");

console.log("pricing-currency checks passed");
