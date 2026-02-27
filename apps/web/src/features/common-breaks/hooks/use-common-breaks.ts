import { api } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";

export interface CommonBreak {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DayBreaks {
  dayOfWeek: number;
  dayName: string;
  breaks: CommonBreak[];
}

export interface FriendTimetableEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  facultyName?: string;
  room?: string;
  section?: string;
}

export interface CompareResult {
  commonBreaks: DayBreaks[];
  friendTimetable: FriendTimetableEntry[];
}

interface CompareInput {
  username: string;
  password: string;
}

export function useCommonBreaks() {
  return useMutation({
    mutationFn: (input: CompareInput) =>
      api.post<CompareResult>("/timetable/compare", input),
    // No automatic retries — don't re-send credentials
    retry: false,
  });
}
