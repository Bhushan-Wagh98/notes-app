/**
 * @module models/otp
 * @description Mongoose schema and model for temporary OTP records.
 * Records auto-expire after 5 minutes via a TTL index on createdAt.
 */

import { Schema, model, Document } from "mongoose";

/** Represents a one-time password record used during signup and password reset. */
export interface IOtp extends Document {
  email: string;
  otp: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  password: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  /** TTL index — MongoDB automatically removes the document 300 s after creation. */
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

export const OtpModel = model<IOtp>("Otp", otpSchema);
