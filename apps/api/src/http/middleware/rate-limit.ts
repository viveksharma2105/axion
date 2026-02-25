import { redis } from "@/infrastructure/cache/redis";
import { createMiddleware } from "hono/factory";
import type { AuthVariables } from "./auth";

interface RateLimitOptions {
  /** Maximum requests allowed within the window. */
  max: number;
  /** Time window in seconds. */
  windowSeconds: number;
  /** Key prefix for Redis. */
  prefix?: string;
}

/**
 * Rate limiter middleware using Redis sliding window counters.
 * Uses the authenticated userId when available, falls back to IP.
 */
export function rateLimiter(options: RateLimitOptions) {
  const { max, windowSeconds, prefix = "rl" } = options;

  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const userId = c.get("userId" as never) as string | undefined;
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const key = userId ? `${prefix}:user:${userId}` : `${prefix}:ip:${ip}`;

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use a Redis sorted set: score = timestamp, member = unique request id
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart); // Remove expired entries
    multi.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`);
    multi.zcard(key); // Count entries in window
    multi.expire(key, windowSeconds); // Ensure TTL

    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;

    // Set rate limit headers
    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, max - count).toString());
    c.header("X-RateLimit-Reset", (now + windowSeconds).toString());

    if (count > max) {
      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
        },
        429,
      );
    }

    await next();
  });
}
