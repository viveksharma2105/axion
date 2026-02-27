/**
 * Port for cache operations.
 * Decouples use cases from Redis-specific implementation.
 */
export interface ICacheService {
  get<T>(namespace: string, id: string): Promise<T | null>;
  set(namespace: string, id: string, data: unknown): Promise<void>;
  setWithTTL(
    namespace: string,
    id: string,
    data: unknown,
    ttlSeconds: number,
  ): Promise<void>;
  del(namespace: string, id: string): Promise<void>;
  invalidateCollegeLink(collegeLinkId: string): Promise<void>;
  invalidateStudentProfile(userId: string): Promise<void>;
  invalidateNotificationCount(userId: string): Promise<void>;
}
