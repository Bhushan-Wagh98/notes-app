import { useState, ReactElement } from "react";
import { Chip, CircularProgress, Tooltip } from "@mui/material";

interface Props {
  title: string;
  label: string;
  icon: ReactElement;
  onClick: () => Promise<void>;
  color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export default function LoadingChip({ title, label, icon, onClick, color = "default" }: Props) {
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
      <Chip
        icon={loading ? <CircularProgress size={12} color="inherit" /> : icon}
        label={label}
        size="small" variant="outlined" color={color}
        onClick={handleClick}
        disabled={loading}
        sx={{ cursor: "pointer" }}
      />
    </Tooltip>
  );
}
