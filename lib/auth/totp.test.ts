import { describe, expect, it } from "vitest";
import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
} from "@/lib/auth/totp";

describe("encryptTwoFactorSecret / decryptTwoFactorSecret", () => {
  it("round-trips a secret", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    expect(decryptTwoFactorSecret(encryptTwoFactorSecret(secret))).toBe(secret);
  });

  it("never stores the plaintext secret in the ciphertext", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    expect(encryptTwoFactorSecret(secret)).not.toContain(secret);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    expect(encryptTwoFactorSecret(secret)).not.toBe(encryptTwoFactorSecret(secret));
  });

  it("throws on a malformed ciphertext rather than returning garbage", () => {
    expect(() => decryptTwoFactorSecret("not-a-real-ciphertext")).toThrow();
  });

  it("throws when the ciphertext has been tampered with", () => {
    const [iv, tag, data] = encryptTwoFactorSecret("JBSWY3DPEHPK3PXP").split(".");
    const tampered = [iv, tag, `${data}x`].join(".");
    expect(() => decryptTwoFactorSecret(tampered)).toThrow();
  });
});
