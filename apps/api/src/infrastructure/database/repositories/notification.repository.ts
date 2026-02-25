import type {
  CreateNotificationInput,
  INotificationRepository,
} from "@/application/ports/repositories";
import type { Notification } from "@/domain/entities";
import type { NotificationType } from "@/domain/value-objects";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../schema";

type NotificationRow = typeof notifications.$inferSelect;

function toEntity(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body ?? null,
    metadata: row.metadata,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

export class NotificationRepository implements INotificationRepository {
  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
    });
    return rows.map(toEntity);
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return result[0]?.value ?? 0;
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    const result = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
    return result[0]?.value ?? 0;
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create notification");
    }

    return toEntity(row);
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return result.length > 0;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
  }
}
