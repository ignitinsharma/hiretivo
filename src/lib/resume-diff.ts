import { diffWords } from "diff";

export interface DiffSegment {
  text: string;
  added: boolean;
}

/*
 * diffSummary
 * Word-level diff between master and tailored summary.
 * Removed segments are discarded — we only care about what's in the tailored version.
 */
export function diffSummary(
  masterSummary: string,
  tailoredSummary: string,
): DiffSegment[] {
  const changes = diffWords(masterSummary ?? "", tailoredSummary ?? "");
  return changes
    .filter((c) => !c.removed)
    .map((c) => ({ text: c.value, added: !!c.added }));
}

/*
 * diffBullets
 * Word-level diff for each tailored bullet matched by stable id.
 * Defensive: if a bullet id doesn't exist in the master (shouldn't happen),
 * treat the whole bullet as unchanged.
 */
export function diffBullets(
  masterBullets: { id: string; text: string }[],
  tailoredBullets: { id: string; text: string }[],
): Record<string, DiffSegment[]> {
  const masterById = new Map(masterBullets.map((b) => [b.id, b.text]));
  const result: Record<string, DiffSegment[]> = {};

  for (const bullet of tailoredBullets) {
    const masterText = masterById.get(bullet.id);
    if (masterText === undefined) {
      // Brand-new bullet (no counterpart in master) — fully added.
      result[bullet.id] = [{ text: bullet.text, added: true }];
      continue;
    }
    const changes = diffWords(masterText, bullet.text);
    result[bullet.id] = changes
      .filter((c) => !c.removed)
      .map((c) => ({ text: c.value, added: !!c.added }));
  }

  return result;
}
