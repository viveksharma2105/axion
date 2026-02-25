import { MarksPage } from "@/features/marks/components/marks-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/marks")({
  component: MarksPage,
});
