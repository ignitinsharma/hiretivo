import {
  INDIA_STATES,
  isValidState,
  isValidCity,
  formatLocation,
  isCanonicalLocation,
  parseLegacyLocation,
  normalizeCity,
} from "../../src/modules/india-location/index";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

console.log("\n=== India Location Verification ===\n");

// State count
console.log("State/UT count:");
assert("exactly 36 unique entries", new Set(INDIA_STATES).size === 36);
assert("28 states + 8 UTs = 36", INDIA_STATES.length === 36);

// isValidState
console.log("\nisValidState:");
assert("Karnataka is valid", isValidState("Karnataka"));
assert("Delhi is valid", isValidState("Delhi"));
assert("Puducherry is valid", isValidState("Puducherry"));
assert("Ladakh is valid", isValidState("Ladakh"));
assert("India is not a state", !isValidState("India"));
assert("Empty string is invalid", !isValidState(""));
assert("Random string is invalid", !isValidState("Narnia"));

// isValidCity
console.log("\nisValidCity:");
assert("Mumbai valid", isValidCity("Mumbai"));
assert("Bengaluru valid", isValidCity("Bengaluru"));
assert("Port Blair valid", isValidCity("Port Blair"));
assert("Daman & Diu valid", isValidCity("Daman & Diu"));
assert("City with hyphen valid", isValidCity("Navi-Mumbai"));
assert("Unicode city valid", isValidCity("मुंबई"));
assert("Single char invalid", !isValidCity("A"));
assert("City with comma invalid", !isValidCity("Bengaluru, KA"));
assert("Empty string invalid", !isValidCity(""));

// normalizeCity
console.log("\nnormalizeCity:");
assert("Trims leading/trailing space", normalizeCity("  Mumbai  ") === "Mumbai");
assert("Collapses repeated whitespace", normalizeCity("New  Delhi") === "New Delhi");

// formatLocation
console.log("\nformatLocation:");
assert(
  'formats "Mumbai, Maharashtra"',
  formatLocation("Mumbai", "Maharashtra") === "Mumbai, Maharashtra",
);
assert(
  'trims city in output',
  formatLocation("  Bengaluru  ", "Karnataka") === "Bengaluru, Karnataka",
);

// isCanonicalLocation
console.log("\nisCanonicalLocation:");
assert("canonical passes", isCanonicalLocation("Bengaluru, Karnataka"));
assert("canonical with space passes", isCanonicalLocation("New Delhi, Delhi"));
assert("null fails", !isCanonicalLocation(null));
assert("empty fails", !isCanonicalLocation(""));
assert('"Remote" fails', !isCanonicalLocation("Remote"));
assert('"Remote, India" fails', !isCanonicalLocation("Remote, India"));
assert('"Mumbai, India" fails', !isCanonicalLocation("Mumbai, India"));
assert("unknown state fails", !isCanonicalLocation("Mumbai, Narnia"));

// parseLegacyLocation — canonical
console.log("\nparseLegacyLocation — canonical:");
assert(
  '"Bengaluru, Karnataka" → both fields',
  deepEqual(parseLegacyLocation("Bengaluru, Karnataka"), { city: "Bengaluru", state: "Karnataka" }),
);

// parseLegacyLocation — legacy 2-part
console.log("\nparseLegacyLocation — legacy 2-part:");
assert(
  '"Mumbai, India" → city only',
  deepEqual(parseLegacyLocation("Mumbai, India"), { city: "Mumbai", state: null }),
);
assert(
  '"Remote, India" → both null',
  deepEqual(parseLegacyLocation("Remote, India"), { city: null, state: null }),
);

// parseLegacyLocation — legacy 3-part (GAP FIX)
console.log("\nparseLegacyLocation — legacy 3-part:");
assert(
  '"Bengaluru, Karnataka, India" → both fields',
  deepEqual(parseLegacyLocation("Bengaluru, Karnataka, India"), {
    city: "Bengaluru",
    state: "Karnataka",
  }),
);
assert(
  '"Mumbai, Maharashtra, India" → both fields',
  deepEqual(parseLegacyLocation("Mumbai, Maharashtra, India"), {
    city: "Mumbai",
    state: "Maharashtra",
  }),
);
assert(
  '"City, Unknown, India" → city only',
  deepEqual(parseLegacyLocation("City, Unknown, India"), { city: "City", state: null }),
);

// parseLegacyLocation — incomplete
console.log("\nparseLegacyLocation — incomplete:");
assert("null → both null", deepEqual(parseLegacyLocation(null), { city: null, state: null }));
assert('empty → both null', deepEqual(parseLegacyLocation(""), { city: null, state: null }));
assert('"Remote" → both null', deepEqual(parseLegacyLocation("Remote"), { city: null, state: null }));
assert('"India" → both null', deepEqual(parseLegacyLocation("India"), { city: null, state: null }));

// Settings pair validation (both or neither)
console.log("\nSettings pair logic (server-side refine):");
const bothPresent = (city: unknown, state: unknown) => !!city && !!state;
const neitherPresent = (city: unknown, state: unknown) => !city && !state;
const isValidPair = (city: unknown, state: unknown) => bothPresent(city, state) || neitherPresent(city, state);
assert("Both present → valid", isValidPair("Mumbai", "Maharashtra"));
assert("Neither present → valid", isValidPair(undefined, undefined));
assert("City only → invalid", !isValidPair("Mumbai", undefined));
assert("State only → invalid", !isValidPair(undefined, "Maharashtra"));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
