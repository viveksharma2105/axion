import type { GpaSummary, Mark } from "@/domain/entities";

export interface BulkInsertMarkInput {
  collegeLinkId: string;
  courseCode: string;
  courseName: string | null;
  examType: string | null;
  maxMarks: number | null;
  obtainedMarks: number | null;
  grade: string | null;
  sgpa: number | null;
  cgpa: number | null;
  semester: string | null;
  rawData: unknown;
  syncedAt: Date;
}

export interface IMarksRepository {
  /** Get all marks for a college link, optionally filtered. */
  findByCollegeLink(
    collegeLinkId: string,
    options?: { semester?: string; examType?: string },
  ): Promise<Mark[]>;

  /** Get GPA summary (latest SGPA/CGPA). */
  getGpaSummary(collegeLinkId: string): Promise<GpaSummary>;

  /**
   * Replace all marks for a college link.
   * Deletes old records and inserts new ones.
   */
  replaceAll(
    collegeLinkId: string,
    records: BulkInsertMarkInput[],
  ): Promise<void>;

  /** Delete all marks for a college link. */
  deleteByCollegeLink(collegeLinkId: string): Promise<void>;
}
