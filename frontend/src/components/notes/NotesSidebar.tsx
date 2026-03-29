/**
 * @module components/notes/NotesSidebar
 * @description Right-side drawer listing the authenticated user's notes.
 * Supports toggling visibility, read-only status, and deleting notes.
 */

import { useState, useEffect } from "react";
import {
  Drawer, Box, Typography, IconButton, List, ListItem,
  ListItemText, Chip, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, CircularProgress,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import EditOffIcon from "@mui/icons-material/EditOff";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAuth } from "../../context/AuthContext";
import { notesApi } from "../../api";
import { LoadingChip, LoadingIconButton } from "../common";
import type { Note } from "../../types";

const DRAWER_WIDTH = 320;

interface NotesSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function NotesSidebar({ open, onClose }: NotesSidebarProps) {
  const { token, isLoggedIn } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Fetch the user's notes every time the drawer opens. */
  useEffect(() => {
    if (!open || !isLoggedIn) return;
    notesApi.getMyNotes(token!)
      .then((r) => r.json())
      .then(setNotes)
      .catch(() => {});
  }, [open, isLoggedIn, token]);

  /** Toggles a note's public/private visibility. */
  const toggleVisibility = async (id: string, current: boolean) => {
    const res = await notesApi.toggleVisibility(token!, id, !current);
    if (res.ok) setNotes((prev) => prev.map((n) => n._id === id ? { ...n, isPrivate: !current } : n));
  };

  /** Toggles a note's editable/read-only status. */
  const toggleReadOnly = async (id: string, current: boolean) => {
    const res = await notesApi.toggleReadOnly(token!, id, !current);
    if (res.ok) setNotes((prev) => prev.map((n) => n._id === id ? { ...n, isReadOnly: !current } : n));
  };

  /** Permanently deletes the selected note after confirmation. */
  const deleteNote = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await notesApi.deleteNote(token!, deleteId);
    if (res.ok) setNotes((prev) => prev.filter((n) => n._id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Drawer
        anchor="right" open={open} onClose={onClose}
        PaperProps={{ sx: { width: DRAWER_WIDTH } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", p: 1, borderBottom: 1, borderColor: "divider" }}>
          <IconButton onClick={onClose}><ChevronRightIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>My Notes</Typography>
        </Box>

        <List dense>
          {notes.length === 0 && (
            <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>No notes yet</Typography>
          )}
          {notes.map((note) => (
            <ListItem key={note._id} sx={{ flexDirection: "column", alignItems: "stretch", borderBottom: 1, borderColor: "divider", py: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <ListItemText
                  primary={note.title}
                  secondary={new Date(note.updatedAt).toLocaleDateString()}
                  sx={{ mr: 1 }}
                />
                <Tooltip title="Open">
                  <IconButton size="small" component="a" href={`/documents/${note._id}`}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Status chips and action buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                {note.isLocked ? (
                  <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Locked by Admin"
                    size="small" color="error" variant="outlined" />
                ) : (
                  <>
                    <LoadingChip
                      title={note.isPrivate ? "Make Public" : "Make Private"}
                      icon={note.isPrivate ? <LockIcon sx={{ fontSize: 14 }} /> : <LockOpenIcon sx={{ fontSize: 14 }} />}
                      label={note.isPrivate ? "Private" : "Public"}
                      color={note.isPrivate ? "default" : "success"}
                      onClick={() => toggleVisibility(note._id, note.isPrivate)}
                    />
                    <LoadingChip
                      title={note.isReadOnly ? "Make Editable" : "Make Read Only"}
                      icon={note.isReadOnly ? <EditOffIcon sx={{ fontSize: 14 }} /> : <EditIcon sx={{ fontSize: 14 }} />}
                      label={note.isReadOnly ? "Read Only" : "Editable"}
                      color={note.isReadOnly ? "warning" : "info"}
                      onClick={() => toggleReadOnly(note._id, note.isReadOnly)}
                    />
                    <Box sx={{ flex: 1 }} />
                    <LoadingIconButton
                      title="Delete" color="error"
                      icon={<DeleteIcon fontSize="small" />}
                      onClick={async () => setDeleteId(note._id)}
                    />
                  </>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs">
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this note? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={deleteNote} disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
