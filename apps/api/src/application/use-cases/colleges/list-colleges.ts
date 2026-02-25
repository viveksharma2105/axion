import type { ICollegeRepository } from "@/application/ports/repositories";
import type { College } from "@/domain/entities";

/**
 * List all active colleges available for linking.
 */
export class ListCollegesUseCase {
  constructor(private readonly collegeRepo: ICollegeRepository) {}

  async execute(): Promise<College[]> {
    return this.collegeRepo.listActive();
  }
}
