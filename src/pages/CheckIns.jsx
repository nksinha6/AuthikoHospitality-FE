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
        // Replace with actual API call to get server date
        // For now, we'll simulate with dayjs but you should replace with:
        // const serverDate = await verificationService.getServerDate();
        // const formattedDate = dayjs(serverDate).format("dddd, D MMM YYYY");

        // For demonstration, using current date but in real app use API
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

  // Update verification status whenever guests change
  useEffect(() => {
    console.log("Guests updated:", guests.map(g => ({ 
      id: g.id, 
      status: g.status, 
      phone: g.phoneNumber,
      originalPhone: g.originalPhoneNumber 
    })));
    
    const anyVerifying = guests.some(
      (g) =>
        g.status === "pending" ||
        g.status === "verifying" ||
        g.isWaitingForRestart,
    );
    const allVerified = guests.every((g) => g.status === "verified");
    
    console.log("Any verifying:", anyVerifying);
    console.log("All verified:", allVerified);

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
    
    console.log("All phone numbers map:", Array.from(newAllPhoneNumbers.entries()));
    console.log("Used phone numbers:", Array.from(newUsedPhoneNumbers));
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
      console.log("Cleared polling interval:", intervalId);
    });

    Object.values(checkStatusTimers).forEach((timerId) => {
      clearTimeout(timerId);
      console.log("Cleared check status timer:", timerId);
    });

    setPollingIntervals({});
    setCheckStatusTimers({});
    pollingInProgressRef.current.clear();
  };

  // Function to stop verification for a specific guest
  const stopGuestVerification = (index) => {
    console.log(`Stopping verification for guest at index ${index}`);

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
    console.log("Resetting app state...");

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

    // Focus back on Booking Source
    setTimeout(() => {
      if (bookingSourceRef.current) {
        bookingSourceRef.current.focus();
      }
    }, 100);

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
          "This phone number is already entered for another guest"
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
      },
    ]);
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

    // Normalize the phone number for checking
    const normalizedNumber = normalizePhoneNumber(guest.phoneNumber);

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
      const phoneno = normalizedNumber;

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

        const newVerifiedSet = new Set(verifiedPhoneNumbers);
        newVerifiedSet.add(phoneno);
        setVerifiedPhoneNumbers(newVerifiedSet);

        showToast("success", "Guest verified successfully!");
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
    console.log("Confirming cancellation...");

    cancellationInProgressRef.current = true;

    clearAllVerificationProcesses();

    resetAppState();

    showToast("success", "Verification cancelled.");

    setTimeout(() => {
      cancellationInProgressRef.current = false;
      console.log("Cancellation flag reset");
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
  const isAddGuestDisabled = !areAllGuestsVerified || isAnyGuestVerifying || !isPhoneInputEnabled;

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
