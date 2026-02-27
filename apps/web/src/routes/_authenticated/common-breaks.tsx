import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/common-breaks")({
  component: lazyRouteComponent(
    () => import("@/features/common-breaks/components/common-breaks-page"),
    "CommonBreaksPage",
  ),
});
