import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface MarkRecord {
  courseCode: string;
  courseTitle: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  semester: number;
}

interface GpaSummary {
  semester: number;
  sgpa: number;
  cgpa: number;
  creditsEarned: number;
  totalCredits: number;
}

export function useMarks(semester?: number, examType?: string) {
  return useQuery({
    queryKey: queryKeys.marks.list(semester, examType),
    queryFn: () => {
      const params = new URLSearchParams();
      if (semester) params.set("semester", String(semester));
      if (examType) params.set("examType", examType);
      const query = params.toString();
      return api.get<MarkRecord[]>(`/marks${query ? `?${query}` : ""}`);
    },
    select: (data) => data.data,
  });
}

export function useMarksSummary() {
  return useQuery({
    queryKey: queryKeys.marks.summary(),
    queryFn: () => api.get<GpaSummary[]>("/marks/summary"),
    select: (data) => data.data,
  });
}
