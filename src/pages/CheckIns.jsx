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
  Circle,
  RotateCcw,
  Edit,
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
import SuccessModal from "../components/SuccessModal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

const Checkin = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Generate unique booking ID for Walk-In
  const generateWalkInBookingId = () => {
    const timestamp = dayjs().format("YYYYMMDDHHmmss");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${timestamp}-${random}`;
  };

  // Basic Form State
  const [bookingInfo, setBookingInfo] = useState({
    verificationDate: dayjs().format("dddd, D MMM YYYY"),
    bookingSource: "OTA (Online Travel Agent)",
    bookingId: "BKG-9901-PRO",
  });

  // Guest List State
  const [guests, setGuests] = useState([
    {
      id: "01",
      phoneNumber: "",
      name: "",
      status: "idle", // idle, pending, verifying, verified, changing
      isPrimary: true,
      aadhaarStatus: VERIFICATION_STATUS.PENDING,
      faceStatus: VERIFICATION_STATUS.PENDING,
      fullName: "",
      verificationTimer: null, // Store timer for each guest
      isTimerActive: false,
      timerSeconds: 0,
      isWaitingForRestart: false, // Track if waiting for 30-second restart
      isChangingNumber: false, // Track if user is changing number
      originalPhoneNumber: "", // Store original phone number for duplicate check
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

  // Track if any guest is currently verifying
  const [isAnyGuestVerifying, setIsAnyGuestVerifying] = useState(false);

  // Track if at least one guest is verified
  const [hasAtLeastOneVerifiedGuest, setHasAtLeastOneVerifiedGuest] =
    useState(false);

  // Track if it's a walk-in booking
  const [isWalkIn, setIsWalkIn] = useState(false);

  // Track if verification has started (for disabling booking source)
  const [hasVerificationStarted, setHasVerificationStarted] = useState(false);

  // Ref to track if cancellation is in progress
  const cancellationInProgressRef = useRef(false);

  // Ref to track ongoing polling by phone number to prevent duplicate API calls
  const pollingInProgressRef = useRef(new Set());

  // Track used phone numbers to prevent duplicates
  const [usedPhoneNumbers, setUsedPhoneNumbers] = useState(new Set());

  // Track verified phone numbers
  const [verifiedPhoneNumbers, setVerifiedPhoneNumbers] = useState(new Set());

  // Update verification status whenever guests change
  useEffect(() => {
    const anyVerifying = guests.some(
      (g) =>
        g.status === "pending" ||
        g.status === "verifying" ||
        g.isWaitingForRestart,
    );
    const anyVerified = guests.some((g) => g.status === "verified");

    setIsAnyGuestVerifying(anyVerifying);
    setHasAtLeastOneVerifiedGuest(anyVerified);

    // Update hasVerificationStarted when any guest starts verifying
    if (anyVerifying && !hasVerificationStarted) {
      setHasVerificationStarted(true);
    }

    // Update used phone numbers set
    const newUsedPhoneNumbers = new Set();
    guests.forEach((guest) => {
      if (
        guest.phoneNumber &&
        guest.phoneNumber.length >= 10 &&
        guest.status !== "idle"
      ) {
        // Normalize phone number for comparison (remove country code if it's just "91")
        const normalizedNumber =
          guest.phoneNumber.startsWith("91") && guest.phoneNumber.length > 2
            ? guest.phoneNumber.slice(2)
            : guest.phoneNumber;
        newUsedPhoneNumbers.add(normalizedNumber);
      }
    });
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

            // When timer reaches 0, reset to idle and start 30-second wait
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

                    // Stop any polling for this guest
                    if (pollingIntervals[index]) {
                      clearInterval(pollingIntervals[index]);
                      setPollingIntervals((prev) => {
                        const newIntervals = { ...prev };
                        delete newIntervals[index];
                        return newIntervals;
                      });
                    }

                    // Start 30-second countdown for restart
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
                    }, 30000); // 30 seconds

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

  // Check if phone number is already verified
  const isPhoneNumberAlreadyVerified = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 10) return false;
    
    const normalizedNumber = phoneNumber.startsWith("91") && phoneNumber.length > 2
      ? phoneNumber.slice(2)
      : phoneNumber.startsWith("+91")
      ? phoneNumber.slice(3)
      : phoneNumber;
    
    return verifiedPhoneNumbers.has(normalizedNumber);
  };

  // Check if phone number is already used by another guest
  const isPhoneNumberAlreadyUsed = (phoneNumber, currentIndex) => {
    if (!phoneNumber || phoneNumber.length < 10) return false;

    // Check if already verified
    if (isPhoneNumberAlreadyVerified(phoneNumber)) {
      return true;
    }

    // Normalize phone number for comparison
    const normalizedNumber =
      phoneNumber.startsWith("91") && phoneNumber.length > 2
        ? phoneNumber.slice(2)
        : phoneNumber;

    // Check other guests (excluding current guest)
    for (let i = 0; i < guests.length; i++) {
      if (i === currentIndex) continue;

      const otherGuest = guests[i];
      if (otherGuest.phoneNumber && otherGuest.phoneNumber.length >= 10) {
        const otherNormalized =
          otherGuest.phoneNumber.startsWith("91") &&
          otherGuest.phoneNumber.length > 2
            ? otherGuest.phoneNumber.slice(2)
            : otherGuest.phoneNumber;

        if (
          otherNormalized === normalizedNumber &&
          otherGuest.status !== "idle"
        ) {
          return true;
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
        timerSeconds: 120, // 2 minutes = 120 seconds
        isWaitingForRestart: false,
        isChangingNumber: false,
      };
      return newState;
    });
  };

  // Function to clear all verification processes
  const clearAllVerificationProcesses = () => {
    console.log("Clearing all verification processes...");
    
    // Clear all polling intervals
    Object.values(pollingIntervals).forEach((intervalId) => {
      clearInterval(intervalId);
      console.log("Cleared polling interval:", intervalId);
    });

    // Clear all timers
    Object.values(checkStatusTimers).forEach((timerId) => {
      clearTimeout(timerId);
      console.log("Cleared check status timer:", timerId);
    });

    // Reset polling intervals and timers state
    setPollingIntervals({});
    setCheckStatusTimers({});
    
    // Clear polling in progress ref
    pollingInProgressRef.current.clear();

    // Note: Removed API call to cancelVerification to avoid unnecessary API calls after verification or cancel
  };

  // Function to stop verification for a specific guest
  const stopGuestVerification = (index) => {
    console.log(`Stopping verification for guest at index ${index}`);
    
    // Get the guest's phone number to remove from polling in progress
    if (guests[index] && guests[index].phoneNumber) {
      const normalizedNumber = guests[index].phoneNumber.startsWith("91") && guests[index].phoneNumber.length > 2
        ? guests[index].phoneNumber.slice(2)
        : guests[index].phoneNumber.startsWith("+91")
        ? guests[index].phoneNumber.slice(3)
        : guests[index].phoneNumber;
      
      pollingInProgressRef.current.delete(normalizedNumber);
    }
    
    // Clear polling interval for this guest
    if (pollingIntervals[index]) {
      clearInterval(pollingIntervals[index]);
      setPollingIntervals((prev) => {
        const newIntervals = { ...prev };
        delete newIntervals[index];
        return newIntervals;
      });
    }

    // Clear check status timer for this guest
    if (checkStatusTimers[index]) {
      clearTimeout(checkStatusTimers[index]);
      setCheckStatusTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[index];
        return newTimers;
      });
    }

    // Clear restart timer for this guest
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
    console.log("Resetting app state...");
    
    // Clear all verification processes first
    clearAllVerificationProcesses();

    // Reset all state to initial values with India as default country
    setGuests([
      {
        id: "01",
        phoneNumber: "91", // Set to India country code
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
      bookingSource: "OTA (Online Travel Agent)",
      bookingId: "BKG-9901-PRO",
    });

    setIsBookingInitialized(false);
    setIsAnyGuestVerifying(false);
    setHasAtLeastOneVerifiedGuest(false);
    setIsVerifying(false);
    setIsConfirmingCheckin(false);
    setTimeRemaining({});
    setShowSuccessModal(false);
    setHasVerificationStarted(false); // Reset verification started flag
    setUsedPhoneNumbers(new Set()); // Clear used phone numbers
    setVerifiedPhoneNumbers(new Set()); // Clear verified phone numbers
    
    console.log("App state reset complete");
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

    // If changing booking source to Walk-In, generate automatic booking ID
    if (name === "bookingSource") {
      if (value === "Walk-In") {
        const newBookingId = generateWalkInBookingId();
        setBookingInfo((prev) => ({
          ...prev,
          [name]: value,
          bookingId: newBookingId,
        }));
      } else {
        // Reset to default booking ID for non-Walk-In
        setBookingInfo((prev) => ({
          ...prev,
          [name]: value,
          bookingId: "BKG-9901-PRO",
        }));
      }
    } else if (
      name === "bookingId" &&
      bookingInfo.bookingSource !== "Walk-In" &&
      !hasVerificationStarted // Only allow editing if verification hasn't started
    ) {
      // Only allow editing booking ID if not Walk-In and verification hasn't started
      setBookingInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (index, value) => {
    setGuests((prev) => {
      const newGuests = [...prev];

      // Check if phone number is already used by another guest or already verified
      if (isPhoneNumberAlreadyUsed(value, index)) {
        const isVerified = isPhoneNumberAlreadyVerified(value);
        showToast(
          "error",
          isVerified 
            ? "This phone number is already verified"
            : "This phone number is already being verified for another guest"
        );
        return prev;
      }

      newGuests[index].phoneNumber = value;

      // If user is changing number, allow them to continue
      if (newGuests[index].isChangingNumber) {
        return newGuests;
      }

      // If timer is active and user changes phone number, reset everything
      if (
        newGuests[index].isTimerActive ||
        newGuests[index].isWaitingForRestart
      ) {
        newGuests[index].isTimerActive = false;
        newGuests[index].timerSeconds = 0;
        newGuests[index].status = "idle";
        newGuests[index].isWaitingForRestart = false;

        // Clear any polling for this guest
        if (pollingIntervals[index]) {
          clearInterval(pollingIntervals[index]);
          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });
        }

        // Clear any restart timer
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

      // Clear any timers and polling for this guest
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
    if (isAddGuestDisabled) return;

    setGuests((prev) => [
      ...prev,
      {
        id: String(prev.length + 1).padStart(2, "0"),
        phoneNumber: "91", // Set to India country code for new guests
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
    ]);
  };

  const startIdVerificationPolling = (index, phoneCountryCode, phoneno) => {
    // Check if this number is already verified - if so, don't start polling
    if (isPhoneNumberAlreadyVerified(phoneno)) {
      console.log(`Phone number ${phoneno} is already verified, skipping polling`);
      return;
    }

    // Check if polling is already in progress for this number
    if (pollingInProgressRef.current.has(phoneno)) {
      console.log(`Polling already in progress for ${phoneno}, skipping`);
      return;
    }

    // Mark polling as in progress for this phone number
    pollingInProgressRef.current.add(phoneno);
    console.log(`Started polling for ${phoneno}`);

    if (pollingIntervals[index]) {
      clearInterval(pollingIntervals[index]);
    }

    let hasNotifiedVerification = false; // Track if we've already notified about verification

    const poll = async () => {
      // Skip polling if cancellation is in progress
      if (cancellationInProgressRef.current) {
        console.log(`Cancellation in progress, stopping poll for ${phoneno}`);
        pollingInProgressRef.current.delete(phoneno);
        return;
      }

      // Double-check if number became verified (to handle race conditions)
      if (isPhoneNumberAlreadyVerified(phoneno)) {
        console.log(`Phone number ${phoneno} became verified during polling, stopping`);
        pollingInProgressRef.current.delete(phoneno);
        stopGuestVerification(index);
        return;
      }

      // Skip if we've already notified about verification
      if (hasNotifiedVerification) {
        console.log(`Already notified verification for ${phoneno}, stopping poll`);
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

        // Check if verification is successful based on the response structure
        if (
          guestResponse.verificationStatus === "verified" ||
          guestResponse.aadhaar_verified ||
          (guestResponse.fullName &&
            guestResponse.verificationStatus === "verified")
        ) {
          // Mark that we've notified to prevent duplicate notifications
          hasNotifiedVerification = true;
          
          console.log(`Verification successful for ${phoneno}, updating guest status`);
          
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

          // Add to verified phone numbers immediately to prevent duplicate API calls
          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(phoneno);
          setVerifiedPhoneNumbers(newVerifiedSet);

          // Show toast only once
          showToast("success", "Guest verified successfully!");

          // IMMEDIATELY stop polling and clear all timers for this guest
          // Clear the interval immediately
          if (pollingIntervals[index]) {
            clearInterval(pollingIntervals[index]);
            console.log(`Cleared polling interval for guest ${index}`);
          }
          
          // Clear the timeout
          if (checkStatusTimers[index]) {
            clearTimeout(checkStatusTimers[index]);
            console.log(`Cleared timeout for guest ${index}`);
          }
          
          // Update state to remove intervals
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
          
          // Remove from polling in progress
          pollingInProgressRef.current.delete(phoneno);
          console.log(`Stopped polling for ${phoneno}`);
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (error.status && error.status >= 400 && error.status < 500) {
          // Stop polling on error
          pollingInProgressRef.current.delete(phoneno);
          stopGuestVerification(index);
        }
      }
    };

    // Initial poll
    poll();

    const intervalId = setInterval(poll, GUEST_VERIFICATION.POLL_INTERVAL);
    setPollingIntervals((prev) => ({ ...prev, [index]: intervalId }));

    // Set timeout to stop polling after timeout period
    const timeoutId = setTimeout(() => {
      console.log(`Polling timeout reached for guest ${index} (${phoneno})`);
      pollingInProgressRef.current.delete(phoneno);
      stopGuestVerification(index);
    }, GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT);

    setCheckStatusTimers((prev) => ({ ...prev, [index]: timeoutId }));
  };

  const handleVerifyGuest = async (index) => {
    const guest = guests[index];

    // Normalize the phone number for checking
    const normalizedNumber = guest.phoneNumber.startsWith("91") && guest.phoneNumber.length > 2
      ? guest.phoneNumber.slice(2)
      : guest.phoneNumber.startsWith("+91")
      ? guest.phoneNumber.slice(3)
      : guest.phoneNumber;

    // Check if phone number is already verified
    if (isPhoneNumberAlreadyVerified(normalizedNumber)) {
      showToast("error", "This phone number is already verified");
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
            : "This phone number is already being verified for another guest"
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

      const phoneCountryCode = "91"; // Default for India
      const phoneno = normalizedNumber;

      try {
        // For changed numbers, we need to call ensureVerification API with the new number
        console.log(`Calling ensureVerification API for changed number: ${phoneno}`);
        
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
          phoneCountryCode,
          phoneno,
        );

        // Check if verification is successful based on response
        if (
          response.verificationStatus === "verified" ||
          response.aadhaar_verified ||
          (response.fullName && response.verificationStatus === "verified")
        ) {
          // If verified immediately, skip pending state
          setGuests((prev) => {
            const newState = [...prev];
            newState[index].status = "verified";
            newState[index].name =
              response.fullName || response.name || "Verified Guest";
            newState[index].fullName =
              response.fullName || response.name || "Verified Guest";
            newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
            newState[index].isTimerActive = false;
            newState[index].timerSeconds = 0;
            newState[index].isWaitingForRestart = false;
            newState[index].isChangingNumber = false;
            newState[index].originalPhoneNumber = "";
            return newState;
          });
          
          // Add to verified phone numbers immediately to prevent duplicate API calls
          const newVerifiedSet = new Set(verifiedPhoneNumbers);
          newVerifiedSet.add(phoneno);
          setVerifiedPhoneNumbers(newVerifiedSet);
          
          showToast("success", "Guest verified successfully!");
        } else {
          // Start polling for verification status with new number
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
          : "This phone number is already being verified for another guest"
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

    const phoneCountryCode = "91"; // Default for India
    const phoneno = normalizedNumber;

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
        phoneCountryCode,
        phoneno,
      );

      // Check if verification is successful based on response
      if (
        response.verificationStatus === "verified" ||
        response.aadhaar_verified ||
        (response.fullName && response.verificationStatus === "verified")
      ) {
        // If verified immediately, skip pending state
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].status = "verified";
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
        
        // Add to verified phone numbers immediately to prevent duplicate API calls
        const newVerifiedSet = new Set(verifiedPhoneNumbers);
        newVerifiedSet.add(phoneno);
        setVerifiedPhoneNumbers(newVerifiedSet);
        
        showToast("success", "Guest verified successfully!");
      } else {
        // Start polling for verification status (but keep showing as "pending")
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
    const allVerified = guests.every((g) => g.status === "verified");
    if (!allVerified) {
      showToast("error", "Please verify all guests first");
      return;
    }

    setIsConfirmingCheckin(true);
    try {
      await verificationService.endVerification(bookingInfo.bookingId);
      
      // Stop all verification processes before showing success modal
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
    console.log("Confirming cancellation...");
    
    // Set cancellation flag
    cancellationInProgressRef.current = true;

    // Clear all verification processes
    clearAllVerificationProcesses();

    // Reset all state with India as default
    resetAppState();

    // Show success message
    showToast(
      "success",
      "Verification cancelled.",
    );

    // Reset cancellation flag after a short delay
    setTimeout(() => {
      cancellationInProgressRef.current = false;
      console.log("Cancellation flag reset");
    }, 1000);

    // Close modal
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
  const isAddGuestDisabled = !hasAtLeastOneVerifiedGuest || isAnyGuestVerifying;

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

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
                value={bookingInfo.verificationDate}
                className="w-full pl-12 pr-4 py-4 bg-[#F1F5F9] border border-transparent rounded-xl text-gray-600 focus:outline-none cursor-default"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              BOOKING SOURCE
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <select
                name="bookingSource"
                value={bookingInfo.bookingSource}
                onChange={handleBookingInfoChange}
                disabled={hasVerificationStarted}
                className={`w-full pl-12 pr-10 py-4 bg-white border rounded-xl text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#1b3631]/10 focus:border-[#1b3631] transition-colors ${
                  hasVerificationStarted
                    ? "border-[#E2E8F0] bg-[#F8FAFC] text-gray-500 cursor-not-allowed"
                    : "border-[#E2E8F0]"
                }`}
              >
                <option value="OTA (Online Travel Agent)">
                  OTA (Online Travel Agent)
                </option>
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
              BOOKING ID
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
                value={bookingInfo.bookingId}
                onChange={handleBookingInfoChange}
                readOnly={isWalkIn || hasVerificationStarted}
                placeholder={isWalkIn ? "Auto-generated" : "BKG-9901-PRO"}
                className={`w-full ${isWalkIn ? "pl-10" : "pl-4"} pr-4 py-4 bg-white border ${
                  isWalkIn
                    ? "border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981] font-medium"
                    : hasVerificationStarted
                      ? "border-[#E2E8F0] bg-[#F8FAFC] text-gray-500"
                      : "border-[#E2E8F0] text-gray-700"
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b3631]/10 focus:border-[#1b3631] transition-colors ${
                  isWalkIn || hasVerificationStarted ? "cursor-default" : ""
                }`}
              />
            </div>
            {isWalkIn && (
              <p className="text-xs text-[#10B981] mt-1">
                Booking ID auto-generated for Walk-In
              </p>
            )}
            {hasVerificationStarted && !isWalkIn && (
              <p className="text-xs text-gray-500 mt-1">
                Cannot change booking ID during verification
              </p>
            )}
          </div>
        </div>

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
                        disabled={
                          guest.status === "pending" ||
                          guest.status === "verifying" ||
                          guest.status === "verified"
                        }
                        containerClass="!w-full"
                        inputClass={`!w-full !h-12 !border-[#E2E8F0] !rounded-xl ${
                          guest.isChangingNumber
                            ? "!bg-[#FFF7ED] !border-[#F59E0B] !text-[#92400E]"
                            : "!bg-white !text-gray-700"
                        } focus:!border-[#1b3631] focus:!ring-2 focus:!ring-[#1b3631]/10`}
                        buttonClass="!border-[#E2E8F0] !rounded-l-xl !bg-white hover:!bg-gray-50"
                        dropdownClass="!rounded-xl !shadow-xl"
                      />

                      {/* Change Number button beside input */}
                      {guest.status === "pending" &&
                        !guest.isChangingNumber && (
                          <button
                            onClick={() => handleChangeNumber(index)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-[#1b3631] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-all flex items-center gap-1"
                          >
                            <Edit size={12} />
                            Change
                          </button>
                        )}

                      {/* Cancel changing */}
                      {guest.isChangingNumber && (
                        <button
                          onClick={() => handleCancelChangeNumber(index)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
                        disabled={
                          guest.status === "verified" ||
                          isPhoneNumberAlreadyVerified(guest.phoneNumber) ||
                          guest.status === "pending" ||
                          !guest.phoneNumber ||
                          guest.phoneNumber.length < 10
                        }
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
        <div className="mb-12">
          <button
            onClick={addGuest}
            disabled={isAddGuestDisabled}
            className="px-6 py-3 bg-[#1b3631] text-white rounded-xl font-bold text-sm hover:bg-[#142925] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={16} />
            Add Guest
          </button>
          {isAddGuestDisabled && (
            <p className="text-sm text-gray-500 mt-2">
              {isAnyGuestVerifying
                ? "Please wait for verification to complete before adding more guests."
                : "Verify at least one guest first to enable adding more guests."}
            </p>
          )}
        </div>

        {/* Footer */}
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
              isConfirmingCheckin
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