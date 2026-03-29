import { useState } from "react";
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Divider, Tooltip, useMediaQuery, useTheme,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotesSidebar from "../notes/NotesSidebar";
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./constants";

const NAV_ITEMS = [
  { label: "Documents", icon: <DescriptionIcon />, path: "/", adminOnly: false },
  { label: "Help", icon: <HelpOutlineIcon />, path: "/help", adminOnly: false },
  { label: "Admin", icon: <AdminPanelSettingsIcon />, path: "/admin", adminOnly: true },
];

interface SidebarProps {
  expanded: boolean;
  onClose: () => void;
}

export default function Sidebar({ expanded, onClose }: SidebarProps) {
  const { isAdmin, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [notesOpen, setNotesOpen] = useState(false);

  const currentWidth = expanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const drawerContent = (
    <>
      <Toolbar />
      <List sx={{ px: expanded ? 1 : 0.5 }}>
        {NAV_ITEMS
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active =
              item.path === "/"
                ? pathname === "/" || pathname.startsWith("/documents")
                : pathname.startsWith(item.path);

            const button = (
              <ListItemButton
                key={item.label}
                selected={active}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: expanded ? "initial" : "center",
                  px: expanded ? 2 : 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: expanded ? 36 : "auto" }}>
                  {item.icon}
                </ListItemIcon>
                {expanded && <ListItemText primary={item.label} />}
              </ListItemButton>
            );

            return expanded ? button : (
              <Tooltip key={item.label} title={item.label} placement="right">
                {button}
              </Tooltip>
            );
          })}

        {isLoggedIn && (
          <>
            <Divider sx={{ my: 1 }} />
            {(() => {
              const button = (
                <ListItemButton
                  onClick={() => setNotesOpen(true)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    justifyContent: expanded ? "initial" : "center",
                    px: expanded ? 2 : 1.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: expanded ? 36 : "auto" }}>
                    <HistoryIcon />
                  </ListItemIcon>
                  {expanded && <ListItemText primary="My Notes" />}
                </ListItemButton>
              );

              return expanded ? button : (
                <Tooltip title="My Notes" placement="right">{button}</Tooltip>
              );
            })()}
          </>
        )}
      </List>
    </>
  );

  return (
    <>
      {isMobile ? (
        /* Mobile: temporary overlay, always full width */
        <Drawer
          variant="temporary"
          open={expanded}
          onClose={onClose}
          className="no-print"
          sx={{
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop: permanent drawer that shrinks to icon-only */
        <Drawer
          variant="permanent"
          className="no-print"
          sx={{
            width: currentWidth,
            flexShrink: 0,
            transition: "width 225ms",
            "& .MuiDrawer-paper": {
              width: currentWidth,
              overflowX: "hidden",
              transition: "width 225ms",
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <NotesSidebar open={notesOpen} onClose={() => setNotesOpen(false)} />
    </>
  );
}
