// Application Configuration Constants

// Tenant ID - Hardcoded for now
export const TENANT_ID = 1;

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: "HotelUser/login",
  BEGIN_VERIFICATION: "booking/begin_verification",
  ENSURE_VERIFICATION: "HotelGuestRead/verification/ensure",
  GET_GUEST_BY_ID: "HotelGuestRead/guest_by_id",
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: "onepass_auth",
  ACCESS_TOKEN: "onepass_access_token",
  REFRESH_TOKEN: "onepass_refresh_token",
  TOKEN_EXPIRES_AT: "onepass_token_expires_at",
};

// Verification Status Constants
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  VERIFIED: "verified",
};

// Guest Verification Constants
export const GUEST_VERIFICATION = {
  DEFAULT_COUNTRY_CODE: "in", // ISO country code for India
  COUNTRY_CODE_NUMERIC: "91", // Numeric country code for phone number processing
  TEST_PHONE_NUMBER: "9104622293",
  AADHAAR_PROCESSING_DELAY: 5000, // 5 seconds
  FACE_PROCESSING_DELAY: 7000, // 7 seconds
  SUCCESS_MODAL_DELAY: 1500, // 1.5 seconds
  POLL_INITIAL_DELAY: 15000, // 30 seconds before starting poll
  POLL_INTERVAL: 15000, // 15 seconds between polls
  MAX_RETRY_ATTEMPTS: 2, // Maximum retry attempts for ID verification
};
