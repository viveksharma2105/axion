import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "attendance_alert",
    "new_marks",
    "timetable_change",
    "sync_error",
  ]),
  title: z.string(),
  body: z.string().nullable(),
  metadata: z.unknown(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number().int(),
  total: z.number().int(),
});

// ─── Request schemas ─────────────────────────────────────────────────────────

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type NotificationResponse = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
