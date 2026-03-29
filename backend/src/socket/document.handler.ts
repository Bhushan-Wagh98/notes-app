/**
 * @module socket/document
 * @description Socket.IO event handlers for real-time collaborative document editing.
 * Manages document loading, access control, live change broadcasting, and auto-saving.
 */

import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { DocumentModel, IDocument } from "../models/document.model";
import { UserModel } from "../models/user.model";

/** Default content for newly created documents. */
const DEFAULT_VALUE = "";

/**
 * Extracts the authenticated user's ID from the socket handshake token.
 * @param socket - The connected Socket.IO client.
 * @returns The user ID if the token is valid, otherwise null.
 */
function getUserId(socket: Socket): string | null {
  const token = socket.handshake.auth?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

interface DocResult {
  doc: IDocument | null;
  readOnly: boolean;
}

/**
 * Finds an existing document by ID or creates a new one.
 * Enforces privacy, lock, and read-only access rules.
 * @param id      - The document ID (URL slug).
 * @param userId  - The requesting user's ID (null for anonymous).
 * @param isAdmin - Whether the requesting user has admin privileges.
 * @returns The document and a flag indicating if access is read-only.
 */
async function findOrCreateDocument(
  id: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<DocResult> {
  if (!id) return { doc: null, readOnly: false };

  const existing = await DocumentModel.findById(id);
  if (existing) {
    const isOwner = !!userId && existing.ownerId === userId;

    // Deny access to private notes for non-owners and non-admins.
    if (existing.isPrivate && existing.ownerId && !isOwner && !isAdmin) {
      return { doc: null, readOnly: false };
    }

    // Determine read-only status based on lock, ownership, and admin role.
    const readOnly =
      (existing.isLocked === true && !isAdmin) ||
      (!isOwner && existing.isReadOnly === true && !!existing.ownerId) ||
      (!isOwner &&
        isAdmin &&
        existing.isPrivate === true &&
        !!existing.ownerId);

    // Claim ownership of an unowned document when an authenticated user opens it.
    if (!existing.ownerId && userId) {
      existing.ownerId = userId;
      await existing.save();
    }
    return { doc: existing, readOnly };
  }

  // Create a new document if none exists with this ID.
  const doc = await DocumentModel.create({
    _id: id,
    data: DEFAULT_VALUE,
    ownerId: userId,
  });
  return { doc, readOnly: false };
}

/**
 * Registers all Socket.IO event handlers for document collaboration.
 * @param io - The Socket.IO server instance.
 */
export const registerDocumentHandlers = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    const userId = getUserId(socket);

    socket.on("get-document", async (documentId: string) => {
      let isAdmin = false;
      let isBlocked = false;

      if (userId) {
        const user =
          await UserModel.findById(userId).select("isAdmin isBlocked");
        isAdmin = !!user?.isAdmin;
        isBlocked = !!user?.isBlocked;
      }

      // Prevent blocked users from accessing any document.
      if (isBlocked) {
        socket.emit("user-blocked");
        return;
      }

      const { doc: document, readOnly } = await findOrCreateDocument(
        documentId,
        userId,
        isAdmin,
      );
      if (!document) {
        socket.emit("access-denied");
        return;
      }

      const isOwner = !!userId && document.ownerId === userId;

      // Resolve the document owner's display name.
      let ownerName = "";
      if (document.ownerId) {
        const owner = await UserModel.findById(document.ownerId).select(
          "firstName lastName",
        );
        if (owner) ownerName = `${owner.firstName} ${owner.lastName}`;
      }

      socket.join(documentId);
      socket.emit("load-document", document.data, {
        isPrivate: document.isPrivate,
        isReadOnly: document.isReadOnly,
        isLocked: document.isLocked,
        isOwner,
        readOnly,
        ownerName,
      });

      // Only register write handlers if the user has edit access.
      if (!readOnly) {
        /** Broadcast changes to all other clients in the same document room. */
        socket.on("send-changes", (delta: unknown) => {
          socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        /** Persist document content and auto-generate a title from the first line. */
        socket.on("save-document", async (data: unknown) => {
          // Re-check lock status before saving.
          const current = await DocumentModel.findById(documentId);
          if (current?.isLocked && !isAdmin) return;

          let title = "Untitled";
          try {
            const ops = (data as any)?.ops;
            if (ops?.length) {
              const text = ops
                .map((op: any) =>
                  typeof op.insert === "string" ? op.insert : "",
                )
                .join("");
              const firstLine = text.split("\n")[0].trim();
              if (firstLine) title = firstLine.substring(0, 50);
            }
          } catch {}
          await DocumentModel.findByIdAndUpdate(documentId, { data, title });
        });
      }
    });
  });
};
