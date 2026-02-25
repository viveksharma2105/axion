import { TimetablePage } from "@/features/timetable/components/timetable-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/timetable")({
  component: TimetablePage,
});
