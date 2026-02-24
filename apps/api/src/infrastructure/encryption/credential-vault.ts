import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is not set",
    );
  }
  if (key.length !== 64) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be 64 hex characters (32 bytes)",
    );
  }
  return Buffer.from(key, "hex");
}

export interface EncryptedData {
  /** Hex-encoded ciphertext */
  ciphertext: string;
  /** Hex-encoded initialization vector (16 bytes) */
  iv: string;
  /** Hex-encoded GCM authentication tag (16 bytes) */
  authTag: string;
}

/**
 * Encrypt a plaintext credential using AES-256-GCM.
 *
 * Each call generates a fresh random IV, so encrypting the same
 * plaintext twice produces different ciphertext.
 */
export function encryptCredential(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

/**
 * Decrypt a credential that was encrypted with `encryptCredential`.
 *
 * Throws if the auth tag doesn't match (tampered data).
 */
export function decryptCredential(
  ciphertext: string,
  iv: string,
  authTag: string,
): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
