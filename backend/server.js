import connectDB from "./config/db.js";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
connectDB();

const app = express();

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
