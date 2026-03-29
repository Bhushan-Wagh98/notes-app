import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Box, Divider, Typography,
  IconButton, InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../context/AuthContext";
import ForgotPasswordDialog from "./ForgotPasswordDialog";

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
const PW_HINT = "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";

export default function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token, email, setFirstName: setCtxFirstName } = useAuth();
  const [firstName, setFirstName] = useState(localStorage.getItem("firstName") || "");
  const [lastName, setLastName] = useState(localStorage.getItem("lastName") || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const pwToggle = (show: boolean, toggle: () => void) => (
    <InputAdornment position="end">
      <IconButton size="small" onClick={toggle} edge="end">
        {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  const handleUpdateName = async () => {
    setError(""); setMsg("");
    if (!firstName.trim() || !lastName.trim()) { setError("Both names required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCtxFirstName(data.firstName);
      localStorage.setItem("lastName", data.lastName);
      setMsg("Name updated!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError(""); setMsg("");
    if (!currentPassword || !newPassword) { setError("Both passwords required"); return; }
    if (!PW_REGEX.test(newPassword)) { setError(PW_HINT); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Password changed!");
      setCurrentPassword(""); setNewPassword("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {msg && <Alert severity="success" sx={{ mb: 1 }}>{msg}</Alert>}

          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Change Name</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <TextField label="First Name" size="small" required fullWidth
              value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField label="Last Name" size="small" required fullWidth
              value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Box>
          <Button variant="contained" size="small" onClick={handleUpdateName} disabled={loading} sx={{ mb: 2 }}>
            Update Name
          </Button>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Change Password</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField label="Current Password" type={showCurPw ? "text" : "password"} size="small" required
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              slotProps={{ input: { endAdornment: pwToggle(showCurPw, () => setShowCurPw(!showCurPw)) } }} />
            <TextField label="New Password" type={showNewPw ? "text" : "password"} size="small" required
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              error={newPassword.length > 0 && !PW_REGEX.test(newPassword)}
              helperText={newPassword.length > 0 && !PW_REGEX.test(newPassword) ? PW_HINT : ""}
              slotProps={{ input: { endAdornment: pwToggle(showNewPw, () => setShowNewPw(!showNewPw)) } }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
            <Button size="small" onClick={() => setForgotOpen(true)}
              sx={{ textTransform: "none", p: 0 }}>
              Forgot Password?
            </Button>
            <Button variant="contained" size="small" onClick={handleChangePassword} disabled={loading}>
              Change Password
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} prefillEmail={email || ""} />
    </>
  );
}
