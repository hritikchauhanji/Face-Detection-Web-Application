// App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { injectAuthSetter } from "./services/axiosInstance";
import UploadImage from "./pages/UploadImage";
import WebcamImage from "./pages/WebcamImage";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3b82f6" }, // Tailwind's blue-500
    background: {
      default: "#0f172a", // Slate-900
      paper: "rgba(255, 255, 255, 0.08)",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
});

// Protected route wrapper
const Protected = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Main App component
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Separate component to access hooks
const AppContent = () => {
  const { setAuthUser } = useAuth();
  const location = useLocation();

  // Inject Auth setter into Axios
  useEffect(() => {
    injectAuthSetter(setAuthUser);
  }, [setAuthUser]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-6 px-4 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/detect"
                element={
                  <Protected>
                    <WebcamImage />
                  </Protected>
                }
              />
              <Route
                path="/detect-local-image"
                element={
                  <Protected>
                    <UploadImage />
                  </Protected>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
