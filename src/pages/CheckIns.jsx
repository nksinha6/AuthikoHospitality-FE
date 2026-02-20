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

const Checkin = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  console.log("userData:", userData);
  console.log("loginType:", userData?.loginType);
  console.log("plan:", userData?.plan);

  const isCorporate =
    userData?.loginType === "Corporate" || userData?.role === "Corporate";
  const isHospitality =
    userData?.loginType === "Hospitality" ||
    userData?.role === "Hospitality" ||
    userData?.role === "Receptionist";

  // State for plan selection (for demo purposes)
  // In production, this would come from user's subscription
  // const [selectedPlan, setSelectedPlan] = useState("smb"); // Default to SMB for Hospitality
  const [selectedPlan, setSelectedPlan] = useState(userData?.plan || "smb");

  // Determine user plan based on role or login type
  // const getUserPlan = () => {
  //   if (isCorporate) {
  //     return "starter"; // Corporate only has starter plan
  //   } else {
  //     // Hospitality can have SMB or Enterprise - use selectedPlan state
  //     return selectedPlan;
  //   }
  // };

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
      planType: userPlan,
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

  // ID Verification timer for SMB and Enterprise plans
  useEffect(() => {
    const timer = setInterval(() => {
      setGuests((prevGuests) => {
        const updatedGuests = [...prevGuests];
        let anyChanges = false;

        updatedGuests.forEach((guest, index) => {
          if (guest.isIdVerifying && guest.idVerificationTimer > 0) {
            updatedGuests[index] = {
              ...guest,
              idVerificationTimer: guest.idVerificationTimer - 1,
            };
            anyChanges = true;

            // When timer reaches 0, complete ID verification
            if (guest.idVerificationTimer <= 1) {
              updatedGuests[index] = {
                ...guest,
                isIdVerifying: false,
                idVerificationTimer: 0,
                // Show next step based on plan
                // showCodeInput:
                //   guest.planType === "smb" ||
                //   (isCorporate && guest.planType === "starter"),
                // showWebcam: guest.planType === "enterprise" && !isCorporate,
                showCodeInput: guest.planType === "smb",
                showWebcam: guest.planType === "enterprise",
              };

              if (
                guest.planType === "smb"
                // || (isCorporate && guest.planType === "starter")
              ) {
                showToast(
                  "info",
                  "ID verification complete. Please enter verification code",
                );
              } else if (guest.planType === "enterprise") {
                showToast(
                  "info",
                  "ID verification complete. Please capture photo",
                );
              }
            }
          }
        });

        return anyChanges ? updatedGuests : prevGuests;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCorporate]);

  // Update phone input enabled status based on Booking ID
  const isPhoneInputEnabled =
    bookingInfo.bookingId && bookingInfo.bookingId.trim() !== "";

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearAllVerificationProcesses();
    };
  }, []);

  // Helper function to normalize phone number
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 10) return "";
    return phoneNumber.startsWith("91") && phoneNumber.length > 2
      ? phoneNumber.slice(2)
      : phoneNumber.startsWith("+91")
        ? phoneNumber.slice(3)
        : phoneNumber;
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
        planType: userPlan,
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

  const handleVerifyCode = (index) => {
    const guest = guests[index];

    if (!guest.verificationCode || guest.verificationCode.length < 4) {
      showToast("error", "Please enter a valid verification code");
      return;
    }

    // Check if code matches static code
    if (guest.verificationCode === STATIC_VERIFICATION_CODE) {
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          isCodeVerified: true,
          status: "verified",
          name: "Verified Guest",
          fullName: "Verified Guest",
          aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
          isTimerActive: false,
          timerSeconds: 0,
          showCodeInput: false,
          verificationCode: "",
        };
        return newState;
      });

      const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);
      const newVerifiedSet = new Set(verifiedPhoneNumbers);
      newVerifiedSet.add(normalizedNumber);
      setVerifiedPhoneNumbers(newVerifiedSet);

      showToast("success", "Guest verified successfully!");
    } else {
      showToast("error", "Invalid verification code. Please use 123456");
    }
  };

  const handleCapturePhoto = (index) => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          capturedImage: imageSrc,
          showWebcam: false,
          status: "verified",
          name: "Verified Guest",
          fullName: "Verified Guest",
          aadhaarStatus: VERIFICATION_STATUS.VERIFIED,
          faceStatus: VERIFICATION_STATUS.VERIFIED,
          isTimerActive: false,
          timerSeconds: 0,
        };
        return newState;
      });

      const normalizedNumber = normalizePhoneNumber(guests[index].phoneNumber);
      const newVerifiedSet = new Set(verifiedPhoneNumbers);
      newVerifiedSet.add(normalizedNumber);
      setVerifiedPhoneNumbers(newVerifiedSet);

      showToast("success", "Guest verified successfully!");
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
        planType: userPlan,
      },
    ]);
  };

  const handleVerifyGuest = async (index) => {
    const guest = guests[index];

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

    const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);

    if (isPhoneNumberAlreadyVerified(normalizedNumber)) {
      showToast("error", "This phone number is already verified");
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
          idVerificationTimer: 40,
        };
        return newState;
      });

      showToast("info", "ID verification started. Please wait 40 seconds...");
    }

    // 🟣 ENTERPRISE → ID → FACE
    else if (plan === "enterprise") {
      setGuests((prev) => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          isIdVerifying: true,
          idVerificationTimer: 40,
        };
        return newState;
      });

      showToast("info", "ID verification started. Please wait 40 seconds...");
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      !isPhoneInputEnabled ||
      guest.status === "verified" ||
      isPhoneNumberAlreadyVerified(guest.phoneNumber) ||
      guest.status === "pending" ||
      !guest.phoneNumber ||
      guest.phoneNumber.length < 10 ||
      hasDuplicatePhoneNumbersInBooking() ||
      guest.showCodeInput ||
      guest.showWebcam ||
      guest.isIdVerifying
    ) {
      return true;
    }

    if (isPhoneNumberDuplicate(guest.phoneNumber, index)) {
      return true;
    }

    return false;
  };

  // Get plan display name
  // const getPlanDisplayName = () => {
  //   if (isCorporate) {
  //     return "Corporate Starter Plan";
  //   } else {
  //     if (selectedPlan === "smb") return "Hospitality SMB Plan";
  //     if (selectedPlan === "enterprise") return "Hospitality Enterprise Plan";
  //   }
  //   return "";
  // };

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
          <h1 className="text-3xl font-bold">Guest Verification</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#10B981]">
              <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
              System Online
            </div>

            {/* Plan Selection Dropdown - Only for Hospitality */}
            {!isCorporate && (
              <div className="relative">
                <select
                  value={selectedPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="appearance-none bg-[#F1F5F9] border border-[#E2E8F0] text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b3631]/10 cursor-pointer"
                >
                  {/* 🏢 Corporate → show Starter + SMB + Enterprise */}
                  {isCorporate && <option value="starter">Starter Plan</option>}

                  {/* 🏨 Hospitality → only SMB + Enterprise */}
                  <option value="smb">SMB Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>

                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm font-medium bg-[#F1F5F9] px-4 py-2 rounded-full">
              {isCorporate ? <Building2 size={16} /> : <Hotel size={16} />}
              <span>{getPlanDisplayName()}</span>
              {isCorporate ? (
                <Shield size={16} className="text-blue-600" />
              ) : selectedPlan === "enterprise" ? (
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
                          <div className="text-xs text-gray-500">
                            Use: 123456
                          </div>
                        </div>
                      ) : guest.showWebcam ? (
                        <div className="space-y-3">
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width={200}
                            height={150}
                            className="rounded-lg border border-[#E2E8F0]"
                          />
                          <button
                            onClick={() => handleCapturePhoto(index)}
                            className="px-4 py-2 bg-[#1b3631] text-white rounded-lg font-medium text-sm hover:bg-[#142925] transition-all flex items-center gap-2"
                          >
                            <Camera size={16} />
                            Capture Photo
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
                        !guest.isIdVerifying ? (
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
