import crypto from "node:crypto";

/**
 * Hash a plain text password using cryptographic scrypt with salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plain text password against a stored salt:hash string
 */
export function verifyPassword(password: string, combinedHash?: string | null): boolean {
  if (!combinedHash || !combinedHash.includes(":")) {
    return false;
  }

  const [salt, key] = combinedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
