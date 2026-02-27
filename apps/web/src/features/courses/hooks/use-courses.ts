import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number | null;
  facultyName: string | null;
  section: string | null;
  semester: string | null;
  syncedAt: string;
}

export type { Course };

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => api.get<Course[]>("/courses"),
    select: (data) => data.data,
  });
}
