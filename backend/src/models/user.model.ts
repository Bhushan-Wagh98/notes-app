/**
 * @module models/user
 * @description Mongoose schema and model for application users.
 * Stores credentials, profile info, and role/block flags.
 */

import { Schema, model, Document } from "mongoose";

/** Represents a registered user in the system. */
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isBlocked: boolean;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
});

export const UserModel = model<IUser>("User", userSchema);
