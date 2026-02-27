import type { CollegeAdapter } from "@/application/ports/college-adapter.port";
import type { CollegeAuthResult } from "@/application/ports/college-adapter.port";
import type {
  IAttendanceRepository,
  ICollegeLinkRepository,
  ICollegeRepository,
  ICoursesRepository,
  IMarksRepository,
  ISyncLogRepository,
  ITimetableRepository,
  IUserProfileRepository,
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
    private readonly userProfileRepo: IUserProfileRepository,
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

      // 2. Obtain auth — reuse cached token if still valid, otherwise login fresh
      let auth = await this.resolveAuth(adapter, link, { username, password });

      const syncedAt = new Date();

      // 3. Fetch all data in parallel — with automatic 401 retry
      let fetchResult = await this.fetchAllData(adapter, auth);

      // If ALL fetches returned empty AND we were using a cached token,
      // the token may have been revoked server-side. Retry with a fresh login.
      if (fetchResult.allEmpty && auth.token === link.collegeToken) {
        auth = await adapter.login({ username, password });
        fetchResult = await this.fetchAllData(adapter, auth);
      }

      const {
        attendanceData,
        timetableData,
        marksData,
        coursesData,
        studentProfileData,
      } = fetchResult;

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
            lectureDate: t.date || null,
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

      // 4b. Upsert student profile (if adapter supports it)
      if (studentProfileData) {
        await this.userProfileRepo.upsertStudentProfile({
          userId: link.userId,
          collegeLinkId: link.id,
          rollNo: studentProfileData.rollNo,
          studentName: studentProfileData.studentName,
          semester: studentProfileData.semester,
          programmeName: studentProfileData.programmeName,
          degreeLevel: studentProfileData.degreeLevel,
          fatherName: studentProfileData.fatherName,
          mobileNo: studentProfileData.mobileNo,
          section: studentProfileData.section,
          studentImage: studentProfileData.studentImage,
        });
      }

      // 5. Invalidate cache
      await this.cacheService.invalidateCollegeLink(link.id);

      // 6. Update link status — persist the token and its expiry for future reuse
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

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Resolve auth by reusing a cached token or performing a fresh login.
   *
   * Token reuse conditions:
   * 1. The link has a stored token
   * 2. The token hasn't expired (checked via `tokenExpiresAt` OR adapter's `isTokenValid`)
   *
   * If the adapter implements `isTokenValid`, we use that for a more accurate check
   * (e.g., inspecting JWT `exp` claim with a safety buffer).
   */
  private async resolveAuth(
    adapter: CollegeAdapter,
    link: {
      collegeToken: string | null;
      tokenExpiresAt: Date | null;
      collegeUserId: string | null;
    },
    credentials: { username: string; password: string },
  ): Promise<CollegeAuthResult> {
    if (link.collegeToken) {
      // Use adapter's isTokenValid if available (more accurate — checks JWT exp with buffer)
      if (adapter.isTokenValid) {
        const candidateAuth: CollegeAuthResult = {
          token: link.collegeToken,
          collegeUserId: link.collegeUserId ?? undefined,
        };
        const valid = await adapter.isTokenValid(candidateAuth);
        if (valid) return candidateAuth;
      }
      // Fallback: check stored expiry from DB
      else if (link.tokenExpiresAt && link.tokenExpiresAt > new Date()) {
        return {
          token: link.collegeToken,
          collegeUserId: link.collegeUserId ?? undefined,
        };
      }
    }

    // No valid cached token — perform fresh login
    return adapter.login(credentials);
  }

  /**
   * Fetch all data from the college API in parallel.
   *
   * Individual endpoint failures are caught and result in empty arrays
   * for that data type (e.g., marks endpoint returning 500 shouldn't
   * block attendance sync). However, we track if ALL returned empty
   * so the caller can detect a potential auth issue and retry.
   */
  private async fetchAllData(adapter: CollegeAdapter, auth: CollegeAuthResult) {
    const [
      attendanceData,
      timetableData,
      marksData,
      coursesData,
      studentProfileData,
    ] = await Promise.all([
      adapter.getAttendance(auth).catch(() => []),
      adapter.getTimetable(auth).catch(() => []),
      adapter.getMarks(auth).catch(() => []),
      adapter.getCourses(auth).catch(() => []),
      adapter.getStudentProfile?.(auth).catch(() => null) ??
        Promise.resolve(null),
    ]);

    const allEmpty =
      attendanceData.length === 0 &&
      timetableData.length === 0 &&
      marksData.length === 0 &&
      coursesData.length === 0;

    return {
      attendanceData,
      timetableData,
      marksData,
      coursesData,
      studentProfileData,
      allEmpty,
    };
  }
}
