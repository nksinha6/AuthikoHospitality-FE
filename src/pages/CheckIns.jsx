import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { getCurrentDate } from "../utility/dateUtils.js";
import { GUEST_VERIFICATION } from "../constants/config.js";

const Checkin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ota: "",
    bookingId: "",
    countryCode: "91", // Default numeric code
    phoneNumber: "",
    adults: 0,
    children: 0,
  });

  const [showBookingId, setShowBookingId] = useState(true);
  const [errors, setErrors] = useState({});

  const otaOptions = [
    "Booking.com",
    "Airbnb",
    "Expedia",
    "Hotels.com",
    "Agoda",
    "Vrbo",
    "Tripadvisor",
    "MakeMyTrip",
    "Goibibo",
    "Walk-In",
  ];

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
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value.slice(country.dialCode.length),
      countryCode: country.dialCode,
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
      ota: "",
      bookingId: "",
      countryCode: "91",
      phoneNumber: "",
      adults: 0,
      children: 0,
    });
    setShowBookingId(true);
    setErrors({});
  };

  const handleReview = () => {
    setErrors({});
    let newErrors = {};

    if (!formData.ota) {
      newErrors.ota = "Please select an OTA platform";
    }
    if (showBookingId && !formData.bookingId.trim()) {
      newErrors.bookingId = "Please enter booking ID";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Please enter phone number";
    }
    if (!formData.adults || formData.adults < 1) {
      newErrors.adults = "Please enter at least one adult";
    }
    if (formData.children < 0) {
      newErrors.children = "Number of minors cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for GuestVerification
    const guestData = {
      date: getCurrentDate(),
      firstName: formData.ota === "Walk-In" ? "Guest" : "OTA Guest",
      surname: "",
      phone: formData.countryCode + formData.phoneNumber,
      adults: parseInt(formData.adults) || 0,
      minors: parseInt(formData.children) || 0,
      totalGuests: (parseInt(formData.adults) || 0) + (parseInt(formData.children) || 0),
      bookingId: formData.bookingId || `WALKIN-${Date.now().toString().slice(-6)}`,
      ota: formData.ota,
      primaryGuest: {
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber
      }
    };

    // Navigate to GuestVerification with form data
    navigate("/guest-verification", { state: { formData: guestData } });
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
            {errors.ota && <p className="text-red-500 text-sm mt-1">{errors.ota}</p>}
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
                />
              </div>
              {errors.bookingId && <p className="text-red-500 text-sm mt-1">{errors.bookingId}</p>}
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
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
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
                  min="1"
                  value={formData.adults}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Age 18+</p>
                {errors.adults && <p className="text-red-500 text-sm mt-1">{errors.adults}</p>}
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
                />
                <p className="text-sm text-gray-500 mt-1">Under 18 years</p>
                {errors.children && <p className="text-red-500 text-sm mt-1">{errors.children}</p>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border! border-gray-300 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              className="flex-1 px-6 py-3 bg-brand! text-white rounded-lg font-semibold hover:bg-brand/90 cursor-pointer"
            >
              Start Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkin;
