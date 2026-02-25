import type { CollegeLink, CollegeLinkWithCollege } from "@/domain/entities";
import type { SyncStatus } from "@/domain/value-objects";

export interface CreateCollegeLinkInput {
  userId: string;
  collegeId: string;
  encryptedUsername: string;
  encryptedPassword: string;
  encryptionIv: string;
  encryptionAuthTag: string;
  collegeUserId?: string;
  collegeToken?: string;
  tokenExpiresAt?: Date;
}

export interface UpdateCollegeLinkSyncInput {
  syncStatus: SyncStatus;
  lastSyncAt?: Date;
  syncError?: string | null;
  collegeToken?: string;
  tokenExpiresAt?: Date;
}

export interface ICollegeLinkRepository {
  /** Find a college link by ID. */
  findById(id: string): Promise<CollegeLink | null>;

  /** Find a college link by ID, including the college name/slug. */
  findByIdWithCollege(id: string): Promise<CollegeLinkWithCollege | null>;

  /** Find a user's link for a specific college. */
  findByUserAndCollege(
    userId: string,
    collegeId: string,
  ): Promise<CollegeLink | null>;

  /** Get all college links for a user (with college details). */
  findByUserId(userId: string): Promise<CollegeLinkWithCollege[]>;

  /** Get all active college links (for sync scheduling). */
  findAllActive(): Promise<CollegeLink[]>;

  /** Create a new college link. */
  create(input: CreateCollegeLinkInput): Promise<CollegeLink>;

  /** Update sync status and related fields. */
  updateSync(id: string, input: UpdateCollegeLinkSyncInput): Promise<void>;

  /** Deactivate a college link. */
  deactivate(id: string): Promise<void>;

  /** Delete a college link by ID (for the owning user). */
  deleteByIdAndUser(id: string, userId: string): Promise<boolean>;
}
