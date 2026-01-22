// Application Configuration Constants

// Tenant ID and Property ID will be extracted from JWT token
// These constants are no longer hardcoded
export const TENANT_ID = null; // Will be obtained from token
export const PROPERTY_ID = null; // Will be obtained from token

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: "HotelUser/login",
  BEGIN_VERIFICATION: "booking/begin_verification",
  ENSURE_VERIFICATION: "HotelGuestRead/verification/ensure",
  GET_GUEST_BY_ID: "HotelGuestRead/guest_by_id",
  INITIATE_FACE_MATCH: "booking/face-match/initiate",
  FACE_MATCH_STATUS: "HotelBookingRead/face-match/status",
  END_VERIFICATION: "booking/end_verification",
  ALL_BOOKINGS: "HotelBookingRead/all_booking",
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: "onepass_auth",
  ACCESS_TOKEN: "onepass_access_token",
  REFRESH_TOKEN: "onepass_refresh_token",
  TOKEN_EXPIRES_AT: "onepass_token_expires_at",
  USER_DATA: "onepass_user_data", // New key to store decoded token data
};

// Verification Status Constants
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  VERIFIED: "verified",
};

// Guest Verification Constants
export const GUEST_VERIFICATION = {
  DEFAULT_COUNTRY_CODE: "in",
  COUNTRY_CODE_NUMERIC: "91",
  TEST_PHONE_NUMBER: "9104622293",
  AADHAAR_PROCESSING_DELAY: 5000,
  FACE_PROCESSING_DELAY: 7000,
  SUCCESS_MODAL_DELAY: 1500,
  POLL_INITIAL_DELAY: 30000,
  POLL_INTERVAL: 10000,
  MAX_RETRY_ATTEMPTS: 2,
  ID_VERIFICATION_TIMEOUT: 120000,
  FACE_VERIFICATION_TIMEOUT: 30000,
  MANUAL_CHECK_COOLDOWN: 30000,
};