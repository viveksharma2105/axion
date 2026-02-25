import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface Course {
  courseCode: string;
  courseTitle: string;
  credits: number;
  courseType: string;
  semester: number;
  instructor: string;
}

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => api.get<Course[]>("/courses"),
    select: (data) => data.data,
  });
}
