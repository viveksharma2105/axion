import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  /** ISO date "YYYY-MM-DD" for the specific lecture date */
  lectureDate: string | null;
  startTime: string;
  endTime: string;
  courseCode: string | null;
  courseName: string | null;
  facultyName: string | null;
  room: string | null;
  section: string | null;
}

export type { TimetableEntry };

export function useTimetable() {
  return useQuery({
    queryKey: queryKeys.timetable.full(),
    queryFn: () => api.get<TimetableEntry[]>("/timetable"),
    select: (data) => data.data,
  });
}

export function useTodaySchedule() {
  return useQuery({
    queryKey: queryKeys.timetable.today(),
    queryFn: () => api.get<TimetableEntry[]>("/timetable/today"),
    select: (data) => data.data,
  });
}
