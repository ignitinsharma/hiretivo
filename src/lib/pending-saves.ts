"use client";
const checks = new Set<() => Promise<boolean>>();
export function registerSaveBarrier(check: () => Promise<boolean>) {
  checks.add(check);
  return () => { checks.delete(check); };
}
/** Flush mounted forms before navigation or a profile import can replace their data. */
export async function settlePendingSaves(): Promise<boolean> {
  const results = await Promise.all([...checks].map((check) => check()));
  return results.every(Boolean);
}
