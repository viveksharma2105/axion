import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/timetable")({
  component: lazyRouteComponent(
    () => import("@/features/timetable/components/timetable-page"),
    "TimetablePage",
  ),
});
