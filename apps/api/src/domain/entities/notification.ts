/**
 * Notification entity — an in-app notification for a user.
 */
import type { NotificationType } from "../value-objects";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  metadata: unknown;
  isRead: boolean;
  createdAt: Date;
}
