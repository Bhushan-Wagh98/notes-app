import { useEffect, useState } from "react";
import { Box, TextField, IconButton, Button, Snackbar, Switch, Typography, Chip, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import PrintIcon from "@mui/icons-material/Print";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

interface CopyUrlProps {
  isOwner?: boolean;
  isPrivate?: boolean;
  isReadOnly?: boolean;
  isLocked?: boolean;
  ownerName?: string;
}

function CopyUrl({ isOwner, isPrivate: initialPrivate, isReadOnly: initialReadOnly, isLocked, ownerName }: CopyUrlProps) {
  const { id } = useParams<{ id: string }>();
  const { token, isLoggedIn } = useAuth();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(document.URL);
  const [isPrivate, setIsPrivate] = useState(initialPrivate ?? false);
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly ?? false);

  useEffect(() => { setUrl(document.URL); }, []);
  useEffect(() => { setIsPrivate(initialPrivate ?? false); }, [initialPrivate]);
  useEffect(() => { setIsReadOnly(initialReadOnly ?? false); }, [initialReadOnly]);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
  }

  async function toggleVisibility() {
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    await fetch(`${API}/api/notes/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isPrivate: newVal }),
    }).catch(() => setIsPrivate(!newVal));
  }

  async function toggleReadOnly() {
    const newVal = !isReadOnly;
    setIsReadOnly(newVal);
    await fetch(`${API}/api/notes/${id}/read-only`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isReadOnly: newVal }),
    }).catch(() => setIsReadOnly(!newVal));
  }

  return (
    <>
      <Box
        className="no-print"
        sx={{
          display: "flex", flexDirection: "column", gap: 2, p: 2,
          bgcolor: "primary.main", borderRadius: 2, height: "fit-content",
        }}
      >
        {/* Copy URL */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            size="small" value={url}
            slotProps={{ input: { readOnly: true } }}
            sx={{ flex: 1, bgcolor: "white", borderRadius: 1 }}
          />
          <IconButton onClick={handleCopy} sx={{ bgcolor: "grey.600", "&:hover": { bgcolor: "grey.700" } }}>
            <ContentCopyIcon sx={{ color: "white", fontSize: 20 }} />
          </IconButton>
        </Box>

        <Button variant="contained" color="secondary" href="/" target="_blank"
          sx={{ color: "white", textTransform: "none" }}>
          create new note
        </Button>

        {ownerName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">Created By:</Typography>
            <Tooltip title={ownerName}>
              <Chip icon={<PersonIcon />} label={isOwner ? "You" : ownerName}
                size="small" variant="outlined" sx={{ bgcolor: "white", maxWidth: 150 }} />
            </Tooltip>
          </Box>
        )}
        {isLocked && (
          <Chip icon={<LockIcon />} label="Locked by Admin" size="small" color="error" variant="outlined" sx={{ bgcolor: "white", alignSelf: "flex-start" }} />
        )}

        {isLoggedIn && isOwner && !isLocked && (
          <>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2">Public</Typography>
              <Switch checked={isPrivate} onChange={toggleVisibility} size="small" />
              <Typography variant="body2">Private</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2">Editable</Typography>
              <Switch checked={isReadOnly} onChange={toggleReadOnly} size="small" />
              <Typography variant="body2">Read Only</Typography>
            </Box>
          </>
        )}

        <Button
          variant="contained" color="error"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          sx={{ textTransform: "none", fontWeight: 500 }}
        >
          Print
        </Button>
      </Box>

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}
        message="Copied!" anchorOrigin={{ vertical: "top", horizontal: "center" }} />
    </>
  );
}

export default CopyUrl;
