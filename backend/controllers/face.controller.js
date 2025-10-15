// controllers/upload.controller.js
import { User } from "../models/user.model.js";
import { ImageHistory } from "../models/imageHistory.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Upload Image and save to ImageHistory
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const imageLocalPath = req.file.path;
    if (!imageLocalPath) {
      return res.status(400).json({ message: "Image local path not found" });
    }

    // Upload to Cloudinary
    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image.url) {
      return res
        .status(500)
        .json({ message: "Error while uploading image to Cloudinary" });
    }

    // Save image metadata to ImageHistory
    const imageHistory = await ImageHistory.create({
      user: user._id,
      image: image.url,
      publicId: image.public_id,
      facesDetected: 0, // will update after face detection from frontend
      detectionData: [], // will update after face detection from frontend
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      imageHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

export { uploadImage, getUploadHistory };
