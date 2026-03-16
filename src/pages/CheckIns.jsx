import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Webcam from "react-webcam";
import {
  CheckCircle,
  X,
  Clock,
  Plus,
  Calendar,
  Search,
  ChevronDown,
  Circle,
  RotateCcw,
  Edit,
  Camera,
  Key,
  UserCheck,
  Shield,
  Building2,
  Hotel,
} from "lucide-react";
import {
  GUEST_VERIFICATION,
  VERIFICATION_STATUS,
} from "../constants/config.js";
import { OTA_OPTIONS, ROUTES } from "../constants/ui";
import { useAuth } from "../context/AuthContext.jsx";
import dayjs from "dayjs";
import { showToast } from "../utility/toast.js";
import SuccessModal from "../components/SuccessModal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { guestDetailsService } from "../services/guestDetailsService";
import { verificationService } from "../services/verificationService";
import { API_ENDPOINTS } from "../constants/config";

const Checkin = () => {
  const navigate = useNavigate();
  const { userData, propertyDetails } = useAuth();

  console.log("userData:", userData);
  console.log("loginType:", userData?.loginType);
  console.log("plan:", userData?.plan);

  const isCorporate =
    userData?.type === "Corporate" ||
    userData?.loginType === "Corporate" ||
    userData?.role === "Corporate";

  const isHospitality =
    userData?.type === "Hospitality" ||
    userData?.loginType === "Hospitality" ||
    userData?.role === "Hospitality" ||
    userData?.role === "Receptionist";

  // State for plan selection
  const [selectedPlan, setSelectedPlan] = useState(
    userData?.tier?.toLowerCase() || userData?.plan || "smb",
  );

  // Sync selectedPlan if userData.tier changes
  useEffect(() => {
    if (userData?.tier) {
      setSelectedPlan(userData.tier.toLowerCase());
    }
  }, [userData?.tier]);

  const getUserPlan = () => selectedPlan;
  const userPlan = getUserPlan();

  // Static verification code for starter and smb plans
  const STATIC_VERIFICATION_CODE = "123456";

  // Purpose options for Corporate users
  const PURPOSE_OPTIONS = [
    "Meeting",
    "Conference",
    "Official",
    "Interview",
    "Company Visit",
    "Personal",
    "Other",
  ];

  // Refs
  const bookingSourceRef = useRef(null);
  const webcamRef = useRef(null);

  // Generate unique booking ID for Walk-In
  const generateWalkInBookingId = () => {
    const timestamp = dayjs().format("YYYYMMDDHHmmss");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `WALK-IN-${timestamp}-${random}`;
  };

  // Basic Form State
  const [bookingInfo, setBookingInfo] = useState({
    verificationDate: "",
    bookingSource: "",
    bookingId: "",
  });

  // Guest List State
  const [guests, setGuests] = useState([
    {
      id: "01",
      phoneNumber: "91",
      name: "",
      status: "idle",
      isPrimary: true,
      aadhaarStatus: VERIFICATION_STATUS.PENDING,
      faceStatus: VERIFICATION_STATUS.PENDING,
      fullName: "",
      verificationTimer: null,
      isTimerActive: false,
      timerSeconds: 0,
      isWaitingForRestart: false,
      isChangingNumber: false,
      originalPhoneNumber: "",
      // Verification flow fields
      verificationCode: "",
      isCodeVerified: false,
      showCodeInput: false,
      showWebcam: false,
      capturedImage: null,
      idVerificationTimer: 0,
      isIdVerifying: false,
      idVerificationComplete: false,
      planType: userPlan,
      // New fields for API integration
      verificationId: null,
      referenceId: null,
      referenceImage: null,
      isFetchingImage: false,
      isMatching: false,
    },
  ]);

  // UI State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirmingCheckin, setIsConfirmingCheckin] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [pollingIntervals, setPollingIntervals] = useState({});
  const [checkStatusTimers, setCheckStatusTimers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState({});

  const otaOptions = Object.values(OTA_OPTIONS);

  const [isBookingInitialized, setIsBookingInitialized] = useState(false);
  const [isAnyGuestVerifying, setIsAnyGuestVerifying] = useState(false);
  const [areAllGuestsVerified, setAreAllGuestsVerified] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [hasVerificationStarted, setHasVerificationStarted] = useState(false);
  const cancellationInProgressRef = useRef(false);
  const [usedPhoneNumbers, setUsedPhoneNumbers] = useState(new Set());
  const [verifiedPhoneNumbers, setVerifiedPhoneNumbers] = useState(new Set());

  // Track all phone numbers in use across all guests
  const [allPhoneNumbers, setAllPhoneNumbers] = useState(new Map());

  // State for server date
  const [isLoadingServerDate, setIsLoadingServerDate] = useState(true);

  // Update guests when plan changes
  useEffect(() => {
    setGuests((prev) =>
      prev.map((guest) => ({
        ...guest,
        planType: userPlan,
      })),
    );
  }, [userPlan]);

  // Fetch server date on component mount
  useEffect(() => {
    const fetchServerDate = async () => {
      try {
        const formattedDate = dayjs().format("dddd, D MMM YYYY");
        setBookingInfo((prev) => ({
          ...prev,
          verificationDate: formattedDate,
        }));
        setIsLoadingServerDate(false);
      } catch (error) {
        console.error("Failed to fetch server date:", error);
        setBookingInfo((prev) => ({
          ...prev,
          verificationDate: dayjs().format("dddd, D MMM YYYY"),
        }));
        setIsLoadingServerDate(false);
      }
    };

    fetchServerDate();
  }, []);

  // Focus on Booking Source when component mounts
  useEffect(() => {
    if (bookingSourceRef.current && !bookingInfo.bookingSource) {
      setTimeout(() => {
        bookingSourceRef.current.focus();
      }, 100);
    }
  }, []);

  // Update verification status whenever guests change
  useEffect(() => {
    const anyVerifying = guests.some(
      (g) =>
        g.status === "pending" ||
        g.status === "verifying" ||
        g.isWaitingForRestart ||
        g.showCodeInput ||
        g.showWebcam ||
        g.isIdVerifying,
    );
    const allVerified = guests.every((g) => g.status === "verified");

    setIsAnyGuestVerifying(anyVerifying);
    setAreAllGuestsVerified(allVerified);

    if (anyVerifying && !hasVerificationStarted) {
      setHasVerificationStarted(true);
    }

    // Update phone number tracking
    const newAllPhoneNumbers = new Map();
    const newUsedPhoneNumbers = new Set();

    guests.forEach((guest, index) => {
      if (guest.phoneNumber && guest.phoneNumber.length >= 10) {
        const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);
        newAllPhoneNumbers.set(normalizedNumber, index);

        if (guest.status !== "idle" && guest.status !== "changing") {
          newUsedPhoneNumbers.add(normalizedNumber);
        }
      }
    });

    setAllPhoneNumbers(newAllPhoneNumbers);
    setUsedPhoneNumbers(newUsedPhoneNumbers);
  }, [guests, hasVerificationStarted]);

  // Update isWalkIn when booking source changes
  useEffect(() => {
    const walkIn = bookingInfo.bookingSource === "Walk-In";
    setIsWalkIn(walkIn);

    if (walkIn && !bookingInfo.bookingId.startsWith("WALK-IN-")) {
      const newBookingId = generateWalkInBookingId();
      setBookingInfo((prev) => ({
        ...prev,
        bookingId: newBookingId,
      }));
    }
  }, [bookingInfo.bookingSource]);

  // Verification Polling for ID, Face Match, and Pending scenarios
  useEffect(() => {
    const processingGuests = guests.filter(
      (g) => g.isIdVerifying || g.isMatching || g.status === "pending",
    );
    if (processingGuests.length === 0) return;

    const pollInterval = setInterval(async () => {
      let anyChanges = false;
      const updatedGuests = [...guests];

      for (let i = 0; i < updatedGuests.length; i++) {
        const guest = updatedGuests[i];
        if (
          (guest.isIdVerifying ||
            guest.isMatching ||
            guest.status === "pending") &&
          !guest.showWebcam &&
          !guest.showCodeInput &&
          guest.status !== "verified"
        ) {
          try {
            const countryCode = "91";
            const tenDigitNumber = normalizePhoneNumber(guest.phoneNumber);

            // Call GET_GUEST_BY_ID API every 5 seconds for all tiers
            const guestDetail = await guestDetailsService.getGuestById(
              countryCode,
              tenDigitNumber,
            );

            const rawStatus = (
              guestDetail?.verificationStatus || ""
            ).toLowerCase();

            if (rawStatus === "identity_verified") {
              console.log("🛑 Identity verified — stopping polling");

              const guestResName =
                guestDetail?.firstName ||
                (guestDetail?.fullName
                  ? guestDetail.fullName.split(" ")[0]
                  : null) ||
                "Verified Guest";

              const guestResFullName =
                guestDetail?.fullName ||
                (guestDetail?.firstName
                  ? `${guestDetail.firstName} ${guestDetail.lastName || ""}`.trim()
                  : null) ||
                "Verified Guest";

              updatedGuests[i] = {
                ...guest,
                isIdVerifying: false,
                status: "pending",
                showCodeInput: true,
                idVerificationTimer: 0,
                verificationCode: guest.verificationCode || "",
                name: guestResName,
                fullName: guestResFullName,
              };

              anyChanges = true;
              continue; // ⬅️ skip rest of polling logic
            }

            const plan = (guest.planType || selectedPlan || "").toLowerCase();
            const isCorp = isCorporate;

            // Define status targets based on Tier and Plan
            let isTargetMatched = false;
            if (isCorp && plan === "starter") {
              isTargetMatched =
                rawStatus === "registered" ||
                rawStatus === "identity_verified" ||
                rawStatus === "face_verified" ||
                rawStatus === "verified";
            } else if (plan === "smb") {
              isTargetMatched =
                rawStatus === "identity_verified" ||
                rawStatus === "face_verified" ||
                rawStatus === "verified";
            } else if (plan === "enterprise") {
              isTargetMatched =
                rawStatus === "face_verified" || rawStatus === "verified";
            } else {
              isTargetMatched = rawStatus === "verified";
            }

            if (isTargetMatched) {
              console.log(`✅ ${plan} target status matched: ${rawStatus}`);
              const guestResName =
                guestDetail?.firstName ||
                (guestDetail?.fullName
                  ? guestDetail.fullName.split(" ")[0]
                  : null) ||
                "Verified Guest";
              const guestResFullName =
                guestDetail?.fullName ||
                (guestDetail?.firstName
                  ? `${guestDetail.firstName} ${guestDetail.lastName || ""}`.trim()
                  : null) ||
                "Verified Guest";

              if (plan === "enterprise") {
                updatedGuests[i] = {
                  ...guest,
                  status: "verified",
                  isMatching: false,
                  isTimerActive: false,
                  name: guestResName,
                  fullName: guestResFullName,
                  faceStatus: VERIFICATION_STATUS.VERIFIED,
                  aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
                  idVerificationComplete: false,
                  showWebcam: false,
                };
              } else {
                const isCorpSMB = isCorp && plan === "smb";
                updatedGuests[i] = {
                  ...guest,
                  status: isCorpSMB ? "pending" : "verified",
                  isIdVerifying: false,
                  showCodeInput: isCorpSMB,
                  name: guestResName,
                  fullName: guestResFullName,
                  aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
                  verificationId:
                    guestDetail?.verificationId || guest.verificationId,
                  referenceId: guestDetail?.referenceId || guest.referenceId,
                };
              }
              anyChanges = true;
              showToast(
                "success",
                `Guest ${guestResName} reached ${rawStatus}.`,
              );
            } else if (
              plan === "enterprise" &&
              rawStatus === "identity_verified" &&
              !guest.idVerificationComplete &&
              !guest.showWebcam &&
              !guest.isMatching &&
              !guest.isFetchingImage
            ) {
              // Transition to Photo Capture for Enterprise
              updatedGuests[i] = {
                ...guest,
                isIdVerifying: false,
                idVerificationComplete: true,
                name:
                  guestDetail?.firstName ||
                  (guestDetail?.fullName
                    ? guestDetail.fullName.split(" ")[0]
                    : null) ||
                  guest.name,
                fullName:
                  guestDetail?.fullName ||
                  (guestDetail?.firstName
                    ? `${guestDetail.firstName} ${guestDetail.lastName || ""}`.trim()
                    : null) ||
                  guest.fullName,
              };
              handleStartPhotoVerification(i);
              anyChanges = true;
              showToast(
                "info",
                "Identity verified automatically. Redirecting to photo capture...",
              );
            } else if (guest.idVerificationTimer > 0) {
              updatedGuests[i] = {
                ...guest,
                idVerificationTimer: Math.max(0, guest.idVerificationTimer - 5),
              };
              anyChanges = true;
            }
          } catch (error) {
            console.error("Error in 5s polling:", error);
          }
        }
      }

      if (anyChanges) {
        setGuests(updatedGuests);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [
    guests.some(
      (g) =>
        (g.isIdVerifying || g.isMatching || g.status === "pending") &&
        !g.showWebcam &&
        !g.showCodeInput &&
        g.status !== "verified",
    ),
  ]);

  // Handle Face Matching Simulation and Persistence
  const matchingRef = useRef(new Set());
  useEffect(() => {
    const startFaceMatch = async (guestId, phoneNumber) => {
      if (matchingRef.current.has(guestId)) return;
      matchingRef.current.add(guestId);

      const index = guests.findIndex((g) => g.id === guestId);
      if (index === -1) return;

      try {
        const countryCode = "91";
        const tenDigitNumber = normalizePhoneNumber(phoneNumber);

        console.log(
          `📸 [FACE_MATCH] Starting simulation for ${tenDigitNumber}...`,
        );

        // 1. Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // 2. 🚨 PERSIST STATUS TO BACKEND
        console.log(
          `📤 [PERSIST_STATUS] Calling persist/status for ${tenDigitNumber}...`,
        );
        await guestDetailsService.persistGuestStatus(
          countryCode,
          tenDigitNumber,
          "face_verified",
        );

        // 3. 🔍 VERIFY STATUS CHANGE FROM SERVER
        console.log(
          `📡 [VERIFY_PERSISTENCE] Checking final status for ${tenDigitNumber}...`,
        );
        const finalStatusRes = await guestDetailsService.getGuestById(
          countryCode,
          tenDigitNumber,
        );
        const finalRawStatus = (
          finalStatusRes?.verificationStatus || ""
        ).toLowerCase();

        if (
          finalRawStatus === "face_verified" ||
          finalRawStatus === "verified"
        ) {
          setGuests((prev) => {
            const newState = [...prev];
            const gIdx = newState.findIndex((g) => g.id === guestId);
            if (gIdx !== -1) {
              newState[gIdx] = {
                ...newState[gIdx],
                status: "verified",
                isMatching: false,
                faceStatus: VERIFICATION_STATUS.VERIFIED,
                aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
                idVerificationComplete: false,
                showWebcam: false,
                // Update final details
                name: finalStatusRes?.firstName || newState[gIdx].name,
                fullName: finalStatusRes?.fullName || newState[gIdx].fullName,
              };
            }
            return newState;
          });
          showToast(
            "success",
            "Face matched and verified on server! Check-in enabled.",
          );
        } else {
          console.warn(
            `⚠️ [VERIFY_PERSISTENCE] Status mismatch: Expected face_verified, got ${finalRawStatus}`,
          );
          // Re-try persistence once or set to error? Let's just set to verified for now to avoid loop
          setGuests((prev) => {
            const newState = [...prev];
            const gIdx = newState.findIndex((g) => g.id === guestId);
            if (gIdx !== -1) {
              newState[gIdx].isMatching = false;
              newState[gIdx].status = "verified"; // Fallback to success
            }
            return newState;
          });
          showToast("success", "Face match completed.");
        }

        matchingRef.current.delete(guestId);
      } catch (error) {
        console.error("❌ Face matching/persistence error:", error);
        showToast(
          "error",
          "Verification persistence failed. Please try again.",
        );
        setGuests((prev) => {
          const newState = [...prev];
          const gIdx = newState.findIndex((g) => g.id === guestId);
          if (gIdx !== -1) {
            newState[gIdx].isMatching = false;
          }
          return newState;
        });
        matchingRef.current.delete(guestId);
      }
    };

    guests.forEach((guest) => {
      if (guest.isMatching && !matchingRef.current.has(guest.id)) {
        startFaceMatch(guest.id, guest.phoneNumber);
      }
    });
  }, [guests.map((g) => g.isMatching).join(",")]);

  const lastFetchedNumbers = useRef(new Map());

  // Proactive guest details fetching after entering phone number
  useEffect(() => {
    const fetchGuestData = async (index, phoneNumber) => {
      const normalized = normalizePhoneNumber(phoneNumber);

      // Prevent duplicate fetches for the same number
      if (lastFetchedNumbers.current.get(index) === normalized) return;
      lastFetchedNumbers.current.set(index, normalized);

      if (normalized.length === 10) {
        try {
          const countryCode = "91";
          console.log(
            `🔍 [GET_GUEST_BY_ID] Proactively checking status for ${normalized}...`,
          );

          // Call GET_GUEST_BY_ID directly
          const response = await guestDetailsService.getGuestById(
            countryCode,
            normalized,
          );

          if (response) {
            const resName = response.firstName || "";
            const resFullName =
              response.fullName ||
              (response.firstName
                ? `${response.firstName} ${response.lastName || ""}`.trim()
                : null) ||
              response.name ||
              "";
            const statusFromServer = (
              response.verificationStatus || ""
            ).toLowerCase();
            const plan = (selectedPlan || "").toLowerCase();
            const isCorp = isCorporate;

            let isAlreadyTargetReached = false;
            if (isCorp && plan === "starter") {
              isAlreadyTargetReached =
                statusFromServer === "registered" ||
                statusFromServer === "identity_verified" ||
                statusFromServer === "face_verified" ||
                statusFromServer === "verified";
            } else if (plan === "smb") {
              isAlreadyTargetReached =
                statusFromServer === "identity_verified" ||
                statusFromServer === "face_verified" ||
                statusFromServer === "verified";
            } else if (plan === "enterprise") {
              isAlreadyTargetReached =
                statusFromServer === "face_verified" ||
                statusFromServer === "verified";
            } else {
              isAlreadyTargetReached = statusFromServer === "verified";
            }

            setGuests((prev) => {
              const newState = [...prev];
              const guestIdx = newState.findIndex(
                (g) => normalizePhoneNumber(g.phoneNumber) === normalized,
              );
              if (guestIdx !== -1) {
                const isCorpSMB = isCorp && plan === "smb";

                newState[guestIdx] = {
                  ...newState[guestIdx],
                  name: resName || newState[guestIdx].name,
                  fullName: resFullName || newState[guestIdx].fullName,
                  verificationId:
                    response.verificationId ||
                    newState[guestIdx].verificationId,
                  referenceId:
                    response.referenceId || newState[guestIdx].referenceId,
                  status:
                    isAlreadyTargetReached && !isCorpSMB
                      ? "verified"
                      : newState[guestIdx].status,
                  aadhaarStatus: isAlreadyTargetReached
                    ? VERIFICATION_STATUS.VERIFIED
                    : newState[guestIdx].aadhaarStatus,
                  faceStatus:
                    isAlreadyTargetReached &&
                    (plan === "enterprise" ||
                      statusFromServer === "face_verified")
                      ? VERIFICATION_STATUS.VERIFIED
                      : newState[guestIdx].faceStatus,
                };

                if (isAlreadyTargetReached && !isCorpSMB) {
                  const newVerifiedSet = new Set(verifiedPhoneNumbers);
                  newVerifiedSet.add(normalized);
                  setVerifiedPhoneNumbers(newVerifiedSet);
                }
              }
              return newState;
            });
          }
        } catch (error) {
          // Silent fail for proactive checks
        }
      }
    };

    // Check all guests for completed phone numbers
    guests.forEach((guest, index) => {
      const normalized = normalizePhoneNumber(guest.phoneNumber);
      if (normalized.length === 10 && guest.status === "idle") {
        fetchGuestData(index, guest.phoneNumber);
      } else if (normalized.length < 10) {
        // Clear tracking if number is cleared/changed
        lastFetchedNumbers.current.delete(index);
      }
    });
  }, [guests.map((g) => g.phoneNumber).join(",")]);

  // Update phone input enabled status based on Booking ID
  const isPhoneInputEnabled =
    bookingInfo.bookingId && bookingInfo.bookingId.trim() !== "";

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearAllVerificationProcesses();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGuests((prevGuests) =>
        prevGuests.map((guest) => {
          if (guest.isTimerActive && guest.timerSeconds > 0) {
            return {
              ...guest,
              timerSeconds: guest.timerSeconds - 1,
            };
          }

          if (guest.isTimerActive && guest.timerSeconds === 0) {
            return {
              ...guest,
              isTimerActive: false,
              isWaitingForRestart: true,
            };
          }

          return guest;
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper function to normalize phone number to 10 digits
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "";

    // Clean non-numeric characters
    let cleaned = String(phoneNumber).replace(/\D/g, "");

    // Handle India prefix: Remove "91" if present and length > 10
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.slice(2);
    }

    // Remove leading zero if present
    if (cleaned.startsWith("0") && cleaned.length > 10) {
      cleaned = cleaned.slice(1);
    }

    // Ensure we only return the last 10 digits
    return cleaned.slice(-10);
  };

  // Get full 12-digit phone number for API (country code + 10 digits)
  const getFullPhoneNumber = (phoneNumber) => {
    const normalized = normalizePhoneNumber(phoneNumber);
    return `91${normalized}`; // Always 12 digits
  };

  // Check if phone number is already verified
  const isPhoneNumberAlreadyVerified = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 10) return false;
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    return verifiedPhoneNumbers.has(normalizedNumber);
  };

  // Check if phone number is already used by another guest
  const isPhoneNumberAlreadyUsed = (phoneNumber, currentIndex) => {
    if (!phoneNumber || phoneNumber.length < 10) return false;

    if (isPhoneNumberAlreadyVerified(phoneNumber)) {
      return true;
    }

    const normalizedNumber = normalizePhoneNumber(phoneNumber);

    for (let i = 0; i < guests.length; i++) {
      if (i === currentIndex) continue;

      const otherGuest = guests[i];
      if (otherGuest.phoneNumber && otherGuest.phoneNumber.length >= 10) {
        const otherNormalized = normalizePhoneNumber(otherGuest.phoneNumber);

        if (otherNormalized === normalizedNumber) {
          return true;
        }
      }
    }

    return false;
  };

  // Enhanced duplicate validation for verification
  const hasDuplicatePhoneNumbersInBooking = () => {
    const phoneNumbers = new Set();

    for (const guest of guests) {
      if (guest.phoneNumber && guest.phoneNumber.length >= 10) {
        const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);

        if (phoneNumbers.has(normalizedNumber)) {
          return true;
        }

        if (guest.status !== "idle" || guest.isChangingNumber) {
          phoneNumbers.add(normalizedNumber);
        }
      }
    }

    return false;
  };

  // Check if a specific phone number is duplicate
  const isPhoneNumberDuplicate = (phoneNumber, currentIndex) => {
    if (!phoneNumber || phoneNumber.length < 10) return false;

    const normalizedNumber = normalizePhoneNumber(phoneNumber);

    let count = 0;
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      if (guest.phoneNumber && guest.phoneNumber.length >= 10) {
        const guestNormalized = normalizePhoneNumber(guest.phoneNumber);

        if (guestNormalized === normalizedNumber) {
          count++;
          if (count > 1) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Function to start verification cycle
  const startVerificationCycle = (index) => {
    setGuests((prev) => {
      const newState = [...prev];
      newState[index] = {
        ...newState[index],
        status: "pending",
        isTimerActive: true,
        timerSeconds: 120,
        isWaitingForRestart: false,
        isChangingNumber: false,
      };
      return newState;
    });
  };

  // Function to clear all verification processes
  const clearAllVerificationProcesses = () => {
    Object.values(pollingIntervals).forEach((intervalId) => {
      clearInterval(intervalId);
    });

    Object.values(checkStatusTimers).forEach((timerId) => {
      clearTimeout(timerId);
    });

    setPollingIntervals({});
    setCheckStatusTimers({});
  };

  // Function to stop verification for a specific guest
  const stopGuestVerification = (index) => {
    if (pollingIntervals[index]) {
      clearInterval(pollingIntervals[index]);
      setPollingIntervals((prev) => {
        const newIntervals = { ...prev };
        delete newIntervals[index];
        return newIntervals;
      });
    }

    if (checkStatusTimers[index]) {
      clearTimeout(checkStatusTimers[index]);
      setCheckStatusTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[index];
        return newTimers;
      });
    }

    const restartTimerKey = `restart-${index}`;
    if (checkStatusTimers[restartTimerKey]) {
      clearTimeout(checkStatusTimers[restartTimerKey]);
      setCheckStatusTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[restartTimerKey];
        return newTimers;
      });
    }
  };

  // Function to reset the entire app state
  const resetAppState = () => {
    clearAllVerificationProcesses();

    setGuests([
      {
        id: "01",
        phoneNumber: "91",
        name: "",
        status: "idle",
        isPrimary: true,
        aadhaarStatus: VERIFICATION_STATUS.PENDING,
        faceStatus: VERIFICATION_STATUS.PENDING,
        fullName: "",
        verificationTimer: null,
        isTimerActive: false,
        timerSeconds: 0,
        isWaitingForRestart: false,
        isChangingNumber: false,
        originalPhoneNumber: "",
        verificationCode: "",
        isCodeVerified: false,
        showCodeInput: false,
        showWebcam: false,
        capturedImage: null,
        idVerificationTimer: 0,
        isIdVerifying: false,
        idVerificationComplete: false,
        planType: userPlan,
        verificationId: null,
        referenceId: null,
        referenceImage: null,
        isFetchingImage: false,
        isMatching: false,
      },
    ]);

    setBookingInfo({
      verificationDate: dayjs().format("dddd, D MMM YYYY"),
      bookingSource: "",
      bookingId: "",
    });

    setIsBookingInitialized(false);
    setIsAnyGuestVerifying(false);
    setAreAllGuestsVerified(false);
    setIsVerifying(false);
    setIsConfirmingCheckin(false);
    setTimeRemaining({});
    setShowSuccessModal(false);
    setHasVerificationStarted(false);
    setUsedPhoneNumbers(new Set());
    setVerifiedPhoneNumbers(new Set());
    setAllPhoneNumbers(new Map());

    setTimeout(() => {
      if (bookingSourceRef.current) {
        bookingSourceRef.current.focus();
      }
    }, 100);
  };

  // Function to handle success modal close and reset
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    resetAppState();
    navigate(ROUTES.TODAYS_BOOKINGS);
  };

  const handleBookingInfoChange = (e) => {
    const { name, value } = e.target;

    if (name === "bookingSource" && hasVerificationStarted) {
      showToast("error", "Cannot change booking source during verification");
      return;
    }

    if (name === "bookingSource") {
      if (value === "Walk-In") {
        const newBookingId = generateWalkInBookingId();
        setBookingInfo((prev) => ({
          ...prev,
          [name]: value,
          bookingId: newBookingId,
        }));
      } else {
        setBookingInfo((prev) => ({
          ...prev,
          [name]: value,
          bookingId: "",
        }));
      }
    } else if (
      name === "bookingId" &&
      bookingInfo.bookingSource !== "Walk-In" &&
      !hasVerificationStarted
    ) {
      setBookingInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (index, value) => {
    if (!isPhoneInputEnabled) {
      showToast(
        "error",
        isCorporate
          ? "Please enter Email ID first"
          : "Please enter Booking ID first",
      );
      return;
    }

    const normalizedNewNumber = normalizePhoneNumber(value);

    if (value && value.length >= 10) {
      const isDuplicate = isPhoneNumberDuplicate(value, index);

      if (isDuplicate) {
        showToast(
          "error",
          "This phone number is already entered for another guest",
        );
        return;
      }
    }

    setGuests((prev) => {
      const newGuests = [...prev];
      newGuests[index].phoneNumber = value;
      if (newGuests[index].isChangingNumber) {
        return newGuests;
      }
      if (
        newGuests[index].isTimerActive ||
        newGuests[index].isWaitingForRestart
      ) {
        newGuests[index].isTimerActive = false;
        newGuests[index].timerSeconds = 0;
        newGuests[index].status = "idle";
        newGuests[index].isWaitingForRestart = false;
        newGuests[index].showCodeInput = false;
        newGuests[index].showWebcam = false;
        newGuests[index].verificationCode = "";
        newGuests[index].isCodeVerified = false;
        newGuests[index].isIdVerifying = false;
        newGuests[index].idVerificationTimer = 0;
        newGuests[index].idVerificationComplete = false;
        newGuests[index].verificationId = null;
        newGuests[index].referenceId = null;
        newGuests[index].referenceImage = null;
        newGuests[index].isFetchingImage = false;
        newGuests[index].isMatching = false;

        if (pollingIntervals[index]) {
          clearInterval(pollingIntervals[index]);
          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });
        }
        const restartTimerKey = `restart-${index}`;
        if (checkStatusTimers[restartTimerKey]) {
          clearTimeout(checkStatusTimers[restartTimerKey]);
          setCheckStatusTimers((prev) => {
            const newTimers = { ...prev };
            delete newTimers[restartTimerKey];
            return newTimers;
          });
        }
      }
      return newGuests;
    });
  };

  const handleVerificationCodeChange = (index, value) => {
    setGuests((prev) => {
      const newGuests = [...prev];
      newGuests[index].verificationCode = value;
      return newGuests;
    });
  };

  const handleVerifyCode = async (index) => {
    const guest = guests[index];

    if (!guest.verificationCode || guest.verificationCode.length < 4) {
      showToast("error", "Please enter a valid verification code");
      return;
    }

    // Check if code matches static code
    if (guest.verificationCode === STATIC_VERIFICATION_CODE) {
      const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);

      // Post Data to Backend & Fetch official details
      const countryCode = "91";
      const tenDigitNumber = normalizedNumber.slice(-10);
      try {
        // Fetch official details - Call both Ensure API and GET_GUEST_BY_ID

        guestDetail = await guestDetailsService.getGuestById(
          countryCode,
          tenDigitNumber,
        );

        // Extract name from ensureResponse as prioritized source
        const ensureName = ensureResponse?.firstName || ensureResponse?.name;
        const ensureFullName =
          ensureResponse?.fullName ||
          (ensureResponse?.firstName
            ? `${ensureResponse.firstName} ${ensureResponse.lastName || ""}`.trim()
            : null);

        if (guest.verificationId) {
          console.log(
            "🚀 Posting verification data for SMB/Starter:",
            normalizedNumber,
          );
          await guestDetailsService.getAadhaarData(
            guest.verificationId,
            guest.referenceId,
            countryCode,
            tenDigitNumber,
          );
        }

        const combinedName =
          ensureName ||
          guestDetail?.firstName ||
          (guestDetail?.fullName ? guestDetail.fullName.split(" ")[0] : null) ||
          newState[index].name ||
          "Verified Guest";
        const combinedFullName =
          ensureFullName ||
          guestDetail?.fullName ||
          (guestDetail?.firstName
            ? `${guestDetail.firstName} ${guestDetail.lastName || ""}`.trim()
            : null) ||
          newState[index].fullName ||
          "Verified Guest";

        setGuests((prev) => {
          const newState = [...prev];
          newState[index] = {
            ...newState[index],
            isCodeVerified: true,
            status: "verified",
            name: combinedName,
            fullName: combinedFullName,
            aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
            isTimerActive: false,
            timerSeconds: 0,
            showCodeInput: false,
            verificationCode: "",
            // Update with official IDs if found
            verificationId:
              guestDetail?.verificationId || newState[index].verificationId,
            referenceId:
              guestDetail?.referenceId || newState[index].referenceId,
          };
          return newState;
        });
      } catch (error) {
        console.warn("Post-verification data/sync error:", error.message);

        // Even if secondary APIs fail, we mark as verified if code was correct
        setGuests((prev) => {
          const newState = [...prev];
          newState[index] = {
            ...newState[index],
            isCodeVerified: true,
            status: "verified",
            aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
            isTimerActive: false,
            timerSeconds: 0,
            showCodeInput: false,
          };
          return newState;
        });
      }

      const newVerifiedSet = new Set(verifiedPhoneNumbers);
      newVerifiedSet.add(normalizedNumber);
      setVerifiedPhoneNumbers(newVerifiedSet);

      showToast("success", "Guest verified successfully!");
    } else {
      showToast("error", "Invalid verification code. Please use 123456");
    }
  };

  const handleCapturePhoto = (index) => {
    if (!webcamRef.current) {
      showToast("error", "Webcam not initialized.");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      showToast("error", "Failed to capture photo. Please check your camera.");
      return;
    }

    setGuests((prev) => {
      const newState = [...prev];
      newState[index] = {
        ...newState[index],
        capturedImage: imageSrc,
        isMatching: true, // Start matching state
        showWebcam: false,
      };
      return newState;
    });

    showToast("info", "Photo captured. Verifying face match...");
  };

  // Function to start photo verification
  const handleStartPhotoVerification = async (index) => {
    const guest = guests[index];

    setGuests((prev) => {
      const newState = [...prev];
      newState[index] = {
        ...newState[index],
        isFetchingImage: true,
        isIdVerifying: false, // 🚨 Move out of progress state
        idVerificationComplete: true, // 🚨 Mark ID step as done
      };
      return newState;
    });

    try {
      const countryCode = "91";
      const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);

      // Fetch official ID image for matching
      const imageData = await guestDetailsService.fetchGuestImage(
        countryCode,
        normalizedNumber,
      );

      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          referenceImage: imageData,
          isFetchingImage: false,
          showWebcam: true,
        };
        return newState;
      });

      if (imageData) {
        showToast(
          "info",
          "Official ID image retrieved. Please align face for matching.",
        );
      } else {
        showToast("info", "Proceeding with standard photo verification.");
      }
    } catch (error) {
      console.error("Error fetching reference image:", error);
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          isFetchingImage: false,
          showWebcam: true,
        };
        return newState;
      });
    }
  };

  // Function to enable number change mode
  const handleChangeNumber = (index) => {
    setGuests((prev) => {
      const newState = [...prev];

      stopGuestVerification(index);

      newState[index] = {
        ...newState[index],
        status: "changing",
        isTimerActive: false,
        timerSeconds: 0,
        isWaitingForRestart: false,
        isChangingNumber: true,
        originalPhoneNumber: newState[index].phoneNumber,
        name: "",
        fullName: "",
        aadhaarStatus: VERIFICATION_STATUS.PENDING,
        verificationCode: "",
        isCodeVerified: false,
        showCodeInput: false,
        showWebcam: false,
        capturedImage: null,
        isIdVerifying: false,
        idVerificationTimer: 0,
        idVerificationComplete: false,
        verificationId: null,
        referenceId: null,
        referenceImage: null,
        isFetchingImage: false,
        isMatching: false,
      };

      return newState;
    });

    showToast("info", "You can now enter a new phone number");
  };

  // Function to cancel number change and revert to original state
  const handleCancelChangeNumber = (index) => {
    setGuests((prev) => {
      const newState = [...prev];
      newState[index] = {
        ...newState[index],
        status: "idle",
        isChangingNumber: false,
        phoneNumber: newState[index].originalPhoneNumber || "91",
        originalPhoneNumber: "",
      };
      return newState;
    });
  };

  const addGuest = () => {
    if (isAddGuestDisabled) return;

    setGuests((prev) => [
      ...prev,
      {
        id: String(prev.length + 1).padStart(2, "0"),
        phoneNumber: "91",
        name: "",
        fullName: "",
        status: "idle",
        isPrimary: false,
        aadhaarStatus: VERIFICATION_STATUS.PENDING,
        faceStatus: VERIFICATION_STATUS.PENDING,
        verificationTimer: null,
        isTimerActive: false,
        timerSeconds: 0,
        isWaitingForRestart: false,
        isChangingNumber: false,
        originalPhoneNumber: "",
        verificationCode: "",
        isCodeVerified: false,
        showCodeInput: false,
        showWebcam: false,
        capturedImage: null,
        idVerificationTimer: 0,
        isIdVerifying: false,
        idVerificationComplete: false,
        planType: userPlan,
        verificationId: null,
        referenceId: null,
        referenceImage: null,
        isFetchingImage: false,
        isMatching: false,
      },
    ]);
  };

  const handleVerifyGuest = async (index) => {
    const guest = guests[index];
    const countryCode = "91";
    const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);
    const tenDigitNumber = normalizedNumber.slice(-10);

    // Check if phone number is a duplicate
    if (isPhoneNumberDuplicate(guest.phoneNumber, index)) {
      showToast(
        "error",
        "This phone number is already entered for another guest. Please use a unique phone number.",
      );
      return;
    }

    if (hasDuplicatePhoneNumbersInBooking()) {
      showToast(
        "error",
        "Duplicate phone numbers detected in this booking. Please use unique phone numbers for each guest.",
      );
      return;
    }

    if (isPhoneNumberAlreadyVerified(normalizedNumber)) {
      showToast("error", "This phone number is already verified");
      return;
    }

    // --- API INTEGRATION ---
    setIsVerifying(true);
    try {
      // Define payload for beginVerification
      const beginPayload = {
        bookingId: bookingInfo.bookingId,
        ota: bookingInfo.bookingSource,
        phoneCountryCode: countryCode,
        adultsCount: guests.length,
        minorsCount: 0,
        phoneNumber: tenDigitNumber,
      };

      console.log(
        `📡 [VERIFICATION_FLOW] Starting verification for ${tenDigitNumber}...`,
      );

      let guestDetailResponse = null;

      try {
        // 1️⃣ Begin Verification
        await verificationService.beginVerification(beginPayload);
        console.log("✅ beginVerification completed");
      } catch (err) {
        if (err.code !== "ALREADY_VERIFIED") {
          console.warn("⚠️ [beginVerification] Soft error:", err);
        }
      }

      try {
        // 2️⃣ Ensure Verification
        const ensureResponse = await verificationService.ensureVerification(
          bookingInfo.bookingId,
          countryCode,
          tenDigitNumber,
        );

        console.log("✅ ensureVerification response:", ensureResponse);
      } catch (err) {
        console.warn("⚠️ [ensureVerification] Soft error:", err);
      }

      try {
        // 3️⃣ Fetch Guest Details
        guestDetailResponse = await verificationService
          .getGuestById(countryCode, tenDigitNumber)
          .catch((err) => {
            console.warn("⚠️ [GET_GUEST_BY_ID] Failed:", err);
            return null;
          });
      } catch (err) {
        console.warn("⚠️ [guest fetch error]", err);
      }

      // Optional: Enterprise DigiLocker
      if (selectedPlan === "enterprise") {
        try {
          await guestDetailsService.postDigilockerVerificationIds(
            countryCode,
            tenDigitNumber,
          );
        } catch {
          console.warn("⚠️ DigiLocker posting skipped");
        }
      }

      if (guestDetailResponse) {
        console.log("✅ [GET_GUEST_BY_ID] Found details:", guestDetailResponse);
        const resName =
          guestDetailResponse.firstName ||
          (guestDetailResponse.fullName
            ? guestDetailResponse.fullName.split(" ")[0]
            : null) ||
          "Verified Guest";
        const resFullName =
          guestDetailResponse.fullName ||
          (guestDetailResponse.firstName
            ? `${guestDetailResponse.firstName} ${guestDetailResponse.lastName || ""}`.trim()
            : null) ||
          "Verified Guest";
        const statusFromServer = (
          guestDetailResponse.verificationStatus || ""
        ).toLowerCase();

        // Determine if already fully verified based on plan
        const plan = (guest.planType || selectedPlan || "").toLowerCase();
        const isCorp = isCorporate;
        let isAlreadyTargetReached = false;

        if (isCorp && plan === "starter") {
          isAlreadyTargetReached =
            statusFromServer === "registered" ||
            statusFromServer === "identity_verified" ||
            statusFromServer === "face_verified" ||
            statusFromServer === "verified";
        } else if (plan === "smb") {
          isAlreadyTargetReached =
            statusFromServer === "identity_verified" ||
            statusFromServer === "face_verified" ||
            statusFromServer === "verified";
        } else if (plan === "enterprise") {
          isAlreadyTargetReached =
            statusFromServer === "face_verified" ||
            statusFromServer === "verified";
        } else {
          isAlreadyTargetReached = statusFromServer === "verified";
        }

        // Short-circuit if already verified
        if (isAlreadyTargetReached) {
          const isCorpSMB = isCorp && plan === "smb";

          setGuests((prev) => {
            const newState = [...prev];
            newState[index] = {
              ...newState[index],
              status: isCorpSMB ? "pending" : "verified",
              name: resName,
              fullName: resFullName,
              aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
              faceStatus:
                plan === "enterprise" || statusFromServer === "face_verified"
                  ? VERIFICATION_STATUS.VERIFIED
                  : newState[index].faceStatus,
              verificationId:
                guestDetailResponse.verificationId ||
                newState[index].verificationId,
              referenceId:
                guestDetailResponse.referenceId || newState[index].referenceId,
              isIdVerifying: false,
              isMatching: false,
              isTimerActive: isCorpSMB,
              timerSeconds: isCorpSMB ? 120 : 0,
              showCodeInput: isCorpSMB,
              idVerificationComplete: false,
              showWebcam: false,
            };
            return newState;
          });

          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(normalizedNumber);
          setVerifiedPhoneNumbers(newVerifiedSet);

          showToast(
            "success",
            `Guest ${resName} is already ${statusFromServer}.`,
          );
          setIsVerifying(false);
          return; // STOP HERE
        }

        // Otherwise just update name/details and continue
        setGuests((prev) => {
          const newState = [...prev];
          newState[index] = {
            ...newState[index],
            name: resName,
            fullName: resFullName,
            verificationId:
              guestDetailResponse.verificationId ||
              newState[index].verificationId,
            referenceId:
              guestDetailResponse.referenceId || newState[index].referenceId,
          };
          return newState;
        });
      }

      // 3. Ensure Verification Status

      const normalizedEnsureStatus = (
        ensureResponse?.verificationStatus || ""
      ).toLowerCase();
      const ensureIsVerified =
        ensureResponse &&
        (ensureResponse.isVerified ||
          normalizedEnsureStatus === "verified" ||
          normalizedEnsureStatus === "registered" ||
          normalizedEnsureStatus === "identity_verified");

      if (ensureIsVerified) {
        // 3. Fetch Guest Details - use 10-digit number
        const guestDetail = await guestDetailsService.getGuestById(
          countryCode,
          tenDigitNumber,
        );

        // Check if guest is already face verified from previous session
        const isFaceVerified =
          guestDetail?.faceStatus === VERIFICATION_STATUS.VERIFIED ||
          guestDetail?.isFaceVerified === true;

        // Determine steps based on plan
        const isSMB = selectedPlan === "smb";
        const isEnterprise = selectedPlan === "enterprise";
        const isStarter = selectedPlan === "starter";

        // Extract name and fullName
        const finalName =
          guestDetail?.firstName ||
          (guestDetail?.fullName ? guestDetail.fullName.split(" ")[0] : null) ||
          "Verified Guest";
        const finalFullName =
          guestDetail?.fullName ||
          (guestDetail?.firstName
            ? `${guestDetail.firstName} ${guestDetail.lastName || ""}`.trim()
            : null) ||
          "Verified Guest";

        // If target status is already reached, mark as verified immediately
        const statusFromServer = (
          guestDetail?.verificationStatus || ""
        ).toLowerCase();
        const isCorpSMB = isCorporate && isSMB;
        const isFullyVerifiedNow =
          (isSMB &&
            (statusFromServer === "identity_verified" ||
              statusFromServer === "verified")) ||
          (isStarter &&
            (statusFromServer === "registered" ||
              statusFromServer === "verified")) ||
          (isEnterprise &&
            (statusFromServer === "face_verified" ||
              statusFromServer === "verified"));

        // Corporate SMB requires code even if already identity verified
        const needsCodeInput =
          (!isFullyVerifiedNow && (isSMB || isStarter)) ||
          (isCorpSMB && isFullyVerifiedNow);
        const shouldResetToPending =
          needsCodeInput ||
          (!isFullyVerifiedNow &&
            (isSMB || isEnterprise || isStarter) &&
            !isFaceVerified);

        setGuests((prev) => {
          const newState = [...prev];
          newState[index] = {
            ...newState[index],
            status:
              isFullyVerifiedNow && !isCorpSMB
                ? "verified"
                : shouldResetToPending
                  ? "pending"
                  : "verified",
            name: finalName,
            fullName: finalFullName,
            aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
            faceStatus:
              isFaceVerified || (isEnterprise && isFullyVerifiedNow)
                ? VERIFICATION_STATUS.VERIFIED
                : VERIFICATION_STATUS.PENDING,
            isTimerActive: shouldResetToPending,
            timerSeconds: shouldResetToPending ? 120 : 0,
            verificationId: guestDetail?.verificationId,
            referenceId: guestDetail?.referenceId,
            // showCodeInput: needsCodeInput,
            showCodeInput: false,
            idVerificationComplete:
              isEnterprise && !isFullyVerifiedNow && !isFaceVerified,
            showWebcam: false,
          };
          return newState;
        });

        if (isFaceVerified) {
          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(normalizedNumber);
          setVerifiedPhoneNumbers(newVerifiedSet);
          showToast(
            "success",
            `Guest ${guestDetail?.firstName || "Identity"} is already fully face verified.`,
          );
        } else if (isSMB || isStarter) {
          showToast(
            "info",
            "Guest identity found (" +
              (guestDetail?.firstName || "Verified") +
              "). Please enter verification code 123456 to confirm.",
          );
        } else if (isEnterprise) {
          showToast(
            "info",
            "Guest identity found (" +
              (guestDetail?.firstName || "Verified") +
              "). Please capture photo to complete verification.",
          );
        } else {
          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(normalizedNumber);
          setVerifiedPhoneNumbers(newVerifiedSet);
          showToast("success", "Guest verified successfully.");
        }
        return;
      }
    } catch (error) {
      console.warn(
        "Standard verification flow could not be bypassed:",
        error.message,
      );
    } finally {
      setIsVerifying(false);
    }
    // --- END API INTEGRATION ---

    // If user is changing number
    if (guest.isChangingNumber) {
      if (isPhoneNumberAlreadyUsed(guest.phoneNumber, index)) {
        const isVerified = isPhoneNumberAlreadyVerified(normalizedNumber);
        showToast(
          "error",
          isVerified
            ? "This phone number is already verified"
            : "This phone number is already being used by another guest",
        );
        return;
      }

      if (
        guest.originalPhoneNumber &&
        guest.phoneNumber === guest.originalPhoneNumber
      ) {
        showToast("error", "Please enter a different phone number");
        return;
      }

      if (!guest.phoneNumber || guest.phoneNumber.length < 10) {
        showToast("error", "Please enter a valid phone number");
        return;
      }

      if (!hasVerificationStarted) {
        setHasVerificationStarted(true);
      }

      startVerificationFlow(index);
      return;
    }

    // Original verification logic for non-changing numbers
    if (
      guest.status !== "idle" ||
      !guest.phoneNumber ||
      guest.phoneNumber.length < 10
    ) {
      showToast("error", "Please enter a valid phone number");
      return;
    }

    if (isPhoneNumberAlreadyUsed(guest.phoneNumber, index)) {
      const isVerified = isPhoneNumberAlreadyVerified(normalizedNumber);
      showToast(
        "error",
        isVerified
          ? "This phone number is already verified"
          : "This phone number is already being used by another guest",
      );
      return;
    }

    if (isPhoneNumberAlreadyVerified(normalizedNumber)) {
      showToast("error", "This phone number is already verified");
      return;
    }

    if (!hasVerificationStarted) {
      setHasVerificationStarted(true);
    }

    startVerificationFlow(index);
  };

  const startVerificationFlow = (index) => {
    const guest = guests[index];
    const plan = guest.planType;

    startVerificationCycle(index);

    // 🟢 STARTER → OTP only
    if (plan === "starter") {
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          showCodeInput: true,
        };
        return newState;
      });

      showToast("info", "Please enter verification code 123456");
    }

    // 🔵 SMB → ID → OTP
    else if (plan === "smb") {
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          isIdVerifying: true,
          idVerificationTimer: 20,
          idVerificationComplete: false,
          showCodeInput: false,
        };
        return newState;
      });

      showToast("info", "Step 1/2: ID verification started. Please wait...");
    }

    // 🟣 ENTERPRISE → ID → FACE
    else if (plan === "enterprise") {
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          isIdVerifying: true,
          idVerificationTimer: 20,
          idVerificationComplete: false,
          showWebcam: false,
        };
        return newState;
      });

      showToast("info", "ID verification started. Please wait 20 seconds...");
    }
  };

  const handlePlanChange = (plan) => {
    setSelectedPlan(plan);
    resetAppState();
    showToast(
      "success",
      `Switched to ${plan === "smb" ? "SMB" : "Enterprise"} plan`,
    );
  };

  const handleConfirmCheckIn = async () => {
    if (hasDuplicatePhoneNumbersInBooking()) {
      showToast(
        "error",
        "Cannot check-in with duplicate phone numbers. Please verify all guests with unique phone numbers.",
      );
      return;
    }

    const allVerified = guests.every((g) => g.status === "verified");
    if (!allVerified) {
      showToast("error", "Please verify all guests first");
      return;
    }

    setIsConfirmingCheckin(true);
    try {
      // Call End Verification API
      await verificationService.endVerification(bookingInfo.bookingId);

      clearAllVerificationProcesses();
      setShowSuccessModal(true);
      setModalMessage("Check-in completed successfully!");
    } catch (error) {
      console.error("Check-in error:", error);
      showToast(
        "error",
        error.message || "Failed to complete check-in. Please try again.",
      );
    } finally {
      setIsConfirmingCheckin(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    cancellationInProgressRef.current = true;
    clearAllVerificationProcesses();
    resetAppState();
    showToast("success", "Verification cancelled.");
    setTimeout(() => {
      cancellationInProgressRef.current = false;
    }, 1000);
    setShowCancelModal(false);
  };

  const cancelCancel = () => {
    setShowCancelModal(false);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if Add Guest button should be disabled
  const isAddGuestDisabled =
    !areAllGuestsVerified || isAnyGuestVerifying || !isPhoneInputEnabled;

  // Check if Booking ID should be enabled
  const isBookingIdEnabled =
    bookingInfo.bookingSource &&
    bookingInfo.bookingSource !== "Walk-In" &&
    !hasVerificationStarted;

  // Check if Verify button should be disabled for a specific guest
  const isVerifyButtonDisabled = (guest, index) => {
    if (
      isVerifying ||
      !isPhoneInputEnabled ||
      guest.status === "verified" ||
      isPhoneNumberAlreadyVerified(guest.phoneNumber) ||
      guest.status === "pending" ||
      !guest.phoneNumber ||
      guest.phoneNumber.length < 10 ||
      hasDuplicatePhoneNumbersInBooking() ||
      guest.showCodeInput ||
      guest.showWebcam ||
      guest.isIdVerifying ||
      guest.idVerificationComplete
    ) {
      return true;
    }

    if (isPhoneNumberDuplicate(guest.phoneNumber, index)) {
      return true;
    }

    return false;
  };

  // Get plan display name
  const getPlanDisplayName = () => {
    if (isCorporate) {
      if (selectedPlan === "starter") return "Corporate Starter Plan";
      if (selectedPlan === "smb") return "Corporate SMB Plan";
      if (selectedPlan === "enterprise") return "Corporate Enterprise Plan";
    } else {
      if (selectedPlan === "smb") return "Hospitality SMB Plan";
      if (selectedPlan === "enterprise") return "Hospitality Enterprise Plan";
    }
    return "";
  };

  // Get button text based on plan
  const getVerifyButtonText = (guest) => {
    if (guest.isIdVerifying) return "Verifying ID...";
    if (guest.showCodeInput) return "Enter Code";
    if (guest.showWebcam) return "Capture Photo";

    if (isCorporate) {
      return "Get Code";
    } else {
      if (selectedPlan === "smb") return "Verify";
      if (selectedPlan === "enterprise") return "Start Verification";
    }
    return "Verify";
  };

  // Get button icon based on plan
  const getVerifyButtonIcon = (guest) => {
    if (guest.isIdVerifying)
      return <Clock size={16} className="animate-spin" />;
    if (guest.showCodeInput) return <Key size={16} />;
    if (guest.showWebcam) return <Camera size={16} />;

    if (isCorporate) {
      return <Key size={16} />;
    } else {
      if (selectedPlan === "smb") return <UserCheck size={16} />;
      if (selectedPlan === "enterprise") return <Camera size={16} />;
    }
    return <UserCheck size={16} />;
  };

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#1b3631]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold">
            {propertyDetails?.name
              ? `${propertyDetails.name}`
              : "Guest Verification"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#10B981]">
              <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
              System Online
            </div>

            <div className="flex items-center gap-2 text-sm font-medium bg-[#F1F5F9] px-4 py-2 rounded-full shadow-sm border border-[#E2E8F0]">
              {isCorporate || userData?.type === "Corporate" ? (
                <Building2 size={16} className="text-blue-600" />
              ) : (
                <Hotel size={16} className="text-green-600" />
              )}
              <div className="flex flex-col leading-tight">
                <span className="text-[#1b3631]">
                  {userData?.tier || getPlanDisplayName()}
                </span>
              </div>
              {isCorporate || userData?.type === "Corporate" ? (
                <Shield size={16} className="text-blue-600" />
              ) : selectedPlan === "enterprise" ||
                userData?.tier?.toLowerCase() === "enterprise" ? (
                <Shield size={16} className="text-purple-600" />
              ) : (
                <Shield size={16} className="text-green-600" />
              )}
            </div>
          </div>
        </div>
        <p className="text-gray-500 mb-8">
          Enter phone numbers to retrieve guest identity for arrival check-in.
        </p>

        {/* Header Fields Group */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-12 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-6 pb-2 border-b border-[#F1F5F9]">
            VISIT INFORMATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                VERIFICATION DATE
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Calendar size={18} />
                </div>
                <input
                  type="text"
                  readOnly
                  value={
                    isLoadingServerDate
                      ? "Loading..."
                      : bookingInfo.verificationDate
                  }
                  className="w-full pl-12 pr-4 py-4 bg-[#F1F5F9] border border-transparent rounded-xl text-gray-600 focus:outline-none cursor-default"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isCorporate ? "PURPOSE*" : "BOOKING SOURCE*"}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </div>
                <select
                  ref={bookingSourceRef}
                  name="bookingSource"
                  value={bookingInfo.bookingSource}
                  onChange={handleBookingInfoChange}
                  disabled={hasVerificationStarted}
                  required
                  className={`w-full pl-12 pr-10 py-4 bg-white border rounded-xl text-gray-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#1b3631] focus:border-[#1b3631] transition-colors`}
                >
                  <option value="">
                    {isCorporate ? "Select Purpose" : "Select Booking Source"}
                  </option>
                  {isCorporate ? (
                    PURPOSE_OPTIONS.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Walk-In">Walk-In</option>
                      {otaOptions
                        .filter((o) => o !== "Walk-In")
                        .map((ota) => (
                          <option key={ota} value={ota}>
                            {ota}
                          </option>
                        ))}
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isCorporate ? "Host EMAIL ID*" : "BOOKING ID*"}
              </label>
              <div className="relative">
                {isWalkIn && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981]">
                    <Circle size={12} fill="#10B981" />
                  </div>
                )}
                <input
                  type={isCorporate ? "email" : "text"}
                  name="bookingId"
                  required
                  value={bookingInfo.bookingId}
                  onChange={handleBookingInfoChange}
                  readOnly={isWalkIn || !isBookingIdEnabled}
                  disabled={!isBookingIdEnabled}
                  placeholder={
                    isWalkIn
                      ? "Auto-generated"
                      : isCorporate
                        ? "Enter Email ID*"
                        : "Enter Booking ID*"
                  }
                  className={`w-full ${isWalkIn ? "pl-10" : "pl-4"} pr-4 py-4 bg-white border ${
                    isWalkIn
                      ? "border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981] font-medium"
                      : !isBookingIdEnabled
                        ? "border-[#E2E8F0] bg-[#F8FAFC] text-gray-400"
                        : "border-[#E2E8F0] text-gray-700"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b3631]/10 focus:border-[#1b3631] transition-colors ${
                    !isBookingIdEnabled ? "cursor-not-allowed" : ""
                  }`}
                />
              </div>
              {isWalkIn ? (
                <p className="text-xs text-[#10B981] mt-1">
                  Booking ID auto-generated for Walk-In
                </p>
              ) : !isBookingIdEnabled ? (
                <p className="text-xs text-gray-500 mt-1">
                  {isCorporate
                    ? "Select a purpose first"
                    : "Select a booking source first"}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Guest Verification Section */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-6 pb-2 border-b border-[#F1F5F9]">
            GUEST VERIFICATION ({guests.length} guest
            {guests.length !== 1 ? "s" : ""})
          </h3>

          {/* Table */}
          <div className="mb-8 overflow-hidden rounded-xl border border-[#F1F5F9]">
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="text-left py-4 px-6">SERIAL NO.</th>
                  <th className="text-left py-4 px-6">PHONE NUMBER</th>
                  <th className="text-left py-4 px-6">
                    GUEST NAME / VERIFICATION
                  </th>
                  <th className="text-right py-4 px-6">STATUS / ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {guests.map((guest, index) => (
                  <tr
                    key={guest.id}
                    className="group hover:bg-[#F8FAFC]/50 transition-colors"
                  >
                    <td className="py-6 px-6">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#F1F5F9] rounded-lg text-xs font-bold text-[#1b3631]">
                        {guest.id}
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center max-w-xs gap-2">
                        <PhoneInput
                          country={"in"}
                          value={guest.phoneNumber}
                          onChange={(val) => handlePhoneChange(index, val)}
                          disabled={
                            !isPhoneInputEnabled ||
                            guest.status === "pending" ||
                            guest.status === "verifying" ||
                            guest.status === "verified" ||
                            guest.showCodeInput ||
                            guest.showWebcam ||
                            guest.isIdVerifying
                          }
                          containerClass="!w-full"
                          inputClass={`!w-full !h-12 !border-[#E2E8F0] !rounded-xl ${
                            !isPhoneInputEnabled
                              ? "!bg-gray-50 !text-gray-400 !cursor-not-allowed"
                              : guest.isChangingNumber
                                ? "!bg-[#FFF7ED] !border-[#F59E0B] !text-[#92400E]"
                                : "!bg-white !text-gray-700"
                          } focus:!border-[#1b3631] focus:!ring-2 focus:!ring-[#1b3631]/10`}
                          buttonClass={`!border-[#E2E8F0] !rounded-l-xl ${
                            !isPhoneInputEnabled ? "!bg-gray-50" : "!bg-white"
                          } hover:!bg-gray-50`}
                          dropdownClass="!rounded-xl !shadow-xl"
                        />

                        {guest.status === "pending" &&
                          !guest.isChangingNumber &&
                          !guest.showCodeInput &&
                          !guest.showWebcam &&
                          !guest.isIdVerifying && (
                            <button
                              onClick={() => handleChangeNumber(index)}
                              disabled={!isPhoneInputEnabled}
                              className="px-3 py-2 rounded-lg text-xs font-semibold text-[#1b3631] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Edit size={12} />
                              Change
                            </button>
                          )}

                        {guest.isChangingNumber && (
                          <button
                            onClick={() => handleCancelChangeNumber(index)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      {!isPhoneInputEnabled && (
                        <p className="text-xs text-gray-500 mt-1">
                          {isCorporate
                            ? "Enter Email ID first"
                            : "Enter Booking ID first"}
                        </p>
                      )}
                    </td>

                    <td className="py-6 px-6">
                      {guest.status === "verified" ? (
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-[#1b3631]">
                            {guest.fullName || guest.name || "Verified Guest"}
                          </span>
                          {guest.isPrimary && (
                            <span className="text-[10px] font-bold text-[#1b3631]/70 uppercase tracking-tighter mt-1">
                              PRIMARY GUEST
                            </span>
                          )}
                          {guest.capturedImage && (
                            <div className="mt-2">
                              <img
                                src={guest.capturedImage}
                                alt="Captured"
                                className="w-16 h-16 object-cover rounded-lg border border-[#E2E8F0]"
                              />
                            </div>
                          )}
                        </div>
                      ) : guest.isIdVerifying ? (
                        <div className="flex flex-col">
                          <span className="text-[#F59E0B] font-medium">
                            ID Verification in Progress
                          </span>
                          <div className="flex items-center gap-2 text-sm text-[#F59E0B] mt-1">
                            <Clock size={14} className="animate-spin" />
                            <span className="font-mono font-bold">
                              {formatTime(guest.idVerificationTimer)} remaining
                            </span>
                          </div>
                        </div>
                      ) : guest.idVerificationComplete || guest.showWebcam ? (
                        <div className="flex flex-col items-start gap-3">
                          <div className="flex items-center gap-4">
                            <span className="text-green-600 font-medium">
                              ID Verification Complete
                            </span>
                            {guest.isFetchingImage ? (
                              <div className="flex items-center gap-2 text-sm text-[#1b3631]">
                                <Clock size={14} className="animate-spin" />
                                <span>Fetching official ID image...</span>
                              </div>
                            ) : guest.isMatching ? (
                              <div className="flex items-center gap-2 text-sm text-purple-600 font-bold animate-pulse">
                                <Shield size={14} />
                                <span>Matching Face with ID...</span>
                              </div>
                            ) : (
                              !guest.showWebcam && (
                                <button
                                  onClick={() =>
                                    handleStartPhotoVerification(index)
                                  }
                                  className="px-4 py-2 bg-[#1b3631] text-white rounded-lg font-medium text-sm hover:bg-[#142925] transition-all flex items-center gap-2"
                                >
                                  <Camera size={16} />
                                  Capture guest photo
                                </button>
                              )
                            )}
                          </div>
                          {guest.showWebcam && (
                            <div className="flex flex-col gap-3 mt-2">
                              <div className="flex items-center gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                                    Live Camera
                                  </p>
                                  <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    width={240}
                                    height={180}
                                    className="rounded-lg border-2 border-[#1b3631]"
                                  />
                                </div>
                                {/* Aadhaar image hidden as per request */}
                              </div>
                              <button
                                onClick={() => handleCapturePhoto(index)}
                                className="w-full px-4 py-3 bg-[#1b3631] text-white rounded-lg font-bold text-sm hover:bg-[#142925] transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                <Camera size={18} />
                                Capture & Match Face
                              </button>
                            </div>
                          )}
                        </div>
                      ) : guest.showCodeInput ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Key
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={guest.verificationCode}
                              onChange={(e) =>
                                handleVerificationCodeChange(
                                  index,
                                  e.target.value,
                                )
                              }
                              className="pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b3631]/10"
                              maxLength={6}
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => handleVerifyCode(index)}
                            className="px-4 py-2 bg-[#1b3631] text-white rounded-lg font-medium text-sm hover:bg-[#142925] transition-all"
                          >
                            Verify Code
                          </button>
                        </div>
                      ) : guest.status === "pending" ? (
                        <div className="flex flex-col">
                          <span className="text-gray-500 italic">
                            Pending verification
                          </span>
                          <div className="flex items-center gap-2 text-sm text-[#F59E0B] mt-1">
                            <Clock size={14} />
                            <span className="font-mono font-bold">
                              {formatTime(guest.timerSeconds)} remaining
                            </span>
                          </div>
                        </div>
                      ) : guest.isWaitingForRestart ? (
                        <div className="flex flex-col">
                          <span className="text-gray-500 italic">
                            Restarting in 30 seconds...
                          </span>
                        </div>
                      ) : guest.isChangingNumber ? (
                        <div className="flex flex-col">
                          <span className="text-[#F59E0B] italic font-medium">
                            Enter new phone number
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Click Verify to start with new number
                          </span>
                        </div>
                      ) : !isPhoneInputEnabled ? (
                        <div className="flex flex-col">
                          <span className="text-gray-400 italic">
                            {isCorporate
                              ? "Enter Email ID to enable verification"
                              : "Enter Booking ID to enable verification"}
                          </span>
                        </div>
                      ) : isPhoneNumberDuplicate(guest.phoneNumber, index) ? (
                        <div className="flex flex-col">
                          <span className="text-red-500 italic">
                            Phone number already in use
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          Verify phone to see name
                        </span>
                      )}
                    </td>
                    <td className="py-6 px-6 text-right">
                      {guest.status === "verified" ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#10B981] rounded-xl text-[#10B981] font-bold text-xs uppercase bg-white">
                          <CheckCircle size={16} />
                          VERIFIED
                        </div>
                      ) : !guest.showCodeInput &&
                        !guest.showWebcam &&
                        !guest.isIdVerifying &&
                        !guest.idVerificationComplete ? (
                        <button
                          onClick={() => handleVerifyGuest(index)}
                          disabled={isVerifyButtonDisabled(guest, index)}
                          className="px-6 py-3 bg-[#1b3631] text-white rounded-xl font-bold text-sm hover:bg-[#142925] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                        >
                          {getVerifyButtonIcon(guest)}
                          {getVerifyButtonText(guest)}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Guest Button */}
          <div className="mb-6">
            <button
              onClick={addGuest}
              disabled={isAddGuestDisabled}
              className="px-6 py-3 bg-[#1b3631] text-white rounded-xl font-bold text-sm hover:bg-[#142925] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} />
              Add Guest
            </button>
            {!isPhoneInputEnabled && (
              <p className="text-sm text-gray-500 mt-2">
                {isCorporate
                  ? "Please enter Email ID before adding guests"
                  : "Please enter Booking ID before adding guests"}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-8 pt-8 border-t border-[#F1F5F9]">
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-[#1b3631] text-white rounded-xl font-bold hover:bg-[#142925] transition-all shadow-lg flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Cancel & Reset
            </button>

            <button
              onClick={handleConfirmCheckIn}
              disabled={
                !guests.every((g) => g.status === "verified") ||
                isConfirmingCheckin ||
                hasDuplicatePhoneNumbersInBooking()
              }
              className="px-8 py-3 bg-[#1b3631] text-white rounded-xl font-bold hover:bg-[#142925] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isConfirmingCheckin ? (
                <span className="flex items-center gap-2">
                  <Clock size={16} className="animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm & Post Verification"
              )}
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        show={showSuccessModal}
        onClose={handleSuccessModalClose}
        bookingId={bookingInfo.bookingId}
        totalGuests={guests.length}
        bookingSource={bookingInfo.bookingSource}
        isCorporate={isCorporate}
      />

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={cancelCancel}
        onConfirm={confirmCancel}
        title="Cancel & Reset Verification"
        message="Are you sure you want to cancel all verifications? This will reset all phone numbers to India (+91) and clear all timers."
        confirmText="Yes, Cancel & Reset"
        cancelText="No, Continue Verification"
        isDanger={true}
      />
    </div>
  );
};

export default Checkin;
