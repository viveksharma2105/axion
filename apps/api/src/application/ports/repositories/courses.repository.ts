import type { Course } from "@/domain/entities";

export interface UpsertCourseInput {
  collegeLinkId: string;
  courseCode: string;
  courseName: string;
  credits: number | null;
  facultyName: string | null;
  section: string | null;
  semester: string | null;
  rawData: unknown;
  syncedAt: Date;
}

export interface ICoursesRepository {
  /** Get all courses for a college link. */
  findByCollegeLink(collegeLinkId: string): Promise<Course[]>;

  /**
   * Replace all courses for a college link.
   * Deletes old records and inserts new ones.
   */
  replaceAll(
    collegeLinkId: string,
    courses: UpsertCourseInput[],
  ): Promise<void>;

  /** Delete all courses for a college link. */
  deleteByCollegeLink(collegeLinkId: string): Promise<void>;
}
