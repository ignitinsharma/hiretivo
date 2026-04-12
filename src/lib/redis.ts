import { Redis } from "@upstash/redis";
import { IS_PRODUCTION, IS_STAGING, IS_DEVELOP } from "./config";

function createRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
    );
  }

  return new Redis({ url, token });
}

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis: Redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

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
   * Get all keys matching a pattern (within current environment)
   * Example: cache.keys('user:*') → ['prod:user:123', 'prod:user:456']
   */
  async keys(pattern: string): Promise<string[]> {
    const prefix = getKeyPrefix();
    const prefixedPattern = `${prefix}:${pattern}`;
    return redis.keys(prefixedPattern);
  },

  /**
   * Flush all keys in current environment only
   * CAUTION: This deletes ALL keys for the current environment!
   */
  async flushEnvironment(): Promise<void> {
    const prefix = getKeyPrefix();
    const keys = await redis.keys(`${prefix}:*`);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
