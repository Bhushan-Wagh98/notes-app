/**
 * @module config/env
 * @description Centralised environment variable configuration.
 * Loads values from .env via dotenv and exposes them as typed constants.
 */

import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 8080,
  MONGO_URI: process.env.MONGO_URI || "",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim(),
  ) || ["http://localhost:3000"],
  JWT_SECRET: process.env.JWT_SECRET || "share-notes-secret-key",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL?.trim() || "",
  SMTP_EMAIL: process.env.SMTP_EMAIL?.trim() || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD?.trim() || "",
};
