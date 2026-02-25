/**
 * Domain value objects — enums and typed constants that encode
 * business meaning. Pure TypeScript, zero external imports.
 */

// ─── Sync Status ─────────────────────────────────────────────────────────────

export const SyncStatus = {
  PENDING: "pending",
  SYNCING: "syncing",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

// ─── Sync Type ───────────────────────────────────────────────────────────────

export const SyncType = {
  FULL: "full",
  ATTENDANCE: "attendance",
  TIMETABLE: "timetable",
  MARKS: "marks",
  COURSES: "courses",
} as const;

export type SyncType = (typeof SyncType)[keyof typeof SyncType];

// ─── Sync Log Status ─────────────────────────────────────────────────────────

export const SyncLogStatus = {
  STARTED: "started",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type SyncLogStatus = (typeof SyncLogStatus)[keyof typeof SyncLogStatus];

// ─── Notification Type ───────────────────────────────────────────────────────

export const NotificationType = {
  ATTENDANCE_ALERT: "attendance_alert",
  NEW_MARKS: "new_marks",
  TIMETABLE_CHANGE: "timetable_change",
  SYNC_ERROR: "sync_error",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
