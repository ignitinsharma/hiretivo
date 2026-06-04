import { INDIA_STATES } from "./data/states";
import type { IndiaState } from "./types";

export const INDIA_TIMEZONE = "Asia/Kolkata";

const STATE_SET = new Set<string>(INDIA_STATES as readonly string[]);

export function isValidState(value: string): value is IndiaState {
  return STATE_SET.has(value);
}

/*
 * isValidCity
 * 2–100 chars, no commas, Unicode allowed (covers Devanagari, regional scripts).
 * Rejects commas because comma is the city/state delimiter in stored format.
 */
export function isValidCity(city: string): boolean {
  const normalized = city.trim();
  if (normalized.length < 2 || normalized.length > 100) return false;
  return !normalized.includes(",");
}

export function normalizeCity(city: string): string {
  return city.trim().replace(/\s+/g, " ");
}

/*
 * formatLocation
 * Produces canonical "City, State" string for DB storage.
 */
export function formatLocation(city: string, state: IndiaState): string {
  return `${normalizeCity(city)}, ${state}`;
}

/*
 * isCanonicalLocation
 * Returns true only when raw matches "City, State" where state is a valid IndiaState.
 */
export function isCanonicalLocation(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const commaIdx = raw.indexOf(",");
  if (commaIdx < 0) return false;
  const city = raw.slice(0, commaIdx).trim();
  const state = raw.slice(commaIdx + 1).trim();
  return isValidCity(city) && isValidState(state);
}

/*
 * parseLegacyLocation
 * Handles all known legacy formats and returns { city, state } for pre-filling UI.
 *
 * Handled patterns:
 *   "Bengaluru, Karnataka"         → { city: "Bengaluru", state: "Karnataka" }   canonical
 *   "Mumbai, India"                → { city: "Mumbai", state: null }              legacy 2-part
 *   "Bengaluru, Karnataka, India"  → { city: "Bengaluru", state: "Karnataka" }   legacy 3-part
 *   "Mumbai, Maharashtra, India"   → { city: "Mumbai", state: "Maharashtra" }    legacy 3-part
 *   "Remote" / "Remote, India"     → { city: null, state: null }                 incomplete
 *   "" / null                      → { city: null, state: null }                 incomplete
 *   "Mumbai"                       → { city: "Mumbai", state: null }             single word
 */
export function parseLegacyLocation(
  raw: string | null | undefined,
): { city: string | null; state: string | null } {
  if (!raw || !raw.trim()) return { city: null, state: null };
  const trimmed = raw.trim();

  if (/^remote$/i.test(trimmed)) return { city: null, state: null };

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 1) {
    if (parts[0] === "India") return { city: null, state: null };
    return { city: parts[0], state: null };
  }

  if (parts.length === 2) {
    const [city, second] = parts;
    if (/^remote$/i.test(city)) return { city: null, state: null };
    if (isValidState(second)) return { city, state: second };
    if (second === "India") return { city, state: null };
    return { city, state: null };
  }

  if (parts.length === 3) {
    const [city, second, third] = parts;
    // "City, State, India" — most common 3-part legacy format
    if (third === "India" && isValidState(second)) return { city, state: second };
    if (third === "India") return { city, state: null };
    return { city, state: null };
  }

  // 4+ parts — unrecognized, treat as incomplete
  return { city: null, state: null };
}
