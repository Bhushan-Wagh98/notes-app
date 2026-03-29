/**
 * @module routes/notes
 * @description Defines note-related API routes.
 * User routes: list own notes, toggle read-only/visibility, delete.
 * Admin routes: manage users, manage any note, toggle lock/admin/block.
 */

import { Router } from "express";
import { auth, adminOnly } from "../middlewares/auth.middleware";
import {
  getMyNotes,
  toggleReadOnly,
  toggleVisibility,
  deleteNote,
  getUsers,
  getUserNotes,
  getAnonymousNotes,
  deleteUser,
  adminDeleteNote,
  toggleLock,
  toggleAdmin,
  toggleBlock,
} from "../controllers/notes.controller";

const router = Router();

// ─── User routes (require authentication) ────────────────────────────────────
router.get("/my-notes", auth, getMyNotes);
router.patch("/:id/read-only", auth, toggleReadOnly);
router.patch("/:id/visibility", auth, toggleVisibility);
router.delete("/:id", auth, deleteNote);

// ─── Admin routes (require authentication + admin role) ──────────────────────
router.get("/admin/users", auth, adminOnly, getUsers);
router.get("/admin/users/:userId/notes", auth, adminOnly, getUserNotes);
router.get("/admin/anonymous-notes", auth, adminOnly, getAnonymousNotes);
router.delete("/admin/users/:userId", auth, adminOnly, deleteUser);
router.delete("/admin/notes/:noteId", auth, adminOnly, adminDeleteNote);
router.patch("/admin/notes/:noteId/toggle-lock", auth, adminOnly, toggleLock);
router.patch("/admin/users/:userId/toggle-admin", auth, adminOnly, toggleAdmin);
router.patch("/admin/users/:userId/toggle-block", auth, adminOnly, toggleBlock);

export default router;
