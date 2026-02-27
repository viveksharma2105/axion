export type { ICollegeRepository } from "./college.repository";
export type {
  ICollegeLinkRepository,
  CreateCollegeLinkInput,
  UpdateCollegeLinkSyncInput,
} from "./college-link.repository";
export type {
  IAttendanceRepository,
  BulkUpsertAttendanceInput,
} from "./attendance.repository";
export type {
  ITimetableRepository,
  UpsertTimetableInput,
} from "./timetable.repository";
export type {
  IMarksRepository,
  BulkInsertMarkInput,
} from "./marks.repository";
export type {
  ICoursesRepository,
  UpsertCourseInput,
} from "./courses.repository";
export type {
  INotificationRepository,
  CreateNotificationInput,
} from "./notification.repository";
export type {
  ISyncLogRepository,
  CreateSyncLogInput,
} from "./sync-log.repository";
export type {
  IUserProfileRepository,
  UpsertStudentProfileInput,
} from "./user-profile.repository";
