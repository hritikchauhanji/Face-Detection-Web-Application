// routes/face.route.js
import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../validator/validate.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteImage,
  getUploadHistory,
  uploadAndDetectFacesbyOpenCV,
  uploadImage,
} from "../controllers/face.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const validateUpload = [
  body("detectionData")
    .optional()
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
        return true;
      } catch {
        throw new Error("detectionData must be a valid JSON array");
      }
    }),
  body("facesDetected")
    .optional()
    .isInt({ min: 0 })
    .withMessage("facesDetected must be a non-negative integer"),
];

// Save face detection metadata
router
  .route("/upload")
  .post(
    verifyJWT,
    upload.single("image"),
    validateUpload,
    validate,
    uploadImage
  );

// Save face detection by OpenCV
router
  .route("/upload-faces-opencv")
  .post(verifyJWT, upload.single("image"), uploadAndDetectFacesbyOpenCV);

// Get user's uploaded image history
router.route("/history").get(verifyJWT, getUploadHistory);

// Delete image by ID
router.route("/delete/:imageId").delete(verifyJWT, deleteImage);

export default router;
