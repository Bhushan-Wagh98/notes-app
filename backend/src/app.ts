/**
 * @module app
 * @description Express application configuration and middleware setup.
 * Configures CORS, JSON parsing, and registers API route handlers.
 */

import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import notesRoutes from "./routes/notes.routes";

const app = express();

// Middleware
app.use(cors({ origin: env.ALLOWED_ORIGINS }));
app.use(express.json());

/** Health check endpoint for monitoring and load balancer probes. */
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

export default app;
