import type {
  ITimetableRepository,
  UpsertTimetableInput,
} from "@/application/ports/repositories";
import type { TimetableEntry } from "@/domain/entities";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { timetables } from "../schema";

type TimetableRow = typeof timetables.$inferSelect;

function toEntity(row: TimetableRow): TimetableEntry {
  return {
    id: row.id,
    collegeLinkId: row.collegeLinkId,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    courseCode: row.courseCode ?? null,
    courseName: row.courseName ?? null,
    facultyName: row.facultyName ?? null,
    room: row.room ?? null,
    section: row.section ?? null,
    rawData: row.rawData,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
  };
}

export class TimetableRepository implements ITimetableRepository {
  async findByCollegeLink(collegeLinkId: string): Promise<TimetableEntry[]> {
    const rows = await db.query.timetables.findMany({
      where: eq(timetables.collegeLinkId, collegeLinkId),
      orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
    });
    return rows.map(toEntity);
  }

  async findByDay(
    collegeLinkId: string,
    dayOfWeek: number,
  ): Promise<TimetableEntry[]> {
    const rows = await db.query.timetables.findMany({
      where: and(
        eq(timetables.collegeLinkId, collegeLinkId),
        eq(timetables.dayOfWeek, dayOfWeek),
      ),
      orderBy: (t, { asc }) => [asc(t.startTime)],
    });
    return rows.map(toEntity);
  }

  async replaceAll(
    collegeLinkId: string,
    entries: UpsertTimetableInput[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(timetables)
        .where(eq(timetables.collegeLinkId, collegeLinkId));

      if (entries.length > 0) {
        await tx.insert(timetables).values(
          entries.map((e) => ({
            collegeLinkId: e.collegeLinkId,
            dayOfWeek: e.dayOfWeek,
            startTime: e.startTime,
            endTime: e.endTime,
            courseCode: e.courseCode,
            courseName: e.courseName,
            facultyName: e.facultyName,
            room: e.room,
            section: e.section,
            rawData: e.rawData,
            syncedAt: e.syncedAt,
          })),
        );
      }
    });
  }

  async deleteByCollegeLink(collegeLinkId: string): Promise<void> {
    await db
      .delete(timetables)
      .where(eq(timetables.collegeLinkId, collegeLinkId));
  }
}
