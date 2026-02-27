import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface StudentProfile {
  rollNo: string | null;
  studentName: string | null;
  semester: number | null;
  programmeName: string | null;
  degreeLevel: string | null;
  fatherName: string | null;
  mobileNo: string | null;
  section: string | null;
  studentImage: string | null;
}

interface ProfileResponse {
  profile: StudentProfile | null;
}

export function useStudentProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: () => api.get<ProfileResponse>("/profile"),
    select: (data) => data.data.profile,
  });
}
