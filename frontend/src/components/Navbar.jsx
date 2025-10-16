import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

export default function Navbar() {
  const { user, setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar className="flex justify-between">
        <Typography
          variant="h6"
          component={Link}
          to="/"
          className="no-underline text-white"
        >
          Face Detection
        </Typography>

        {user && (
          <Box className="flex gap-4 mx-auto">
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>
            <Button color="inherit" component={Link} to="/detect">
              WebCam
            </Button>
            <Button color="inherit" component={Link} to="/detect-local-image">
              Upload Image
            </Button>
          </Box>
        )}
        <div>
          {user ? (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" component={Link} to="/register">
              Get Started
            </Button>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}
