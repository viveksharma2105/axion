import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const timetableEntrySchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  /** ISO date "YYYY-MM-DD" for the specific lecture date */
  lectureDate: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  courseCode: z.string().nullable(),
  courseName: z.string().nullable(),
  facultyName: z.string().nullable(),
  room: z.string().nullable(),
  section: z.string().nullable(),
});

export type TimetableEntryResponse = z.infer<typeof timetableEntrySchema>;

// ─── Common breaks (compare timetables) ──────────────────────────────────────

export const compareRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type CompareRequest = z.infer<typeof compareRequestSchema>;

export const commonBreakSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number(),
});

export type CommonBreak = z.infer<typeof commonBreakSchema>;

export const dayBreaksSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  dayName: z.string(),
  breaks: z.array(commonBreakSchema),
});

export type DayBreaks = z.infer<typeof dayBreaksSchema>;

export const compareResponseSchema = z.object({
  data: z.object({
    commonBreaks: z.array(dayBreaksSchema),
    friendTimetable: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        courseCode: z.string(),
        courseName: z.string(),
        facultyName: z.string().optional(),
        room: z.string().optional(),
        section: z.string().optional(),
      }),
    ),
  }),
});

export type CompareResponse = z.infer<typeof compareResponseSchema>;
