import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { GUEST_VERIFICATION, TENANT_ID, PROPERTY_ID } from "../constants/config.js";
import { verificationService } from "../services/verificationService";
import dayjs from "dayjs";
import {
  generateWalkInBookingId,
  shouldRequireBookingId,
} from "../utility/checkInUtils";

import { OTA_OPTIONS } from "../constants/ui";

const Checkin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ota: "Walk-In",
    bookingId: "",
    countryCode: "91",
    phoneNumber: "",
    adults: 1,
    children: 0,
  });

  const [showBookingId, setShowBookingId] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processedBookingIds, setProcessedBookingIds] = useState(new Set());
  const [errors, setErrors] = useState({});

  const otaOptions = Object.values(OTA_OPTIONS);

  // Check if button should be disabled
  const isButtonDisabled = () => {
    return isVerifying || formData.adults === 0;
  };

  useEffect(() => {
    const storedIds =
      JSON.parse(localStorage.getItem("processedBookingIds")) || [];
    setProcessedBookingIds(new Set(storedIds));
  }, []);

  const addProcessedBookingId = (bookingId) => {
    setProcessedBookingIds((prev) => {
      const updatedSet = new Set([...prev, bookingId]);
      localStorage.setItem(
        "processedBookingIds",
        JSON.stringify([...updatedSet]),
      );
      return updatedSet;
    });
  };

  const getCurrentDate = () => {
    return dayjs().format("DD MMM YY");
  };

  const handleOTASelection = (e) => {
    const selectedOTA = e.target.value;
    setFormData((prev) => ({
      ...prev,
      ota: selectedOTA,
      bookingId: selectedOTA === "Walk-In" ? "" : prev.bookingId,
    }));
    setShowBookingId(selectedOTA !== "Walk-In");
  };

  const handlePhoneChange = (value, country) => {
    const dialCode = country?.dialCode || "";
    const phoneNumber = value.slice(dialCode.length);

    setFormData((prev) => ({
      ...prev,
      countryCode: dialCode,
      phoneNumber,
    }));

    setErrors((prev) => ({
      ...prev,
      phoneNumber: "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "adults" || name === "children") {
      const numValue = parseInt(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCancel = () => {
    setFormData({
      ota: "Walk-In",
      bookingId: "",
      countryCode: "91",
      phoneNumber: "",
      adults: 1,
      children: 0,
    });
    setShowBookingId(false);
    setErrors({});
  };

  const handleReview = async () => {
    setErrors({});
    let newErrors = {};

    if (isVerifying) {
      console.log("Already verifying, please wait");
      return;
    }

    // Check if adults is 0 (though button should already be disabled)
    if (formData.adults === 0) {
      newErrors.adults = "Please enter at least one adult";
    }

    if (!formData.ota) {
      newErrors.ota = "Please select an OTA platform";
    }

    if (
      showBookingId &&
      !shouldRequireBookingId(formData.bookingId, formData.ota)
    ) {
      newErrors.bookingId = "Please enter booking ID";
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.adults || parseInt(formData.adults) < 1) {
      newErrors.adults = "Please enter at least one adult";
    }

    const childrenValue = parseInt(formData.children) || 0;
    if (childrenValue < 0) {
      newErrors.children = "Number of minors cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Determine booking ID based on OTA selection
    let bookingIdToUse = formData.bookingId;
    let updatedFormData = { ...formData };

    if (formData.ota === "Walk-In") {
      try {
        bookingIdToUse = generateWalkInBookingId(TENANT_ID, PROPERTY_ID);
        console.log("Generated Walk-In Booking ID:", bookingIdToUse);

        updatedFormData = {
          ...formData,
          bookingId: bookingIdToUse,
        };
        setFormData(updatedFormData);
      } catch (error) {
        console.error("Walk-In ID generation error:", error);
        newErrors.general = "Failed to generate booking ID";
        setErrors(newErrors);
        return;
      }
    } else {
      bookingIdToUse = formData.bookingId;
    }

    // Check if this booking ID has already been processed
    if (processedBookingIds.has(bookingIdToUse)) {
      console.log(`Booking ID ${bookingIdToUse} already processed. Skipping.`);
      newErrors.general = "This booking has already been verified";
      setErrors(newErrors);
      return;
    }

    try {
      setIsVerifying(true);
      console.log(`Calling API with Booking ID: ${bookingIdToUse}`);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timed out. Please try again.")),
          10000,
        ),
      );

      const verificationPayload = {
        bookingId: bookingIdToUse,
        ota: formData.ota,
        phoneCountryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
        adultsCount: parseInt(formData.adults),
        minorsCount: parseInt(formData.children) || 0,
      };

      const response = await Promise.race([
        verificationService.beginVerification(verificationPayload),
        timeoutPromise,
      ]);

      if (!response || response.error) {
        throw new Error(
          response?.error?.message || "Verification service error",
        );
      }

      addProcessedBookingId(bookingIdToUse);
      console.log("Verification successful:", response);
      console.log("Form Data submitted:", {
        ...updatedFormData,
        bookingId: bookingIdToUse,
      });

      navigate("/guest-verification", {
        state: {
          formData: {
            ...updatedFormData,
            bookingId: bookingIdToUse,
            countryCode: formData.countryCode,
            phoneNumber: formData.phoneNumber,
            adults: parseInt(formData.adults),
            children: parseInt(formData.children),
          },
        },
      });
    } catch (error) {
      console.error("Verification failed:", error.message);

      const userMessage = error.message.includes("timeout")
        ? "Request took too long. Please check connection and try again."
        : error.message.includes("network") || error.message.includes("Network")
          ? "Network error. Please check internet connection."
          : `Verification failed: ${error.message}`;

      setErrors(userMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Main Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Card Header */}
        <div className="bg-brand px-8 py-6 text-white">
          <h2 className="text-2xl font-semibold mb-2">Guest Verification</h2>
          <p className="opacity-95">
            Enter booking details to begin verification
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {/* Verification Date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Verification Date
            </label>
            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              {getCurrentDate()}
            </div>
          </div>

          {/* OTA Platform */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Booking Source
            </label>
            <div className="relative">
              <select
                name="ota"
                value={formData.ota}
                onChange={handleOTASelection}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none"
                disabled={isVerifying}
              >
                <option value="">Select OTA platform</option>
                {otaOptions.map((ota) => (
                  <option key={ota} value={ota}>
                    {ota}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                ▼
              </div>
            </div>
            {errors.ota && (
              <p className="text-red-500 text-sm mt-1">{errors.ota}</p>
            )}
          </div>

          {/* Booking ID */}
          {showBookingId && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Booking ID *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  #
                </span>
                <input
                  type="text"
                  name="bookingId"
                  placeholder="Enter booking ID"
                  value={formData.bookingId}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg"
                  disabled={isVerifying || formData.ota === "Walk-In"}
                  readOnly={formData.ota === "Walk-In"}
                />
              </div>
              {errors.bookingId && (
                <p className="text-red-500 text-sm mt-1">{errors.bookingId}</p>
              )}
            </div>
          )}

          {/* Phone Number */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Primary Guest Phone Number *
            </label>
            <div className="w-full">
              <PhoneInput
                country={GUEST_VERIFICATION.DEFAULT_COUNTRY_CODE}
                value={formData.countryCode + formData.phoneNumber}
                onChange={handlePhoneChange}
                inputClass="!w-full !h-12 !text-base !pl-12 !border-gray-300 !rounded-lg"
                buttonClass="!border-gray-300 !rounded-l-lg !bg-white hover:!bg-gray-50"
                containerClass="!w-full"
                dropdownClass="!shadow-lg !rounded-lg !border-gray-200"
                searchClass="!p-2 !border-gray-200"
                enableSearch={true}
                placeholder="Enter phone number"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Guest Count */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Adults *
                </label>
                <input
                  type="number"
                  name="adults"
                  placeholder="Enter number"
                  min="0"
                  value={formData.adults}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                  disabled={isVerifying}
                />
                <p className="text-sm text-gray-500 mt-1">Age 18+</p>
                {errors.adults && (
                  <p className="text-red-500 text-sm mt-1">{errors.adults}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Minors
                </label>
                <input
                  type="number"
                  name="children"
                  placeholder="Enter number"
                  min="0"
                  value={formData.children}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  disabled={isVerifying}
                />
                <p className="text-sm text-gray-500 mt-1">Under 18 years</p>
                {errors.children && (
                  <p className="text-red-500 text-sm mt-1">{errors.children}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border! border-gray-300 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={isButtonDisabled()} // Updated this line
              className={`flex-1 px-6 py-3 rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 ${
                isButtonDisabled()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-brand! text-white hover:bg-brand/90"
              }`}
            >
              {isVerifying ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Verifying...
                </>
              ) : (
                "Start Verification"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkin;
