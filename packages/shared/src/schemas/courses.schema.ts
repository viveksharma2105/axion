import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const courseRecordSchema = z.object({
  id: z.string().uuid(),
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number().nullable(),
  facultyName: z.string().nullable(),
  section: z.string().nullable(),
  semester: z.string().nullable(),
  syncedAt: z.string(),
});

export const coursesResponseSchema = z.object({
  courses: z.array(courseRecordSchema),
  lastSyncAt: z.string().nullable(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CourseRecord = z.infer<typeof courseRecordSchema>;
export type CoursesResponse = z.infer<typeof coursesResponseSchema>;
