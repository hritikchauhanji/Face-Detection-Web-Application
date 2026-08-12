import connectDB from "./config/db.js";
import dotenv from "dotenv";
import express from "express";
import userRouter from "./routes/user.route.js";
import faceRouter from "./routes/face.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_PROD],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


// Server is running
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Face Detection Backend is running",
  });
});

// Health Check Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/face", faceRouter);

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port: ${PORT}`);
});