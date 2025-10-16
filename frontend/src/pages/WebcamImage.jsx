import React, { useRef, useState, useEffect } from "react";
import { Button, Paper, Typography } from "@mui/material";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { uploadImage } from "../services/faceService";
import { toast } from "react-toastify";

export default function WebcamImage() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [noFace, setNoFace] = useState(false);
  const [latestDetections, setLatestDetections] = useState([]);
  const [webcamActive, setWebcamActive] = useState(false);

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
      }, 200);
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
      <div className="grid md:grid-cols-2 gap-4">
        <Typography variant="h5" sx={{ mt: 2 }}>
          Face Detection (Live)
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Result
        </Typography>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Webcam section */}
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

              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="contained"
                  onClick={captureAndUpload}
                  disabled={processing || !modelsLoaded}
                >
                  {processing ? "Uploading..." : "Capture & Save"}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setWebcamActive(false)}
                >
                  Stop Webcam
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          {resultImage ? (
            <img
              src={resultImage}
              alt="Result"
              className="max-w-full rounded mt-14"
            />
          ) : (
            <div className="text-gray-500 mt-2">No result yet</div>
          )}
        </div>
      </div>
    </Paper>
  );
}
