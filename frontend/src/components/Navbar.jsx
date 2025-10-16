import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
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
        <div>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            className="no-underline text-white"
          >
            Face Detection
          </Typography>
        </div>
        <div>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/detect">
                Detect
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}
