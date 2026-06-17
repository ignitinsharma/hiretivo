import { Redis } from "@upstash/redis";
import { IS_PRODUCTION, IS_STAGING, IS_DEVELOP } from "./config";

// Lazy Redis client — not initialized at module load time.
// This prevents import-time failures when UPSTASH env vars are absent,
// which would otherwise cascade and break all server actions that import
// anything from this module (e.g. the entire seeker onboarding flow).
const _globalForRedis = globalThis as unknown as {
  _redisClient: Redis | undefined;
};

function getRedis(): Redis {
  if (_globalForRedis._redisClient) return _globalForRedis._redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
    );
  }

  const instance = new Redis({ url, token });

  if (process.env.NODE_ENV !== "production") {
    _globalForRedis._redisClient = instance;
  }

  return instance;
}

// Proxy-based lazy export: safe to import even when UPSTASH env vars are not
// set. Throws only when a method is actually called, not at import time.
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const instance = getRedis();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/**
 * Get environment-specific key prefix
 * Ensures keys don't collide across environments when using shared Redis instance
 */
function getKeyPrefix(): string {
  if (IS_PRODUCTION) return "prod";
  if (IS_STAGING) return "staging";
  if (IS_DEVELOP) return "dev";
  return "preview"; // For other preview branches
}

/**
 * Add environment prefix to a key
 * Example: "recommendations:user123" → "prod:recommendations:user123"
 */
function prefixKey(key: string): string {
  const prefix = getKeyPrefix();
  return `${prefix}:${key}`;
}

/**
 * Environment-aware Redis cache helpers
 * Automatically prefixes keys based on current environment
 */
export const cache = {
  /**
   * Set a value with optional TTL (in seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const prefixedKey = prefixKey(key);
    const serialized = JSON.stringify(value);

    if (ttl) {
      await redis.setex(prefixedKey, ttl, serialized);
    } else {
      await redis.set(prefixedKey, serialized);
    }
  },

  /**
   * Get a value
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const prefixedKey = prefixKey(key);
    const data = await redis.get(prefixedKey);

    if (!data) return null;

    try {
      return JSON.parse(data as string) as T;
    } catch {
      // If parsing fails, return raw data
      return data as T;
    }
  },

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    const prefixedKey = prefixKey(key);
    await redis.del(prefixedKey);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const prefixedKey = prefixKey(key);
    const result = await redis.exists(prefixedKey);
    return result === 1;
  },

  /**
   * Increment a counter
   */
  async increment(key: string, amount = 1): Promise<number> {
    const prefixedKey = prefixKey(key);
    return redis.incrby(prefixedKey, amount);
  },

  /**
   * Set expiration on existing key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<void> {
    const prefixedKey = prefixKey(key);
    await redis.expire(prefixedKey, seconds);
  },

  /**
   * Get multiple keys at once
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    const prefixedKeys = keys.map(prefixKey);
    const results = await redis.mget(...prefixedKeys);

    return results.map((data) => {
      if (!data) return null;
      try {
        return JSON.parse(data as string) as T;
      } catch {
        return data as T;
      }
    });
  },

  /**
   * Get all keys matching a pattern via cursor scan (non-blocking, O(N) spread across calls).
   * Example: cache.keys('user:*') → ['prod:user:123', 'prod:user:456']
   */
  async keys(pattern: string): Promise<string[]> {
    const prefix = getKeyPrefix();
    const prefixedPattern = `${prefix}:${pattern}`;
    const collected: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: prefixedPattern,
        count: 100,
      });
      cursor = nextCursor;
      collected.push(...keys);
    } while (cursor !== '0');
    return collected;
  },

  /**
   * Flush all keys in current environment only via cursor scan — non-blocking.
   * CAUTION: This deletes ALL keys for the current environment!
   */
  async flushEnvironment(): Promise<void> {
    const prefix = getKeyPrefix();
    const collected: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${prefix}:*`,
        count: 100,
      });
      cursor = nextCursor;
      collected.push(...keys);
    } while (cursor !== '0');

    const BATCH = 100;
    for (let i = 0; i < collected.length; i += BATCH) {
      const batch = collected.slice(i, i + BATCH);
      if (batch.length > 0) await redis.del(...batch);
    }
  },
};
