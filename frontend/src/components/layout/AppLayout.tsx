import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { NAVBAR_HEIGHT } from "./constants";

/**
 * Root layout shell.
 * - Fixed navbar at top
 * - Collapsible sidebar (icon-only when collapsed on desktop, overlay on mobile)
 * - Only the content area scrolls
 */
export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState(!isMobile);

  const toggleSidebar = () => setExpanded((prev) => !prev);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Navbar onToggleSidebar={toggleSidebar} />
      <Sidebar expanded={expanded} onClose={() => setExpanded(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${NAVBAR_HEIGHT}px`,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          overflow: "auto",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
