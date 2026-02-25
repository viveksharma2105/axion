import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: lazyRouteComponent(
    () => import("@/features/attendance/components/attendance-page"),
    "AttendancePage",
  ),
});
