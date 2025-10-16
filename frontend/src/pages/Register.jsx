import React, { useState } from "react";
import { Paper, TextField, Button, Typography, Link } from "@mui/material";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
      await registerUser(form);
      toast.success("Account created successfully!", {
        onClose: () => navigate("/login"),
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
        toast.error(errorData?.message || "Registration failed");
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
          Create Account
        </Typography>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name || ""}
          />
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
            error={!!errors.password}
            helperText={errors.password || ""}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </Button>
        </form>
        <Typography
          sx={{ mt: 2 }}
          className="text-center text-sm text-gray-600"
        >
          Already have an account?{" "}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/login")}
            sx={{ fontWeight: 500 }}
          >
            Login
          </Link>
        </Typography>
      </Paper>
    </motion.div>
  );
}
