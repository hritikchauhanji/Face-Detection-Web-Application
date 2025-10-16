import React, { useRef, useState, useEffect } from "react";
import { Button, Paper, Typography } from "@mui/material";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { uploadImage } from "../services/faceService";
import { toast } from "react-toastify";

export default function FaceDetectPage() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [noFace, setNoFace] = useState(false);
  const [latestDetections, setLatestDetections] = useState([]);

  // 🧠 Load models once
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // ensure /public/models contains model files
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

  // 🎥 Live detection (bounding boxes only)
  useEffect(() => {
    let interval;
    if (modelsLoaded) {
      interval = setInterval(async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const canvas = canvasRef.current;

          const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight,
          };
          faceapi.matchDimensions(canvas, displaySize);

          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );

          const context = canvas.getContext("2d");
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (detections.length === 0) {
            setNoFace(true);
            setLatestDetections([]);
            return;
          }

          setNoFace(false);
          setLatestDetections(detections);

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );

          // draw bounding boxes only
          faceapi.draw.drawDetections(canvas, resizedDetections);
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [modelsLoaded]);

  // 📤 Capture + Upload (only if face detected)
  const captureAndUpload = async () => {
    if (!modelsLoaded) {
      toast.warning("Models still loading...");
      return;
    }

    if (latestDetections.length === 0) {
      toast.error("No face detected — image not saved!");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setProcessing(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");
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
        `Image uploaded successfully! Faces detected: ${latestDetections.length}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Error uploading image!");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Paper className="p-6">
      <Typography variant="h5" className="mb-4">
        Face Detection (Live)
      </Typography>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Webcam with bounding boxes */}
        <div className="relative w-full">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="rounded w-full"
            videoConstraints={{ facingMode: "user" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />

          {noFace && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-semibold text-lg">
              No Face Detected
            </div>
          )}

          <div className="mt-2">
            <Button
              variant="contained"
              onClick={captureAndUpload}
              disabled={processing || !modelsLoaded}
            >
              {processing ? "Uploading..." : "Capture & Save"}
            </Button>
          </div>
        </div>

        {/* Uploaded image */}
        <div>
          <Typography variant="subtitle1">Result</Typography>
          {resultImage ? (
            <img
              src={resultImage}
              alt="Result"
              className="max-w-full rounded"
            />
          ) : (
            <div className="text-gray-500">No result yet</div>
          )}
        </div>
      </div>
    </Paper>
  );
}
