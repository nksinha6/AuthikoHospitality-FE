import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { CheckCircle, X, Clock, User, Plus, Edit2 } from "lucide-react";
import { UI_TEXT, ROUTES } from "../constants/ui.js";
import {
  VERIFICATION_STATUS,
  GUEST_VERIFICATION,
} from "../constants/config.js";
import { verificationService } from "../services/verificationService.js";
import SuuccessModal from "../components/SuccessModal.jsx";
import GuestDetailsModal from "../components/GuestDetailsModal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { showToast } from '../utility/toast.js';

export default function GuestVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const formData = location.state?.formData || {};
  const {
    adults = 0,
    children = 0, // Changed from minors to children to match checkin screen
    bookingId,
    countryCode = "91",
    phoneNumber = "",
  } = formData;

  const [guests, setGuests] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [manualVerificationGuestIndex, setManualVerificationGuestIndex] =
    useState(null);
  const [showForceVerifyModal, setShowForceVerifyModal] = useState(false);
  const [isConfirmingCheckin, setIsConfirmingCheckin] = useState(false);

  // Polling and retry state
  const [pollingIntervals, setPollingIntervals] = useState({});
  const [retryAttempts, setRetryAttempts] = useState({});

  // Minor Logic State
  const [activeMinorForm, setActiveMinorForm] = useState(null);

  // Checks Status Timer State
  const [checkStatusTimers, setCheckStatusTimers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState({});

  // Initialize guest list
  useEffect(() => {
    if (adults > 0) {
      const initialGuests = Array.from({ length: adults }, (_, index) => {
        // First guest gets the phone number from checkin
        if (index === 0 && phoneNumber) {
          // Combine country code and phone number
          const fullPhoneNumber = countryCode + phoneNumber;
          return {
            phoneNumber: fullPhoneNumber,
            isVerified: false,
            aadhaarStatus: VERIFICATION_STATUS.PENDING,
            faceStatus: VERIFICATION_STATUS.PENDING,
            timestamp: null,
            minors: [],
          };
        }
        return {
          phoneNumber: "",
          isVerified: false,
          aadhaarStatus: VERIFICATION_STATUS.PENDING,
          faceStatus: VERIFICATION_STATUS.PENDING,
          timestamp: null,
          minors: [],
        };
      });
      setGuests(initialGuests);
    }
  }, [adults, phoneNumber, countryCode]);

  useEffect(() => {
    return () => {
      Object.values(pollingIntervals).forEach((intervalId) => {
        clearInterval(intervalId);
      });
    };
  }, [pollingIntervals]);

  // Check Status Timer Logic
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const newTimeRemaining = {};
      let hasActiveTimers = false;

      Object.keys(checkStatusTimers).forEach((index) => {
        const targetTime = checkStatusTimers[index];
        if (targetTime > now) {
          newTimeRemaining[index] = Math.ceil((targetTime - now) / 1000);
          hasActiveTimers = true;
        } else {
          // Timer expired
          newTimeRemaining[index] = 0;
          // We can optionally remove it from checkStatusTimers here, or just let it stay as expired
        }
      });

      if (hasActiveTimers || Object.keys(timeRemaining).some(k => timeRemaining[k] > 0)) {
        setTimeRemaining((prev) => {
          // Only update if changed to avoid unnecessary re-renders (optimization)
          const updated = { ...prev, ...newTimeRemaining };
          // Simple check if actually different? For now just set it.
          return updated;
        });
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [checkStatusTimers]);

  const handlePhoneNumberChange = (index, value) => {
    const updatedGuests = [...guests];
    updatedGuests[index].phoneNumber = value;
    setGuests(updatedGuests);
  };

  const isValidPhoneNumber = (phoneNumber) => {
    return phoneNumber && phoneNumber.length >= 10;
  };

  const handleVerifyGuest = async (index) => {
    const guest = guests[index];

    // Prevent multiple verification attempts for the same guest
    if (guest.isVerified || pollingIntervals[index]) {
      return;
    }

    const phoneCountryCode = GUEST_VERIFICATION.COUNTRY_CODE_NUMERIC.replace(
      /^\+/,
      ""
    );
    const phoneno = guest.phoneNumber.replace(
      new RegExp(`^${phoneCountryCode}`),
      ""
    );

    // Update guest status to processing
    const updatedGuests = [...guests];
    updatedGuests[index].isVerified = true;
    updatedGuests[index].timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    updatedGuests[index].aadhaarStatus = VERIFICATION_STATUS.PROCESSING;
    setGuests(updatedGuests);

    try {
      // Call ensure verification API
      const ensureResponse = await verificationService.ensureVerification(
        bookingId,
        phoneCountryCode,
        phoneno
      );

      // Case 1: Verified 1Pass user exists
      if (ensureResponse.verificationStatus === "verified") {
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
          // Face status remains pending until manually initiated
          newState[index].faceStatus = VERIFICATION_STATUS.PENDING;
          return newState;
        });
        // Stop polling for face match status (Wait for manual trigger)
      } else if (ensureResponse.verificationStatus === "pending") {
        // Case 2: Status pending - start polling for ID verification
        startIdVerificationWithDelay(index, phoneCountryCode, phoneno);

        // Start 2-minute timer for "Check Status" button
        setCheckStatusTimers((prev) => ({
          ...prev,
          [index]: Date.now() + GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT,
        }));
        setTimeRemaining((prev) => ({
          ...prev,
          [index]: GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT / 1000,
        }));
      }
    } catch (error) {
      if (error.code === "USER_NOT_FOUND") {
        // Backend sends SMS, start polling after delay
        startIdVerificationWithDelay(index, phoneCountryCode, phoneno);

        // Start 2-minute timer for "Check Status" button
        setCheckStatusTimers((prev) => ({
          ...prev,
          [index]: Date.now() + GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT,
        }));
        setTimeRemaining((prev) => ({
          ...prev,
          [index]: GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT / 1000,
        }));
      } else {
        // Handle other errors
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].aadhaarStatus = VERIFICATION_STATUS.PENDING;
          newState[index].isVerified = false;
          newState[index].timestamp = null;
          return newState;
        });
        showToast("error", error.message || "Verification failed. Please try again.");
      }
    }
  };

  const startIdVerificationWithDelay = (index, phoneCountryCode, phoneno) => {
    setTimeout(() => {
      startIdVerificationPolling(index, phoneCountryCode, phoneno);
    }, GUEST_VERIFICATION.POLL_INITIAL_DELAY);
  };

  const startIdVerificationPolling = (index, phoneCountryCode, phoneno) => {
    // Prevent starting polling if already active for this guest
    if (pollingIntervals[index]) {
      return;
    }

    const poll = async () => {
      try {
        const guestResponse = await verificationService.getGuestById(
          phoneCountryCode,
          phoneno
        );
        if (guestResponse.verificationStatus === "verified" || guestResponse.aadhaar_verified) {
          // ID verification successful
          setGuests((prev) => {
            const newState = [...prev];
            newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
            // Face status remains pending until manually initiated which we do right after
            newState[index].faceStatus = VERIFICATION_STATUS.PENDING;
            return newState;
          });

          // Clear polling interval
          clearInterval(pollingIntervals[index]);
          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });

          // Auto-initiate Face Match
          handleInitiateFaceMatch(index);
        }
        // Continue polling if not verified
      } catch (error) {
        // Stop polling on 4XX client errors (permanent failures)
        if (error.status && error.status >= 400 && error.status < 500) {
          clearInterval(pollingIntervals[index]);
          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });
          // Update status to pending to indicate error
          setGuests((prev) => {
            const newState = [...prev];
            newState[index].aadhaarStatus = VERIFICATION_STATUS.PENDING;
            return newState;
          });
          return;
        }
        // Continue polling on other errors (5XX, network issues, etc.)
      }
    };

    // Start polling every 10 seconds
    const intervalId = setInterval(poll, GUEST_VERIFICATION.POLL_INTERVAL);
    setPollingIntervals((prev) => ({ ...prev, [index]: intervalId }));

    // Stop polling after timeout and show manual status check option
    setTimeout(() => {
      // Check if interval still exists (verification hasn't completed)
      setPollingIntervals((prev) => {
        if (prev[index]) {
          clearInterval(prev[index]);
          const newIntervals = { ...prev };
          delete newIntervals[index];

          // Mark for manual verification check
          setManualVerificationGuestIndex(index);
          return newIntervals;
        }
        return prev;
      });
    }, GUEST_VERIFICATION.ID_VERIFICATION_TIMEOUT);
  };

  const startFaceMatchPolling = (index, phoneCountryCode, phoneno) => {
    // Prevent starting polling if already active for this guest
    if (pollingIntervals[index]) {
      return;
    }

    const poll = async () => {
      try {
        const faceMatchResponse = await verificationService.getFaceMatchStatus(
          bookingId,
          phoneCountryCode,
          phoneno
        );

        if (
          faceMatchResponse &&
          faceMatchResponse.status === "verified"
        ) {
          // Face match successful
          setGuests((prev) => {
            const newState = [...prev];
            newState[index].faceStatus = VERIFICATION_STATUS.VERIFIED;
            newState[index].faceMatchScore = faceMatchResponse.faceMatchScore;
            newState[index].faceMatchData = faceMatchResponse;
            return newState;
          });

          // Clear polling interval
          clearInterval(pollingIntervals[index]);
          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });
        }
        // Continue polling if not verified or no response yet
      } catch (error) {
        // Stop polling on 4XX client errors (except 404)
        if (
          error.status &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 404
        ) {
          clearInterval(pollingIntervals[index]);
          setPollingIntervals((prev) => {
            const newIntervals = { ...prev };
            delete newIntervals[index];
            return newIntervals;
          });
          // Update status to pending to indicate error
          setGuests((prev) => {
            const newState = [...prev];
            newState[index].faceStatus = VERIFICATION_STATUS.PENDING;
            return newState;
          });
          return;
        }
        // Continue polling on 404 or network errors
      }
    };

    // Start polling
    const intervalId = setInterval(poll, GUEST_VERIFICATION.POLL_INTERVAL);
    setPollingIntervals((prev) => ({ ...prev, [index]: intervalId }));

    // Stop polling after timeout
    setTimeout(() => {
      setPollingIntervals((prev) => {
        if (prev[index]) {
          clearInterval(intervalId); // Clear the specific interval ID
          const newIntervals = { ...prev };
          delete newIntervals[index];

          // Mark for manual face match check (reusing the same state variable, logic in render handles per status)
          setManualVerificationGuestIndex(index);
          return newIntervals;
        }
        return prev;
      });
    }, GUEST_VERIFICATION.FACE_VERIFICATION_TIMEOUT);

    // Start 30-second timer for "Check Status" button for Face Match
    setCheckStatusTimers((prev) => ({
      ...prev,
      [index]: Date.now() + GUEST_VERIFICATION.FACE_VERIFICATION_TIMEOUT,
    }));
    setTimeRemaining((prev) => ({
      ...prev,
      [index]: GUEST_VERIFICATION.FACE_VERIFICATION_TIMEOUT / 1000,
    }));
  };

  const handleRetryVerification = (index) => {
    // Reset status and retry
    setGuests((prev) => {
      const newState = [...prev];
      newState[index].aadhaarStatus = VERIFICATION_STATUS.PENDING;
      newState[index].faceStatus = VERIFICATION_STATUS.PENDING;
      return newState;
    });
    handleVerifyGuest(index);
  };

  const handleInitiateFaceMatch = async (index) => {
    const guest = guests[index];
    const phoneCountryCode = GUEST_VERIFICATION.COUNTRY_CODE_NUMERIC.replace(
      /^\+/,
      ""
    );
    const phoneno = guest.phoneNumber.replace(
      new RegExp(`^${phoneCountryCode}`),
      ""
    );

    // Update status to processing
    setGuests((prev) => {
      const newState = [...prev];
      newState[index].faceStatus = VERIFICATION_STATUS.PROCESSING;
      return newState;
    });

    try {
      // Fire & Forget call (we await only for checking successful dispatch)
      await verificationService.initiateFaceMatch(
        bookingId,
        phoneCountryCode,
        phoneno
      );

      // Start polling
      startFaceMatchPolling(index, phoneCountryCode, phoneno);
    } catch (error) {
      // Revert status on failure to initiate
      setGuests((prev) => {
        const newState = [...prev];
        newState[index].faceStatus = VERIFICATION_STATUS.PENDING;
        return newState;
      });
      showToast("error", error.message || "Failed to initiate face match.");
    }
  };

  const handleManualVerification = async (index) => {
    // const index = manualVerificationGuestIndex; // passed as arg now or from closure
    // But modifying to take index as argument if called directly from button click

    // Set 30s cooldown timer
    setCheckStatusTimers((prev) => ({
      ...prev,
      [index]: Date.now() + GUEST_VERIFICATION.MANUAL_CHECK_COOLDOWN,
    }));
    setTimeRemaining((prev) => ({
      ...prev,
      [index]: GUEST_VERIFICATION.MANUAL_CHECK_COOLDOWN / 1000,
    }));

    const guest = guests[index];
    const phoneCountryCode = GUEST_VERIFICATION.COUNTRY_CODE_NUMERIC.replace(
      /^\+/,
      ""
    );
    const phoneno = guest.phoneNumber.replace(
      new RegExp(`^${phoneCountryCode}`),
      ""
    );

    try {
      const guestResponse = await verificationService.getGuestById(
        phoneCountryCode,
        phoneno
      );

      if (guestResponse.verificationStatus === "verified" || guestResponse.aadhaar_verified) {
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
          // Logic for face status: if verified, set verified. If aadhaar verified but face not, set pending (waiting for init).
          newState[index].faceStatus = guestResponse.face_verified
            ? VERIFICATION_STATUS.VERIFIED
            : VERIFICATION_STATUS.PENDING;
          return newState;
        });
        setManualVerificationGuestIndex(null);
        handleInitiateFaceMatch(index);
      } else {
        // If not verified yet, restart polling
        showToast("info", "Verification still pending. Resuming automatic checks...");
        setManualVerificationGuestIndex(null);
        // Reset status to processing to indicate polling is back on
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].aadhaarStatus = VERIFICATION_STATUS.PROCESSING;
          return newState;
        });
        startIdVerificationPolling(index, phoneCountryCode, phoneno);
      }
    } catch (error) {
      // On error, also restart polling (retry)
      showToast("info", "Verification check failed. Resuming automatic checks...");
      setManualVerificationGuestIndex(null);
      setGuests((prev) => {
        const newState = [...prev];
        newState[index].aadhaarStatus = VERIFICATION_STATUS.PROCESSING;
        return newState;
      });
      startIdVerificationPolling(index, phoneCountryCode, phoneno);
    }
  };

  const handleManualFaceMatchCheck = async (index) => {
    // const index = manualVerificationGuestIndex; // passed now

    // Set 30s cooldown timer
    setCheckStatusTimers((prev) => ({
      ...prev,
      [index]: Date.now() + GUEST_VERIFICATION.MANUAL_CHECK_COOLDOWN,
    }));
    setTimeRemaining((prev) => ({
      ...prev,
      [index]: GUEST_VERIFICATION.MANUAL_CHECK_COOLDOWN / 1000,
    }));

    const guest = guests[index];
    const phoneCountryCode = GUEST_VERIFICATION.COUNTRY_CODE_NUMERIC.replace(
      /^\+/,
      ""
    );
    const phoneno = guest.phoneNumber.replace(
      new RegExp(`^${phoneCountryCode}`),
      ""
    );

    try {
      const faceMatchResponse = await verificationService.getFaceMatchStatus(
        bookingId,
        phoneCountryCode,
        phoneno
      );

      if (
        faceMatchResponse &&
        faceMatchResponse.status === "verified"
      ) {
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].faceStatus = VERIFICATION_STATUS.VERIFIED;
          newState[index].faceMatchScore = faceMatchResponse.faceMatchScore;
          newState[index].faceMatchData = faceMatchResponse;
          return newState;
        });
        setManualVerificationGuestIndex(null);
      } else {
        // If not verified yet, restart polling
        showToast("info", "Face match still pending. Resuming automatic checks...");
        setManualVerificationGuestIndex(null);
        // Reset status to processing to indicate polling is back on
        setGuests((prev) => {
          const newState = [...prev];
          newState[index].faceStatus = VERIFICATION_STATUS.PROCESSING;
          return newState;
        });
        startFaceMatchPolling(index, phoneCountryCode, phoneno);
      }
    } catch (error) {
      // On error, also restart polling
      showToast("info", "Status check failed. Resuming automatic checks...");
      setManualVerificationGuestIndex(null);
      setGuests((prev) => {
        const newState = [...prev];
        newState[index].faceStatus = VERIFICATION_STATUS.PROCESSING;
        return newState;
      });
      startFaceMatchPolling(index, phoneCountryCode, phoneno);
    }
  };

  const confirmForcedVerification = () => {
    const index = manualVerificationGuestIndex;
    if (index === null) return;

    setGuests((prev) => {
      const newState = [...prev];
      newState[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
      // Should be ready for face match init
      newState[index].faceStatus = VERIFICATION_STATUS.PENDING;
      return newState;
    });

    setShowForceVerifyModal(false);
    setManualVerificationGuestIndex(null);
    handleInitiateFaceMatch(index);
  };

  const handleChangeNumber = (index) => {
    const updatedGuests = [...guests];
    updatedGuests[index].isVerified = false;
    updatedGuests[index].phoneNumber = countryCode;
    updatedGuests[index].aadhaarStatus = VERIFICATION_STATUS.PENDING;
    updatedGuests[index].faceStatus = VERIFICATION_STATUS.PENDING;
    updatedGuests[index].timestamp = null;
    setGuests(updatedGuests);
  };

  const handleConfirmCheckIn = async () => {
    if (!allGuestsFullyVerified || !bookingId) {
      return;
    }

    setIsConfirmingCheckin(true);

    try {
      // Call end_verification API
      const response = await verificationService.endVerification(bookingId);
      console.log("response", response);

      // Show success modal
      setShowSuccessModal(true);
      setModalMessage(UI_TEXT.GUEST_VERIFICATION_SUCCESS_MESSAGE);
      console.log("response", response);

      // Navigate after delay
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate(ROUTES.TODAYS_BOOKINGS);
      }, GUEST_VERIFICATION.SUCCESS_MODAL_DELAY);
    } catch (error) {
      // Handle API error
      showToast("error", error.message || "Failed to complete check-in. Please try again.");
    } finally {
      setIsConfirmingCheckin(false);
    }
  };

  const handleCancelVerification = () => {
    setShowCancelModal(true);
  };

  const confirmCancelVerification = () => {
    setShowCancelModal(false);
    navigate(-1);
  };

  // Minor Logic
  const openAddMinorForm = (guestIndex) => {
    setActiveMinorForm({ guestIndex, minorIndex: null, name: "", age: "" });
  };

  const openEditMinorForm = (guestIndex, minorIndex, minor) => {
    setActiveMinorForm({
      guestIndex,
      minorIndex,
      name: minor.name,
      age: minor.age,
    });
  };

  const closeMinorForm = () => {
    setActiveMinorForm(null);
  };

  const handleMinorInputChange = (field, value) => {
    setActiveMinorForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveMinor = () => {
    if (!activeMinorForm.name || !activeMinorForm.age) {
      showToast("error", "Please enter both name and age.");
      return;
    }

    const age = parseInt(activeMinorForm.age);
    if (age < 0 || age > 17) {
      showToast("error", "Minor age must be between 0 and 17 years.");
      return;
    }

    setGuests((prev) => {
      const newState = [...prev];
      const gIndex = activeMinorForm.guestIndex;

      if (activeMinorForm.minorIndex !== null) {
        const newMinors = [...newState[gIndex].minors];
        newMinors[activeMinorForm.minorIndex] = {
          name: activeMinorForm.name,
          age: activeMinorForm.age,
        };
        newState[gIndex] = { ...newState[gIndex], minors: newMinors };
      } else {
        newState[gIndex] = {
          ...newState[gIndex],
          minors: [
            ...newState[gIndex].minors,
            { name: activeMinorForm.name, age: activeMinorForm.age },
          ],
        };
      }
      return newState;
    });
    closeMinorForm();
  };

  const removeMinor = (guestIndex, minorIndex) => {
    setGuests((prev) => {
      const newState = [...prev];
      const newMinors = [...newState[guestIndex].minors];
      newMinors.splice(minorIndex, 1);
      newState[guestIndex] = { ...newState[guestIndex], minors: newMinors };
      return newState;
    });
  };

  const totalAddedMinors = guests.reduce((sum, g) => sum + g.minors.length, 0);
  const minorsLimit = parseInt(children) || 0;
  const limitReached = totalAddedMinors >= minorsLimit;

  const allGuestsFullyVerified =
    guests.length > 0 &&
    guests.every(
      (g) =>
        g.isVerified &&
        g.aadhaarStatus === VERIFICATION_STATUS.VERIFIED &&
        g.faceStatus === VERIFICATION_STATUS.VERIFIED
    );

  const hasAnyVerified = guests.some(
    (g) =>
      g.aadhaarStatus === VERIFICATION_STATUS.VERIFIED &&
      g.faceStatus === VERIFICATION_STATUS.VERIFIED
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {/* Main Content Area - Centered */}
      <div className="w-full max-w-7xl overflow-hidden">
        <div className="rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-[#1b3631]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {UI_TEXT.GUEST_VERIFICATION_TITLE}
                </h2>
                {/* <p className="text-sm text-white">
                  {UI_TEXT.GUEST_VERIFICATION_BOOKING_ID}:{" "}
                  <span className="font-semibold text-white">
                    {bookingId || "VXXXXXX"}
                  </span>
                </p> */}
              </div>
              <div className="flex items-center gap-2 text-sm bg-blue-50 text-[#1b3631] px-3 py-1.5 rounded-full font-medium">
                <User size={16} />
                <span>
                  {adults} {UI_TEXT.TABLE_ADULTS}, {minorsLimit}{" "}
                  {UI_TEXT.TABLE_MINORS}
                </span>
              </div>
            </div>
          </div>

          {/* Guest Verification Table */}
          <div className="">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 w-16">
                    {UI_TEXT.GUEST_VERIFICATION_SR_NO}
                  </th>
                  <th className="px-6 py-4 w-80">
                    {UI_TEXT.GUEST_VERIFICATION_GUEST_INFO}
                  </th>
                  {guests.some((g) => g.isVerified) && (
                    <>
                      <th className="px-6 py-4 w-24">
                        {UI_TEXT.GUEST_VERIFICATION_ID_STATUS}
                      </th>
                      <th className="px-6 py-4 w-24">
                        {UI_TEXT.GUEST_VERIFICATION_FACE_ID}
                      </th>
                      <th className="px-6 py-4 w-32">
                        {UI_TEXT.GUEST_VERIFICATION_TIMESTAMP}
                      </th>
                    </>
                  )}
                  {hasAnyVerified && (
                    <th className="px-6 py-4 w-28">
                      {UI_TEXT.GUEST_VERIFICATION_ACTION}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map((guest, index) => (
                  <tr
                    key={index}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                    valign="top"
                  >
                    <td className="px-6 py-6 font-semibold text-gray-400">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="px-6 py-6 space-y-4">
                      {!guest.isVerified ? (
                        <div className="flex items-center gap-3 relative">
                          <div className="flex-1">
                            <PhoneInput
                              country={GUEST_VERIFICATION.DEFAULT_COUNTRY_CODE}
                              value={guest.phoneNumber}
                              onChange={(value) =>
                                handlePhoneNumberChange(index, value)
                              }
                              placeholder={
                                UI_TEXT.GUEST_VERIFICATION_PHONE_PLACEHOLDER
                              }
                              enableSearch={true}
                              countryCodeEditable={false}
                            />
                          </div>
                          <button
                            onClick={() => handleVerifyGuest(index)}
                            disabled={!isValidPhoneNumber(guest.phoneNumber)}
                            className="px-5 py-2.5 bg-[#1b3631] text-white rounded-lg hover:bg-[#144032] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap shadow-sm hover:shadow-md cursor-pointer"
                          >
                            {UI_TEXT.GUEST_VERIFICATION_VERIFY_BUTTON}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <PhoneInput
                              country={GUEST_VERIFICATION.DEFAULT_COUNTRY_CODE}
                              value={guest.phoneNumber}
                              disabled
                            />
                          </div>
                          {guest.aadhaarStatus !== "verified" && (
                            <button
                              onClick={() => handleChangeNumber(index)}
                              className="text-[#1b3631] hover:text-[#144032] text-sm font-medium underline-offset-2 hover:underline cursor-pointer"
                            >
                              {UI_TEXT.GUEST_VERIFICATION_CHANGE_BUTTON}
                            </button>
                          )}
                        </div>
                      )}

                      {guest.minors.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {guest.minors.map((minor, mIdx) => (
                            <div
                              key={mIdx}
                              className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 group/minor"
                            >
                              <div className="bg-blue-100 p-1 rounded-full">
                                <User size={12} className="text-[#1b3631]" />
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="font-semibold text-xs">
                                  {minor.name}
                                </span>
                                <span className="text-[10px] opacity-70">
                                  {minor.age} yrs
                                </span>
                              </div>

                              {!guest.isVerified && (
                                <div className="flex gap-1 ml-2 border-l border-blue-200 pl-2">
                                  <button
                                    onClick={() =>
                                      openEditMinorForm(index, mIdx, minor)
                                    }
                                    className="p-1 hover:bg-blue-100 rounded text-blue-500"
                                    title="Edit"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => removeMinor(index, mIdx)}
                                    className="p-1 hover:bg-red-100 rounded text-blue-400 hover:text-red-500"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {(() => {
                        if (
                          activeMinorForm &&
                          activeMinorForm.guestIndex === index
                        ) {
                          return (
                            <div className="flex items-center gap-2 mt-2 bg-white p-2 rounded-xl border border-blue-100 shadow-lg shadow-blue-50/50 animate-in fade-in zoom-in-95 duration-200 max-w-md ring-1 ring-[#1b3631]/20">
                              <div className="relative flex-1">
                                <User
                                  size={14}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                  type="text"
                                  placeholder={
                                    UI_TEXT.GUEST_VERIFICATION_CHILD_NAME_PLACEHOLDER
                                  }
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-[#1b3631]/20 text-gray-900 placeholder:text-gray-400"
                                  value={activeMinorForm.name}
                                  onChange={(e) =>
                                    handleMinorInputChange(
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  autoFocus
                                />
                              </div>
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  placeholder={
                                    UI_TEXT.GUEST_VERIFICATION_AGE_PLACEHOLDER
                                  }
                                  className="w-full px-3 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-[#1b3631]/20 text-gray-900 text-center"
                                  value={activeMinorForm.age}
                                  onChange={(e) =>
                                    handleMinorInputChange(
                                      "age",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  max="17"
                                />
                              </div>
                              <button
                                onClick={saveMinor}
                                className="p-2 bg-[#1b3631] text-white rounded-lg hover:bg-[#144032] transition-colors shadow-sm"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={closeMinorForm}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        }

                        if (!limitReached && allGuestsFullyVerified) {
                          return (
                            <button
                              onClick={() => openAddMinorForm(index)}
                              className="text-sm text-[#1b3631] hover:text-[#144032] font-medium flex items-center gap-2 mt-2 px-1 py-1 rounded hover:bg-blue-50/50 transition-colors w-fit"
                            >
                              <div className="bg-blue-100 text-[#1b3631] rounded-full p-0.5">
                                <Plus size={12} />
                              </div>
                              {UI_TEXT.GUEST_VERIFICATION_ADD_MINOR}
                            </button>
                          );
                        }

                        return null;
                      })()}
                    </td>

                    {guest.isVerified && (
                      <>
                        <td className="px-6 py-6" valign="top">
                          {guest.aadhaarStatus ===
                            VERIFICATION_STATUS.VERIFIED ? (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-fit border border-green-100">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                ID Verified
                              </span>
                            </div>
                          ) : manualVerificationGuestIndex === index ? (
                            <div className="space-y-1">
                              {/* <span className="text-orange-500 text-sm font-medium">
                                Timeout
                              </span> */}
                              <button
                                onClick={() => handleManualVerification(index)}
                                className="text-[#1b3631] hover:text-[#144032] text-xs font-medium pl-1 cursor-pointer"
                              >
                                Check Status Manually
                              </button>
                            </div>
                          ) : guest.aadhaarStatus ===
                            VERIFICATION_STATUS.PROCESSING ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
                                <Clock className="w-4 h-4 animate-spin-slow" />
                                <span className="text-sm font-medium">
                                  {UI_TEXT.GUEST_VERIFICATION_VERIFYING}
                                </span>
                              </div>
                              <button
                                onClick={() => handleManualVerification(index)}
                                disabled={timeRemaining[index] > 0}
                                className={`text-xs font-medium pl-1 transition-colors ${timeRemaining[index] > 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-[#1b3631] hover:text-[#144032] cursor-pointer"
                                  }`}
                              >
                                {timeRemaining[index] > 0
                                  ? `Check Status (${Math.floor(timeRemaining[index] / 60)}:${String(timeRemaining[index] % 60).padStart(2, '0')})`
                                  : UI_TEXT.GUEST_VERIFICATION_CHECK_STATUS}
                              </button>
                            </div>
                          ) : guest.aadhaarStatus ===
                            VERIFICATION_STATUS.PENDING &&
                            retryAttempts[index] > 0 &&
                            retryAttempts[index] <
                            GUEST_VERIFICATION.MAX_RETRY_ATTEMPTS ? (
                            <div className="space-y-1">
                              <span className="text-red-500 text-sm font-medium">
                                Verification Failed
                              </span>
                              <button
                                onClick={() => handleRetryVerification(index)}
                                className="text-[#1b3631] hover:text-[#144032] text-xs font-medium pl-1 cursor-pointer"
                              >
                                Retry Verification
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        <td className="px-6 py-6" valign="top">
                          {guest.faceStatus ===
                            VERIFICATION_STATUS.PROCESSING ? (
                            <div className="space-y-1">
                              {manualVerificationGuestIndex === index ? (
                                <>
                                  {/* <span className="text-orange-500 text-sm font-medium">
                                    Timeout
                                  </span> */}
                                  <button
                                    onClick={() => handleManualFaceMatchCheck(index)}
                                    className="text-[#1b3631] hover:text-[#144032] text-xs font-medium pl-1 cursor-pointer block"
                                  >
                                    Check Status Manually
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
                                    <Clock className="w-4 h-4 animate-spin-slow" />
                                    <span className="text-sm font-medium">
                                      {UI_TEXT.GUEST_VERIFICATION_VERIFYING}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleManualFaceMatchCheck(index)}
                                    disabled={timeRemaining[index] > 0}
                                    className={`text-xs font-medium pl-1 transition-colors ${timeRemaining[index] > 0
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-[#1b3631] hover:text-[#144032] cursor-pointer"
                                      }`}
                                  >
                                    {timeRemaining[index] > 0
                                      ? `Check Status (${Math.floor(timeRemaining[index] / 60)}:${String(timeRemaining[index] % 60).padStart(2, '0')})`
                                      : UI_TEXT.GUEST_VERIFICATION_CHECK_STATUS}
                                  </button>
                                </>
                              )}
                            </div>
                          ) : guest.faceStatus ===
                            VERIFICATION_STATUS.VERIFIED ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-fit border border-green-100">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {UI_TEXT.GUEST_VERIFICATION_VERIFIED}
                                </span>
                              </div>
                              {guest.faceMatchScore && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Score: {guest.faceMatchScore}%
                                </div>
                              )}
                            </div>
                          ) : guest.aadhaarStatus ===
                            VERIFICATION_STATUS.VERIFIED ? (
                            <button
                              onClick={() => handleInitiateFaceMatch(index)}
                              className="px-3 py-1.5 bg-[#1b3631] text-white rounded-lg hover:bg-[#144032] transition-colors text-xs font-medium shadow-sm"
                            >
                              Initiate Face Match
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        <td className="px-6 py-6 text-gray-500" valign="top">
                          {guest.timestamp || "-"}
                        </td>

                        {hasAnyVerified && (
                          <td className="px-6 py-6" valign="top">
                            {guest.aadhaarStatus === "verified" &&
                              guest.faceStatus === "verified" ? (
                              <button
                                onClick={() => {
                                  setSelectedGuest(guest);
                                  setShowGuestModal(true);
                                }}
                                className="text-[#1b3631] hover:text-[#144032] text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                {UI_TEXT.GUEST_VERIFICATION_VIEW_DETAILS}
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex gap-4 justify-end">
            <button
              onClick={handleCancelVerification}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
            >
              {UI_TEXT.GUEST_VERIFICATION_CANCEL}
            </button>
            <button
              onClick={handleConfirmCheckIn}
              disabled={!allGuestsFullyVerified || isConfirmingCheckin}
              className={`px-8 py-2.5 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center min-w-35 cursor-pointer
                  ${allGuestsFullyVerified
                  ? "bg-[#1b3631] hover:bg-[#144032] hover:shadow-lg hover:shadow-[#1b3631]/20 transform hover:-translate-y-0.5"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
                }`}
            >
              {isConfirmingCheckin ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {UI_TEXT.GUEST_VERIFICATION_VERIFYING}
                </>
              ) : (
                UI_TEXT.GUEST_VERIFICATION_CONFIRM_CHECKIN
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuuccessModal
        show={showSuccessModal}
        handleClose={() => setShowSuccessModal(false)}
        message={modalMessage}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal
        show={showGuestModal}
        handleClose={() => setShowGuestModal(false)}
        guest={selectedGuest}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancelVerification}
        title="Cancel Verification"
        message={UI_TEXT.GUEST_VERIFICATION_CANCEL_CONFIRM}
        confirmText="Yes, Cancel"
        cancelText="No, Keep Verifying"
        isDanger={true}
      />

      {/* Force Verify Confirmation Modal */}
      <ConfirmationModal
        isOpen={showForceVerifyModal}
        onClose={() => setShowForceVerifyModal(false)}
        onConfirm={confirmForcedVerification}
        title="Verify Identity Manually?"
        message="The system could not verify this guest's identity automatically. Do you want to manually mark them as ID Verified and proceed?"
        confirmText="Yes, Verify Manually"
        cancelText="Cancel"
      />
    </div >
  );
}
