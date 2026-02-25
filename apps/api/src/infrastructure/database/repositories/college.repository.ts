import type { ICollegeRepository } from "@/application/ports/repositories";
import type { College } from "@/domain/entities";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { colleges } from "../schema";

function toEntity(row: typeof colleges.$inferSelect): College {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    adapterId: row.adapterId,
    config: (row.config ?? {}) as Record<string, unknown>,
    attendanceThreshold: Number(row.attendanceThreshold) || 75,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CollegeRepository implements ICollegeRepository {
  async findById(id: string): Promise<College | null> {
    const row = await db.query.colleges.findFirst({
      where: eq(colleges.id, id),
    });
    return row ? toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<College | null> {
    const row = await db.query.colleges.findFirst({
      where: eq(colleges.slug, slug),
    });
    return row ? toEntity(row) : null;
  }

  async listActive(): Promise<College[]> {
    const rows = await db.query.colleges.findMany({
      where: eq(colleges.isActive, true),
    });
    return rows.map(toEntity);
  }
}
