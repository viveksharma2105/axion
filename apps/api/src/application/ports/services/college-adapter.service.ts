import type { CollegeAdapter } from "../college-adapter.port";

/**
 * Port for looking up college adapters at runtime.
 */
export interface ICollegeAdapterService {
  get(adapterId: string): CollegeAdapter | undefined;
  getOrThrow(adapterId: string): CollegeAdapter;
  listIds(): string[];
}
