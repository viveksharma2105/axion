import type { Notification } from "@/domain/entities";
import type { NotificationType } from "@/domain/value-objects";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: unknown;
}

export interface INotificationRepository {
  /** Get notifications for a user, ordered by most recent. */
  findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]>;

  /** Count total notifications for a user. */
  countByUserId(userId: string): Promise<number>;

  /** Count unread notifications for a user. */
  countUnreadByUserId(userId: string): Promise<number>;

  /** Create a notification. */
  create(input: CreateNotificationInput): Promise<Notification>;

  /** Mark a single notification as read. */
  markAsRead(id: string, userId: string): Promise<boolean>;

  /** Mark all notifications as read for a user. */
  markAllAsRead(userId: string): Promise<void>;
}
