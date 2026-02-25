import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const timetableEntrySchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  courseCode: z.string().nullable(),
  courseName: z.string().nullable(),
  facultyName: z.string().nullable(),
  room: z.string().nullable(),
  section: z.string().nullable(),
});

export type TimetableEntryResponse = z.infer<typeof timetableEntrySchema>;
