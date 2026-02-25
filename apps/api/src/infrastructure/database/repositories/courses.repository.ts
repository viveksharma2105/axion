import type {
  ICoursesRepository,
  UpsertCourseInput,
} from "@/application/ports/repositories";
import type { Course } from "@/domain/entities";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { courses } from "../schema";

type CourseRow = typeof courses.$inferSelect;

function toEntity(row: CourseRow): Course {
  return {
    id: row.id,
    collegeLinkId: row.collegeLinkId,
    courseCode: row.courseCode,
    courseName: row.courseName,
    credits: row.credits ? Number(row.credits) : null,
    facultyName: row.facultyName ?? null,
    section: row.section ?? null,
    semester: row.semester ?? null,
    rawData: row.rawData,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
  };
}

export class CoursesRepository implements ICoursesRepository {
  async findByCollegeLink(collegeLinkId: string): Promise<Course[]> {
    const rows = await db.query.courses.findMany({
      where: eq(courses.collegeLinkId, collegeLinkId),
    });
    return rows.map(toEntity);
  }

  async replaceAll(
    collegeLinkId: string,
    records: UpsertCourseInput[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(courses).where(eq(courses.collegeLinkId, collegeLinkId));

      if (records.length > 0) {
        await tx.insert(courses).values(
          records.map((r) => ({
            collegeLinkId: r.collegeLinkId,
            courseCode: r.courseCode,
            courseName: r.courseName,
            credits: r.credits?.toString(),
            facultyName: r.facultyName,
            section: r.section,
            semester: r.semester,
            rawData: r.rawData,
            syncedAt: r.syncedAt,
          })),
        );
      }
    });
  }

  async deleteByCollegeLink(collegeLinkId: string): Promise<void> {
    await db.delete(courses).where(eq(courses.collegeLinkId, collegeLinkId));
  }
}
