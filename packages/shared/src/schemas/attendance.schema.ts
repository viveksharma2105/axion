import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const attendanceRecordSchema = z.object({
  id: z.string().uuid(),
  courseCode: z.string(),
  courseName: z.string().nullable(),
  totalLectures: z.number().int(),
  totalPresent: z.number().int(),
  totalAbsent: z.number().int(),
  totalLoa: z.number().int(),
  totalOnDuty: z.number().int(),
  percentage: z.number().nullable(),
  syncedAt: z.string(),
});

export type AttendanceRecordResponse = z.infer<typeof attendanceRecordSchema>;

export const attendanceProjectionSchema = z.object({
  courseCode: z.string(),
  courseName: z.string().nullable(),
  currentPercentage: z.number(),
  totalLectures: z.number().int(),
  totalPresent: z.number().int(),
  classesNeededForThreshold: z.number().int(),
  canReachThreshold: z.boolean(),
  classesCanSkip: z.number().int(),
});

export type AttendanceProjectionResponse = z.infer<
  typeof attendanceProjectionSchema
>;

// ─── Query params ────────────────────────────────────────────────────────────

export const attendanceHistoryQuerySchema = z.object({
  courseCode: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type AttendanceHistoryQuery = z.infer<
  typeof attendanceHistoryQuerySchema
>;
