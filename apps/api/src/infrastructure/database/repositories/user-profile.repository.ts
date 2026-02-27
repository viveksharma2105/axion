import type {
  IUserProfileRepository,
  UpsertStudentProfileInput,
} from "@/application/ports/repositories";
import type { UserProfile } from "@/domain/entities";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { userProfiles } from "../schema";

type UserProfileRow = typeof userProfiles.$inferSelect;

function toEntity(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName ?? null,
    avatarUrl: row.avatarUrl ?? null,
    rollNo: row.rollNo ?? null,
    studentName: row.studentName ?? null,
    semester: row.semester ?? null,
    programmeName: row.programmeName ?? null,
    degreeLevel: row.degreeLevel ?? null,
    fatherName: row.fatherName ?? null,
    mobileNo: row.mobileNo ?? null,
    section: row.section ?? null,
    studentImage: row.studentImage ?? null,
    collegeLinkId: row.collegeLinkId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class UserProfileRepository implements IUserProfileRepository {
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const row = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    return row ? toEntity(row) : null;
  }

  async upsertStudentProfile(input: UpsertStudentProfileInput): Promise<void> {
    await db
      .insert(userProfiles)
      .values({
        userId: input.userId,
        collegeLinkId: input.collegeLinkId,
        rollNo: input.rollNo,
        studentName: input.studentName,
        semester: input.semester,
        programmeName: input.programmeName,
        degreeLevel: input.degreeLevel,
        fatherName: input.fatherName ?? null,
        mobileNo: input.mobileNo ?? null,
        section: input.section ?? null,
        studentImage: input.studentImage ?? null,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          collegeLinkId: input.collegeLinkId,
          rollNo: input.rollNo,
          studentName: input.studentName,
          semester: input.semester,
          programmeName: input.programmeName,
          degreeLevel: input.degreeLevel,
          fatherName: input.fatherName ?? null,
          mobileNo: input.mobileNo ?? null,
          section: input.section ?? null,
          studentImage: input.studentImage ?? null,
          updatedAt: sql`now()`,
        },
      });
  }
}
