import type { INotificationRepository } from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import type { Notification } from "@/domain/entities";

export interface GetNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

/**
 * Get paginated notifications for the authenticated user.
 */
export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<GetNotificationsResult> {
    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationRepo.findByUserId(userId, options),
      this.notificationRepo.countByUserId(userId),
      this.getUnreadCount(userId),
    ]);

    return { notifications, unreadCount, total };
  }

  private async getUnreadCount(userId: string): Promise<number> {
    const cached = await this.cacheService.get<number>(
      "user:notifications:count",
      userId,
    );
    if (cached !== null) return cached;

    const count = await this.notificationRepo.countUnreadByUserId(userId);
    await this.cacheService.setWithTTL(
      "user:notifications:count",
      userId,
      count,
      5 * 60,
    );
    return count;
  }
}

/**
 * Mark a single notification as read.
 */
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.notificationRepo.markAsRead(
      notificationId,
      userId,
    );
    if (result) {
      await this.cacheService.invalidateNotificationCount(userId);
    }
    return result;
  }
}

/**
 * Mark all notifications as read for the user.
 */
export class MarkAllNotificationsReadUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);
    await this.cacheService.invalidateNotificationCount(userId);
  }
}
