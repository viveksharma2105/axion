import type { UserProfile } from "@/domain/entities";

export interface UpsertStudentProfileInput {
  userId: string;
  collegeLinkId: string;
  rollNo: string;
  studentName: string;
  semester: number;
  programmeName: string;
  degreeLevel: string;
  fatherName?: string;
  mobileNo?: string;
  section?: string;
  studentImage?: string;
}

export interface IUserProfileRepository {
  /** Get the user profile by user ID. */
  findByUserId(userId: string): Promise<UserProfile | null>;

  /**
   * Upsert student profile fields from a college adapter sync.
   * Creates the row if it doesn't exist, otherwise updates the student fields.
   */
  upsertStudentProfile(input: UpsertStudentProfileInput): Promise<void>;
}
