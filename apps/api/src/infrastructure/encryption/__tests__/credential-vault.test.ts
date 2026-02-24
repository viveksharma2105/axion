import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decryptCredential, encryptCredential } from "../credential-vault";

// Generate a deterministic test key (32 bytes = 64 hex chars)
const TEST_KEY = randomBytes(32).toString("hex");

describe("credential-vault", () => {
  const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    if (originalKey) {
      process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
    } else {
      process.env.CREDENTIAL_ENCRYPTION_KEY = undefined;
    }
  });

  it("encrypts and decrypts a credential round-trip", () => {
    const plaintext = "my-college-password-123!@#";
    const encrypted = encryptCredential(plaintext);

    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();

    // Ciphertext should not be the plaintext
    expect(encrypted.ciphertext).not.toBe(plaintext);

    const decrypted = decryptCredential(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (unique IV)", () => {
    const plaintext = "same-password";
    const first = encryptCredential(plaintext);
    const second = encryptCredential(plaintext);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);

    // Both should decrypt back to the same value
    expect(decryptCredential(first.ciphertext, first.iv, first.authTag)).toBe(
      plaintext,
    );
    expect(
      decryptCredential(second.ciphertext, second.iv, second.authTag),
    ).toBe(plaintext);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptCredential("secret");
    // Flip a character in the ciphertext
    const tampered =
      encrypted.ciphertext.slice(0, -1) +
      (encrypted.ciphertext.slice(-1) === "0" ? "1" : "0");

    expect(() =>
      decryptCredential(tampered, encrypted.iv, encrypted.authTag),
    ).toThrow();
  });

  it("throws on wrong auth tag", () => {
    const encrypted = encryptCredential("secret");
    const wrongTag = "0".repeat(32); // 16 bytes in hex

    expect(() =>
      decryptCredential(encrypted.ciphertext, encrypted.iv, wrongTag),
    ).toThrow();
  });

  it("handles empty string", () => {
    const encrypted = encryptCredential("");
    const decrypted = decryptCredential(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toBe("");
  });

  it("handles unicode characters", () => {
    const plaintext = "pässwörd 密码 🔑";
    const encrypted = encryptCredential(plaintext);
    const decrypted = decryptCredential(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toBe(plaintext);
  });
});
