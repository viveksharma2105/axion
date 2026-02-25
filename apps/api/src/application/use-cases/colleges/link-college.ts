import type {
  ICollegeLinkRepository,
  ICollegeRepository,
} from "@/application/ports/repositories";
import type {
  ICacheService,
  ICollegeAdapterService,
  IEncryptionService,
} from "@/application/ports/services";
import type { CollegeLink } from "@/domain/entities";
import {
  CollegeLinkAlreadyExistsError,
  CollegeNotFoundError,
  InvalidCredentialsError,
} from "@/domain/errors";

export interface LinkCollegeInput {
  userId: string;
  collegeSlug: string;
  username: string;
  password: string;
}

/**
 * Link a college account to the user's Axion account.
 *
 * 1. Verify the college exists and is active
 * 2. Check for existing link
 * 3. Validate credentials by attempting a login via the adapter
 * 4. Encrypt credentials
 * 5. Create the college link record
 */
export class LinkCollegeUseCase {
  constructor(
    private readonly collegeRepo: ICollegeRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly adapterService: ICollegeAdapterService,
    private readonly encryptionService: IEncryptionService,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(input: LinkCollegeInput): Promise<CollegeLink> {
    // 1. Look up college
    const college = await this.collegeRepo.findBySlug(input.collegeSlug);
    if (!college || !college.isActive) {
      throw new CollegeNotFoundError(input.collegeSlug);
    }

    // 2. Check for existing link
    const existing = await this.collegeLinkRepo.findByUserAndCollege(
      input.userId,
      college.id,
    );
    if (existing) {
      throw new CollegeLinkAlreadyExistsError();
    }

    // 3. Validate credentials via adapter
    const adapter = this.adapterService.getOrThrow(college.adapterId);
    const authResult = await adapter
      .login({ username: input.username, password: input.password })
      .catch(() => {
        throw new InvalidCredentialsError(college.name);
      });

    // 4. Encrypt credentials
    const encryptedUsername = this.encryptionService.encrypt(input.username);
    const encryptedPassword = this.encryptionService.encrypt(input.password);

    // 5. Create college link (both username and password share the same IV/authTag pattern;
    //    we store separate encrypted blobs but for simplicity use the username's IV/authTag
    //    in the link record. The password has its own embedded IV/authTag in its ciphertext.)
    const link = await this.collegeLinkRepo.create({
      userId: input.userId,
      collegeId: college.id,
      encryptedUsername: encryptedUsername.ciphertext,
      encryptedPassword: encryptedPassword.ciphertext,
      encryptionIv: `${encryptedUsername.iv}:${encryptedPassword.iv}`,
      encryptionAuthTag: `${encryptedUsername.authTag}:${encryptedPassword.authTag}`,
      collegeUserId: authResult.collegeUserId,
      collegeToken: authResult.token,
      tokenExpiresAt: authResult.expiresAt,
    });

    // Invalidate any stale cache
    await this.cacheService.invalidateCollegeLink(link.id);

    return link;
  }
}
