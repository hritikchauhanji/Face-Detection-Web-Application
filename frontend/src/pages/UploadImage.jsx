import React, { useRef, useState, useEffect } from "react";
import { Button, Paper, Typography, CircularProgress } from "@mui/material";
import * as faceapi from "face-api.js";
import { uploadImage, uploadImageWithOpenCV } from "../services/faceService";
import { toast } from "react-toastify";

export default function UploadImagePage() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [latestDetections, setLatestDetections] = useState([]);
  const [resultImage, setResultImage] = useState(null);
  const [opencvResult, setOpencvResult] = useState(null);
  const [noFace, setNoFace] = useState(false);

  // Load face-api.js models once
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        toast.success("Face detection models loaded!");
      } catch (err) {
        console.error(err);
        toast.error("Error loading face detection models!");
      }
    };
    loadModels();
  }, []);

  // Handle image file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {
        setUploadedImage(reader.result);
        drawAndDetectFace(img);
      };
    };
    reader.readAsDataURL(file);
  };

  // Draw uploaded image and run face-api.js detection
  const drawAndDetectFace = async (img) => {
    const canvas = canvasRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0);

    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (detections.length === 0) {
      setNoFace(true);
      setLatestDetections([]);
      toast.warning("No face detected!");
    } else {
      setNoFace(false);
      setLatestDetections(detections);
      const resizedDetections = faceapi.resizeResults(detections, {
        width: img.width,
        height: img.height,
      });
      faceapi.draw.drawDetections(canvas, resizedDetections);
    }
  };

  // Upload image with face-api.js detection data
  const uploadFaceImage = async () => {
    if (!uploadedImage || latestDetections.length === 0) {
      toast.error("No face detected or no image selected!");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(uploadedImage);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "upload.jpg");
      formData.append("facesDetected", latestDetections.length);
      formData.append(
        "detectionData",
        JSON.stringify(
          latestDetections.map((d) => d.box || d.detection?.box || {})
        )
      );

      const response = await uploadImage(formData);
      setResultImage(response.data.imageHistory.image);
      toast.success(
        `Uploaded successfully! Faces detected: ${latestDetections.length}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Error uploading image!");
    } finally {
      setProcessing(false);
    }
  };

  // Detect and upload image using backend OpenCV API
  const uploadWithOpenCV = async () => {
    if (!uploadedImage) {
      toast.error("Please select an image first!");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(uploadedImage);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "opencv_upload.jpg");

      const response = await uploadImageWithOpenCV(formData);
      setOpencvResult(response.data.imageHistory.image);
      toast.success(
        `OpenCV Detection Successful! Faces: ${response.data.imageHistory.facesDetected}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Error with OpenCV detection!");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Paper className="p-6">
      <div className="grid md:grid-cols-2">
        <Typography variant="h5" sx={{ mt: 2 }}>
          Upload Image for Face Detection
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Detection Result
        </Typography>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-4">
        {/* Left Panel */}
        <div>
          <Button
            variant="contained"
            onClick={() => fileInputRef.current.click()}
            disabled={!modelsLoaded || processing}
          >
            Select Image
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {uploadedImage && (
            <div className="mt-4 relative">
              <canvas ref={canvasRef} className="border rounded w-full" />
              {noFace && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-semibold text-lg">
                  No Face Detected
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="contained"
              color="primary"
              onClick={uploadFaceImage}
              disabled={processing || !latestDetections.length}
            >
              {processing ? <CircularProgress size={20} /> : "Save (Face-API)"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={uploadWithOpenCV}
              disabled={processing || !uploadedImage}
            >
              {processing ? <CircularProgress size={20} /> : "Detect (OpenCV)"}
            </Button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {resultImage && (
            <>
              <Typography variant="subtitle1">Face-API Result:</Typography>
              <img
                src={resultImage}
                alt="faceapi-result"
                className="rounded border w-full"
              />
            </>
          )}

          {opencvResult && (
            <>
              <Typography variant="subtitle1">OpenCV Result:</Typography>
              <img
                src={opencvResult}
                alt="opencv-result"
                className="rounded border w-full"
              />
            </>
          )}

          {!resultImage && !opencvResult && (
            <Typography color="textSecondary" className="mt-4">
              No results yet.
            </Typography>
          )}
        </div>
      </div>
    </Paper>
  );
}
