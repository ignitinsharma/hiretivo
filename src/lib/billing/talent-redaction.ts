/*
 * Talent pool redaction helpers
 * Single source of truth for masking engineer identity on locked talent cards.
 *
 * Security note: these run server-side. The real name/location must never be sent
 * in a locked payload — only the masked value reaches the browser. The CSS blur on
 * the client is purely cosmetic and is NOT a substitute for this masking.
 */

// Fixed-length mask. Intentionally a constant length so the real name length is not leaked.
const NAME_MASK = "••••••"; // ••••••

/*
 * redactName
 * Masks a seeker's full name to a non-recoverable label for locked cards.
 * Keeps only the first initial; the remainder is replaced with a fixed bullet mask.
 * Handles single-token names (no space) correctly — fixes the prior bug where
 * names without a space leaked in full.
 * @param fullName - Raw seeker name (may be null/empty)
 * @returns Masked label e.g. "N•••••• •." or "Engineer" when no name exists
 */
export function redactName(fullName: string | null | undefined): string {
  const initial = (fullName ?? "").trim().charAt(0).toUpperCase();
  if (!initial) {
    return "Engineer";
  }
  return `${initial}${NAME_MASK} •.`;
}

// Region-level label shown for locked cards. Marketplace is India-only (per pivot),
// so a single constant is sufficient. If a country field is added later, derive it here.
export const LOCKED_REGION_LABEL = "India · Remote";

/*
 * coarseLocation
 * Returns a region-level label only, never the exact city, for locked cards.
 * @param _location - Raw seeker location (currently unused; reserved for future precise parsing)
 * @returns Region label e.g. "India · Remote"
 */
export function coarseLocation(_location: string | null | undefined): string {
  return LOCKED_REGION_LABEL;
}
