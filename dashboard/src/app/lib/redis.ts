import { createClient } from "redis";

import { REDIS_URL, REDIS_PASSWORD } from "../../../config/redis";
import { TTL } from "../../../config/ttl";

const client = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
});

client.connect();

// export interface CacheKey {
//   prepend: string;
//   value: string;
// }

// export function makeCacheKey(prepend: string, value: string) {
//   return { prepend, value };
// }

// function stringifyCacheKey(cacheKey: CacheKey) {
//   return `${cacheKey.prepend}-${cacheKey.value}`;
// }

/**
 * Caches a signed url in Redis.
 * @param key the key to cache the signed url under
 * @param url the signed url to cache
 */
export async function cacheSignedUrls(keyValues: Record<string, string>) {
  const multi = client.multi();

  // Set multiple keys using MSET.
  multi.mSet(keyValues);

  // Set expiration for each key.
  Object.keys(keyValues).forEach((key) => {
    multi.expire(key, TTL);
  });

  try {
    // Execute all commands in one batch
    await multi.exec();
  } catch (err) {
    console.error('Redis error:', err);
  }
}

/**
 * Retrieves a cached signed url from Redis.
 * @param key the key to cache the signed url under
 * @returns the cached signed url
 */
export async function getCachedUrls(keys: string[] | string) {
  const urls = await client.mGet(typeof keys === "string" ? [keys] : keys);
  return urls;
}
