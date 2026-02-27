import { z } from "zod";

// ─── Response schemas ────────────────────────────────────────────────────────

export const studentProfileSchema = z.object({
  rollNo: z.string().nullable(),
  studentName: z.string().nullable(),
  semester: z.number().nullable(),
  programmeName: z.string().nullable(),
  degreeLevel: z.string().nullable(),
  fatherName: z.string().nullable(),
  mobileNo: z.string().nullable(),
  section: z.string().nullable(),
  studentImage: z.string().nullable(),
});

export const studentProfileResponseSchema = z.object({
  profile: studentProfileSchema.nullable(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type StudentProfileResponse = z.infer<typeof studentProfileSchema>;
export type StudentProfileApiResponse = z.infer<
  typeof studentProfileResponseSchema
>;
