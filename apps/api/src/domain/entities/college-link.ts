/**
 * CollegeLink entity — represents a link between an Axion user
 * and their college portal account.
 */
import type { SyncStatus } from "../value-objects";

export interface CollegeLink {
  id: string;
  userId: string;
  collegeId: string;
  encryptedUsername: string;
  encryptedPassword: string;
  encryptionIv: string;
  encryptionAuthTag: string;
  collegeUserId: string | null;
  collegeToken: string | null;
  tokenExpiresAt: Date | null;
  lastSyncAt: Date | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** CollegeLink with the related college name/slug for display. */
export interface CollegeLinkWithCollege extends CollegeLink {
  collegeName: string;
  collegeSlug: string;
}
