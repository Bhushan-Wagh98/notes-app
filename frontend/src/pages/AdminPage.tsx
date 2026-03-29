import { useEffect, useState } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Collapse, Box, Chip, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useAuth } from "../context/AuthContext";
import LoadingIconButton from "../components/common/LoadingIconButton";

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isBlocked: boolean;
}

interface Note {
  _id: string;
  title: string;
  isPrivate: boolean;
  isLocked: boolean;
  updatedAt: string;
}

function NoteRow({ note, token, onDelete, onToggleLock }: {
  note: Note; token: string;
  onDelete: (id: string) => Promise<void>;
  onToggleLock: (id: string) => Promise<void>;
}) {
  return (
    <TableRow>
      <TableCell>{note.title}</TableCell>
      <TableCell>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Chip label={note.isPrivate ? "Private" : "Public"} size="small"
            color={note.isPrivate ? "default" : "success"} variant="outlined" />
          {note.isLocked && <Chip label="Locked" size="small" color="error" variant="outlined" />}
        </Box>
      </TableCell>
      <TableCell>{new Date(note.updatedAt).toLocaleString()}</TableCell>
      <TableCell align="right">
        <Button size="small" href={`/documents/${note._id}`} target="_blank">Open</Button>
        <LoadingIconButton
          title={note.isLocked ? "Unlock" : "Lock"}
          color={note.isLocked ? "success" : "warning"}
          icon={note.isLocked ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
          onClick={() => onToggleLock(note._id)}
        />
        <LoadingIconButton
          title="Delete" color="error"
          icon={<DeleteIcon fontSize="small" />}
          onClick={() => onDelete(note._id)}
        />
      </TableCell>
    </TableRow>
  );
}

function NotesTable({ notes, token, onDelete, onToggleLock }: {
  notes: Note[]; token: string;
  onDelete: (id: string) => Promise<void>;
  onToggleLock: (id: string) => Promise<void>;
}) {
  if (notes.length === 0) {
    return <Typography variant="body2" sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>No notes</Typography>;
  }
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Last Updated</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {notes.map((n) => (
          <NoteRow key={n._id} note={n} token={token} onDelete={onDelete} onToggleLock={onToggleLock} />
        ))}
      </TableBody>
    </Table>
  );
}

function UserRow({ user, token, onDeleteUser }: { user: User; token: string; onDeleteUser: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [isBlocked, setIsBlocked] = useState(user.isBlocked);

  const fetchNotes = async () => {
    if (loaded) { setOpen(!open); return; }
    const res = await fetch(`${API}/api/notes/admin/users/${user._id}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes(await res.json());
    setLoaded(true);
    setOpen(true);
  };

  const deleteNote = async (noteId: string) => {
    const res = await fetch(`${API}/api/notes/admin/notes/${noteId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setNotes((prev) => prev.filter((n) => n._id !== noteId));
  };

  const toggleLock = async (noteId: string) => {
    const res = await fetch(`${API}/api/notes/admin/notes/${noteId}/toggle-lock`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, isLocked: data.isLocked } : n));
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    const res = await fetch(`${API}/api/notes/admin/users/${user._id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) onDeleteUser(user._id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  const toggleAdmin = async () => {
    const res = await fetch(`${API}/api/notes/admin/users/${user._id}/toggle-admin`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setIsAdmin((await res.json()).isAdmin);
  };

  const toggleBlock = async () => {
    const res = await fetch(`${API}/api/notes/admin/users/${user._id}/toggle-block`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setIsBlocked((await res.json()).isBlocked);
  };

  return (
    <>
      <TableRow hover sx={isBlocked ? { opacity: 0.6 } : {}}>
        <TableCell>
          <IconButton size="small" onClick={fetchNotes}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          {user.firstName} {user.lastName}
          {isAdmin && <Chip label="Admin" size="small" color="primary" sx={{ ml: 1 }} />}
          {isBlocked && <Chip label="Blocked" size="small" color="error" sx={{ ml: 1 }} />}
        </TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell align="right">
          <LoadingIconButton
            title={isBlocked ? "Unblock" : "Block"}
            color={isBlocked ? "success" : "error"}
            icon={isBlocked ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
            onClick={toggleBlock}
          />
          <LoadingIconButton
            title={isAdmin ? "Remove Admin" : "Make Admin"}
            color={isAdmin ? "warning" : "info"}
            icon={isAdmin ? <PersonOffIcon fontSize="small" /> : <AdminPanelSettingsIcon fontSize="small" />}
            onClick={toggleAdmin}
          />
          <LoadingIconButton
            title="Delete User" color="error"
            icon={<DeleteIcon fontSize="small" />}
            onClick={async () => setConfirmDelete(true)}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 1 }}>
              <NotesTable notes={notes} token={token} onDelete={deleteNote} onToggleLock={toggleLock} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs">
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{user.firstName} {user.lastName}</strong> ({user.email}) and all their notes?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser} disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function AdminPage() {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [showMyNotes, setShowMyNotes] = useState(false);
  const [anonNotes, setAnonNotes] = useState<Note[]>([]);
  const [showAnon, setShowAnon] = useState(false);

  useEffect(() => {
    if (!isAdmin || !token) return;
    fetch(`${API}/api/notes/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setUsers).catch(() => {});
  }, [isAdmin, token]);

  const fetchMyNotes = async () => {
    if (myNotes.length > 0) { setShowMyNotes(!showMyNotes); return; }
    const res = await fetch(`${API}/api/notes/my-notes`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setMyNotes(await res.json()); setShowMyNotes(true); }
  };

  const fetchAnonNotes = async () => {
    if (anonNotes.length > 0) { setShowAnon(!showAnon); return; }
    const res = await fetch(`${API}/api/notes/admin/anonymous-notes`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setAnonNotes(await res.json()); setShowAnon(true); }
  };

  const adminDeleteNote = async (noteId: string, setter: React.Dispatch<React.SetStateAction<Note[]>>) => {
    const res = await fetch(`${API}/api/notes/admin/notes/${noteId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setter((prev) => prev.filter((n) => n._id !== noteId));
  };

  const adminToggleLock = async (noteId: string, setter: React.Dispatch<React.SetStateAction<Note[]>>) => {
    const res = await fetch(`${API}/api/notes/admin/notes/${noteId}/toggle-lock`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setter((prev) => prev.map((n) => n._id === noteId ? { ...n, isLocked: data.isLocked } : n));
    }
  };

  if (!isAdmin) {
    return <Container sx={{ mt: 4, textAlign: "center" }}><Typography variant="h5" color="error">Access Denied</Typography></Container>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Admin Panel</Typography>

      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>My Notes</Typography>
        <Button size="small" variant="outlined" onClick={fetchMyNotes}>{showMyNotes ? "Hide" : "Show"}</Button>
      </Box>
      <Collapse in={showMyNotes}>
        <Paper elevation={1} sx={{ mb: 3 }}>
          <NotesTable notes={myNotes} token={token!}
            onDelete={(id) => adminDeleteNote(id, setMyNotes)}
            onToggleLock={(id) => adminToggleLock(id, setMyNotes)} />
        </Paper>
      </Collapse>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Users</Typography>
      <Paper elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <UserRow key={user._id} user={user} token={token!} onDeleteUser={(id) => setUsers((p) => p.filter((u) => u._id !== id))} />
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
          <Typography variant="body2" sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>No users found</Typography>
        )}
      </Paper>

      <Box sx={{ display: "flex", alignItems: "center", mt: 4, mb: 2, gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Anonymous Notes</Typography>
        <Button size="small" variant="outlined" onClick={fetchAnonNotes}>{showAnon ? "Hide" : "Show"}</Button>
      </Box>
      <Collapse in={showAnon}>
        <Paper elevation={1}>
          <NotesTable notes={anonNotes} token={token!}
            onDelete={(id) => adminDeleteNote(id, setAnonNotes)}
            onToggleLock={(id) => adminToggleLock(id, setAnonNotes)} />
        </Paper>
      </Collapse>
    </Container>
  );
}
