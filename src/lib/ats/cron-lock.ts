import { redis } from '@/lib/redis';

const LOCK_KEY = 'cron:ats-fetch-lock';
const LOCK_TTL = 300;

export async function acquireLock(): Promise<boolean> {
  const result = await redis.set(LOCK_KEY, '1', { nx: true, ex: LOCK_TTL });
  return result === 'OK';
}

export async function releaseLock(): Promise<void> {
  await redis.del(LOCK_KEY);
}
