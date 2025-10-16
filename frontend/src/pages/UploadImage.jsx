import React, { useRef, useState, useEffect } from "react";
import { Button, Paper, Typography } from "@mui/material";
import * as faceapi from "face-api.js";
import { uploadImage } from "../services/faceService";
import { toast } from "react-toastify";

export default function UploadImagePage() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [latestDetections, setLatestDetections] = useState([]);
  const [resultImage, setResultImage] = useState(null);
  const [noFace, setNoFace] = useState(false);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {
        setUploadedImage(reader.result);

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
          toast.error("No face detected in uploaded image!");
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
    };
    reader.readAsDataURL(file);
  };

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
    <Paper className="p-6 ">
      <div className="grid md: grid-cols-2">
        <Typography variant="h5" sx={{ mt: 2 }}>
          Upload Image (Local Storage)
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Result
        </Typography>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="relative w-full">
          <Button
            variant="contained"
            onClick={() => fileInputRef.current.click()}
            disabled={!modelsLoaded}
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

          <div className="mt-4 relative">
            {uploadedImage && (
              <canvas ref={canvasRef} className="border rounded w-full" />
            )}
            {noFace && uploadedImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-semibold text-lg">
                No Face Detected
              </div>
            )}
          </div>

          {latestDetections.length > 0 && (
            <div className="mt-3">
              <Button
                variant="contained"
                onClick={uploadFaceImage}
                disabled={processing}
              >
                {processing ? "Uploading..." : "Save Image"}
              </Button>
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
