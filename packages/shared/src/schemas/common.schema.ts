import { z } from "zod";

/** Standard API error response shape. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.array(z.string())).optional(),
  }),
});

/** Standard paginated query params. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
