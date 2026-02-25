import { AttendancePage } from "@/features/attendance/components/attendance-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});
