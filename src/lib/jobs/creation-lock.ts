import "server-only";
// The runner is single-instance; serialize starts across tabs and hot reloads.
const shared = globalThis as unknown as { applicationCreationLock?: Promise<void> };
export async function withCreationLock<T>(work: () => Promise<T>): Promise<T> {
  const previous = shared.applicationCreationLock ?? Promise.resolve();
  let release!: () => void;
  shared.applicationCreationLock = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await work(); } finally { release(); }
}
