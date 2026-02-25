import type { Attendance } from "@/domain/entities";

export interface BulkUpsertAttendanceInput {
  collegeLinkId: string;
  courseCode: string;
  courseName: string | null;
  totalLectures: number;
  totalPresent: number;
  totalAbsent: number;
  totalLoa: number;
  totalOnDuty: number;
  percentage: number | null;
  rawData: unknown;
  syncedAt: Date;
}

export interface IAttendanceRepository {
  /** Get the latest attendance records for a college link. */
  findLatestByCollegeLink(collegeLinkId: string): Promise<Attendance[]>;

  /**
   * Get historical attendance snapshots for a college link,
   * optionally filtered by course code.
   */
  findHistory(
    collegeLinkId: string,
    options?: { courseCode?: string; limit?: number },
  ): Promise<Attendance[]>;

  /** Bulk insert attendance records (one snapshot per sync). */
  bulkInsert(records: BulkUpsertAttendanceInput[]): Promise<void>;

  /** Delete all attendance records for a college link. */
  deleteByCollegeLink(collegeLinkId: string): Promise<void>;
}
