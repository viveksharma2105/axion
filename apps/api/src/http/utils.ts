/**
 * HTTP-layer serialization helpers.
 *
 * Cache (Redis) stores data via JSON.stringify / JSON.parse, which converts
 * Date objects to ISO strings. Route handlers must handle both real Date
 * instances (from Drizzle/Postgres) and plain strings (from cache).
 */

/**
 * Safely convert a Date or string to an ISO-8601 string.
 *
 * - Date instance → `.toISOString()`
 * - String (already ISO from cache) → returned as-is
 * - Anything else (fallback) → wrapped in `new Date()` first
 */
export function toISOString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
}
