import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useAuth } from "../context/AuthContext.jsx";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { faceMatchService } from "../services/faceMatchService.js";
import { guestDetailsService } from "../services/guestDetailsService.js";

export default function VendorEntry() {
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessingApi, setIsProcessingApi] = useState(false);
  const [apiResult, setApiResult] = useState({ type: "", message: "" });
  const [autoCaptureStatus, setAutoCaptureStatus] = useState(
    "Move your face into the oval frame.",
  );
  const [isAligned, setIsAligned] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [showVendorEntryForm, setShowVendorEntryForm] = useState(false);
  const [vendorPhoneNumber, setVendorPhoneNumber] = useState("");
  const [vendorGuest, setVendorGuest] = useState(null);
  const [isCheckingNumber, setIsCheckingNumber] = useState(false);
  const [canConfirmVendorEntry, setCanConfirmVendorEntry] = useState(false);
  const [entryMessage, setEntryMessage] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const stabilityCounter = useRef(0);
  const isProcessing = useRef(false);
  const requestRef = useRef(null);
  const hideFormTimeout = useRef(null);

  const { propertyDetails } = useAuth();

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
      isProcessingApi ||
      apiResult.type === "success"
    ) {
      return;
    }

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
            isProcessing.current = false;
            handleCapture();
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
    if (!capturedImage && !isProcessingApi && apiResult.type !== "success")
      requestRef.current = requestAnimationFrame(detectLoop);
  };

  const [mockFaceMatch, setMockFaceMatch] = useState("YES");

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
      // const capturedFile = dataURLtoFile(dataUrl, "contractor_selfie.jpg");
      // const response = await faceMatchService.matchContractorFace(capturedFile);
      const response = {
        result: {
          faceMatchResult: mockFaceMatch,
          phoneCountryCode: "91",
          phoneNumber: "9586023883",
        },
      };

      if (response?.result?.faceMatchResult === "YES") {
        const guestData = await guestDetailsService.getGuestById(
          response.result.phoneCountryCode,
          response.result.phoneNumber,
        );
        setGuestName(guestData?.fullName || "");
        setAutoCaptureStatus("Verification Successful");
        setApiResult({ type: "success", message: "Identity Verified!" });
        toast.success("Identity Verified!", {
          duration: 3000,
          position: "top-right",
        });
      } else {
        const failureMessage = "Face match failed.";
        setApiResult({ type: "error", message: failureMessage });
        toast.error(failureMessage, {
          duration: 3000,
          position: "top-right",
        });
      }
    } catch (error) {
      const errorMessage = error?.message || "Match Failed";
      setApiResult({
        type: "error",
        message: errorMessage,
      });
      toast.error(errorMessage, {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setIsProcessingApi(false);
      setTimeout(() => {
        stabilityCounter.current = 0;
        isProcessing.current = false;
        setCapturedImage(null);
        setApiResult({ type: "", message: "" });
        setGuestName("");
        setIsAligned(false);
        setAutoCaptureStatus("Move your face into the oval frame.");

        setTimeout(async () => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play().catch(() => {});
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(detectLoop);
          }
        }, 200);
      }, 5000);
    }
  };

  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "";
    const cleaned = String(phoneNumber).replace(/\D/g, "");
    return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
  };

  const handleAddVendor = () => {
    if (hideFormTimeout.current) {
      clearTimeout(hideFormTimeout.current);
      hideFormTimeout.current = null;
    }
    setShowVendorEntryForm(true);
    setVendorGuest(null);
    setCanConfirmVendorEntry(false);
    setEntryMessage("");
  };

  const checkVendorNumber = async () => {
    if (hideFormTimeout.current) {
      clearTimeout(hideFormTimeout.current);
      hideFormTimeout.current = null;
    }

    const normalized = normalizePhoneNumber(vendorPhoneNumber);
    if (normalized.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsCheckingNumber(true);
    setVendorGuest(null);
    setCanConfirmVendorEntry(false);
    setEntryMessage("");

    try {
      const guest = await guestDetailsService.getGuestById("91", normalized);
      console.log("Vendor Number", normalized);
      if (!guest) {
        setEntryMessage("No vendor found with this number.");
        toast.error("No vendor found with this number.");
        return;
      }

      setVendorGuest(guest);
      const status = (guest.verificationStatus || "").toLowerCase();
      if (status === "face_verified") {
        setCanConfirmVendorEntry(true);
        setEntryMessage(
          "Face verification complete. You may confirm vendor entry.",
        );
      } else {
        setCanConfirmVendorEntry(false);
        setEntryMessage("Complete face verification first.");
        toast.error("Complete face verification first.");
        hideFormTimeout.current = setTimeout(() => {
          setShowVendorEntryForm(false);
          setVendorPhoneNumber("");
          setVendorGuest(null);
          setEntryMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("Vendor lookup failed:", error);
      setEntryMessage("Unable to verify number. Try again.");
      toast.error("Unable to verify number. Please try again.");
    } finally {
      setIsCheckingNumber(false);
    }
  };

  const handleConfirmVendorEntry = async () => {
    try {
      // 👉 Call API first
      await guestDetailsService.addContractor("91", vendorPhoneNumber);

      // 👉 Show success toast after API success
      toast.success("Vendor entry confirmed.", {
        duration: 3000,
        position: "top-right",
      });

      // 👉 Reset UI state
      setShowVendorEntryForm(false);
      setVendorPhoneNumber("");
      setVendorGuest(null);
      setCanConfirmVendorEntry(false);
      setEntryMessage("");
    } catch (error) {
      console.error("Failed to add contractor:", error);

      toast.error("Failed to confirm vendor entry.", {
        duration: 3000,
        position: "top-right",
      });
    }
  };

  const complianceItems =
    apiResult.type === "success"
      ? [
          "Medical Certificate Valid",
          "Safety Training Valid",
          "ESI/PF Compliance Active",
          "Not Blacklisted",
        ]
      : [
          { label: "Medical Certificate Valid", valid: true },
          { label: "Safety Training Expired", valid: false },
          { label: "ESI/PF Compliance Active", valid: true },
          { label: "Not Blacklisted", valid: true },
        ];

  const resultTextClass =
    apiResult.type === "success" ? "text-emerald-700" : "text-red-700";

  useEffect(() => {
    return () => {
      if (hideFormTimeout.current) {
        clearTimeout(hideFormTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showVendorEntryForm) {
      // When camera section comes back

      const restartCamera = async () => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;

          try {
            await videoRef.current.play();
          } catch (err) {
            console.warn("Video play failed:", err);
          }

          // Restart detection loop
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          requestRef.current = requestAnimationFrame(detectLoop);
        } else {
          // Fallback: start camera fresh
          await startCamera();
        }
      };

      setTimeout(restartCamera, 200); // small delay helps DOM mount
    }
  }, [showVendorEntryForm]);

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
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

          {showVendorEntryForm && (
            <div className="mt-3 mb-3 rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <PhoneInput
                    country={"in"}
                    value={vendorPhoneNumber}
                    onChange={(val) => setVendorPhoneNumber(val)}
                    enableSearch={true}
                    countryCodeEditable={false}
                    containerClass="!w-full"
                    inputClass={`!w-full !h-12 !border-[#E2E8F0] !rounded-xl ${
                      canConfirmVendorEntry
                        ? "!bg-gray-50 !text-gray-400 !cursor-not-allowed"
                        : vendorGuest?.isChangingNumber
                          ? "!bg-[#FFF7ED] !border-[#F59E0B] !text-[#92400E]"
                          : "!bg-white !text-gray-700"
                    } focus:!border-[#1b3631] focus:!ring-2 focus:!ring-[#1b3631]/10`}
                    buttonClass={`!border-[#E2E8F0] !rounded-l-xl ${
                      !canConfirmVendorEntry ? "!bg-gray-50" : "!bg-white"
                    } hover:!bg-gray-50`}
                    dropdownClass="!rounded-xl !shadow-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={checkVendorNumber}
                  disabled={isCheckingNumber}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-40"
                >
                  {isCheckingNumber ? "Checking..." : "Check Number"}
                </button>
              </div>

              {vendorGuest && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-sm text-slate-900">
                        Vendor Name:{" "}
                        <span className="font-semibold text-slate-900">
                          {vendorGuest.fullName || "Vendor found"}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text text-slate-600">
                        Status:{" "}
                        <span className="font-semibold uppercase text-slate-900">
                          {vendorGuest.verificationStatus || "Unknown"}
                        </span>
                      </p>
                    </div>

                    {/* ✅ Button moved here */}
                    {canConfirmVendorEntry && (
                      <button
                        type="button"
                        onClick={handleConfirmVendorEntry}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all whitespace-nowrap"
                      >
                        Confirm Entry
                      </button>
                    )}
                  </div>
                </div>
              )}

              {entryMessage && (
                <p className="mt-3 text-sm text-slate-600">{entryMessage}</p>
              )}
            </div>
          )}

          {!showVendorEntryForm && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] bg-slate-900 shadow-inner">
              {apiResult.type === "success" || apiResult.type === "error" ? (
                <div className="absolute inset-0 z-5 flex flex-col items-center justify-between bg-slate-50 p-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-full">
                    <div
                      className={`mb-2 inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-bold ${apiResult.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    >
                      <span className="text-xs uppercase">
                        {apiResult.type === "success"
                          ? "✓ Identity Verified"
                          : "Entry Denied - Compliance Alert"}
                      </span>
                    </div>
                  </div>

                  <div className="relative mb-2 flex flex-col items-center gap-4">
                    <img
                      src={capturedImage}
                      alt={apiResult.type === "success" ? "Verified" : "Denied"}
                      className="h-35 w-35 rounded-2xl border-4 border-white object-cover shadow-lg"
                    />

                    {apiResult.type === "success" ? (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white shadow-md">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800">
                      {apiResult.type === "success"
                        ? guestName || "Verified Guest"
                        : "Compliance Check Failed"}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {apiResult.type === "success"
                        ? "Guest Visitor • Platinum Tier"
                        : "Please contact safety or site administration."}
                    </p>
                  </div>

                  <div className="mt-4 grid w-full grid-cols-2 gap-2 px-4">
                    {complianceItems.map((item) => {
                      const isObject = typeof item !== "string";
                      const label = isObject ? item.label : item;
                      const valid = isObject ? item.valid : true;
                      const badgeClass =
                        apiResult.type === "success"
                          ? "bg-emerald-100 text-emerald-600"
                          : valid
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-600";
                      const cardClass =
                        apiResult.type === "success"
                          ? "bg-white border border-slate-100"
                          : valid
                            ? "bg-emerald-50 border border-emerald-100"
                            : "bg-red-50 border border-red-100";

                      return (
                        <div
                          key={label}
                          className={`flex items-center gap-2 rounded-lg p-2 shadow-sm ${cardClass}`}
                        >
                          <div className={`rounded-full p-0.5 ${badgeClass}`}>
                            <svg
                              className="h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d={
                                  valid
                                    ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    : "M10 18a8 8 0 100-16 8 8 0 000 16zm-2-9.414l1.414-1.414L10 8.586l1.414-1.414L13 8.586l-1.414 1.414L13 11.414 11.586 12.828 10 11.414 8.586 12.828 7.172 11.414 8.586 10z"
                                }
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className={`mt-auto w-full rounded-2xl p-4 text-center ${apiResult.type === "success" ? "bg-emerald-50/100 text-emerald-900" : "bg-red-50/70 text-red-900"}`}
                  >
                    <p className="text-sm font-bold">
                      {apiResult.type === "success"
                        ? "Move ahead, please."
                        : "Entry Restricted."}
                    </p>
                    <p className={`text-[10px] ${resultTextClass}`}>
                      {apiResult.type === "success"
                        ? "Your check-in is being finalized."
                        : "Please contact the safety department or the site administrator."}
                    </p>
                  </div>
                </div>
              ) : (
                /* --- ORIGINAL CAMERA VIEW --- */
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />

                  {!capturedImage && !isProcessingApi && (
                    <div className="absolute left-6 top-6 z-1 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 shadow-lg">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                        Live Camera
                      </span>
                    </div>
                  )}

                  {isProcessingApi && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                        <span className="text-white font-bold">
                          Verifying...
                        </span>
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
                </>
              )}
            </div>
          )}

          {apiResult.type !== "success" && !showVendorEntryForm && (
            <div className="mt-6 flex flex-col gap-4 rounded-[2rem] bg-slate-50 border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 pl-2">
                <div
                  className={`h-3 w-3 rounded-full ${isAligned ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {autoCaptureStatus}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {!showVendorEntryForm && (
                  <button
                    type="button"
                    onClick={handleAddVendor}
                    className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all"
                  >
                    Add Vendor
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
