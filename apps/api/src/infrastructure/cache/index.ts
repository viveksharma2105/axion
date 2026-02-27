import { redis } from "./redis";

/**
 * Cache key patterns and TTLs as defined in AXION.md section 10.
 *
 * Cache Key Pattern                          TTL
 * ──────────────────────────────────────────────────
 * attendance:{collegeLinkId}                 30 min
 * timetable:{collegeLinkId}                  6 hours
 * marks:{collegeLinkId}                      1 hour
 * courses:{collegeLinkId}                    24 hours
 * college:token:{collegeLinkId}              varies
 * user:notifications:count:{userId}          5 min
 */

const TTL = {
  attendance: 30 * 60, // 30 minutes
  timetable: 6 * 60 * 60, // 6 hours
  marks: 60 * 60, // 1 hour
  courses: 24 * 60 * 60, // 24 hours
  notificationCount: 5 * 60, // 5 minutes
  "student-profile": 30 * 60, // 30 minutes
} as const;

type CacheNamespace = keyof typeof TTL;

function buildKey(namespace: string, id: string): string {
  return `${namespace}:${id}`;
}

/**
 * Generic cache service for reading and writing JSON-serializable data.
 */
export const cache = {
  /**
   * Get a cached value, parsed from JSON.
   * Returns null on cache miss.
   */
  async get<T>(namespace: string, id: string): Promise<T | null> {
    const raw = await redis.get(buildKey(namespace, id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupted cache entry — delete it
      await redis.del(buildKey(namespace, id));
      return null;
    }
  },

  /**
   * Set a cached value with the namespace's default TTL.
   */
  async set(
    namespace: CacheNamespace,
    id: string,
    data: unknown,
  ): Promise<void> {
    const key = buildKey(namespace, id);
    const ttl = TTL[namespace];
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  },

  /**
   * Set a cached value with a custom TTL (in seconds).
   * Used for college auth tokens whose expiry varies.
   */
  async setWithTTL(
    namespace: string,
    id: string,
    data: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    const key = buildKey(namespace, id);
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  },

  /**
   * Delete a single cached value.
   */
  async del(namespace: string, id: string): Promise<void> {
    await redis.del(buildKey(namespace, id));
  },

  /**
   * Invalidate all cache entries for a given college link.
   * Called after a successful sync or when a college link is removed.
   */
  async invalidateCollegeLink(collegeLinkId: string): Promise<void> {
    const keys = [
      buildKey("attendance", collegeLinkId),
      buildKey("timetable", collegeLinkId),
      buildKey("marks", collegeLinkId),
      buildKey("courses", collegeLinkId),
      buildKey("college:token", collegeLinkId),
    ];
    await redis.del(...keys);
  },

  /**
   * Invalidate the student profile cache for a user.
   */
  async invalidateStudentProfile(userId: string): Promise<void> {
    await redis.del(buildKey("student-profile", userId));
  },

  /**
   * Invalidate the notification count cache for a user.
   */
  async invalidateNotificationCount(userId: string): Promise<void> {
    await redis.del(buildKey("user:notifications:count", userId));
  },
};
