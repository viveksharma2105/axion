import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface AttendanceRecord {
  id: string;
  courseCode: string;
  courseName: string | null;
  totalLectures: number;
  totalPresent: number;
  totalAbsent: number;
  totalLoa: number;
  totalOnDuty: number;
  percentage: number | null;
  syncedAt: string;
}

interface AttendanceProjection {
  courseCode: string;
  courseName: string | null;
  currentPercentage: number;
  totalLectures: number;
  totalPresent: number;
  classesNeededForThreshold: number;
  canReachThreshold: boolean;
  classesCanSkip: number;
}

export type { AttendanceRecord, AttendanceProjection };

export function useAttendance() {
  return useQuery({
    queryKey: queryKeys.attendance.summary(),
    queryFn: () => api.get<AttendanceRecord[]>("/attendance"),
    select: (data) => data.data,
  });
}

export function useAttendanceProjection() {
  return useQuery({
    queryKey: queryKeys.attendance.projection(),
    queryFn: () => api.get<AttendanceProjection[]>("/attendance/projection"),
    select: (data) => data.data,
  });
}

export function useAttendanceHistory(courseCode?: string) {
  return useQuery({
    queryKey: queryKeys.attendance.history(courseCode),
    queryFn: () =>
      api.get<AttendanceRecord[]>(
        `/attendance/history${courseCode ? `?courseCode=${courseCode}` : ""}`,
      ),
    select: (data) => data.data,
    enabled: !!courseCode,
  });
}
