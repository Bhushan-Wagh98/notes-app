import { useState } from "react";
import {
  AppBar, Toolbar, Typography, Avatar, Button, Box,
  IconButton, Menu, MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthDialog from "../auth/AuthDialog";
import ProfileDialog from "../auth/ProfileDialog";
import { NAVBAR_HEIGHT } from "./constants";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { isLoggedIn, firstName, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <AppBar
        position="fixed"
        className="no-print"
        sx={{
          height: NAVBAR_HEIGHT,
          bgcolor: "white",
          boxShadow: 1,
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ height: NAVBAR_HEIGHT, gap: 1 }}>
          {/* Hamburger — toggles sidebar */}
          <IconButton edge="start" onClick={onToggleSidebar} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Box
            onClick={() => navigate("/")}
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
          >
            <Avatar
              src="https://raw.githubusercontent.com/Bhushan-Wagh98/notes/main/logo192.png"
              alt="logo"
              sx={{ width: 36, height: 36 }}
            />
            <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
              Share Notes
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Auth controls */}
          {isLoggedIn ? (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <Avatar
                  sx={{
                    width: 32, height: 32,
                    bgcolor: "primary.main", color: "text.primary", fontSize: 14,
                  }}
                >
                  {firstName?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </IconButton>
              <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
                {firstName}
              </Typography>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setAnchorEl(null); setProfileOpen(true); }}>
                  Edit Profile
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button size="small" onClick={() => setAuthOpen(true)} startIcon={<PersonIcon />} variant="outlined">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
