/**
 * @module constants
 * @description Application-wide constants shared across frontend components.
 */

/** Password strength regex: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char. */
export const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

/** Human-readable password requirement hint shown in form validation. */
export const PW_HINT =
  "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";

/** Interval (ms) between auto-save calls in the text editor. */
export const SAVE_INTERVAL_MS = 2000;
