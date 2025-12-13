import React, { useState } from "react";

const OTAVerificationForm = () => {
  const [formData, setFormData] = useState({
    ota: "",
    bookingId: "",
    countryCode: "+91",
    phoneNumber: "",
    adults: "",
    children: "",
  });

  const [showBookingId, setShowBookingId] = useState(true);

  const countryCodes = [
    {
      code: "+91",
      country: "India",
      flag: "🇮🇳",
      pattern: /^(\d{5})(\d{5})$/,
      format: "$1-$2",
    },
    {
      code: "+1",
      country: "US/Canada",
      flag: "🇺🇸",
      pattern: /^(\d{3})(\d{3})(\d{4})$/,
      format: "($1) $2-$3",
    },
    {
      code: "+44",
      country: "UK",
      flag: "🇬🇧",
      pattern: /^(\d{4})(\d{6})$/,
      format: "$1 $2",
    },
    {
      code: "+61",
      country: "Australia",
      flag: "🇦🇺",
      pattern: /^(\d{4})(\d{3})(\d{3})$/,
      format: "$1 $2 $3",
    },
    {
      code: "+971",
      country: "UAE",
      flag: "🇦🇪",
      pattern: /^(\d{2})(\d{3})(\d{4})$/,
      format: "$1 $2 $3",
    },
    {
      code: "+65",
      country: "Singapore",
      flag: "🇸🇬",
      pattern: /^(\d{4})(\d{4})$/,
      format: "$1 $2",
    },
  ];

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

  const getCurrentDate = () => {
    const today = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    return today.toLocaleDateString("en-US", options);
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

  const formatPhoneNumber = (value, countryCode) => {
    if (!value) return "";
    const country = countryCodes.find((c) => c.code === countryCode);
    if (!country) return value;
    const digits = value.replace(/\D/g, "");
    if (country.pattern) {
      const match = digits.match(country.pattern);
      if (match) {
        return country.format.replace(/\$(\d+)/g, (_, index) => match[index]);
      }
    }
    return digits;
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value, formData.countryCode);
    setFormData((prev) => ({ ...prev, phoneNumber: formattedValue }));
  };

  const handleCountryCodeChange = (e) => {
    const newCountryCode = e.target.value;
    const formattedNumber = formatPhoneNumber(
      formData.phoneNumber.replace(/\D/g, ""),
      newCountryCode
    );
    setFormData((prev) => ({
      ...prev,
      countryCode: newCountryCode,
      phoneNumber: formattedNumber,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "adults" || name === "children") {
      const numValue = parseInt(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numValue < 0 ? "" : value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCancel = () => {
    setFormData({
      ota: "",
      bookingId: "",
      countryCode: "+91",
      phoneNumber: "",
      adults: "",
      children: "",
    });
    setShowBookingId(true);
  };

  const handleReview = () => {
    if (!formData.ota) {
      alert("Please select an OTA platform");
      return;
    }
    if (showBookingId && !formData.bookingId.trim()) {
      alert("Please enter booking ID");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      alert("Please enter phone number");
      return;
    }
    if (!formData.adults || parseInt(formData.adults) < 1) {
      alert("Please enter at least one adult");
      return;
    }
    const childrenValue = parseInt(formData.children) || 0;
    if (childrenValue < 0) {
      alert("Number of minors cannot be negative");
      return;
    }
    console.log("Review booking information:", formData);
  };

  const getCurrentFlag = () => {
    const country = countryCodes.find((c) => c.code === formData.countryCode);
    return country ? country.flag : "🇺🇸";
  };

  return (
    <div className="min-h-screen p-6">
      {/* Main Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#1b3631] px-8 py-6 text-white">
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
            </div>
          )}

          {/* Phone Number */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Primary Guest Phone Number *
            </label>
            <div className="flex gap-3">
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                  {getCurrentFlag()}
                </span>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg appearance-none"
                >
                  {countryCodes.map(({ code, country, flag }) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                  ▼
                </div>
              </div>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handlePhoneNumberChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
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
              className="flex-1 px-6 py-3 bg-[#1b3631]! text-white rounded-lg font-semibold hover:bg-[#1b3631]/90 cursor-pointer"
            >
              Start Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTAVerificationForm;
