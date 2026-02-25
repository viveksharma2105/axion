import type { CollegeAuthResult } from "@/application/ports/college-adapter.port";
import type {
  IAttendanceRepository,
  ICollegeLinkRepository,
  ICollegeRepository,
  ICoursesRepository,
  IMarksRepository,
  ISyncLogRepository,
  ITimetableRepository,
} from "@/application/ports/repositories";
import type {
  ICacheService,
  ICollegeAdapterService,
  IEncryptionService,
} from "@/application/ports/services";
import {
  CollegeLinkNotFoundError,
  SyncFailedError,
  SyncInProgressError,
} from "@/domain/errors";
import { SyncLogStatus, SyncStatus, SyncType } from "@/domain/value-objects";

/**
 * Sync all data from the college API for a given college link.
 *
 * 1. Decrypt credentials
 * 2. Login to college API (or reuse cached token)
 * 3. Fetch all data (attendance, timetable, marks, courses)
 * 4. Upsert into Postgres
 * 5. Invalidate Redis cache
 * 6. Log sync result
 */
export class SyncCollegeLinkUseCase {
  constructor(
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly collegeRepo: ICollegeRepository,
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly timetableRepo: ITimetableRepository,
    private readonly marksRepo: IMarksRepository,
    private readonly coursesRepo: ICoursesRepository,
    private readonly syncLogRepo: ISyncLogRepository,
    private readonly adapterService: ICollegeAdapterService,
    private readonly encryptionService: IEncryptionService,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(collegeLinkId: string): Promise<void> {
    const link = await this.collegeLinkRepo.findById(collegeLinkId);
    if (!link || !link.isActive) {
      throw new CollegeLinkNotFoundError(collegeLinkId);
    }

    if (link.syncStatus === SyncStatus.SYNCING) {
      throw new SyncInProgressError();
    }

    const college = await this.collegeRepo.findById(link.collegeId);
    if (!college) {
      throw new SyncFailedError(`College not found for link ${collegeLinkId}`);
    }

    const adapter = this.adapterService.getOrThrow(college.adapterId);
    const startedAt = new Date();

    // Create sync log
    const syncLog = await this.syncLogRepo.create({
      collegeLinkId: link.id,
      syncType: SyncType.FULL,
      status: SyncLogStatus.STARTED,
      startedAt,
    });

    // Mark as syncing
    await this.collegeLinkRepo.updateSync(link.id, {
      syncStatus: SyncStatus.SYNCING,
    });

    try {
      // 1. Decrypt credentials
      const [usernameIv, passwordIv] = link.encryptionIv.split(":");
      const [usernameAuthTag, passwordAuthTag] =
        link.encryptionAuthTag.split(":");

      if (!usernameIv || !passwordIv || !usernameAuthTag || !passwordAuthTag) {
        throw new SyncFailedError("Invalid encryption metadata");
      }

      const username = this.encryptionService.decrypt(
        link.encryptedUsername,
        usernameIv,
        usernameAuthTag,
      );
      const password = this.encryptionService.decrypt(
        link.encryptedPassword,
        passwordIv,
        passwordAuthTag,
      );

      // 2. Login to college API
      let auth: CollegeAuthResult;
      if (
        link.collegeToken &&
        link.tokenExpiresAt &&
        link.tokenExpiresAt > new Date()
      ) {
        auth = {
          token: link.collegeToken,
          collegeUserId: link.collegeUserId ?? undefined,
        };
      } else {
        auth = await adapter.login({ username, password });
      }

      const syncedAt = new Date();

      // 3. Fetch all data in parallel
      const [attendanceData, timetableData, marksData, coursesData] =
        await Promise.all([
          adapter.getAttendance(auth).catch(() => []),
          adapter.getTimetable(auth).catch(() => []),
          adapter.getMarks(auth).catch(() => []),
          adapter.getCourses(auth).catch(() => []),
        ]);

      // 4. Upsert into Postgres
      if (attendanceData.length > 0) {
        await this.attendanceRepo.bulkInsert(
          attendanceData.map((a) => ({
            collegeLinkId: link.id,
            courseCode: a.courseCode,
            courseName: a.courseName,
            totalLectures: a.totalLectures,
            totalPresent: a.totalPresent,
            totalAbsent: a.totalAbsent,
            totalLoa: a.totalLOA,
            totalOnDuty: a.totalOnDuty,
            percentage: a.percentage,
            rawData: a.raw,
            syncedAt,
          })),
        );
      }

      if (timetableData.length > 0) {
        await this.timetableRepo.replaceAll(
          link.id,
          timetableData.map((t) => ({
            collegeLinkId: link.id,
            dayOfWeek: t.dayOfWeek,
            startTime: t.startTime,
            endTime: t.endTime,
            courseCode: t.courseCode,
            courseName: t.courseName,
            facultyName: t.facultyName ?? null,
            room: t.room ?? null,
            section: t.section ?? null,
            rawData: t.raw,
            syncedAt,
          })),
        );
      }

      if (marksData.length > 0) {
        await this.marksRepo.replaceAll(
          link.id,
          marksData.map((m) => ({
            collegeLinkId: link.id,
            courseCode: m.courseCode,
            courseName: m.courseName,
            examType: m.examType,
            maxMarks: m.maxMarks ?? null,
            obtainedMarks: m.obtainedMarks ?? null,
            grade: m.grade ?? null,
            sgpa: m.sgpa ?? null,
            cgpa: m.cgpa ?? null,
            semester: m.semester?.toString() ?? null,
            rawData: m.raw,
            syncedAt,
          })),
        );
      }

      if (coursesData.length > 0) {
        await this.coursesRepo.replaceAll(
          link.id,
          coursesData.map((c) => ({
            collegeLinkId: link.id,
            courseCode: c.courseCode,
            courseName: c.courseName,
            credits: c.credits ?? null,
            facultyName: null,
            section: null,
            semester: c.semester?.toString() ?? null,
            rawData: c.raw,
            syncedAt,
          })),
        );
      }

      // 5. Invalidate cache
      await this.cacheService.invalidateCollegeLink(link.id);

      // 6. Update link status
      await this.collegeLinkRepo.updateSync(link.id, {
        syncStatus: SyncStatus.SUCCESS,
        lastSyncAt: syncedAt,
        syncError: null,
        collegeToken: auth.token,
        tokenExpiresAt: auth.expiresAt,
      });

      // 7. Complete sync log
      const durationMs = Date.now() - startedAt.getTime();
      await this.syncLogRepo.complete(syncLog.id, {
        status: SyncLogStatus.SUCCESS,
        durationMs,
        completedAt: new Date(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";
      const durationMs = Date.now() - startedAt.getTime();

      // Update link status
      await this.collegeLinkRepo.updateSync(link.id, {
        syncStatus: SyncStatus.FAILED,
        syncError: errorMessage,
      });

      // Complete sync log as failed
      await this.syncLogRepo.complete(syncLog.id, {
        status: SyncLogStatus.FAILED,
        errorMessage,
        durationMs,
        completedAt: new Date(),
      });

      throw new SyncFailedError(errorMessage);
    }
  }
}
