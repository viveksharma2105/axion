import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: lazyRouteComponent(
    () => import("@/features/notifications/components/notifications-page"),
    "NotificationsPage",
  ),
});
