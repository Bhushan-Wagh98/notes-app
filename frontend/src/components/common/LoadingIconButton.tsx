import { useState, ReactNode } from "react";
import { IconButton, CircularProgress, Tooltip } from "@mui/material";

interface Props {
  title: string;
  icon: ReactNode;
  onClick: () => Promise<void>;
  color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}

export default function LoadingIconButton({ title, icon, onClick, color = "default", size = "small", disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={title}>
      <span>
        <IconButton size={size} color={color} onClick={handleClick} disabled={loading || disabled}>
          {loading ? <CircularProgress size={18} color="inherit" /> : icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}
