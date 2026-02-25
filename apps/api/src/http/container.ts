/**
 * Dependency injection container.
 *
 * Instantiates all repositories, services, and use cases once.
 * Routes import from here to get fully wired use cases.
 */

import { cache } from "@/infrastructure/cache";
import { adapterRegistry } from "@/infrastructure/college-adapters";
import {
  AttendanceRepository,
  CollegeLinkRepository,
  CollegeRepository,
  CoursesRepository,
  MarksRepository,
  NotificationRepository,
  SyncLogRepository,
  TimetableRepository,
} from "@/infrastructure/database/repositories";
import {
  decryptCredential,
  encryptCredential,
} from "@/infrastructure/encryption/credential-vault";

import type { ICacheService } from "@/application/ports/services/cache.service";
import type { ICollegeAdapterService } from "@/application/ports/services/college-adapter.service";
import type { IEncryptionService } from "@/application/ports/services/encryption.service";

import { GetCollegeLinksUseCase } from "@/application/use-cases/colleges/get-college-links";
import { LinkCollegeUseCase } from "@/application/use-cases/colleges/link-college";
import { ListCollegesUseCase } from "@/application/use-cases/colleges/list-colleges";
import { UnlinkCollegeUseCase } from "@/application/use-cases/colleges/unlink-college";

import { GetAttendanceUseCase } from "@/application/use-cases/attendance/get-attendance";
import { GetAttendanceHistoryUseCase } from "@/application/use-cases/attendance/get-attendance-history";
import { GetAttendanceProjectionUseCase } from "@/application/use-cases/attendance/get-attendance-projection";

import {
  GetTimetableUseCase,
  GetTodayScheduleUseCase,
} from "@/application/use-cases/timetable/get-timetable";

import {
  GetMarksSummaryUseCase,
  GetMarksUseCase,
} from "@/application/use-cases/marks/get-marks";

import { GetCoursesUseCase } from "@/application/use-cases/courses/get-courses";

import { SyncCollegeLinkUseCase } from "@/application/use-cases/sync/sync-college-link";
import { TriggerManualSyncUseCase } from "@/application/use-cases/sync/trigger-manual-sync";

import {
  GetNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from "@/application/use-cases/notifications/get-notifications";

// ─── Repositories ────────────────────────────────────────────────────────────

export const collegeRepo = new CollegeRepository();
export const collegeLinkRepo = new CollegeLinkRepository();
export const attendanceRepo = new AttendanceRepository();
export const timetableRepo = new TimetableRepository();
export const marksRepo = new MarksRepository();
export const coursesRepo = new CoursesRepository();
export const notificationRepo = new NotificationRepository();
export const syncLogRepo = new SyncLogRepository();

// ─── Service adapters (implement ports using concrete infra) ─────────────────

export const cacheService: ICacheService = cache;

export const encryptionService: IEncryptionService = {
  encrypt: encryptCredential,
  decrypt: decryptCredential,
};

export const collegeAdapterService: ICollegeAdapterService = adapterRegistry;

// ─── Use cases ───────────────────────────────────────────────────────────────

export const listCollegesUseCase = new ListCollegesUseCase(collegeRepo);

export const linkCollegeUseCase = new LinkCollegeUseCase(
  collegeRepo,
  collegeLinkRepo,
  collegeAdapterService,
  encryptionService,
  cacheService,
);

export const unlinkCollegeUseCase = new UnlinkCollegeUseCase(
  collegeLinkRepo,
  cacheService,
);

export const getCollegeLinksUseCase = new GetCollegeLinksUseCase(
  collegeLinkRepo,
);

export const getAttendanceUseCase = new GetAttendanceUseCase(
  attendanceRepo,
  collegeLinkRepo,
  cacheService,
);

export const getAttendanceHistoryUseCase = new GetAttendanceHistoryUseCase(
  attendanceRepo,
  collegeLinkRepo,
);

export const getAttendanceProjectionUseCase =
  new GetAttendanceProjectionUseCase(
    attendanceRepo,
    collegeLinkRepo,
    collegeRepo,
  );

export const getTimetableUseCase = new GetTimetableUseCase(
  timetableRepo,
  collegeLinkRepo,
  cacheService,
);

export const getTodayScheduleUseCase = new GetTodayScheduleUseCase(
  timetableRepo,
  collegeLinkRepo,
);

export const getMarksUseCase = new GetMarksUseCase(
  marksRepo,
  collegeLinkRepo,
  cacheService,
);

export const getMarksSummaryUseCase = new GetMarksSummaryUseCase(
  marksRepo,
  collegeLinkRepo,
);

export const getCoursesUseCase = new GetCoursesUseCase(
  coursesRepo,
  collegeLinkRepo,
  cacheService,
);

export const syncCollegeLinkUseCase = new SyncCollegeLinkUseCase(
  collegeLinkRepo,
  collegeRepo,
  attendanceRepo,
  timetableRepo,
  marksRepo,
  coursesRepo,
  syncLogRepo,
  collegeAdapterService,
  encryptionService,
  cacheService,
);

export const getNotificationsUseCase = new GetNotificationsUseCase(
  notificationRepo,
  cacheService,
);

export const markNotificationReadUseCase = new MarkNotificationReadUseCase(
  notificationRepo,
  cacheService,
);

export const markAllNotificationsReadUseCase =
  new MarkAllNotificationsReadUseCase(notificationRepo, cacheService);

/**
 * Create the TriggerManualSyncUseCase.
 * Accepts a sync enqueue function — injected at app startup once BullMQ queues are initialized.
 */
export function createTriggerManualSyncUseCase(
  enqueueSyncJob: (collegeLinkId: string) => Promise<void>,
) {
  return new TriggerManualSyncUseCase(collegeLinkRepo, enqueueSyncJob);
}
