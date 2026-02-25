import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const markRecordSchema = z.object({
  id: z.string().uuid(),
  courseCode: z.string(),
  courseName: z.string().nullable(),
  examType: z.string().nullable(),
  maxMarks: z.number().nullable(),
  obtainedMarks: z.number().nullable(),
  grade: z.string().nullable(),
  sgpa: z.number().nullable(),
  cgpa: z.number().nullable(),
  semester: z.string().nullable(),
  syncedAt: z.string(),
});

export type MarkRecordResponse = z.infer<typeof markRecordSchema>;

export const gpaSummarySchema = z.object({
  latestSgpa: z.number().nullable(),
  latestCgpa: z.number().nullable(),
  semester: z.string().nullable(),
});

export type GpaSummaryResponse = z.infer<typeof gpaSummarySchema>;

// ─── Query params ────────────────────────────────────────────────────────────

export const marksQuerySchema = z.object({
  semester: z.string().optional(),
  examType: z.string().optional(),
});

export type MarksQuery = z.infer<typeof marksQuerySchema>;
