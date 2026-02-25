import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/login")({
  component: lazyRouteComponent(
    () => import("@/features/landing/components/landing-page"),
    "LandingPage",
  ),
});
