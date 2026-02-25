import type { NOTIFICATION_TYPE, SYNC_STATUS } from "../constants";

/** Union of all sync status values. */
export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

/** Union of all notification type values. */
export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/** Standard API success response wrapper. */
export interface ApiSuccessResponse<T> {
  data: T;
}

/** Standard paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
