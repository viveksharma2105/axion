/**
 * UserProfile entity — extended user profile with student details
 * populated from the college adapter.
 */
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  // ─── Student profile fields ─────────────────────────────────────────────
  rollNo: string | null;
  studentName: string | null;
  semester: number | null;
  programmeName: string | null;
  degreeLevel: string | null;
  fatherName: string | null;
  mobileNo: string | null;
  section: string | null;
  studentImage: string | null;
  collegeLinkId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
