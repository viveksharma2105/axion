import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface TimetableEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor: string;
}

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
