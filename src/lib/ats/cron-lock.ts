import { redis } from '@/lib/redis';

const LOCK_TTL = 300;

/*
 * acquireLock
 * Attempts to acquire a Redis-based distributed lock using SET NX EX.
 * Prevents concurrent cron executions for the same ATS source.
 * @param key - Redis key for the lock (defaults to cron:ats-fetch-lock)
 * @returns true if the lock was acquired, false if already held by another process
 */
export async function acquireLock(key = 'cron:ats-fetch-lock'): Promise<boolean> {
  const result = await redis.set(key, '1', { nx: true, ex: LOCK_TTL });
  return result === 'OK';
}

/*
 * releaseLock
 * Releases a previously acquired Redis lock by deleting the key.
 * Safe to call even if the lock has already expired (TTL-based expiry).
 * @param key - Redis key for the lock (must match the key used in acquireLock)
 */
export async function releaseLock(key = 'cron:ats-fetch-lock'): Promise<void> {
  await redis.del(key);
}
