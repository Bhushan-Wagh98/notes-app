import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/layout";
import DocumentPage from "./pages/DocumentPage";
import HelpPage from "./pages/HelpPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to={`/documents/${uuidV4()}`} replace />} />
            <Route path="/documents/:id" element={<DocumentPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
