/**
 * @module server
 * @description Application entry point. Creates the HTTP server, initialises
 * Socket.IO for real-time collaboration, connects to MongoDB, and starts
 * listening for incoming connections.
 */

import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { registerDocumentHandlers } from "./socket/document.handler";
import app from "./app";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

// Connect to the database, then register socket handlers and start the server.
connectDB()
  .then(() => {
    registerDocumentHandlers(io);
    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
