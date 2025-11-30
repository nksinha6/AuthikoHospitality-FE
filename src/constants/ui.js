// UI Text Constants
export const UI_TEXT = {
  // App
  APP_NAME: "OnePass",
  NAV_SECTION_MAIN: "Main",
  
  // Navigation
  NAV_DASHBOARD: "Dashboard",
  NAV_CHECK_INS: "Check-ins",
  NAV_BOOKINGS: "Bookings",
  BUTTON_LOGOUT: "Logout",
  SEARCH_PLACEHOLDER: "Search...",
  
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
  
  // Check-ins
  CHECK_INS_TITLE: "Check-ins",
  CHECK_INS_SUBTITLE: "Process guest check-ins by entering booking details",
  CHECK_INS_FORM_TITLE: "Booking Check-in",
  CHECK_INS_STEP_1_TITLE: "Booking Information",
  CHECK_INS_STEP_2_TITLE: "Guest Details",
  CHECK_INS_BOOKING_ID_LABEL: "Booking ID",
  CHECK_INS_BOOKING_ID_PLACEHOLDER: "Enter booking ID",
  CHECK_INS_GUEST_NAME_LABEL: "Guest Name",
  CHECK_INS_GUEST_NAME_PLACEHOLDER: "Enter guest name",
  CHECK_INS_NUMBER_OF_GUESTS_LABEL: "Number of Guests",
  CHECK_INS_NUMBER_OF_GUESTS_PLACEHOLDER: "Enter number of guests",
  CHECK_INS_BUTTON_NEXT: "Next",
  CHECK_INS_BUTTON_BACK: "Back",
  CHECK_INS_BUTTON: "Check In",
  CHECK_INS_BUTTON_LOADING: "Processing...",
  CHECK_INS_GUEST_DETAILS_TITLE: "Guest Details",
  CHECK_INS_COLUMN_SR_NO: "Sr. No.",
  CHECK_INS_COLUMN_GUEST_NAME: "Guest Name",
  CHECK_INS_COLUMN_MOBILE: "Mobile Number",
  CHECK_INS_COLUMN_AADHAR: "Aadhar Status",
  CHECK_INS_COLUMN_FACE_ID: "Face ID",
  CHECK_INS_COLUMN_TIMESTAMP: "Timestamp",
  CHECK_INS_COLUMN_ACTIONS: "Actions",
  CHECK_INS_MOBILE_PLACEHOLDER: "Enter mobile number",
  CHECK_INS_AADHAR_VERIFIED: "Verified",
  CHECK_INS_FACE_ID_AUTO: "Auto Verify",
  CHECK_INS_FACE_ID_MANUAL: "Manual Verify",
  CHECK_INS_VIEW_DETAILS: "View Details",
  
  // Loader
  LOADER_TEXT: "Loading...",
  
  // Bookings
  BOOKINGS_TITLE: "Bookings",
  BOOKINGS_SUBTITLE: "View and manage all hotel bookings",
  BOOKINGS_LIST_TITLE: "All Bookings",
  BOOKINGS_EMPTY: "No bookings found",
  BOOKINGS_COLUMN_BOOKING_ID: "Booking ID",
  BOOKINGS_COLUMN_GUEST_NAME: "Guest Name",
  BOOKINGS_COLUMN_NUMBER_OF_GUESTS: "Number of Guests",
  BOOKINGS_COLUMN_STATUS: "Status",
  BOOKINGS_STATUS_CHECKED_IN: "Checked In",
  BOOKINGS_STATUS_NOT_CHECKED_IN: "Not Checked In",
  BOOKINGS_VIEW_DETAILS: "View Details",
  BOOKINGS_CHECK_IN: "Check In",
  
  // Filters
  FILTER_BY: "Filter by",
  FILTER_APPLY: "Apply",
  FILTER_CONDITION_IS_AFTER: "is after",
  FILTER_CONDITION_IS_BEFORE: "is before",
  FILTER_CONDITION_IS_EQUAL_TO: "is equal to",
  FILTER_CONDITION_IS_ON_OR_AFTER: "is on or after",
  FILTER_CONDITION_IS_BEFORE_OR_ON: "is before or on",
  FILTER_CONDITION_IS_IN_THE_LAST: "is in the last",
  FILTER_CONDITION_IS_BETWEEN: "is between",
  FILTER_DAYS: "days",
  FILTER_FROM: "From",
  FILTER_TO: "To",
};

// Form Field Names
export const FORM_FIELDS = {
  USER_ID: "userId",
  EMAIL: "email", // Kept for backward compatibility
  PASSWORD: "password",
  BOOKING_ID: "bookingId",
  GUEST_NAME: "guestName",
  NUMBER_OF_GUESTS: "numberOfGuests",
  GUEST_DETAILS_NAME: "guestDetailsName",
  GUEST_DETAILS_MOBILE: "guestDetailsMobile",
};

// Routes
export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  CHECK_INS: "/check-ins",
  BOOKINGS: "/bookings",
};
