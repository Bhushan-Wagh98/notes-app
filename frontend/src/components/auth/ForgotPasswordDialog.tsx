import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Box, Typography,
  IconButton, InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
const PW_HINT = "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";

export default function ForgotPasswordDialog({ open, onClose, prefillEmail }: {
  open: boolean; onClose: () => void; prefillEmail?: string;
}) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState(prefillEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("email"); setEmail(prefillEmail || ""); setOtp(""); setNewPassword("");
    setShowPw(false); setError(""); setMessage("");
  };

  const handleSendOtp = async () => {
    setError(""); setMessage("");
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("otp");
      setMessage("OTP sent to your email!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(""); setMessage("");
    if (!otp || otp.length !== 6) { setError("Please enter the 6-digit OTP"); return; }
    if (!PW_REGEX.test(newPassword)) { setError(PW_HINT); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setTimeout(() => { reset(); onClose(); }, 2000);
    } catch (e: any) {
      setError(e.message);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const pwToggle = (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setShowPw(!showPw)} edge="end">
        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="xs" fullWidth>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 1 }}>{message}</Alert>}

        {step === "email" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your registered email to receive a password reset OTP.
            </Typography>
            <TextField label="Email" type="email" size="small" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the OTP sent to <strong>{email}</strong> and your new password.
            </Typography>
            <TextField label="OTP" size="small" required value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputProps={{ maxLength: 6 }} autoFocus />
            <TextField label="New Password" type={showPw ? "text" : "password"} size="small" required
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              error={newPassword.length > 0 && !PW_REGEX.test(newPassword)}
              helperText={newPassword.length > 0 && !PW_REGEX.test(newPassword) ? PW_HINT : ""}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              slotProps={{ input: { endAdornment: pwToggle } }} />
            <Button size="small" onClick={handleSendOtp} disabled={loading}
              sx={{ alignSelf: "flex-start", textTransform: "none" }}>
              Resend OTP
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { reset(); onClose(); }}>Cancel</Button>
        {step === "email" ? (
          <Button variant="contained" onClick={handleSendOtp} disabled={loading}>Send OTP</Button>
        ) : (
          <Button variant="contained" onClick={handleReset} disabled={loading}>Reset Password</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
