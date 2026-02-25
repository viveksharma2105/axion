import type { College } from "@/domain/entities";

export interface ICollegeRepository {
  /** Find a college by its UUID. */
  findById(id: string): Promise<College | null>;

  /** Find a college by its slug (e.g., "ncu"). */
  findBySlug(slug: string): Promise<College | null>;

  /** List all active colleges. */
  listActive(): Promise<College[]>;
}
