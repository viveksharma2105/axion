import type {
  CreateCollegeLinkInput,
  ICollegeLinkRepository,
  UpdateCollegeLinkSyncInput,
} from "@/application/ports/repositories";
import type { CollegeLink, CollegeLinkWithCollege } from "@/domain/entities";
import type { SyncStatus } from "@/domain/value-objects";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { collegeLinks } from "../schema";

type CollegeLinkRow = typeof collegeLinks.$inferSelect;

function toEntity(row: CollegeLinkRow): CollegeLink {
  return {
    id: row.id,
    userId: row.userId,
    collegeId: row.collegeId,
    encryptedUsername: row.encryptedUsername,
    encryptedPassword: row.encryptedPassword,
    encryptionIv: row.encryptionIv,
    encryptionAuthTag: row.encryptionAuthTag,
    collegeUserId: row.collegeUserId,
    collegeToken: row.collegeToken,
    tokenExpiresAt: row.tokenExpiresAt,
    lastSyncAt: row.lastSyncAt,
    syncStatus: row.syncStatus as SyncStatus,
    syncError: row.syncError,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toEntityWithCollege(
  row: CollegeLinkRow,
  college: { name: string; slug: string },
): CollegeLinkWithCollege {
  return {
    ...toEntity(row),
    collegeName: college.name,
    collegeSlug: college.slug,
  };
}

export class CollegeLinkRepository implements ICollegeLinkRepository {
  async findById(id: string): Promise<CollegeLink | null> {
    const row = await db.query.collegeLinks.findFirst({
      where: eq(collegeLinks.id, id),
    });
    return row ? toEntity(row) : null;
  }

  async findByIdWithCollege(
    id: string,
  ): Promise<CollegeLinkWithCollege | null> {
    const row = await db.query.collegeLinks.findFirst({
      where: eq(collegeLinks.id, id),
      with: { college: true },
    });
    if (!row) return null;
    return toEntityWithCollege(row, row.college);
  }

  async findByUserAndCollege(
    userId: string,
    collegeId: string,
  ): Promise<CollegeLink | null> {
    const row = await db.query.collegeLinks.findFirst({
      where: and(
        eq(collegeLinks.userId, userId),
        eq(collegeLinks.collegeId, collegeId),
      ),
    });
    return row ? toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<CollegeLinkWithCollege[]> {
    const rows = await db.query.collegeLinks.findMany({
      where: and(
        eq(collegeLinks.userId, userId),
        eq(collegeLinks.isActive, true),
      ),
      with: { college: true },
    });
    return rows.map((r) => toEntityWithCollege(r, r.college));
  }

  async findAllActive(): Promise<CollegeLink[]> {
    const rows = await db.query.collegeLinks.findMany({
      where: eq(collegeLinks.isActive, true),
    });
    return rows.map(toEntity);
  }

  async create(input: CreateCollegeLinkInput): Promise<CollegeLink> {
    const [row] = await db
      .insert(collegeLinks)
      .values({
        userId: input.userId,
        collegeId: input.collegeId,
        encryptedUsername: input.encryptedUsername,
        encryptedPassword: input.encryptedPassword,
        encryptionIv: input.encryptionIv,
        encryptionAuthTag: input.encryptionAuthTag,
        collegeUserId: input.collegeUserId,
        collegeToken: input.collegeToken,
        tokenExpiresAt: input.tokenExpiresAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create college link");
    }

    return toEntity(row);
  }

  async updateSync(
    id: string,
    input: UpdateCollegeLinkSyncInput,
  ): Promise<void> {
    await db
      .update(collegeLinks)
      .set({
        syncStatus: input.syncStatus,
        lastSyncAt: input.lastSyncAt,
        syncError: input.syncError,
        collegeToken: input.collegeToken,
        tokenExpiresAt: input.tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(collegeLinks.id, id));
  }

  async deactivate(id: string): Promise<void> {
    await db
      .update(collegeLinks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(collegeLinks.id, id));
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(collegeLinks)
      .where(and(eq(collegeLinks.id, id), eq(collegeLinks.userId, userId)))
      .returning({ id: collegeLinks.id });
    return result.length > 0;
  }
}
