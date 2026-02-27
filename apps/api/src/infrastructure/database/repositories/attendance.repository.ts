import type {
  BulkUpsertAttendanceInput,
  IAttendanceRepository,
} from "@/application/ports/repositories";
import type { Attendance } from "@/domain/entities";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { attendances } from "../schema";

type AttendanceRow = typeof attendances.$inferSelect;

function toEntity(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    collegeLinkId: row.collegeLinkId,
    courseCode: row.courseCode,
    courseName: row.courseName ?? null,
    totalLectures: row.totalLectures,
    totalPresent: row.totalPresent,
    totalAbsent: row.totalAbsent,
    totalLoa: row.totalLoa,
    totalOnDuty: row.totalOnDuty,
    percentage: row.percentage ? Number(row.percentage) : null,
    rawData: row.rawData,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
  };
}

export class AttendanceRepository implements IAttendanceRepository {
  async findLatestByCollegeLink(collegeLinkId: string): Promise<Attendance[]> {
    // Get the most recent syncedAt timestamp.
    // sql<string> because the pg driver returns MAX(timestamp) as a string,
    // not a Date object — we must wrap it in new Date() before using it
    // in a Drizzle eq() comparison (which calls .toISOString()).
    const latestSync = await db
      .select({ maxSynced: sql<string>`MAX(${attendances.syncedAt})` })
      .from(attendances)
      .where(eq(attendances.collegeLinkId, collegeLinkId));

    const maxSyncedRaw = latestSync[0]?.maxSynced;
    if (!maxSyncedRaw) return [];

    const maxSynced = new Date(maxSyncedRaw);

    const rows = await db.query.attendances.findMany({
      where: and(
        eq(attendances.collegeLinkId, collegeLinkId),
        eq(attendances.syncedAt, maxSynced),
      ),
    });

    return rows.map(toEntity);
  }

  async findHistory(
    collegeLinkId: string,
    options?: { courseCode?: string; limit?: number },
  ): Promise<Attendance[]> {
    const conditions = [eq(attendances.collegeLinkId, collegeLinkId)];

    if (options?.courseCode) {
      conditions.push(eq(attendances.courseCode, options.courseCode));
    }

    const rows = await db.query.attendances.findMany({
      where: and(...conditions),
      orderBy: [desc(attendances.syncedAt)],
      limit: options?.limit ?? 30,
    });

    return rows.map(toEntity);
  }

  async bulkInsert(records: BulkUpsertAttendanceInput[]): Promise<void> {
    if (records.length === 0) return;

    await db.insert(attendances).values(
      records.map((r) => ({
        collegeLinkId: r.collegeLinkId,
        courseCode: r.courseCode,
        courseName: r.courseName,
        totalLectures: r.totalLectures,
        totalPresent: r.totalPresent,
        totalAbsent: r.totalAbsent,
        totalLoa: r.totalLoa,
        totalOnDuty: r.totalOnDuty,
        percentage: r.percentage?.toString(),
        rawData: r.rawData,
        syncedAt: r.syncedAt,
      })),
    );
  }

  async deleteByCollegeLink(collegeLinkId: string): Promise<void> {
    await db
      .delete(attendances)
      .where(eq(attendances.collegeLinkId, collegeLinkId));
  }
}
