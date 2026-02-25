import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  component: lazyRouteComponent(
    () => import("@/features/dashboard/components/dashboard-page"),
    "DashboardPage",
  ),
});
