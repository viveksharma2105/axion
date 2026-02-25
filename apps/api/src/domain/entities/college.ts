/**
 * College entity — represents a supported college in the system.
 * Pure domain type, no external imports.
 */
export interface College {
  id: string;
  slug: string;
  name: string;
  adapterId: string;
  config: Record<string, unknown>;
  attendanceThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
