// constants/config.js

// Application Configuration Constants
export const TENANT_ID = null;
export const PROPERTY_ID = null;

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
  BOOKING_GUEST_DETAILS: "HotelGuestRead/booking_guest_details",
  GUEST_AADHAAR_IMAGE: "HotelGuestRead/selfie",
  PROPERTY_BY_ID: "/HotelPropertyRead/property_by_id",
  TENANT_BY_ID: "/HotelPropertyRead/tenant_by_id",
  DIGILOCKER_VERIFICATION_IDS: "HotelGuestRead/digilocker_verification_ids",
  GET_AADHAAR_DATA: "/digilocker/aadhaar",
  PERSIST_GUEST_STATUS: "guest/persist/status",
  PERSIST_AADHAAR_UPDATE: "guest/persist/aadhaar/update",
  PERSIST_IMAGE: "/guest/persist/selfie",
  FACE_MATCH: "/faceverification/match",
  PERSIST_SELFIE: "/guest/persist/selfie",
  CONTRACTOR_MATCH: "/contractor/match",
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: "onepass_auth",
  ACCESS_TOKEN: "onepass_access_token",
  REFRESH_TOKEN: "onepass_refresh_token",
  TOKEN_EXPIRES_AT: "onepass_token_expires_at",
  USER_DATA: "onepass_user_data",
};

// Verification Status Constants
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  VERIFIED: "verified",
};

// Verification Status Mapping (API numeric to UI label)
export const VERIFICATION_STATUS_MAP = {
  0: "pending",
  1: "verified",
  2: "failed",
  3: "processing",
};

// Gender Mapping (API code to UI label)
export const GENDER_MAP = {
  M: "Male",
  F: "Female",
  O: "Other",
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
  POLL_INTERVAL: 5000,
  MAX_RETRY_ATTEMPTS: 2,
  ID_VERIFICATION_TIMEOUT: 120000,
  FACE_VERIFICATION_TIMEOUT: 30000,
  MANUAL_CHECK_COOLDOWN: 30000,
};
