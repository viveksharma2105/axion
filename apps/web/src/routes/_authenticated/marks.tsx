import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/marks")({
  component: lazyRouteComponent(
    () => import("@/features/marks/components/marks-page"),
    "MarksPage",
  ),
});
