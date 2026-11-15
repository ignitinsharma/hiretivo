type Entry<T> = { value: T; active: number; usedAt: number };

/** Bounded clients; a transaction holds its lease until the entire callback finishes. */
export class TenantClientCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly capacity: number, private readonly create: (key: string) => T, private readonly dispose: (value: T) => Promise<unknown>) {
    if (capacity < 1) throw new Error("A tenant client cache needs capacity.");
  }

  peek(key: string): T | undefined { return this.entries.get(key)?.value; }

  async use<R>(key: string, run: (value: T) => PromiseLike<R> | R): Promise<R> {
    let entry: Entry<T>;
    let closing: Promise<unknown> | undefined;
    for (;;) {
      const existing = this.entries.get(key);
      if (existing) { entry = existing; entry.active++; break; }
      if (this.entries.size < this.capacity) {
        entry = { value: this.create(key), active: 1, usedAt: Date.now() };
        this.entries.set(key, entry);
        break;
      }
      const idle = [...this.entries].filter(([, item]) => item.active === 0).sort((a, b) => a[1].usedAt - b[1].usedAt)[0];
      if (idle) {
        this.entries.delete(idle[0]);
        entry = { value: this.create(key), active: 1, usedAt: Date.now() };
        this.entries.set(key, entry);
        closing = this.dispose(idle[1].value);
        break;
      }
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    try {
      // Close the old idle sockets before opening the new client's sockets.
      await closing;
      return await run(entry.value);
    } finally {
      entry.active--;
      entry.usedAt = Date.now();
      this.waiting.shift()?.();
    }
  }

  async remove(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (!entry) return;
    if (entry.active) throw new Error("Cannot disconnect an active account transaction.");
    this.entries.delete(key);
    await this.dispose(entry.value);
    this.waiting.shift()?.();
  }
}
