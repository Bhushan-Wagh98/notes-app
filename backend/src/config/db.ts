/**
 * @module config/db
 * @description Establishes the MongoDB connection using Mongoose.
 */

import mongoose from "mongoose";
import { env } from "./env";

/**
 * Connects to MongoDB using the URI defined in environment variables.
 * @throws {Error} If MONGO_URI is not defined.
 */
export const connectDB = async (): Promise<void> => {
  if (!env.MONGO_URI)
    throw new Error("MONGO_URI is not defined in environment variables");
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
};
