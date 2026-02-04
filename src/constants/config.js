// constants/config.js

// Application Configuration Constants
export const TENANT_ID = null;
export const PROPERTY_ID = null;

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: "HotelUser/login",
  BOOKING_GUEST_DETAILS: "HotelGuestRead/booking_guest_details",
  GUEST_AADHAAR_IMAGE: "HotelGuestRead/aadhar/image",
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: "onepass_auth",
  ACCESS_TOKEN: "onepass_access_token",
  REFRESH_TOKEN: "onepass_refresh_token",
  TOKEN_EXPIRES_AT: "onepass_token_expires_at",
  USER_DATA: "onepass_user_data",
};

// Gender Mapping (API code to UI label)
export const GENDER_MAP = {
  M: "Male",
  F: "Female",
  O: "Other",
};
