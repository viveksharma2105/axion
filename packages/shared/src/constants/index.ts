/** Sync status values used by college_links. */
export const SYNC_STATUS = {
  PENDING: "pending",
  SYNCING: "syncing",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

/** Notification type values. */
export const NOTIFICATION_TYPE = {
  ATTENDANCE_ALERT: "attendance_alert",
  NEW_MARKS: "new_marks",
  TIMETABLE_CHANGE: "timetable_change",
  SYNC_ERROR: "sync_error",
} as const;

/** Default attendance threshold percentage. */
export const DEFAULT_ATTENDANCE_THRESHOLD = 75;

/** Maximum number of sync retries before marking link as failed. */
export const MAX_SYNC_RETRIES = 3;

/** Number of consecutive sync failures before deactivating a college link. */
export const MAX_CONSECUTIVE_FAILURES = 5;
