import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/courses")({
  component: lazyRouteComponent(
    () => import("@/features/courses/components/courses-page"),
    "CoursesPage",
  ),
});
