// routes/face.route.js
import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../validator/validate.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteImage,
  getUploadHistory,
  uploadImage,
} from "../controllers/face.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Save face detection metadata
router
  .route("/upload")
  .post(
    verifyJWT,
    upload.single("image"),
    [
      body("facesDetected")
        .optional()
        .isInt({ min: 0 })
        .withMessage("facesDetected must be a number"),
      body("detectionData")
        .optional()
        .isArray()
        .withMessage("detectionData must be an array"),
    ],
    validate,
    uploadImage
  );

// Get user's uploaded image history
router.route("/history").get(verifyJWT, getUploadHistory);

// Delete image by ID
router.route("/delete/:imageId").delete(verifyJWT, deleteImage);

export default router;
