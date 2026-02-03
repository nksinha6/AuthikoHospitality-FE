// utility/guestDataTransformer.js

import dayjs from "dayjs";

// Verification Status Mapping (API numeric to UI label)
export const VERIFICATION_STATUS_MAP = {
  0: "Pending",
  1: "Verified",
  2: "Failed",
  3: "Processing",
};

// Verification Status String Mapping (lowercase to proper case)
export const VERIFICATION_STATUS_STRING_MAP = {
  verified: "Verified",
  pending: "Pending",
  failed: "Failed",
  processing: "Processing",
  in_progress: "Processing",
  inprogress: "Processing",
  success: "Verified",
  error: "Failed",
  rejected: "Failed",
};

// Gender Mapping (API code to UI label)
export const GENDER_MAP = {
  M: "Male",
  F: "Female",
  O: "Other",
  Male: "Male",
  Female: "Female",
  Other: "Other",
  m: "Male",
  f: "Female",
  o: "Other",
  male: "Male",
  female: "Female",
  other: "Other",
};

/**
 * Parse the splitAddress JSON string to extract address components
 * @param {string} splitAddressStr - JSON string containing address details
 * @returns {Object} Parsed address object
 */
export const parseAddress = (splitAddressStr) => {
  try {
    if (!splitAddressStr) {
      return {
        house: "",
        street: "",
        landmark: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
        fullAddress: "N/A",
      };
    }

    const addressObj =
      typeof splitAddressStr === "string"
        ? JSON.parse(splitAddressStr)
        : splitAddressStr;

    // Build full address string
    const addressParts = [
      addressObj.House,
      addressObj.Street,
      addressObj.Landmark,
      addressObj.Vtc || addressObj.Po,
      addressObj.Subdist,
      addressObj.Dist,
      addressObj.State,
      addressObj.Pincode,
    ].filter(Boolean);

    return {
      house: addressObj.House || "",
      street: addressObj.Street || "",
      landmark: addressObj.Landmark || "",
      city: addressObj.Dist || addressObj.Vtc || "",
      state: addressObj.State || "",
      pinCode: addressObj.Pincode || "",
      country: addressObj.Country || "India",
      fullAddress: addressParts.join(", ") || "N/A",
    };
  } catch (error) {
    console.error("Error parsing address:", error);
    return {
      house: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      fullAddress: "N/A",
    };
  }
};

/**
 * Split full name into first name and last name
 * @param {string} fullName - Full name string
 * @returns {Object} Object with firstName and lastName
 */
export const splitName = (fullName) => {
  if (!fullName) {
    return { firstName: "N/A", lastName: "" };
  }

  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: "" };
  }

  if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  }

  // For names with more than 2 parts, first word is firstName, rest is lastName
  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
  };
};

/**
 * Format date of birth from API format
 * @param {string} dateStr - Date string from API
 * @returns {string} Formatted date string
 */
export const formatDateOfBirth = (dateStr) => {
  if (!dateStr) return "N/A";
  const formatted = dayjs(dateStr).format("DD MMM YYYY");
  return formatted === "Invalid Date" ? "N/A" : formatted;
};

/**
 * Format created at timestamp
 * @param {string} timestamp - Timestamp from API
 * @returns {Object} Object with formatted date and time
 */
export const formatCreatedAt = (timestamp) => {
  if (!timestamp) {
    return { date: "N/A", time: "N/A", formatted: "N/A" };
  }

  const dateObj = dayjs(timestamp);

  if (!dateObj.isValid()) {
    return { date: "N/A", time: "N/A", formatted: "N/A" };
  }

  return {
    date: dateObj.format("YYYY-MM-DD"),
    time: dateObj.format("hh:mm A"),
    formatted: dateObj.format("DD MMM YYYY, hh:mm A"),
  };
};

/**
 * Get verification status label from numeric or string status
 * @param {number|string} status - Numeric or string status from API
 * @returns {string} Human-readable status (properly capitalized)
 */
export const getVerificationStatusLabel = (status) => {
  // If status is null or undefined, default to Pending
  if (status === null || status === undefined) {
    return "Pending";
  }

  // If status is a number, use numeric mapping
  if (typeof status === "number") {
    return VERIFICATION_STATUS_MAP[status] || "Unknown";
  }

  // If status is a string
  if (typeof status === "string") {
    // Trim and convert to lowercase for comparison
    const normalizedStatus = status.toLowerCase().trim();

    // Check in string mapping (handles lowercase like "verified", "pending", etc.)
    if (VERIFICATION_STATUS_STRING_MAP[normalizedStatus]) {
      return VERIFICATION_STATUS_STRING_MAP[normalizedStatus];
    }

    // Try to parse as number (e.g., "1" -> 1)
    const numStatus = parseInt(status, 10);
    if (!isNaN(numStatus) && VERIFICATION_STATUS_MAP[numStatus]) {
      return VERIFICATION_STATUS_MAP[numStatus];
    }

    // If it's already properly capitalized and valid, return as-is
    const validStatuses = ["Verified", "Pending", "Failed", "Processing"];
    if (validStatuses.includes(status)) {
      return status;
    }

    // Return Unknown for unrecognized statuses
    return "Unknown";
  }

  return "Unknown";
};

/**
 * Get gender label from code
 * @param {string} genderCode - Gender code from API (M/F/O or Male/Female/Other)
 * @returns {string} Human-readable gender
 */
export const getGenderLabel = (genderCode) => {
  if (!genderCode) return "N/A";
  return GENDER_MAP[genderCode] || genderCode || "N/A";
};

/**
 * Transform API response to UI-friendly format
 * @param {Object} apiGuest - Guest object from API
 * @returns {Object} Transformed guest object for UI
 */
export const transformGuestData = (apiGuest) => {
  if (!apiGuest) {
    console.warn("transformGuestData received null or undefined guest");
    return null;
  }

  const { firstName, lastName } = splitName(apiGuest.fullName);
  const address = parseAddress(apiGuest.splitAddress);
  const createdAt = formatCreatedAt(apiGuest.createdAt);

  // Get verification status - handle numeric, lowercase string, and capitalized string
  const verificationStatus = getVerificationStatusLabel(apiGuest.verificationStatus);

  // Debug logging
  console.log("Transform Guest Status:", {
    original: apiGuest.verificationStatus,
    originalType: typeof apiGuest.verificationStatus,
    transformed: verificationStatus,
    bookingId: apiGuest.bookingId,
  });

  return {
    // Identity Details
    aadhaarNumber: apiGuest.uid || "",
    firstName,
    lastName,
    fullName: apiGuest.fullName || "-",
    dateOfBirth: formatDateOfBirth(apiGuest.dateOfBirth),
    gender: getGenderLabel(apiGuest.gender),
    nationality: apiGuest.nationality || "Indian",

    // Contact Information
    phone: apiGuest.phoneNumber
      ? `${apiGuest.phoneCountryCode || "91"}${apiGuest.phoneNumber}`
      : "",
    phoneNumber: apiGuest.phoneNumber || "",
    phoneCountryCode: apiGuest.phoneCountryCode || "91",
    email: apiGuest.email || "",

    // Address
    address: address.fullAddress,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    house: address.house,
    street: address.street,
    landmark: address.landmark,

    // Booking Details
    bookingId: apiGuest.bookingId || "",
    date: createdAt.date,
    time: createdAt.time,
    checkInDateTime: createdAt.formatted,
    bookingSource: apiGuest.ota || "WALK-IN",

    // Verification Details
    verificationStatus: verificationStatus,
    verificationStatusCode: apiGuest.verificationStatus,
    referenceId: apiGuest.referenceId || "",
    verificationId: apiGuest.verificationId || "",
    digiLockerReferenceId: apiGuest.referenceId || "-",
    aadhaarVerificationTimestamp: createdAt.formatted,

    // Metadata
    createdAt: apiGuest.createdAt,
    lastUpdatedTimestamp: createdAt.formatted,
    deskId: apiGuest.deskId || "-",
    receptionUserId: apiGuest.receptionUserId || "-",

    // Original data for reference
    _original: apiGuest,
  };
};

/**
 * Transform array of guests from API
 * @param {Array|Object} apiGuests - Array of guest objects from API or single guest
 * @returns {Array} Transformed array of guest objects
 */
export const transformGuestsArray = (apiGuests) => {
  // Handle null or undefined
  if (!apiGuests) {
    console.warn("transformGuestsArray received null or undefined");
    return [];
  }

  // If single object, wrap in array
  if (!Array.isArray(apiGuests)) {
    const transformed = transformGuestData(apiGuests);
    return transformed ? [transformed] : [];
  }

  // Filter out any null transformations
  return apiGuests
    .map((guest) => transformGuestData(guest))
    .filter((guest) => guest !== null);
};

export default {
  parseAddress,
  splitName,
  formatDateOfBirth,
  formatCreatedAt,
  getVerificationStatusLabel,
  getGenderLabel,
  transformGuestData,
  transformGuestsArray,
  VERIFICATION_STATUS_MAP,
  VERIFICATION_STATUS_STRING_MAP,
  GENDER_MAP,
};