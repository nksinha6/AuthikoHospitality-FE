import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useAuth } from "../context/AuthContext.jsx";
import { faceMatchService } from "../services/faceMatchService.js";

export default function VendorEntry() {
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessingApi, setIsProcessingApi] = useState(false);
  const [apiResult, setApiResult] = useState({ type: "", message: "" });
  const [autoCaptureStatus, setAutoCaptureStatus] = useState(
    "Move your face into the oval frame.",
  );
  const [isAligned, setIsAligned] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const stabilityCounter = useRef(0);
  const isProcessing = useRef(false);
  const requestRef = useRef(null);

  const { userData, propertyDetails } = useAuth();

  // Helper: Convert base64 canvas data to a File object for the API
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setTimeout(() => {
            requestRef.current = requestAnimationFrame(detectLoop);
          }, 500);
        };
      }
    } catch (error) {
      setCameraError("Unable to access camera.");
    }
  };

  useEffect(() => {
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        await startCamera();
      } catch (err) {
        setCameraError("Face security module failed to load.");
      }
    };
    initDetector();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const detectLoop = async () => {
    if (
      !detectorRef.current ||
      !videoRef.current ||
      capturedImage ||
      isProcessingApi
    )
      return;
    if (isProcessing.current) {
      requestRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    isProcessing.current = true;
    try {
      const result = detectorRef.current.detectForVideo(
        videoRef.current,
        performance.now(),
      );
      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        const noseTip = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const faceIsVisible = noseTip && leftEye && rightEye;
        const isCenteredX = noseTip.x > 0.4 && noseTip.x < 0.6;
        const isCenteredY = noseTip.y > 0.3 && noseTip.y < 0.7;
        const eyeDistance = Math.abs(rightEye.x - leftEye.x);
        const isGoodSize = eyeDistance > 0.15 && eyeDistance < 0.4;

        if (faceIsVisible && isCenteredX && isCenteredY && isGoodSize) {
          setIsAligned(true);
          setAutoCaptureStatus("Hold still... capturing");
          stabilityCounter.current += 1;
          if (stabilityCounter.current > 15) {
            handleCapture();
            isProcessing.current = false;
            return;
          }
        } else {
          setIsAligned(false);
          stabilityCounter.current = 0;
          if (!isCenteredX || !isCenteredY)
            setAutoCaptureStatus("Align face in oval");
          else if (!isGoodSize)
            setAutoCaptureStatus("Adjust distance to camera");
          else setAutoCaptureStatus("Position your face clearly");
        }
      } else {
        setIsAligned(false);
        stabilityCounter.current = 0;
        setAutoCaptureStatus("Searching for face...");
      }
    } catch (e) {
      console.error("Security Error:", e);
    }
    isProcessing.current = false;
    if (!capturedImage && !isProcessingApi)
      requestRef.current = requestAnimationFrame(detectLoop);
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isProcessingApi) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

    setCapturedImage(dataUrl);
    setIsProcessingApi(true);
    setAutoCaptureStatus("Verifying...");

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    try {
      // 1. Prepare the file from the captured dataURL
      const capturedFile = dataURLtoFile(dataUrl, "contractor_selfie.jpg");

      console.log("🚀 Initiating Contractor Face Match...");

      // 2. Execute the API call
      const response = await faceMatchService.matchContractorFace(capturedFile);
      // const response = {
      //   result: {
      //     faceMatchResult: "YES",
      //     phoneCountryCode: "91",
      //     phoneNumber: "9586023883",
      //   },
      // };

      // 3. Log the full response for debugging
      console.log("✅ API Response Received:", response);

      // 4. Update UI based on the response structure
      // (Adjusting logic to handle the likely success schema)
      if (response?.result?.faceMatchResult === "YES") {
        setApiResult({
          type: "success",
          message: "Identity Verified!",
        });
      } else {
        setApiResult({
          type: "error",
          message: "Face match score too low. Please try again.",
        });
      }
    } catch (error) {
      // Log the error details for technical review
      console.error("❌ Contractor Match Failed:");
      console.dir(error);

      // Display the specific error message (from your 400, 422, or 413 checks)
      setApiResult({
        type: "error",
        message: error.message || "Match Failed",
      });
    } finally {
      setIsProcessingApi(false);
      setTimeout(() => {
        setCapturedImage(null);
        setApiResult({ type: "", message: "" });
        setIsAligned(false);
        stabilityCounter.current = 0;
        setAutoCaptureStatus("Next person, please...");
        requestRef.current = requestAnimationFrame(detectLoop);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      {/* Dynamic Success/Error Toast */}
      {apiResult.message && (
        <div className="fixed top-8 left-1/2 z-50 -translate-x-1/2 animate-bounce">
          <div
            className={`flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl ${apiResult.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900">
              {apiResult.type === "success" ? "✓" : "!"}
            </div>
            <p className="font-bold text-white">{apiResult.message}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl">
        <div className="px-4 py-3">
          <div className="mb-3 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              Confirm Your Identity
            </h1>
            <p className="mt-2 text-sm">Automated secure identity check</p>
          </div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Property Name
              </p>
              <h2 className="text-sm font-bold text-slate-800">
                {propertyDetails?.name || "TechFlow Systems"}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Property Details
              </p>
              <p className="text-sm font-medium text-slate-600">
                Innovation Tower, 1st Floor, Tech Park, Bangalore
              </p>
            </div>
          </div>

          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] bg-slate-900 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Live Camera Badge */}
            {!capturedImage && !isProcessingApi && (
              <div className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 shadow-lg">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  Live Camera
                </span>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessingApi && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                  <span className="text-white font-bold">Verifying...</span>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                <div
                  className={`h-3/4 w-3/4 overflow-hidden rounded-2xl border-4 shadow-2xl ${apiResult.type === "error" ? "border-red-500" : "border-emerald-500"}`}
                >
                  <img
                    src={capturedImage}
                    className="h-full w-full object-cover"
                    alt="Captured"
                  />
                </div>
              </div>
            )}

            {!capturedImage && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`h-[85%] w-[32%] border-2 transition-all duration-300 ${isAligned ? "border-emerald-500 scale-105 shadow-[0_0_30px_rgba(16,185,129,0.5)]" : "border-white/40 border-dashed"}`}
                  style={{ borderRadius: "100%" }}
                ></div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-[2rem] bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-3 pl-2">
              <div
                className={`h-3 w-3 rounded-full ${isAligned ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
              />
              <span className="text-sm font-semibold text-slate-700">
                {autoCaptureStatus}
              </span>
            </div>
            <button
              onClick={handleCapture}
              disabled={!!capturedImage || isProcessingApi}
              className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Manual Capture
            </button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
