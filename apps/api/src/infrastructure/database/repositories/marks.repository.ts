import type {
  BulkInsertMarkInput,
  IMarksRepository,
} from "@/application/ports/repositories";
import type { GpaSummary, Mark } from "@/domain/entities";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { marks } from "../schema";

type MarkRow = typeof marks.$inferSelect;

function toEntity(row: MarkRow): Mark {
  return {
    id: row.id,
    collegeLinkId: row.collegeLinkId,
    courseCode: row.courseCode,
    courseName: row.courseName ?? null,
    examType: row.examType ?? null,
    maxMarks: row.maxMarks ? Number(row.maxMarks) : null,
    obtainedMarks: row.obtainedMarks ? Number(row.obtainedMarks) : null,
    grade: row.grade ?? null,
    sgpa: row.sgpa ? Number(row.sgpa) : null,
    cgpa: row.cgpa ? Number(row.cgpa) : null,
    semester: row.semester ?? null,
    rawData: row.rawData,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
  };
}

export class MarksRepository implements IMarksRepository {
  async findByCollegeLink(
    collegeLinkId: string,
    options?: { semester?: string; examType?: string },
  ): Promise<Mark[]> {
    const conditions = [eq(marks.collegeLinkId, collegeLinkId)];

    if (options?.semester) {
      conditions.push(eq(marks.semester, options.semester));
    }
    if (options?.examType) {
      conditions.push(eq(marks.examType, options.examType));
    }

    const rows = await db.query.marks.findMany({
      where: and(...conditions),
      orderBy: [desc(marks.syncedAt)],
    });

    return rows.map(toEntity);
  }

  async getGpaSummary(collegeLinkId: string): Promise<GpaSummary> {
    // Get the most recent mark record that has SGPA/CGPA
    const row = await db.query.marks.findFirst({
      where: eq(marks.collegeLinkId, collegeLinkId),
      orderBy: [desc(marks.syncedAt)],
    });

    if (!row) {
      return { latestSgpa: null, latestCgpa: null, semester: null };
    }

    return {
      latestSgpa: row.sgpa ? Number(row.sgpa) : null,
      latestCgpa: row.cgpa ? Number(row.cgpa) : null,
      semester: row.semester ?? null,
    };
  }

  async replaceAll(
    collegeLinkId: string,
    records: BulkInsertMarkInput[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(marks).where(eq(marks.collegeLinkId, collegeLinkId));

      if (records.length > 0) {
        await tx.insert(marks).values(
          records.map((r) => ({
            collegeLinkId: r.collegeLinkId,
            courseCode: r.courseCode,
            courseName: r.courseName,
            examType: r.examType,
            maxMarks: r.maxMarks?.toString(),
            obtainedMarks: r.obtainedMarks?.toString(),
            grade: r.grade,
            sgpa: r.sgpa?.toString(),
            cgpa: r.cgpa?.toString(),
            semester: r.semester,
            rawData: r.rawData,
            syncedAt: r.syncedAt,
          })),
        );
      }
    });
  }

  async deleteByCollegeLink(collegeLinkId: string): Promise<void> {
    await db.delete(marks).where(eq(marks.collegeLinkId, collegeLinkId));
  }
}
