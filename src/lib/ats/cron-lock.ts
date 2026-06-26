import { redis } from '@/lib/redis';

const LOCK_TTL = 300;

export async function acquireLock(key = 'cron:ats-fetch-lock'): Promise<boolean> {
  const result = await redis.set(key, '1', { nx: true, ex: LOCK_TTL });
  return result === 'OK';
}

export async function releaseLock(key = 'cron:ats-fetch-lock'): Promise<void> {
  await redis.del(key);
}
