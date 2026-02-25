import {
  getNotificationsUseCase,
  markAllNotificationsReadUseCase,
  markNotificationReadUseCase,
} from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { paginationSchema } from "@axion/shared";
import { Hono } from "hono";

/**
 * Notification routes — all require authentication.
 *
 * GET   /            — paginated notifications
 * PATCH /:id/read    — mark single notification as read
 * PATCH /read-all    — mark all notifications as read
 */
export const notificationRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const { page, limit } = paginationSchema.parse(c.req.query());
    const offset = (page - 1) * limit;

    const result = await getNotificationsUseCase.execute(userId, {
      limit,
      offset,
    });

    return c.json({
      data: result.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        metadata: n.metadata,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount: result.unreadCount,
      total: result.total,
      page,
      limit,
      hasMore: offset + limit < result.total,
    });
  })
  .patch("/read-all", async (c) => {
    const userId = c.get("userId");
    await markAllNotificationsReadUseCase.execute(userId);
    return c.json({ data: { success: true } });
  })
  .patch("/:id/read", async (c) => {
    const userId = c.get("userId");
    const notificationId = c.req.param("id");

    const updated = await markNotificationReadUseCase.execute(
      notificationId,
      userId,
    );

    return c.json({ data: { success: updated } });
  });
