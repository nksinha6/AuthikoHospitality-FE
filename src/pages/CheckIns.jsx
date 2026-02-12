import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  CheckCircle,
  X,
  Clock,
  Plus,
  Calendar,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  RotateCcw,
  Edit,
  User,
  ArrowRight,
  QrCode,
  Check,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  GUEST_VERIFICATION,
  VERIFICATION_STATUS,
} from "../constants/config.js";
import { verificationService } from "../services/verificationService";
import { OTA_OPTIONS, ROUTES, UI_TEXT } from "../constants/ui";
import { useAuth } from "../context/AuthContext.jsx";
import dayjs from "dayjs";
import { showToast } from "../utility/toast.js";
import { Html5Qrcode } from "html5-qrcode";
import SuccessModal from "../components/SuccessModal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

<style>{`
  #reader video {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
  }
`}</style>;

const Checkin = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const isIdVerified = (guest) =>
    guest.aadhaarStatus === VERIFICATION_STATUS.VERIFIED;

  const isPhysicalVerified = (guest) => guest.status === "verified";

  const isReadyForScan = (guest) =>
    isIdVerified(guest) && !isPhysicalVerified(guest);

  // Ref for Booking Source dropdown focus
  const bookingSourceRef = useRef(null);

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
    verificationDate: "", // Will be populated from server
    bookingSource: "", // Changed from default value
    bookingId: "",
  });

  // Guest List State
  const [guests, setGuests] = useState([
    {
      id: "01",
      phoneNumber: "",
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
  const pollingInProgressRef = useRef(new Set());
  const [usedPhoneNumbers, setUsedPhoneNumbers] = useState(new Set());
  const [verifiedPhoneNumbers, setVerifiedPhoneNumbers] = useState(new Set());

  // Track all phone numbers in use across all guests
  const [allPhoneNumbers, setAllPhoneNumbers] = useState(new Map()); // Map: phoneNumber -> guest index

  // State for server date
  const [isLoadingServerDate, setIsLoadingServerDate] = useState(true);

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
        // Fallback to client date if server fails
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
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        bookingSourceRef.current.focus();
      }, 100);
    }
  }, []);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile Step State
  const [mobileStep, setMobileStep] = useState(1); // 1: Booking Details, 2: Guest Entry, 3: Review & Post

  // Mobile Verification Sub-view state
  const [activeVerificationGuestIndex, setActiveVerificationGuestIndex] =
    useState(null);
  const [mobileVerificationView, setMobileVerificationView] = useState("list"); // list, scanner, manual_code, success
  const [manualCode, setManualCode] = useState("");
  // Track verification method for each guest
  const [guestVerificationMethod, setGuestVerificationMethod] = useState({});
  const scannerRef = useRef(null);

  // Handle QR Scan Success
  const handleQrScanSuccess = (decodedText) => {
    console.log("QR scanned successfully:", decodedText);
    if (activeVerificationGuestIndex !== null) {
      setGuests((prev) => {
        const next = [...prev];
        next[activeVerificationGuestIndex].status = "verified";
        // Optionally parse decodedText for guest info if QR contains it
        // next[activeVerificationGuestIndex].fullName = ...;
        // next[activeVerificationGuestIndex].name = ...;
        return next;
      });
      setGuestVerificationMethod((prev) => ({
        ...prev,
        [activeVerificationGuestIndex]: "qr",
      }));
      setMobileVerificationView("success");
      showToast("success", "QR scanned successfully!");
    }
  };

  // QR Scanner Lifecycle
  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      if (
        mobileVerificationView === "scanner" &&
        activeVerificationGuestIndex !== null
      ) {
        // Give the DOM a moment to render the reader div
        await new Promise((resolve) => setTimeout(resolve, 100));

        const readerElement = document.getElementById("reader");
        if (!readerElement) {
          console.error("Scanner element #reader not found");
          return;
        }

        html5QrCode = new Html5Qrcode("reader");
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },

          aspectRatio: 1.0,
        };

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              handleQrScanSuccess(decodedText);
            },
          );
          console.log("Scanner started");
        } catch (err) {
          console.error("Error starting scanner:", err);
          // showToast("error", "Unable to access camera");
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            console.log("Scanner stopped");
          })
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [mobileVerificationView, activeVerificationGuestIndex]);

  // Success view auto-return timer
  useEffect(() => {
    if (mobileVerificationView === "success") {
      const timer = setTimeout(() => {
        setMobileVerificationView("list");
        setManualCode("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mobileVerificationView]);

  // Update verification status whenever guests change
  useEffect(() => {
    const anyVerifying = guests.some(
      (g) =>
        g.status === "pending" ||
        g.status === "verifying" ||
        g.isWaitingForRestart,
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

        // Track all phone numbers
        newAllPhoneNumbers.set(normalizedNumber, index);

        // Track used phone numbers (not idle)
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

    // Generate automatic booking ID for Walk-In
    if (walkIn && !bookingInfo.bookingId.startsWith("WALK-IN-")) {
      const newBookingId = generateWalkInBookingId();
      setBookingInfo((prev) => ({
        ...prev,
        bookingId: newBookingId,
      }));
    }
  }, [bookingInfo.bookingSource]);

  // Update phone input enabled status based on Booking ID
  const isPhoneInputEnabled =
    bookingInfo.bookingId && bookingInfo.bookingId.trim() !== "";

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearAllVerificationProcesses();
    };
  }, []);

  // Timer for reverse countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setGuests((prevGuests) => {
        const updatedGuests = [...prevGuests];
        let anyChanges = false;

        updatedGuests.forEach((guest, index) => {
          if (
            guest.isTimerActive &&
            guest.timerSeconds > 0 &&
            guest.status === "pending"
          ) {
            updatedGuests[index] = {
              ...guest,
              timerSeconds: guest.timerSeconds - 1,
            };
            anyChanges = true;

            if (guest.timerSeconds <= 1) {
              setTimeout(() => {
                setGuests((prev) => {
                  const newState = [...prev];
                  if (newState[index].status === "pending") {
                    newState[index] = {
                      ...newState[index],
                      status: "idle",
                      isTimerActive: false,
                      timerSeconds: 0,
                      isWaitingForRestart: true,
                    };

                    if (pollingIntervals[index]) {
                      clearInterval(pollingIntervals[index]);
                      setPollingIntervals((prev) => {
                        const newIntervals = { ...prev };
                        delete newIntervals[index];
                        return newIntervals;
                      });
                    }

                    const restartTimer = setTimeout(() => {
                      setGuests((prev) => {
                        const restartState = [...prev];
                        if (
                          restartState[index].status === "idle" &&
                          restartState[index].isWaitingForRestart &&
                          restartState[index].phoneNumber &&
                          restartState[index].phoneNumber.length >= 10
                        ) {
                          restartState[index] = {
                            ...restartState[index],
                            isWaitingForRestart: false,
                          };
                          startVerificationCycle(index);
                        }
                        return restartState;
                      });
                    }, 30000);

                    setCheckStatusTimers((prev) => ({
                      ...prev,
                      [`restart-${index}`]: restartTimer,
                    }));
                  }
                  return newState;
                });
              }, 1000);
            }
          }
        });

        return anyChanges ? updatedGuests : prevGuests;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pollingIntervals]);

  // Helper function to normalize phone number
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 10) return "";

    return phoneNumber.startsWith("91") && phoneNumber.length > 2
      ? phoneNumber.slice(2)
      : phoneNumber.startsWith("+91")
        ? phoneNumber.slice(3)
        : phoneNumber;
  };

  // Helper to format phone number for display (XXXXX-XXXXX)
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "";
    const clean = phoneNumber.replace(/\D/g, "");
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5, 10)}`;
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

    // Check if this number exists in any other guest (excluding current)
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

        // Only add to set if the number is being used (not idle)
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

    // Count how many guests have this phone number
    let count = 0;
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      if (guest.phoneNumber && guest.phoneNumber.length >= 10) {
        const guestNormalized = normalizePhoneNumber(guest.phoneNumber);

        if (guestNormalized === normalizedNumber) {
          count++;
          if (count > 1) {
            return true; // Duplicate found
          }
        }
      }
    }

    return false;
  };

  // Function to start verification cycle (2-minute timer)
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
    console.log("Clearing all verification processes...");

    Object.values(pollingIntervals).forEach((intervalId) => {
      clearInterval(intervalId);
    });

    Object.values(checkStatusTimers).forEach((timerId) => {
      clearTimeout(timerId);
    });

    setPollingIntervals({});
    setCheckStatusTimers({});
    pollingInProgressRef.current.clear();
  };

  // Function to stop verification for a specific guest
  const stopGuestVerification = (index) => {
    if (guests[index] && guests[index].phoneNumber) {
      const normalizedNumber = normalizePhoneNumber(guests[index].phoneNumber);
      pollingInProgressRef.current.delete(normalizedNumber);
    }

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

  // Function to reset the entire app state and set phone input to India
  const resetAppState = () => {
    clearAllVerificationProcesses();

    setGuests([
      {
        id: "01",
        phoneNumber: "",
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
      },
    ]);

    setBookingInfo({
      verificationDate: dayjs().format("dddd, D MMM YYYY"),
      bookingSource: "", // Reset to empty
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
    setMobileStep(1);
    setMobileVerificationView("list");

    // Focus back on Booking Source
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

    // If verification has started, don't allow changing booking source
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
        // Reset booking ID for non-Walk-In (user will enter manually)
        setBookingInfo((prev) => ({
          ...prev,
          [name]: value,
          bookingId: "",
        }));
      }
    } else if (
      name === "bookingId" &&
      bookingInfo.bookingSource !== "Walk-In" &&
      !hasVerificationStarted // Only allow editing if verification hasn't started
    ) {
      setBookingInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (index, value) => {
    // Disable phone input if booking ID is not set
    if (!isPhoneInputEnabled) {
      showToast("error", "Please enter Booking ID first");
      return;
    }

    // Normalize the new phone number
    const normalizedNewNumber = normalizePhoneNumber(value);

    // Check if this is a valid phone number
    if (value && value.length >= 10) {
      // Check if this phone number is already used by another guest
      const isDuplicate = isPhoneNumberDuplicate(value, index);

      if (isDuplicate) {
        showToast(
          "error",
          "This phone number is already entered for another guest",
        );
        return; // Don't update the phone number
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
    if (isAddGuestDisabled) {
      console.log("Add guest is disabled");
      return;
    }

    setGuests((prev) => {
      const newGuests = [
        ...prev,
        {
          id: String(prev.length + 1).padStart(2, "0"),
          phoneNumber: "",
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
        },
      ];
      console.log("New guest added. Total guests:", newGuests.length);

      // Scroll to the bottom after adding guest
      setTimeout(() => {
        const scrollContainer = document.querySelector(".custom-scrollbar");
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 100);

      return newGuests;
    });
  };

  const handleDeleteGuest = (index) => {
    setGuests((prev) => {
      if (prev.length === 1) {
        showToast("error", "At least one guest is required");
        return prev;
      }

      stopGuestVerification(index);

      const updated = prev.filter((_, i) => i !== index);

      return updated.map((g, i) => ({
        ...g,
        id: String(i + 1).padStart(2, "0"),
        isPrimary: i === 0,
      }));
    });
  };

  const startIdVerificationPolling = (index, phoneCountryCode, phoneno) => {
    if (isPhoneNumberAlreadyVerified(phoneno)) {
      console.log(
        `Phone number ${phoneno} is already verified, skipping polling`,
      );
      return;
    }

    if (pollingInProgressRef.current.has(phoneno)) {
      console.log(`Polling already in progress for ${phoneno}, skipping`);
      return;
    }

    pollingInProgressRef.current.add(phoneno);
    console.log(`Started polling for ${phoneno}`);

    if (pollingIntervals[index]) {
      clearInterval(pollingIntervals[index]);
    }

    let hasNotifiedVerification = false;

    const poll = async () => {
      if (cancellationInProgressRef.current) {
        console.log(`Cancellation in progress, stopping poll for ${phoneno}`);
        pollingInProgressRef.current.delete(phoneno);
        return;
      }

      if (isPhoneNumberAlreadyVerified(phoneno)) {
        console.log(
          `Phone number ${phoneno} became verified during polling, stopping`,
        );
        pollingInProgressRef.current.delete(phoneno);
        stopGuestVerification(index);
        return;
      }

      if (hasNotifiedVerification) {
        console.log(
          `Already notified verification for ${phoneno}, stopping poll`,
        );
        pollingInProgressRef.current.delete(phoneno);
        stopGuestVerification(index);
        return;
      }

      try {
        console.log(`Polling API call for ${phoneno}`);
        const guestResponse = await verificationService.getGuestById(
          phoneCountryCode,
          phoneno,
        );

        console.log(`API response for ${phoneno}:`, guestResponse);

        if (
          guestResponse.verificationStatus === "verified" ||
          guestResponse.aadhaar_verified ||
          (guestResponse.fullName &&
            guestResponse.verificationStatus === "verified")
        ) {
          hasNotifiedVerification = true;

          console.log(
            `Verification successful for ${phoneno}, updating guest status`,
          );

          setGuests((prev) => {
            const newState = [...prev];
            newState[index].status = "verified";
            newState[index].name =
              guestResponse.fullName || guestResponse.name || "Verified Guest";
            newState[index].fullName =
              guestResponse.fullName || guestResponse.name || "Verified Guest";
            newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
            newState[index].isTimerActive = false;
            newState[index].timerSeconds = 0;
            newState[index].isWaitingForRestart = false;
            newState[index].isChangingNumber = false;
            newState[index].originalPhoneNumber = "";
            return newState;
          });

          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(phoneno);
          setVerifiedPhoneNumbers(newVerifiedSet);

          showToast("success", "Guest verified successfully!");

          if (pollingIntervals[index]) {
            clearInterval(pollingIntervals[index]);
            console.log(`Cleared polling interval for guest ${index}`);
          }

          if (checkStatusTimers[index]) {
            clearTimeout(checkStatusTimers[index]);
            console.log(`Cleared timeout for guest ${index}`);
          }

          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });

          setCheckStatusTimers((prev) => {
            const newTimers = { ...prev };
            delete newTimers[index];
            return newTimers;
          });

          pollingInProgressRef.current.delete(phoneno);
          console.log(`Stopped polling for ${phoneno}`);
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (error.status && error.status >= 400 && error.status < 500) {
          pollingInProgressRef.current.delete(phoneno);
          stopGuestVerification(index);
        }
      }
    };

    poll();

    const intervalId = setInterval(poll, GUEST_VERIFICATION.POLL_INTERVAL);
    setPollingIntervals((prev) => ({ ...prev, [index]: intervalId }));

    const timeoutId = setTimeout(() => {
      console.log(`Polling timeout reached for guest ${index} (${phoneno})`);
      pollingInProgressRef.current.delete(phoneno);
      stopGuestVerification(index);
    }, GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT);

    setCheckStatusTimers((prev) => ({ ...prev, [index]: timeoutId }));
  };

  const handleVerifyGuest = async (index) => {
    const guest = guests[index];
    console.log(`Verifying guest ${index}:`, guest);

    // Check if phone number is a duplicate BEFORE any other checks
    if (isPhoneNumberDuplicate(guest.phoneNumber, index)) {
      showToast(
        "error",
        "This phone number is already entered for another guest. Please use a unique phone number.",
      );
      return;
    }

    // Enhanced duplicate validation check
    if (hasDuplicatePhoneNumbersInBooking()) {
      showToast(
        "error",
        "Duplicate phone numbers detected in this booking. Please use unique phone numbers for each guest.",
      );
      return;
    }

    // Normalize the phone number for checking (for duplicate/verified checks only)
    const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);
    // Use the raw phone number (with country code) for API
    const fullPhoneNumber = guest.phoneNumber;

    // Check if phone number is already verified
    if (isPhoneNumberAlreadyVerified(normalizedNumber)) {
      showToast("error", "This phone number is already verified");
      return;
    }

    // Check if phone number is already used by another guest
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

    // If user is changing number, they need to confirm the change first
    if (guest.isChangingNumber) {
      // Check if phone number is already used by another guest or already verified
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

      // Check if new number is the same as original
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

      // Mark that verification has started
      if (!hasVerificationStarted) {
        setHasVerificationStarted(true);
      }

      // Start the 2-minute timer cycle with new number
      startVerificationCycle(index);
      setIsVerifying(true);

      const phoneCountryCode = "91";
      const phoneno = fullPhoneNumber;

      try {
        console.log(
          `Calling ensureVerification API for changed number: ${phoneno}`,
        );

        if (!isBookingInitialized) {
          const beginPayload = {
            bookingId: bookingInfo.bookingId,
            ota: bookingInfo.bookingSource,
            phoneCountryCode: phoneCountryCode,
            phoneNumber: phoneno,
            adultsCount: guests.filter((g) => !g.isMinor).length,
            minorsCount: guests.filter((g) => g.isMinor).length,
          };
          await verificationService.beginVerification(beginPayload);
          setIsBookingInitialized(true);
        }

        const response = await verificationService.ensureVerification(
          bookingInfo.bookingId,
          phoneCountryCode,
          phoneno,
        );

        if (
          response.verificationStatus === "verified" ||
          response.aadhaar_verified ||
          (response.fullName && response.verificationStatus === "verified")
        ) {
          setGuests((prev) => {
            const newState = [...prev];

            newState[index] = {
              ...newState[index],

              // ✅ ID verification complete
              aadhaarStatus: VERIFICATION_STATUS.VERIFIED,

              // ✅ READY for physical verification (QR scan)
              status: "ready",

              // guest details
              name: response.fullName || response.name || "Verified Guest",
              fullName: response.fullName || response.name || "Verified Guest",
              isPrimary: index === 0,

              // cleanup
              isTimerActive: false,
              timerSeconds: 0,
              isWaitingForRestart: false,
              isChangingNumber: false,
              originalPhoneNumber: "",
            };

            return newState;
          });

          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(phoneno);
          setVerifiedPhoneNumbers(newVerifiedSet);

          showToast("success", "Guest verified successfully!");
        } else {
          startIdVerificationPolling(index, phoneCountryCode, phoneno);
          showToast("info", "Verification started with new phone number");
        }
      } catch (error) {
        console.error("Verification error:", error);
        if (error.code === "USER_NOT_FOUND") {
          startIdVerificationPolling(index, phoneCountryCode, phoneno);
          showToast("info", "Verification started with new phone number");
        } else {
          showToast("error", error.message || "Verification failed");
        }
      } finally {
        setIsVerifying(false);
      }
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

    // Check if phone number is already used by another guest
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

    // Final check: ensure number is not already verified before proceeding
    if (isPhoneNumberAlreadyVerified(normalizedNumber)) {
      showToast("error", "This phone number is already verified");
      return;
    }

    // Mark that verification has started
    if (!hasVerificationStarted) {
      setHasVerificationStarted(true);
    }

    // Start the 2-minute timer cycle
    startVerificationCycle(index);

    // Start the actual verification process
    setIsVerifying(true);

    const phoneCountryCode = "91";
    const phoneno = fullPhoneNumber;

    try {
      if (!isBookingInitialized) {
        const beginPayload = {
          bookingId: bookingInfo.bookingId,
          ota: bookingInfo.bookingSource,
          phoneCountryCode: phoneCountryCode,
          phoneNumber: phoneno,
          adultsCount: guests.filter((g) => !g.isMinor).length,
          minorsCount: guests.filter((g) => g.isMinor).length,
        };
        await verificationService.beginVerification(beginPayload);
        setIsBookingInitialized(true);
      }

      const response = await verificationService.ensureVerification(
        bookingInfo.bookingId,
        phoneCountryCode,
        phoneno,
      );

      if (
        response.verificationStatus === "verified" ||
        response.aadhaar_verified ||
        (response.fullName && response.verificationStatus === "verified")
      ) {
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].status = "ready";
          newState[index].name =
            response.fullName || response.name || "Verified Guest";
          newState[index].fullName =
            response.fullName || response.name || "Verified Guest";
          newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
          newState[index].isTimerActive = false;
          newState[index].timerSeconds = 0;
          newState[index].isWaitingForRestart = false;
          newState[index].isChangingNumber = false;
          return newState;
        });

        const newVerifiedSet = new Set(verifiedPhoneNumbers);
        newVerifiedSet.add(phoneno);
        setVerifiedPhoneNumbers(newVerifiedSet);

        showToast("success", "ID verified successfully! Ready for QR scan.");
      } else {
        startIdVerificationPolling(index, phoneCountryCode, phoneno);
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error.code === "USER_NOT_FOUND") {
        startIdVerificationPolling(index, phoneCountryCode, phoneno);
      } else {
        showToast("error", error.message || "Verification failed");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    // Final duplicate check before check-in
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
      await verificationService.endVerification(bookingInfo.bookingId);

      clearAllVerificationProcesses();

      setShowSuccessModal(true);
      setModalMessage("Check-in completed successfully!");
    } catch (error) {
      console.error("Check-in error:", error);
      showToast("error", error.message || "Failed to complete check-in");
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
  const isAddGuestDisabled = !isPhoneInputEnabled || isVerifying;

  // Check if Booking ID should be enabled
  const isBookingIdEnabled =
    bookingInfo.bookingSource &&
    bookingInfo.bookingSource !== "Walk-In" &&
    !hasVerificationStarted;

  // Check if Verify button should be disabled for a specific guest
  const isVerifyButtonDisabled = (guest, index) => {
    // Basic conditions
    if (
      !isPhoneInputEnabled ||
      guest.status === "verified" ||
      isPhoneNumberAlreadyVerified(guest.phoneNumber) ||
      guest.status === "pending" ||
      !guest.phoneNumber ||
      guest.phoneNumber.length < 10 ||
      hasDuplicatePhoneNumbersInBooking()
    ) {
      return true;
    }

    // Additional check: if this phone number is already used by another guest (even if idle)
    if (isPhoneNumberDuplicate(guest.phoneNumber, index)) {
      return true;
    }

    return false;
  };

  if (isMobile) {
    // Helper to render the Top Progress Bar (Circles style)
    const renderMobileStepper = () => (
      <div className="pt-5 pb-5 bg-white">
        <div className="flex items-center justify-between relative mb-4">
          {/* Line connecting circles */}
          <div className="absolute top-1/2 left-4 right-4 h-[1.5px] bg-gray-100 -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-1/2 left-4 h-[1.5px] bg-[#10b981] -translate-y-1/2 z-10 transition-all duration-500"
            style={{
              width:
                mobileStep === 1
                  ? "0%"
                  : mobileStep === 2
                    ? "calc(50% - 16px)"
                    : "calc(100% - 32px)",
            }}
          ></div>

          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="relative z-20 flex flex-col items-center"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  mobileStep > step
                    ? "bg-[#10b981] text-white"
                    : mobileStep === step
                      ? "bg-[#1b3631] text-white"
                      : "bg-white border-[1.5px] border-gray-100 text-gray-300"
                }`}
              >
                {mobileStep > step ? <CheckCircle size={18} /> : step}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between px-0">
          <span
            className={`text-[8px] font-black uppercase tracking-widest ${mobileStep >= 1 ? "text-[#10b981]" : "text-gray-300"}`}
          >
            Booking Info
          </span>
          <span
            className={`text-[8px] font-black uppercase tracking-widest ${mobileStep >= 2 ? (mobileStep === 2 ? "text-[#1b3631]" : "text-[#10b981]") : "text-gray-300"}`}
          >
            Verification
          </span>
          <span
            className={`text-[8px] font-black uppercase tracking-widest ${mobileStep === 3 ? "text-[#1b3631]" : "text-gray-300"}`}
          >
            Review & Post
          </span>
        </div>
      </div>
    );

    // Scanner View Sub-screen
    const renderScannerView = () => {
      const guest = guests[activeVerificationGuestIndex];
      return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500">
          {/* <div className="flex items-center gap-4 py-5 px-5">
            <button
              onClick={() => setMobileVerificationView("list")}
              className="p-2 text-[#1b3631] hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-[#1b3631]">Scan QR Code</h2>
          </div> */}

          <div className="relative flex items-center align-center h-16 px-5 bg-white">
            {/* Back Button */}
            <button
              onClick={() => setMobileVerificationView("list")}
              className="absolute left-1 flex items-center justify-center align-middle w-10 h-10 text-[#1b3631] hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Centered Title */}
            <h2 className="w-full text-center text-xl font-bold text-[#1b3631] leading-none">
              Scan QR Code
            </h2>
          </div>

          <div className="px-10 text-center mb-10">
            <span className="text-[#10b981] text-[10px] font-black uppercase tracking-[0.2em]">
              Step 2.5 of 4
            </span>
            <h3 className="text-xl font-extrabold text-[#111827] mt-2 px-6">
              Scan the QR code on the guest's phone to complete Step 2
            </h3>
          </div>

          <div className="relative mx-6 rounded-4xl overflow-hidden bg-black flex items-center justify-center aspect-square max-h-[70vh]">
            {/* Real Camera View */}
            <div id="reader" className="w-full h-full"></div>

            {/* Scan Area Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative w-[250px] h-[250px]">
                {/* GREEN BORDER */}
                <div className="absolute inset-0 border-[3px] border-[#10b981] rounded-l"></div>

                {/* SCAN LINE */}
                <div className="absolute left-0 w-full h-[3px] bg-[#10b981] animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#10b981]"></div>
              </div>
            </div>
          </div>

          <div className="p-10">
            {/* <div className="flex justify-around mb-8">
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1b3631] group-hover:text-white transition-all">
                  <RotateCcw size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Flash
                </span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1b3631] group-hover:text-white transition-all">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Gallery
                </span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1b3631] group-hover:text-white transition-all">
                  <Search size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Reset
                </span>
              </button>
            </div> */}

            <button
              onClick={() => setMobileVerificationView("manual_code")}
              className="w-full py-5 border border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              <Edit size={18} />
              Enter code manually
            </button>
          </div>
        </div>
      );
    };

    // Manual Code View
    const renderManualCodeView = () => {
      const guest = guests[activeVerificationGuestIndex];
      const keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "back"];

      const handleKeypad = (val) => {
        if (val === "back") setManualCode((prev) => prev.slice(0, -1));
        else if (val !== "" && manualCode.length < 6)
          setManualCode((prev) => prev + val);
      };

      return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-10 duration-500">
          <div className="p-8 flex items-center justify-center relative">
            <button
              onClick={() => setMobileVerificationView("scanner")}
              className="absolute left-8 p-3 text-[#1b3631] hover:bg-gray-100 rounded-full"
            >
              <ChevronDown size={28} className="rotate-90" />
            </button>
            <h2 className="text-xl font-bold text-[#111827]">
              Manual Verification
            </h2>
          </div>

          <div className="mx-8 mb-10 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10b981] transition-all duration-300"
              style={{ width: `${(manualCode.length / 6) * 100}%` }}
            ></div>
          </div>

          <div className="px-10 mb-10">
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-3xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <User size={28} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-[#111827] text-lg leading-tight">
                  {guest?.fullName || guest?.name || `Guest ${guest?.id}`}
                </p>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  {guest?.phoneNumber}
                </p>
              </div>
              <div className="px-3 py-1 bg-[#ccfbf1] text-[#0f766e] text-[9px] font-black rounded-lg uppercase tracking-widest">
                Guest
              </div>
            </div>
          </div>

          <div className="px-8 flex justify-between mb-10">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-200 ${
                  manualCode.length === i
                    ? "border-[#10b981] ring-4 ring-[#10b981]/10"
                    : manualCode[i]
                      ? "border-[#10b981]/30 bg-[#f0fdf4]"
                      : "border-gray-100"
                }`}
              >
                {manualCode[i] || ""}
                {manualCode.length === i && (
                  <div className="w-0.5 h-8 bg-[#10b981] animate-pulse"></div>
                )}
              </div>
            ))}
          </div>

          <div className="px-10 mb-8">
            <button
              onClick={() => {
                if (manualCode.length === 6) {
                  setGuests((prev) => {
                    const next = [...prev];
                    next[activeVerificationGuestIndex].status = "verified";
                    // Optionally update guest info here if needed
                    return next;
                  });
                  setGuestVerificationMethod((prev) => ({
                    ...prev,
                    [activeVerificationGuestIndex]: "manual",
                  }));
                  setMobileVerificationView("success");
                } else {
                  showToast("error", "Please enter all 6 digits");
                }
              }}
              className="w-full py-5 bg-[#10b981] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#10b981]/20 active:scale-95 transition-all"
            >
              Verify Guest
            </button>

            <button
              onClick={() => setMobileVerificationView("scanner")}
              className="w-full mt-6 flex items-center justify-center gap-2 text-gray-400 font-bold text-sm tracking-wider uppercase"
            >
              <Search size={16} />
              Back to Scanner
            </button>
          </div>

          {/* Custom Numeric Keypad */}
          <div className="mt-auto grid grid-cols-3 border-t border-gray-100">
            {keypad.map((key, i) => (
              <button
                key={i}
                onClick={() => handleKeypad(key)}
                className="py-6 text-2xl font-bold text-[#111827] active:bg-gray-50 flex items-center justify-center border-b border-r border-gray-50 last:border-r-0"
              >
                {key === "back" ? (
                  <X size={24} className="stroke-[3px]" />
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </div>
      );
    };

    // Success View
    const renderSuccessView = () => {
      const guest = guests[activeVerificationGuestIndex];
      const method =
        guestVerificationMethod[activeVerificationGuestIndex] || "qr";

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in zoom-in-95 duration-500">
          <div className="w-32 h-32 bg-[#f0fdf4] rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-[#10b981]/10 rounded-full animate-ping"></div>
            <CheckCircle size={64} className="text-[#10b981] relative z-20" />
          </div>

          <h2 className="text-[2rem] font-black text-[#111827] leading-tight text-center mb-4">
            Verification Success!
          </h2>
          <p className="text-gray-500 text-center text-sm font-medium mb-12 px-10">
            The guest has been successfully verified and is ready for check-in.
          </p>

          <div className="w-full bg-white border border-[#f1f5f9] rounded-[2.5rem] p-10 shadow-sm relative mb-12">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 relative mb-6">
                <User size={40} />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center border-4 border-white">
                  <CheckCircle size={16} className="text-white" />
                </div>
              </div>

              <h3 className="text-3xl font-black text-[#111827] mb-2">
                {guest?.fullName || guest?.name || "Verified Guest"}
              </h3>
              <div className="px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">
                {method === "manual"
                  ? "Manual Verification"
                  : "QR Verification"}
              </div>

              <div className="w-full space-y-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Booking Reference
                  </span>
                  <span className="font-bold text-[#1e293b]">
                    #{bookingInfo.bookingId}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Booking Source
                  </span>
                  <span className="font-bold text-[#1e293b]">
                    {bookingInfo.bookingSource || "Direct Booking"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Verified Timestamp
                  </span>
                  <span className="font-bold text-[#1e293b]">
                    {dayjs().format("MMM D, hh:mm A")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Phone Number
                  </span>
                  <span className="font-bold text-[#1e293b]">
                    {guest?.phoneNumber || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setMobileVerificationView("list");
              setManualCode("");
            }}
            className="w-full py-6 bg-[#10b981] text-white rounded-3xl font-bold text-lg shadow-xl shadow-[#10b981]/20"
          >
            Return to Main Screen
          </button>
          <p className="mt-6 text-gray-400 font-medium text-xs">
            Auto-returning to guest list in 3s
          </p>
        </div>
      );
    };

    // Review & Post Step (Step 3) - Similar to image design
    const renderReviewAndPostStep = () => {
      return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-500 min-h-0">
          {/* Header */}

          {/* Booking Summary Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 flex items-center gap-4 shadow-sm w-full overflow-hidden">
            <div className="w-12 h-12 bg-[#1b3631] text-white rounded-2xl flex items-center justify-center shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 7H17"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12H17"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 17H13"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1 flex gap-6 min-w-0">
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">
                  Booking
                </p>
                <span className="font-extrabold text-[#111827] text-sm truncate block">
                  {bookingInfo.bookingId || "BK-882910"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">
                  Check-in
                </p>
                <span className="font-bold text-gray-400 text-xs truncate block">
                  {dayjs().format("DD MMM YYYY")}
                </span>
              </div>
            </div>
            <div className="bg-[#f8fafc] border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
              <User size={12} className="text-gray-300" />
              <span className="font-black text-[#111827] text-xs leading-none">
                {guests.length}
              </span>
            </div>
          </div>

          {/* Guest Verification Status */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Detailed Guest List
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              {guests.filter((g) => g.status === "verified").length} of{" "}
              {guests.length} guests verified
            </p>
          </div>

          {/* Guest Cards List */}
          <div className="flex-1 overflow-y-auto space-y-4 -mx-5 px-5 pb-10 custom-scrollbar">
            {guests.map((guest, index) => (
              <div
                key={guest.id}
                className="relative rounded-2xl p-5 shadow-sm bg-white border border-gray-100 w-full"
              >
                {/* Guest Header */}
                <div className="flex items-center justify-between mb-4 gap-2 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#10b981] shrink-0">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#111827] truncate">
                        {guest.fullName || guest.name || `Guest ${guest.id}`}
                      </h4>
                      <p className="text-[10px] text-gray-500 truncate">
                        Guest {guest.id} •{" "}
                        {guest.isPrimary ? "Primary Guest" : "Secondary Guest"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#f0fdf4] px-2 py-1.5 rounded-lg shrink-0">
                    <CheckCircle size={12} className="text-[#10b981]" />
                    <span className="text-[9px] font-black text-[#10b981] uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Guest Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Phone Number
                    </p>
                    <p className="font-medium text-[#111827]">
                      +91 ••••• •
                      {guest.phoneNumber ? guest.phoneNumber.slice(-3) : "•••"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Verification Method
                    </p>
                    <p className="font-medium text-[#111827]">QR Code Scan</p>
                  </div>
                </div>

                {/* Verification Timestamp */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Verified At
                  </p>
                  <p className="font-medium text-[#111827] text-sm">
                    {dayjs().format("DD MMM YYYY, hh:mm A")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Summary */}
          <div className="mt-6 p-5 bg-[#f8fafc] border border-gray-100 rounded-2xl w-full overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Verification Summary
              </p>
              <div className="w-6 h-6 bg-[#10b981] rounded-full flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-500">
                  Total Guests
                </p>
                <p className="text-lg font-black text-[#111827]">
                  {guests.length}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-500">Verified</p>
                <p className="text-lg font-black text-[#10b981]">
                  {guests.filter((g) => g.status === "verified").length}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-500">
                  Booking Source
                </p>
                <p className="text-sm font-bold text-[#111827] truncate">
                  {bookingInfo.bookingSource || "Not specified"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-500">Booking ID</p>
                <p className="text-sm font-bold text-[#111827] truncate">
                  {bookingInfo.bookingId || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="mt-6 p-5 bg-[#fef3c7]/30 border border-[#fde68a] rounded-2xl w-full overflow-hidden">
            <div className="flex items-start gap-3 min-w-0">
              <AlertCircle
                size={20}
                className="text-[#d97706] mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#92400e] uppercase tracking-widest mb-1">
                  Ready to Post
                </p>
                <p className="text-xs text-[#92400e] font-medium">
                  All guests are verified. Click "Confirm & Post" to complete
                  the check-in process. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-white flex flex-col h-dvh w-full font-sans selection:bg-[#1b3631]/10 overflow-hidden">
        <style>{`
  @keyframes scan {
    0% { top: 0%; }
    50% { top: calc(100% - 4px); }
    100% { top: 0%; }
  }
`}</style>

        <div className="flex-1 flex flex-col w-full max-w-md mx-auto relative overflow-hidden h-full">
          {/* Main List Views */}
          {mobileVerificationView === "list" ? (
            <>
              {/* Mobile Header (Unified Style) */}
              {/* {renderMobileStepper()} */}

              <div className="flex-1 flex flex-col py-5 px-5 overflow-y-auto">
                {/* Step Navigation */}

                {mobileStep !== 1 && (
                  <>
                    {/* Header */}
                    <div className=" flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setMobileStep(mobileStep - 1)}
                          className="p-2 -ml-4 text-[#1b3631] hover:bg-gray-100 rounded-full"
                        >
                          <ChevronLeft size={24} />
                        </button>

                        <h2 className="text-xl font-bold text-[#1b3631]">
                          {mobileStep === 2 ? "Verification" : "Review & Post"}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#f0fdf4] px-3 py-1.5 rounded-full border border-[#bcf0da]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></div>
                        <span className="text-[9px] font-black text-[#10b981] uppercase tracking-wider">
                          {mobileStep === 2 ? "Live" : "All Verified"}
                        </span>
                      </div>
                    </div>

                    {/* 🔽 Mobile Stepper BELOW heading (ONLY for Step 2) */}
                    {mobileStep === 2 && (
                      <div className="">{renderMobileStepper()}</div>
                    )}
                  </>
                )}

                {mobileStep === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div>
                      <h1 className="text-[2rem] font-bold text-[#111827] leading-[1.15] tracking-tight">
                        Guest Verification
                      </h1>

                      {renderMobileStepper()}

                      <p className="text-[#64748b] text-sm leading-relaxed font-medium">
                        Step 1: Provide booking details
                      </p>
                      <div className="flex items-center gap-2 text-[#1b3631] font-bold mt-2">
                        <Calendar size={18} />
                        <span>{dayjs().format("dddd, D MMM YYYY")}</span>
                      </div>
                    </div>

                    <div className="bg-[#fcfdfe] border border-[#f1f5f9] rounded-xl p-5 shadow-sm">
                      <h3 className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] mb-5">
                        Booking Information
                      </h3>

                      <div className="space-y-10">
                        <div className="relative mb-5!">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">
                            Booking Source *
                          </label>
                          <div className="relative">
                            <Search
                              size={22}
                              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <select
                              name="bookingSource"
                              value={bookingInfo.bookingSource}
                              onChange={handleBookingInfoChange}
                              className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 pl-16 text-[#1e293b] font-bold text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-[#1b3631]/5 transition-all"
                            >
                              <option value="">Select Booking Source</option>
                              {otaOptions.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={20}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        <div className="relative mb-5!">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">
                            Booking ID *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="bookingId"
                              value={bookingInfo.bookingId}
                              onChange={handleBookingInfoChange}
                              placeholder="Enter Booking ID*"
                              className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-[#1e293b] font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#1b3631]/5 transition-all"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">
                              i
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-3 font-medium pl-1">
                            Select a booking source first to validate ID format
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mobileStep === 2 && (
                  <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-6 duration-500 min-h-0">
                    {/* Booking Context Card */}
                    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 mb-5 shadow-sm flex items-center gap-4">
                      {/* Left Icon */}
                      <div className="w-12 h-12 bg-[#1b3631] text-white rounded-2xl flex items-center justify-center shrink-0">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 7H17"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          />
                          <path
                            d="M7 12H17"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          />
                          <path
                            d="M7 17H13"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>

                      {/* Middle Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Booking ID (TOP) */}
                        <div>
                          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">
                            Booking ID
                          </p>
                          <p className="font-bold text-[#111827] text-sm break-all">
                            {bookingInfo.bookingId || "WALK-IN-XXXX"}
                          </p>
                        </div>

                        {/* Date + Guest Count (SAME LINE) */}
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                              Check-in Date
                            </p>
                            <p className="text-xs font-bold text-gray-500">
                              {dayjs().format("dddd, D MMM YYYY")}
                            </p>
                          </div>

                          {/* Guest Count */}
                          <div className="flex items-center gap-1 bg-[#f8fafc] border border-gray-100 rounded-md px-2 py-1">
                            <User size={10} className="text-gray-300" />
                            <span className="font-black text-[#111827] text-[11px] leading-none">
                              {guests.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Detailed Guest List
                      </h3>
                    </div>
                    <div
                      className="flex-1 max-h-[40vh]
 overflow-y-auto space-y-6 -mx-4 mb-5 px-4 pb-5 custom-scrollbar"
                    >
                      {guests.map((guest, index) => {
                        const idVerified = isIdVerified(guest);
                        const physicalVerified = isPhysicalVerified(guest);
                        const readyForScan = isReadyForScan(guest);

                        return (
                          <div
                            key={guest.id}
                            className="relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
                          >
                            {/* Left accent */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                                physicalVerified || readyForScan
                                  ? "bg-[#22c55e]"
                                  : "bg-[#fbbf24]"
                              }`}
                            />

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-black flex items-center justify-center">
                                    {guest.id}
                                  </div>

                                  <h4 className="font-bold text-[#111827]">
                                    {guest.status === "verified"
                                      ? guest.fullName || guest.name
                                      : `Guest ${guest.id}`}
                                  </h4>
                                </div>

                                <p
                                  className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    physicalVerified
                                      ? "text-[#22c55e]"
                                      : readyForScan
                                        ? "text-[#22c55e]"
                                        : "text-[#f59e0b]"
                                  }`}
                                >
                                  {physicalVerified
                                    ? "Fully Verified"
                                    : readyForScan
                                      ? "Ready for Scan"
                                      : "Pending Validation"}
                                </p>
                              </div>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteGuest(index)}
                                disabled={false}
                                className="p-2 rounded-full text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                                title="Delete guest"
                              >
                                <Trash2 size={18} className="stroke-[2.5]" />
                              </button>
                            </div>

                            {/* Progress bar – 2 stages */}
                            <div className="mb-5">
                              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                <span>ID Verified</span>
                                <span>Physical Verified</span>
                              </div>

                              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                                {/* ID */}
                                <div
                                  className={`flex-1 rounded-full ${
                                    idVerified ? "bg-[#22c55e]" : "bg-[#fbbf24]"
                                  }`}
                                />
                                {/* Physical */}
                                <div
                                  className={`flex-1 rounded-full ${
                                    physicalVerified
                                      ? "bg-[#22c55e]"
                                      : "bg-gray-200"
                                  }`}
                                />
                              </div>
                            </div>

                            {/* BODY */}
                            {!idVerified && (
                              <>
                                {/* Phone input */}
                                <div className="bg-[#f8fafc] border border-gray-100 rounded-xl flex items-center overflow-hidden mb-4">
                                  <div className="flex items-center gap-2 px-4 border-r border-gray-100">
                                    <img
                                      src="https://flagcdn.com/in.svg"
                                      className="w-5 h-3"
                                      alt="IN"
                                    />
                                    <span className="font-bold text-[#1b3631] text-sm">
                                      +91
                                    </span>
                                  </div>

                                  <input
                                    type="tel"
                                    placeholder="Enter phone"
                                    value={formatPhoneNumber(guest.phoneNumber)}
                                    onChange={(e) => {
                                      const rawValue = e.target.value.replace(
                                        /\D/g,
                                        "",
                                      );
                                      // Limit to 10 digits
                                      if (rawValue.length <= 10) {
                                        handlePhoneChange(index, rawValue);
                                      }
                                    }}
                                    className="flex-1 bg-transparent px-4 py-4 text-sm font-bold text-[#1e293b] placeholder:text-gray-300 focus:outline-none"
                                  />
                                </div>

                                {/* Verify */}
                                <button
                                  onClick={() => handleVerifyGuest(index)}
                                  disabled={isVerifyButtonDisabled(
                                    guest,
                                    index,
                                  )}
                                  className="w-full py-3 rounded-xl bg-[#1b3631] text-white font-bold disabled:opacity-50"
                                >
                                  Verify
                                </button>
                              </>
                            )}

                            {idVerified && !physicalVerified && (
                              <>
                                {/* Phone validated */}
                                <div className="bg-[#f8fafc] border border-dashed border-[#22c55e] rounded-xl p-4 flex items-center justify-between mb-4">
                                  <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                      Phone Validated
                                    </p>
                                    <p className="font-bold text-[#111827]">
                                      +91 •••• ••{guest.phoneNumber.slice(-3)}
                                    </p>
                                  </div>
                                  <div className="w-6 h-6 rounded-full border border-[#22c55e] flex items-center justify-center text-[#22c55e]">
                                    ✓
                                  </div>
                                </div>

                                {/* Scan QR */}
                                <button
                                  onClick={() => {
                                    setActiveVerificationGuestIndex(index);
                                    setMobileVerificationView("scanner");
                                  }}
                                  className="w-full py-4 rounded-xl bg-[#1b3631] text-white font-bold flex items-center justify-center gap-2"
                                >
                                  <QrCode size={18} className="stroke-[2.5]" />
                                  Scan QR Code
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {mobileStep === 3 && renderReviewAndPostStep()}
              </div>

              {/* Mobile Footer (Match refined style) */}

              <div className=" px-5 mb-2 bg-white">
                {mobileStep === 1 ? (
                  <>
                    {/* Primary CTA */}
                    <button
                      onClick={() => {
                        if (
                          bookingInfo.bookingSource &&
                          bookingInfo.bookingId
                        ) {
                          setMobileStep(2);
                        } else {
                          showToast(
                            "error",
                            "Please fill booking details first",
                          );
                        }
                      }}
                      className="w-full py-3 bg-[#1b3631] text-white rounded-xl
                   font-bold text-lg flex items-center justify-center gap-3
                   shadow-xl shadow-[#1b3631]/30
                   active:scale-95 transition-all"
                    >
                      Continue to Guest Entry
                      <ArrowRight size={20} />
                    </button>

                    {/* Secondary Action */}
                    <button
                      onClick={handleCancel}
                      className="mt-3 mb-1 w-full flex items-center justify-center gap-2
                   text-gray-400 font-semibold text-sm"
                    >
                      <RotateCcw size={16} />
                      Cancel & Reset
                    </button>
                  </>
                ) : (
                  <>
                    {/* EXISTING FOOTER for Step 2 & 3 */}
                    <div className="flex gap-4 mb-1">
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-3 bg-[#f0f4f8] text-[#1b3631]
                     rounded-xl font-bold
                     flex items-center justify-center gap-3
                     active:scale-95 transition-all"
                      >
                        <X size={18} />
                        Cancel
                      </button>

                      <button
                        onClick={() => {
                          if (mobileStep === 2) {
                            if (areAllGuestsVerified) setMobileStep(3);
                            else showToast("error", "Verify all guests first");
                          } else {
                            handleConfirmCheckIn();
                          }
                        }}
                        disabled={
                          (mobileStep === 2 && !areAllGuestsVerified) ||
                          (mobileStep === 3 && isConfirmingCheckin)
                        }
                        className={`flex-[1.8] py-3 rounded-xl
            font-black text-lg flex items-center justify-center gap-3
            transition-all active:scale-95 shadow-xl
            ${
              (mobileStep === 2 && !areAllGuestsVerified) ||
              (mobileStep === 3 && isConfirmingCheckin)
                ? "bg-[#1b3631] font-bold opacity-50 text-white cursor-not-allowed"
                : "bg-[#1b3631] font-bold text-white shadow-[#1b3631]/30 hover:bg-[#142925]"
            }`}
                      >
                        {isConfirmingCheckin ? (
                          <>
                            <Clock size={18} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Confirm & Post
                            <ChevronRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : mobileVerificationView === "scanner" ? (
            renderScannerView()
          ) : mobileVerificationView === "manual_code" ? (
            renderManualCodeView()
          ) : (
            renderSuccessView()
          )}

          {/* Floating Action Button for Add Guest */}
          {/* {isMobile && mobileStep === 2 && (
            <button
              onClick={addGuest}
              disabled={isAddGuestDisabled}
              className="absolute bottom-25 right-3 w-10 h-10 bg-[#1b3631] hover:bg-[#1b3631]/90 disabled:bg-gray-300 text-white rounded-full shadow-lg shadow-[#1b3631]/40 flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
              title="Add Guest"
            >
              <div className="relative">
                <User size={18} />
                <Plus
                  size={12}
                  className="absolute -bottom-1 -right-1 bg-[#1f5a52] rounded-full"
                />
              </div>
            </button>
          )} */}

          {/* Floating Action Button for Add Guest */}
          {isMobile &&
            mobileStep === 2 &&
            mobileVerificationView === "list" && (
              <button
                onClick={addGuest}
                disabled={isAddGuestDisabled}
                className="absolute bottom-25 right-3 w-10 h-10 bg-[#1b3631] hover:bg-[#1b3631]/90 disabled:bg-gray-300 text-white rounded-full shadow-lg shadow-[#1b3631]/40 flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
                title="Add Guest"
              >
                <div className="relative">
                  <User size={18} />
                  <Plus
                    size={12}
                    className="absolute -bottom-1 -right-1 bg-[#1f5a52] rounded-full"
                  />
                </div>
              </button>
            )}
        </div>

        {/* Safe Area Padding */}
        {/* <div className="h-6 w-full"></div> */}

        <SuccessModal
          show={showSuccessModal}
          onClose={handleSuccessModalClose}
          bookingId={bookingInfo.bookingId}
          totalGuests={guests.length}
          bookingSource={bookingInfo.bookingSource}
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
  }

  // Desktop view remains the same...
  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#1b3631]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold">Guest Verification</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-[#10B981]">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            System Online
          </div>
        </div>
        <p className="text-gray-500 mb-8">
          Enter phone numbers to retrieve guest identity for arrival check-in.
        </p>

        {/* Header Fields Group with visual grouping */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-12 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-6 pb-2 border-b border-[#F1F5F9]">
            BOOKING INFORMATION
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
              {!isLoadingServerDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Date fetched from server
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                BOOKING SOURCE*
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
                  <option value="">Select Booking Source</option>
                  <option value="Walk-In">Walk-In</option>
                  {otaOptions
                    .filter((o) => o !== "Walk-In")
                    .map((ota) => (
                      <option key={ota} value={ota}>
                        {ota}
                      </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
                {hasVerificationStarted && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <Clock size={14} className="text-gray-400" />
                  </div>
                )}
              </div>
              {hasVerificationStarted && (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot change booking source during verification
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                BOOKING ID*
              </label>
              <div className="relative">
                {isWalkIn && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981]">
                    <Circle size={12} fill="#10B981" />
                  </div>
                )}
                <input
                  type="text"
                  name="bookingId"
                  required
                  value={bookingInfo.bookingId}
                  onChange={handleBookingInfoChange}
                  readOnly={isWalkIn || !isBookingIdEnabled}
                  disabled={!isBookingIdEnabled}
                  placeholder={
                    isWalkIn ? "Auto-generated" : "Enter Booking ID*"
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
                {!isBookingIdEnabled && !isWalkIn && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                  </div>
                )}
              </div>
              {isWalkIn ? (
                <p className="text-xs text-[#10B981] mt-1">
                  Booking ID auto-generated for Walk-In
                </p>
              ) : !isBookingIdEnabled ? (
                <p className="text-xs text-gray-500 mt-1">
                  Select a booking source first
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Enter your booking ID
                </p>
              )}
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
                  <th className="text-left py-4 px-6">GUEST NAME</th>
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
                          masks={{ in: ".....-....." }}
                          disabled={
                            !isPhoneInputEnabled ||
                            guest.status === "pending" ||
                            guest.status === "verifying" ||
                            guest.status === "verified"
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
                          !guest.isChangingNumber && (
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
                          Enter Booking ID first
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
                            Enter Booking ID to enable verification
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
                      ) : (
                        <button
                          onClick={() => handleVerifyGuest(index)}
                          disabled={isVerifyButtonDisabled(guest, index)}
                          className="px-6 py-3 bg-[#1b3631] text-white rounded-xl font-bold text-sm hover:bg-[#142925] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                        >
                          <CheckCircle size={16} />
                          Verify
                        </button>
                      )}
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
                Please enter Booking ID before adding guests
              </p>
            )}
            {isAddGuestDisabled && isPhoneInputEnabled && (
              <p className="text-sm text-gray-500 mt-2">
                {isAnyGuestVerifying
                  ? "Please wait for verification to complete before adding more guests."
                  : "Please verify all existing guests before adding a new guest."}
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
