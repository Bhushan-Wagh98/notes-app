import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Tabs, Tab, Alert, Box, Typography,
  IconButton, InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../context/AuthContext";
import ForgotPasswordDialog from "./ForgotPasswordDialog";

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
const PW_HINT = "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";

export default function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const reset = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setShowPw(false);
    setOtp(""); setOtpSent(false); setError(""); setMessage("");
  };

  const pwToggle = (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setShowPw(!showPw)} edge="end">
        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.token, data.email, data.firstName, data.isAdmin);
      reset(); onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(""); setMessage("");
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name required"); return; }
    if (!PW_REGEX.test(password)) { setError(PW_HINT); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
      setMessage("OTP sent to your email!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(""); setMessage("");
    if (!otp || otp.length !== 6) { setError("Please enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      login(data.token, data.email, data.firstName, data.isAdmin);
      reset(); onClose();
    } catch (e: any) {
      setError(e.message);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const pwError = tab === 1 && password.length > 0 && !PW_REGEX.test(password);

  return (
    <>
      <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); reset(); }} centered>
            <Tab label="Login" />
            <Tab label="Sign Up" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 1 }}>{message}</Alert>}

          {tab === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField label="Email" type="email" size="small" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Password" type={showPw ? "text" : "password"} size="small" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                slotProps={{ input: { endAdornment: pwToggle } }} />
              <Button size="small" onClick={() => setForgotOpen(true)}
                sx={{ alignSelf: "flex-start", textTransform: "none", p: 0 }}>
                Forgot Password?
              </Button>
            </Box>
          ) : !otpSent ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label="First Name" size="small" required fullWidth
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField label="Last Name" size="small" required fullWidth
                  value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Box>
              <TextField label="Email" type="email" size="small" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Password" type={showPw ? "text" : "password"} size="small" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                error={!!pwError} helperText={pwError ? PW_HINT : ""}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                slotProps={{ input: { endAdornment: pwToggle } }} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Enter the 6-digit OTP sent to <strong>{email}</strong>
              </Typography>
              <TextField label="OTP" size="small" required value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                inputProps={{ maxLength: 6 }} autoFocus />
              <Button size="small" onClick={handleSendOtp} disabled={loading} sx={{ alignSelf: "flex-start", textTransform: "none" }}>
                Resend OTP
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { reset(); onClose(); }}>Cancel</Button>
          {tab === 0 ? (
            <Button variant="contained" onClick={handleLogin} disabled={loading}>Login</Button>
          ) : !otpSent ? (
            <Button variant="contained" onClick={handleSendOtp} disabled={loading || !!pwError}>Send OTP</Button>
          ) : (
            <Button variant="contained" onClick={handleVerifyOtp} disabled={loading}>Verify & Sign Up</Button>
          )}
        </DialogActions>
      </Dialog>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} prefillEmail={email} />
    </>
  );
}
