import React, { useState } from "react";
import { Paper, TextField, Button, Typography, Link } from "@mui/material";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data = await loginUser(form);
      setAuthUser(data.accessToken);
      toast.success("Login successful!", {
        onClose: () => navigate("/dashboard"),
        autoClose: 1500,
      });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.length) {
        const fieldErrors = {};
        errorData.errors.forEach((item) => {
          fieldErrors[item.field] = item.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(errorData?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Paper className="p-6 max-w-md mx-auto mt-8">
        <Typography variant="h5" sx={{ mb: 2 }} className="text-center">
          Sign In
        </Typography>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email || ""}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <Typography
          sx={{ mt: 2 }}
          className="text-center text-sm text-gray-600"
        >
          Don't have an account?{" "}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/register")}
            sx={{ fontWeight: 500 }}
          >
            Register
          </Link>
        </Typography>
      </Paper>
    </motion.div>
  );
}
