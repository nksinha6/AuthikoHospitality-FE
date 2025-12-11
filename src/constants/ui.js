// UI Text Constants
export const UI_TEXT = {
  // App
  APP_NAME: "OnePass",
  NAV_SECTION_MAIN: "Main",

  // Navigation
  NAV_DASHBOARD: "Dashboard",
  NAV_CHECK_INS: "Walk-in Check-ins", // "Check-ins"
  NAV_ALL_BOOKINGS: "All Bookings",
  NAV_TODAYS_BOOKINGS: "Today's Bookings",
  BUTTON_LOGOUT: "Logout",

  // Login
  LOGIN_TITLE: "Sign in",
  LOGIN_SUBTITLE: "Enter your user ID and password to continue",
  LOGIN_EMAIL_LABEL: "User ID",
  LOGIN_EMAIL_PLACEHOLDER: "abc@xyz.com",
  LOGIN_PASSWORD_LABEL: "Password",
  LOGIN_PASSWORD_PLACEHOLDER: "••••••••",
  LOGIN_BUTTON: "Sign in",
  LOGIN_BUTTON_LOADING: "Signing in…",

  // Dashboard
  DASHBOARD_TITLE: "Dashboard",
  DASHBOARD_SUBTITLE: "Overview of your OnePass operations",
  DASHBOARD_CARD_CHECKED_IN: "Currently Checked in Guests",
  DASHBOARD_CARD_CHECKED_IN_DESC: "Active check-ins right now",
  DASHBOARD_CARD_TOTAL_BOOKINGS: "Total Bookings",
  DASHBOARD_CARD_TOTAL_BOOKINGS_DESC: "Total bookings this month",
  DASHBOARD_RECENT_ACTIVITY: "Recent Activity",
  DASHBOARD_NO_ACTIVITY: "No recent activity to display",

  // Today's Bookings
  TODAYS_TITLE: "Today's Bookings",
  TODAYS_SUBTITLE: "All confirmed & walk-in bookings for today.",

  // All Bookings
  ALL_BOOKINGS_TITLE: "All Bookings",
  ALL_BOOKINGS_SUBTITLE: "View bookings for all days.",

  // Today's Bookings Filters
  FILTER_GUEST_NAME: "Guest Name",
  FILTER_PHONE: "Phone",
  FILTER_OTA: "OTA",
  FILTER_STATUS: "Status",

  // Today's Bookings Table Headings
  TABLE_DATE: "Date",
  TABLE_BOOKING_ID: "Booking ID",
  TABLE_OTA: "OTA",
  TABLE_FIRST_NAME: "First Name",
  TABLE_SURNAME: "Surname",
  TABLE_PHONE: "Phone",
  TABLE_NUM_GUESTS: "Guests",
  TABLE_ADULTS: "Adults",
  TABLE_MINORS: "Minors",
  TABLE_STATUS: "Status",

  // Today's Bookings CTA Buttons
  BUTTON_CREATE_WALKIN: "Create walk-in",
  BUTTON_VERIFY_NOW: "Verify Now",
  BUTTON_VIEW_DETAILS: "View Details",
  BUTTON_VIEW_CHECKIN_DETAILS: "View verification details",
  BUTTON_START_CHECKIN: "Start verification",
  BUTTON_NO_SHOW: "No show",

  // Check-ins
  CHECK_INS_TITLE: "Check-ins",
  CHECK_INS_SUBTITLE: "Process guest check-ins by entering booking details",
  CHECK_INS_FORM_TITLE: "New Check-in",
  CHECK_INS_BOOKING_ID_LABEL: "Booking ID",
  CHECK_INS_BOOKING_ID_PLACEHOLDER: "Enter booking ID",
  CHECK_INS_GUEST_NAME_LABEL: "Guest Name",
  CHECK_INS_GUEST_NAME_PLACEHOLDER: "Enter guest name",
  CHECK_INS_NUMBER_OF_GUESTS_LABEL: "Number of Guests",
  CHECK_INS_NUMBER_OF_GUESTS_PLACEHOLDER: "Enter number of guests",
  CHECK_INS_BUTTON: "Check In",
  CHECK_INS_BUTTON_LOADING: "Processing...",

  // Loader
  LOADER_TEXT: "Loading...",
};

// Form Field Names
export const FORM_FIELDS = {
  USER_ID: "userId",
  EMAIL: "email", // Kept for backward compatibility
  PASSWORD: "password",
  BOOKING_ID: "bookingId",
  GUEST_NAME: "guestName",
  NUMBER_OF_GUESTS: "numberOfGuests",
};

// Routes
export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  ALL_BOOKINGS: "/all-bookings",
  TODAYS_BOOKINGS: "/todays-bookings",
  CHECK_INS: "/check-ins",
};
