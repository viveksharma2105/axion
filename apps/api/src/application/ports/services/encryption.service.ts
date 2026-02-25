import type { EncryptedData } from "@/infrastructure/encryption/credential-vault";

/**
 * Port for credential encryption/decryption.
 * Decouples use cases from the concrete AES-256-GCM implementation.
 */
export interface IEncryptionService {
  encrypt(plaintext: string): EncryptedData;
  decrypt(ciphertext: string, iv: string, authTag: string): string;
}
