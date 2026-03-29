import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
  palette: {
    primary: { main: "#faee7a" },
    secondary: { main: "#4caf50" },
    error: { main: "#f44336" },
  },
});

export default theme;
