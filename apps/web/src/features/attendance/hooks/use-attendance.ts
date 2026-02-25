import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface AttendanceRecord {
  courseCode: string;
  courseTitle: string;
  present: number;
  total: number;
  percentage: number;
  threshold: number;
  lastUpdated: string;
}

interface AttendanceProjection {
  courseCode: string;
  courseTitle: string;
  currentPercentage: number;
  threshold: number;
  canSkip: number;
  mustAttend: number;
  status: "safe" | "warning" | "danger";
}

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
