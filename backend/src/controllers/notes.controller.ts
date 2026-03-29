/**
 * @module controllers/notes
 * @description Handles note CRUD operations for both regular users and admins.
 * Includes note listing, visibility/read-only toggles, deletion,
 * and admin-specific user & note management endpoints.
 */

import { Response } from "express";
import { env } from "../config/env";
import { DocumentModel } from "../models/document.model";
import { UserModel } from "../models/user.model";
import { AuthRequest } from "../middlewares/auth.middleware";

// ─── User Controllers ────────────────────────────────────────────────────────

/**
 * Retrieves all notes owned by the authenticated user.
 * @route GET /api/notes/my-notes
 */
export const getMyNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await DocumentModel.find({ ownerId: req.userId })
      .select("_id title isPrivate isReadOnly isLocked updatedAt")
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Toggles the read-only flag on a note. Only the owner can toggle.
 * Locked notes cannot be modified.
 * @route PATCH /api/notes/:id/read-only
 */
export const toggleReadOnly = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.isLocked)
      return res.status(403).json({ error: "This note is locked by admin" });
    if (doc.ownerId && doc.ownerId !== req.userId)
      return res.status(403).json({ error: "Forbidden" });

    doc.isReadOnly = req.body.isReadOnly ?? !doc.isReadOnly;
    await doc.save();
    res.json({ isReadOnly: doc.isReadOnly });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Toggles the private/public visibility of a note.
 * Admins can toggle visibility on any note; regular users only on their own.
 * @route PATCH /api/notes/:id/visibility
 */
export const toggleVisibility = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.isLocked)
      return res.status(403).json({ error: "This note is locked by admin" });
    if (doc.ownerId && doc.ownerId !== req.userId) {
      const user = await UserModel.findById(req.userId);
      if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
    }
    doc.isPrivate = req.body.isPrivate ?? !doc.isPrivate;
    await doc.save();
    res.json({ isPrivate: doc.isPrivate });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Deletes a note owned by the authenticated user.
 * Locked notes cannot be deleted.
 * @route DELETE /api/notes/:id
 */
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.isLocked)
      return res.status(403).json({ error: "This note is locked by admin" });
    if (doc.ownerId !== req.userId)
      return res.status(403).json({ error: "Forbidden" });

    await DocumentModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

// ─── Admin Controllers ───────────────────────────────────────────────────────

/**
 * Lists all users except the requesting admin.
 * @route GET /api/notes/admin/users
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await UserModel.find({ _id: { $ne: req.userId } })
      .select("_id email firstName lastName isAdmin isBlocked")
      .sort({ email: 1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Retrieves all notes belonging to a specific user (admin view).
 * @route GET /api/notes/admin/users/:userId/notes
 */
export const getUserNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await DocumentModel.find({ ownerId: req.params.userId })
      .select("_id title isPrivate isReadOnly isLocked updatedAt")
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Retrieves all notes that have no owner (anonymous/unassigned notes).
 * @route GET /api/notes/admin/anonymous-notes
 */
export const getAnonymousNotes = async (_req: AuthRequest, res: Response) => {
  try {
    const notes = await DocumentModel.find({
      $or: [{ ownerId: null }, { ownerId: { $exists: false } }],
    })
      .select("_id title isPrivate isReadOnly isLocked updatedAt")
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Deletes a user and all their associated notes.
 * The master admin account cannot be deleted.
 * @route DELETE /api/notes/admin/users/:userId
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const target = await UserModel.findById(req.params.userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.email === env.ADMIN_EMAIL?.toLowerCase())
      return res.status(403).json({ error: "Cannot delete master admin" });

    await DocumentModel.deleteMany({ ownerId: req.params.userId });
    await UserModel.findByIdAndDelete(req.params.userId);
    res.json({ message: "User and their notes deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Allows an admin to delete any note by its ID.
 * @route DELETE /api/notes/admin/notes/:noteId
 */
export const adminDeleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await DocumentModel.findByIdAndDelete(req.params.noteId);
    if (!doc) return res.status(404).json({ error: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Toggles the lock status of a note. Locked notes become read-only for all non-admin users.
 * @route PATCH /api/notes/admin/notes/:noteId/toggle-lock
 */
export const toggleLock = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await DocumentModel.findById(req.params.noteId);
    if (!doc) return res.status(404).json({ error: "Not found" });

    doc.isLocked = !doc.isLocked;
    await doc.save();
    res.json({ isLocked: doc.isLocked });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Toggles admin privileges for a user. The master admin cannot be demoted.
 * @route PATCH /api/notes/admin/users/:userId/toggle-admin
 */
export const toggleAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const target = await UserModel.findById(req.params.userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.email === env.ADMIN_EMAIL?.toLowerCase())
      return res.status(403).json({ error: "Cannot modify master admin" });

    target.isAdmin = !target.isAdmin;
    await target.save();
    res.json({ isAdmin: target.isAdmin });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Toggles the blocked status of a user. The master admin cannot be blocked.
 * @route PATCH /api/notes/admin/users/:userId/toggle-block
 */
export const toggleBlock = async (req: AuthRequest, res: Response) => {
  try {
    const target = await UserModel.findById(req.params.userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.email === env.ADMIN_EMAIL?.toLowerCase())
      return res.status(403).json({ error: "Cannot block master admin" });

    target.isBlocked = !target.isBlocked;
    await target.save();
    res.json({ isBlocked: target.isBlocked });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};
