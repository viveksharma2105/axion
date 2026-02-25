import { NotificationType } from "@/domain/value-objects";
import {
  attendanceRepo,
  cacheService,
  collegeLinkRepo,
  collegeRepo,
  notificationRepo,
} from "@/http/container";
import { Worker } from "bullmq";
import {
  type CheckAttendanceAlertsJobData,
  NOTIFICATION_QUEUE,
  bullmqConnection,
} from "./queues";

/**
 * Notification worker — processes attendance alert checks after syncs.
 *
 * Compares each course's attendance percentage against the college threshold
 * and creates notifications for courses that are below threshold.
 */
export function createNotificationWorker() {
  const worker = new Worker<CheckAttendanceAlertsJobData>(
    NOTIFICATION_QUEUE,
    async (job) => {
      const { collegeLinkId, userId } = job.data;
      console.log(
        `[NotificationWorker] Checking attendance alerts for link ${collegeLinkId}`,
      );

      const link = await collegeLinkRepo.findById(collegeLinkId);
      if (!link || !link.isActive) return;

      const college = await collegeRepo.findById(link.collegeId);
      if (!college) return;

      const threshold = college.attendanceThreshold ?? 75;
      const records =
        await attendanceRepo.findLatestByCollegeLink(collegeLinkId);

      const belowThreshold = records.filter(
        (r) => r.percentage !== null && r.percentage < threshold,
      );

      if (belowThreshold.length === 0) return;

      // Create a single notification summarizing below-threshold courses
      const courseNames = belowThreshold
        .map((r) => `${r.courseCode} (${r.percentage?.toFixed(1)}%)`)
        .join(", ");

      const title =
        belowThreshold.length === 1
          ? `Attendance Alert: ${belowThreshold[0]!.courseCode}`
          : `Attendance Alert: ${belowThreshold.length} courses below ${threshold}%`;

      const body =
        belowThreshold.length === 1
          ? `Your attendance in ${belowThreshold[0]!.courseCode} is ${belowThreshold[0]!.percentage?.toFixed(1)}%, below the ${threshold}% threshold.`
          : `Courses below threshold: ${courseNames}`;

      await notificationRepo.create({
        userId,
        type: NotificationType.ATTENDANCE_ALERT,
        title,
        body,
        metadata: {
          collegeLinkId,
          threshold,
          courses: belowThreshold.map((r) => ({
            courseCode: r.courseCode,
            courseName: r.courseName,
            percentage: r.percentage,
          })),
        },
      });

      // Invalidate notification count cache
      await cacheService.invalidateNotificationCount(userId);

      console.log(
        `[NotificationWorker] Created attendance alert for ${belowThreshold.length} courses (user ${userId})`,
      );
    },
    {
      connection: bullmqConnection,
      concurrency: 10,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[NotificationWorker] Worker error:", err.message);
  });

  console.log("[NotificationWorker] Started");
  return worker;
}
