import connectDB from "./config/db.js";
import dotenv from "dotenv";
import express from "express";
import userRouter from "./routes/user.route.js";
import bodyParser from "body-parser";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/auth", userRouter);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
