import bcrypt from "bcryptjs";
import { z } from "zod";

const SALT_ROUNDS = 12;

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200, "Password must be at most 200 characters")
  .refine((v) => /[a-z]/.test(v), "Password must contain a lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Password must contain an uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Password must contain a number");

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a candidate password. When the user has no password set (an
 * OAuth-only account) this still runs a bcrypt comparison against a dummy hash
 * so the response time does not reveal whether the account exists.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.6qBM9Zx0YdE0jVYbAxSJPNqFLJKvGWK";

export async function verifyPassword(
  password: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, hash);
}
