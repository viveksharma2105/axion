import { CoursesPage } from "@/features/courses/components/courses-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/courses")({
  component: CoursesPage,
});
