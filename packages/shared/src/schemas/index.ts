export {
  linkCollegeSchema,
  type LinkCollegeInput,
  collegeSchema,
  type CollegeResponse,
  collegeLinkSchema,
  type CollegeLinkResponse,
} from "./college-link.schema";

export {
  attendanceRecordSchema,
  type AttendanceRecordResponse,
  attendanceProjectionSchema,
  type AttendanceProjectionResponse,
  attendanceHistoryQuerySchema,
  type AttendanceHistoryQuery,
} from "./attendance.schema";

export {
  timetableEntrySchema,
  type TimetableEntryResponse,
} from "./timetable.schema";

export {
  markRecordSchema,
  type MarkRecordResponse,
  gpaSummarySchema,
  type GpaSummaryResponse,
  marksQuerySchema,
  type MarksQuery,
} from "./marks.schema";

export {
  courseRecordSchema,
  type CourseRecord,
  coursesResponseSchema,
  type CoursesResponse,
} from "./courses.schema";

export {
  notificationSchema,
  notificationsResponseSchema,
  type NotificationResponse,
  type NotificationsResponse,
  pushSubscriptionSchema,
  type PushSubscriptionInput,
} from "./notifications.schema";

export {
  apiErrorSchema,
  type ApiError,
  paginationSchema,
  type PaginationInput,
} from "./common.schema";
