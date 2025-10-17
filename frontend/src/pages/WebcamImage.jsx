import React, { useRef, useState, useEffect } from "react";
import { Button, Paper, Typography } from "@mui/material";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { uploadImage, uploadImageWithOpenCV } from "../services/faceService"; // existing function for backend upload
import { toast } from "react-toastify";

export default function WebcamImage() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [opencvResult, setOpencvResult] = useState(null);
  const [noFace, setNoFace] = useState(false);
  const [latestDetections, setLatestDetections] = useState([]);
  const [webcamActive, setWebcamActive] = useState(false);

  // Load face-api.js models
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
        toast.success("Face-api.js models loaded!");
      } catch (err) {
        console.error(err);
        toast.error("Error loading face-api models!");
      }
    };
    loadModels();
  }, []);

  // Real-time detection loop
  useEffect(() => {
    let interval;
    if (modelsLoaded && webcamActive) {
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
          faceapi.draw.drawDetections(canvas, resizedDetections);
        }
      }, 250);
    }

    return () => {
      if (interval) clearInterval(interval);
      const canvas = canvasRef.current;
      if (canvas)
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      setNoFace(false);
      setLatestDetections([]);
    };
  }, [modelsLoaded, webcamActive]);

  // -----------------------------
  // CLIENT-SIDE (face-api.js)
  // -----------------------------
  const captureAndUploadFaceAPI = async () => {
    if (!modelsLoaded) return toast.warning("Models still loading...");
    if (latestDetections.length === 0) {
      toast.error("No face detected!");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setProcessing(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "capture_faceapi.jpg");
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
        `Face-api.js upload success (${latestDetections.length} faces)`
      );
    } catch (err) {
      console.error(err);
      toast.error("Face-api.js upload failed");
    } finally {
      setProcessing(false);
    }
  };

  // -----------------------------
  // SERVER-SIDE (OpenCV backend)
  // -----------------------------
  const captureAndUploadOpenCV = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return toast.warning("No image captured");

    setProcessing(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "capture_opencv.jpg");

      // Hit your backend OpenCV route (e.g. /api/face/upload)
      const response = await uploadImageWithOpenCV(formData);
      setOpencvResult(response.data.imageHistory.image);
      toast.success("Processed by OpenCV backend!");
    } catch (err) {
      console.error(err);
      toast.error("OpenCV upload failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Paper className="p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Typography variant="h5" sx={{ mt: 2 }}>
          Live Face Detection
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Results
        </Typography>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Webcam view */}
        <div className="relative w-full">
          {!webcamActive && (
            <Button
              variant="contained"
              onClick={() => setWebcamActive(true)}
              disabled={!modelsLoaded}
            >
              Start Webcam
            </Button>
          )}

          {webcamActive && (
            <div className="relative">
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

              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {/* Face API client-side */}
                <Button
                  variant="contained"
                  onClick={captureAndUploadFaceAPI}
                  disabled={processing || !modelsLoaded}
                >
                  {processing ? "Processing..." : "Detect (face-api.js)"}
                </Button>

                {/* OpenCV backend */}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={captureAndUploadOpenCV}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Detect (OpenCV API)"}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setWebcamActive(false);
                    setResultImage(null);
                    setOpencvResult(null);
                  }}
                >
                  Stop Webcam
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Result panel */}
        <div className="flex flex-col items-center">
          {resultImage && (
            <div>
              <Typography className="mt-2">face-api.js Result</Typography>
              <img
                src={resultImage}
                alt="face-api result"
                className="max-w-full rounded mt-2 shadow"
              />
            </div>
          )}

          {opencvResult && (
            <div>
              <Typography className="mt-6">OpenCV Backend Result</Typography>
              <img
                src={opencvResult}
                alt="opencv result"
                className="max-w-full rounded mt-2 shadow"
              />
            </div>
          )}

          {!resultImage && !opencvResult && (
            <div className="text-gray-500 mt-10">No result yet</div>
          )}
        </div>
      </div>
    </Paper>
  );
}
