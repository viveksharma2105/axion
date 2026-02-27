import {
  createTriggerManualSyncUseCase,
  getCollegeLinksUseCase,
  linkCollegeUseCase,
  unlinkCollegeUseCase,
} from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { linkCollegeSchema } from "@axion/shared";
import { Hono } from "hono";

/**
 * Factory to create college link routes.
 *
 * Accepts an optional `enqueueSyncJob` so that:
 * 1. POST / (link) can trigger an initial sync immediately
 * 2. POST /:id/sync (manual sync) can enqueue a sync job
 *
 * When not provided (e.g., in tests), linking/sync still works but
 * no background jobs are enqueued.
 *
 * IMPORTANT: All routes live on this single Hono sub-app so that the
 * parent app's `onError(errorHandler)` catches all errors (domain errors,
 * auth errors, BullMQ errors, etc.) and maps them to proper HTTP responses.
 * Previously the sync route was a separate Hono instance mounted in index.ts,
 * which meant errors bypassed the global error handler → 500.
 *
 * GET    /             — list user's linked colleges
 * POST   /             — link a new college account (+ enqueue initial sync)
 * DELETE /:id          — unlink a college account
 * POST   /:id/sync     — trigger manual sync
 */
export function createCollegeLinkRoutes(
  enqueueSyncJob?: (collegeLinkId: string) => Promise<void>,
) {
  const routes = new Hono<{ Variables: AuthVariables }>()
    .use("*", authMiddleware)
    .get("/", async (c) => {
      const userId = c.get("userId");
      const links = await getCollegeLinksUseCase.execute(userId);
      return c.json({
        data: links.map((link) => ({
          id: link.id,
          collegeId: link.collegeId,
          collegeName: link.collegeName,
          collegeSlug: link.collegeSlug,
          lastSyncAt: link.lastSyncAt?.toISOString() ?? null,
          syncStatus: link.syncStatus,
          syncError: link.syncError,
          isActive: link.isActive,
          createdAt: link.createdAt.toISOString(),
        })),
      });
    })
    .post("/", async (c) => {
      const userId = c.get("userId");
      const body = await c.req.json();
      const input = linkCollegeSchema.parse(body);

      const link = await linkCollegeUseCase.execute({
        userId,
        collegeSlug: input.collegeSlug,
        username: input.username,
        password: input.password,
      });

      // Trigger initial sync immediately so the user doesn't stay on "pending"
      if (enqueueSyncJob) {
        await enqueueSyncJob(link.id).catch((err) => {
          console.error(
            `[CollegeLinkRoutes] Failed to enqueue initial sync for ${link.id}:`,
            err,
          );
          // Non-fatal — the link was still created successfully.
          // The cron scheduler will pick it up later.
        });
      }

      return c.json(
        {
          data: {
            id: link.id,
            collegeId: link.collegeId,
            syncStatus: link.syncStatus,
            createdAt: link.createdAt.toISOString(),
          },
        },
        201,
      );
    })
    .delete("/:id", async (c) => {
      const userId = c.get("userId");
      const collegeLinkId = c.req.param("id");

      await unlinkCollegeUseCase.execute(collegeLinkId, userId);
      return c.json({ data: { success: true } });
    });

  // ─── Manual sync route ─────────────────────────────────────────────────
  // Only wire up if enqueueSyncJob is provided (i.e., BullMQ is available)
  if (enqueueSyncJob) {
    const triggerManualSyncUseCase =
      createTriggerManualSyncUseCase(enqueueSyncJob);

    routes.post("/:id/sync", async (c) => {
      const userId = c.get("userId");
      const collegeLinkId = c.req.param("id");

      await triggerManualSyncUseCase.execute(collegeLinkId, userId);
      return c.json({ data: { success: true, message: "Sync job enqueued" } });
    });
  }

  return routes;
}

/**
 * @deprecated Use createCollegeLinkRoutes() instead.
 * Kept for backward compat during migration — creates routes without initial sync.
 */
export const collegeLinkRoutes = createCollegeLinkRoutes();
