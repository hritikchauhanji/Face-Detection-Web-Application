// controllers/upload.controller.js
import { User } from "../models/user.model.js";
import { ImageHistory } from "../models/imageHistory.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import cv from "opencv4nodejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Upload Image and save to ImageHistory
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const imageLocalPath = req.file.path;
    if (!imageLocalPath) {
      return res.status(400).json({ message: "Image local path not found" });
    }

    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image.url) {
      return res
        .status(500)
        .json({ message: "Error while uploading image to Cloudinary" });
    }

    // Parse detectionData if present (fix for "must be array" error)
    const detectionData = req.body.detectionData
      ? JSON.parse(req.body.detectionData)
      : [];

    const facesDetected = req.body.facesDetected
      ? Number(req.body.facesDetected)
      : 0;

    const imageHistory = await ImageHistory.create({
      user: user._id,
      image: image.url,
      publicId: image.public_id,
      facesDetected,
      detectionData,
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while uploading image",
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Haar Cascade
const cascadePath = path.resolve(
  __dirname,
  "../cascades/haarcascade_frontalface_default.xml"
);
const classifier = new cv.CascadeClassifier(cascadePath);

const uploadAndDetectFacesbyOpenCV = async (req, res) => {
  try {
    // Validate upload
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    const imagePath = req.file.path;

    // Read image buffer and process via OpenCV
    const buffer = fs.readFileSync(imagePath);
    const img = cv.imdecode(buffer);
    const gray = img.bgrToGray();

    // Detect faces
    const options = {
      scaleFactor: 1.1,
      minNeighbors: 5,
      minSize: new cv.Size(30, 30),
    };
    const faces = classifier.detectMultiScale(gray, options).objects;

    // If no faces found, clean up and return response
    if (!faces || faces.length === 0) {
      fs.unlinkSync(imagePath);
      return res.status(200).json({
        success: false,
        message: "No face detected",
      });
    }

    const detectionData = faces.map((f) => ({
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
    }));
    const facesDetected = detectionData.length;

    // Draw rectangles
    const resultImg = img.copy();
    detectionData.forEach((f) => {
      resultImg.drawRectangle(
        new cv.Point2(f.x, f.y),
        new cv.Point2(f.x + f.width, f.y + f.height),
        new cv.Vec(255, 0, 0),
        2
      );
    });

    // Encode to JPEG and save temp output
    const processedBuffer = cv.imencode(".jpg", resultImg);
    const processedPath = path.join(
      path.dirname(imagePath),
      `processed_${Date.now()}.jpg`
    );
    fs.writeFileSync(processedPath, processedBuffer);

    // Upload processed image to Cloudinary
    const uploaded = await uploadOnCloudinary(processedPath);
    if (!uploaded || !uploaded.url) {
      fs.unlinkSync(imagePath);
      if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    // Save history to DB
    const imageHistory = await ImageHistory.create({
      user: user._id,
      image: uploaded.url,
      publicId: uploaded.public_id,
      facesDetected,
      detectionData,
    });

    //Cleanup local files
    fs.unlinkSync(imagePath);
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);

    // Return response
    res.status(200).json({
      success: true,
      message: "Face detection successful",
      imageHistory,
    });
  } catch (error) {
    console.error("Face detection error:", error);
    // Attempt to clean up local files if exist
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during face detection",
    });
  }
};

// Get all uploaded images of a user
const getUploadHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await ImageHistory.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Upload history fetched successfully",
      history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an image by ID
const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    // Find the image record
    const imageRecord = await ImageHistory.findOne({
      _id: imageId,
      user: req.user._id,
    });
    if (!imageRecord) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from Cloudinary
    if (imageRecord.publicId) {
      await deleteFromCloudinary(imageRecord.publicId);
    }

    // Delete from MongoDB
    await ImageHistory.deleteOne({ _id: imageId });

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  uploadImage,
  getUploadHistory,
  deleteImage,
  uploadAndDetectFacesbyOpenCV,
};
