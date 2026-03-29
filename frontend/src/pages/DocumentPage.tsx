import { useState } from "react";
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Snackbar, Alert, Fab, SwipeableDrawer, useMediaQuery, useTheme,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import BlockIcon from "@mui/icons-material/Block";
import SettingsIcon from "@mui/icons-material/Settings";
import CopyUrl from "../components/notes/CopyUrl";
import TextEditor from "../components/notes/TextEditor";
import { useAuth } from "../context/AuthContext";

interface DocMeta {
  isPrivate: boolean;
  isReadOnly: boolean;
  isLocked: boolean;
  isOwner: boolean;
  readOnly?: boolean;
  ownerName?: string;
}

function DocumentPage() {
  const { logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [meta, setMeta] = useState<DocMeta>({ isPrivate: false, isReadOnly: false, isLocked: false, isOwner: false, ownerName: "" });
  const [denied, setDenied] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showReadOnlyMsg, setShowReadOnlyMsg] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMeta = (m: DocMeta) => {
    setMeta(m);
    if (m.readOnly && !m.isOwner) setShowReadOnlyMsg(true);
  };

  const handleUseWithoutLogin = () => { logout(); window.location.href = "/"; };
  const handleLoginDifferent = () => { logout(); window.location.reload(); };

  const readOnlyMessage = meta.isLocked
    ? "This note has been locked by admin. Nobody can edit it."
    : "This note is read-only. You can view it but cannot make changes.";

  const showControls = !denied && !blocked;

  const controlsPanel = showControls && (
    <CopyUrl
      isOwner={meta.isOwner} isPrivate={meta.isPrivate}
      isReadOnly={meta.isReadOnly} isLocked={meta.isLocked}
      ownerName={meta.ownerName}
    />
  );

  return (
    <>
      <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Editor — always full width on mobile */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TextEditor onMeta={handleMeta} onAccessDenied={() => setDenied(true)} onBlocked={() => setBlocked(true)} />
        </Box>

        {/* Desktop — right panel */}
        {!isMobile && showControls && (
          <Box sx={{ width: 300, flexShrink: 0, p: 2 }}>
            {controlsPanel}
          </Box>
        )}
      </Box>

      {/* Mobile — FAB + bottom drawer */}
      {isMobile && showControls && (
        <>
          <Fab
            size="medium"
            className="no-print"
            onClick={() => setDrawerOpen(true)}
            sx={{
              position: "fixed", bottom: 16, right: 16,
              bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <SettingsIcon />
          </Fab>
          <SwipeableDrawer
            anchor="bottom"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onOpen={() => setDrawerOpen(true)}
            PaperProps={{ sx: { borderRadius: "16px 16px 0 0", maxHeight: "80vh", p: 2 } }}
          >
            {controlsPanel}
          </SwipeableDrawer>
        </>
      )}

      <Snackbar open={showReadOnlyMsg} autoHideDuration={5000} onClose={() => setShowReadOnlyMsg(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={meta.isLocked ? "warning" : "info"} onClose={() => setShowReadOnlyMsg(false)} variant="filled">
          {readOnlyMessage}
        </Alert>
      </Snackbar>

      <Dialog open={denied} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockIcon color="error" /> Private Note
        </DialogTitle>
        <DialogContent>
          <Typography>This note is private and you don't have access to view it.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="secondary" href="/" sx={{ color: "white", textTransform: "none" }}>
            Create your own note
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={blocked} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BlockIcon color="error" /> Account Blocked
        </DialogTitle>
        <DialogContent>
          <Typography>Your account has been blocked by the admin. You cannot access notes with this account.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleUseWithoutLogin} sx={{ textTransform: "none" }}>
            Use without login
          </Button>
          <Button variant="contained" onClick={handleLoginDifferent} sx={{ textTransform: "none" }}>
            Login as different user
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default DocumentPage;
