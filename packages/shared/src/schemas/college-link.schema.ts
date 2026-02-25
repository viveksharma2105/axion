import { z } from "zod";

// ─── Request schemas ─────────────────────────────────────────────────────────

export const linkCollegeSchema = z.object({
  collegeSlug: z.string().min(1, "College slug is required").max(50),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LinkCollegeInput = z.infer<typeof linkCollegeSchema>;

// ─── Response schemas ────────────────────────────────────────────────────────

export const collegeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  attendanceThreshold: z.number(),
  isActive: z.boolean(),
});

export type CollegeResponse = z.infer<typeof collegeSchema>;

export const collegeLinkSchema = z.object({
  id: z.string().uuid(),
  collegeId: z.string().uuid(),
  collegeName: z.string(),
  collegeSlug: z.string(),
  lastSyncAt: z.string().nullable(),
  syncStatus: z.enum(["pending", "syncing", "success", "failed"]),
  syncError: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type CollegeLinkResponse = z.infer<typeof collegeLinkSchema>;
