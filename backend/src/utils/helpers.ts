/**
 * @module utils/helpers
 * @description General-purpose utility functions used across the application.
 */

/** Regex enforcing: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character. */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

/**
 * Validates a password against the strength policy.
 * @param password - The plaintext password to validate.
 * @returns An error message string if invalid, or null if the password meets requirements.
 */
export function validatePassword(password: string): string | null {
  if (!PASSWORD_REGEX.test(password)) {
    return "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number and 1 special character";
  }
  return null;
}

/**
 * Generates a cryptographically non-secure 6-digit OTP.
 * @returns A 6-digit numeric string.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
