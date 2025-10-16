// controllers/upload.controller.js
import { User } from "../models/user.model.js";
import { ImageHistory } from "../models/imageHistory.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

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

export { uploadImage, getUploadHistory, deleteImage };
