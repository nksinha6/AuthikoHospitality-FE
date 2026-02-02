// UI Text Constants
export const UI_TEXT = {
  // App
  APP_NAME: "OnePass",
  NAV_SECTION_MAIN: "Main",
  LOGO_NAME: "1/Pass",

  // Navigation
  NAV_DASHBOARD: "Dashboard",
  NAV_CHECK_INS: "Walk-in Check-ins", // "Check-ins"
  NAV_ALL_BOOKINGS: "All Bookings",
  NAV_TODAYS_BOOKINGS: "Today's Bookings",
  NAV_GUEST_DETAILS: "View all Guest",
  BUTTON_LOGOUT: "Logout",

  // Login

  LOGIN_TITLE: "Sign in",
  LOGIN_SUBTITLE: "Enter your user ID and password to continue",
  LOGIN_WELCOME_TITLE: "Welcome Back",
  LOGIN_WELCOME_SUBTITLE: "Sign in to your account to continue",
  LOGIN_EMAIL_LABEL: "User ID",
  LOGIN_EMAIL_PLACEHOLDER: "abc@xyz.com",
  LOGIN_PASSWORD_LABEL: "Password",
  LOGIN_PASSWORD_PLACEHOLDER: "••••••••",
  LOGIN_BUTTON: "Sign in",
  LOGIN_BUTTON_LOADING: "Signing in…",
  COMPANY_NAME: "Your Company Name",

  LOGIN_SHOW_PASSWORD: "Show",
  LOGIN_HIDE_PASSWORD: "Hide",

  LOGIN_ERROR_DEFAULT:
    "Login failed. Please check your credentials and try again.",
  LOGIN_FORGOT_PASSWORD: "Forgot your password?",
  LOGIN_FOOTER: "© 2024 Company Portal. Secure access only.",

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
  BUTTON_VIEW_CHECKEDIN: "Verified",
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

  // Create Walk-in
  CREATE_WALKIN_TITLE: "Create Walk-in",
  CREATE_WALKIN_SUBTITLE: "Register a walk-in guest quickly",
  LEAD_GUEST_LABEL: "Lead Guest",
  FIRST_NAME_LABEL: "First Name",
  SURNAME_LABEL: "Surname",
  PHONE_LABEL: "Phone Number",
  PHONE_PLACEHOLDER: "+91 98765 43210",
  NUMBER_OF_GUESTS_LABEL: "Number of Guests",
  ADULTS_LABEL: "Adults",
  MINORS_LABEL: "Minors",
  START_VERIFICATION_BUTTON: "Start Guest Verification",
  CANCEL_BUTTON: "Cancel",

  // Guest Verification
  GUEST_VERIFICATION_TITLE: "Guest Verification",
  GUEST_VERIFICATION_SUBTITLE:
    "Verify guest identities and complete check-in process",
  GUEST_VERIFICATION_BOOKING_ID: "Booking ID",
  GUEST_VERIFICATION_ADULTS_MINORS: "Adults, Minors",
  GUEST_VERIFICATION_SR_NO: "Sr. No.",
  GUEST_VERIFICATION_GUEST_INFO: "Guest Information",
  GUEST_VERIFICATION_ID_STATUS: "ID Status",
  GUEST_VERIFICATION_FACE_ID: "Face ID",
  GUEST_VERIFICATION_TIMESTAMP: "Timestamp",
  GUEST_VERIFICATION_ACTION: "Action",
  GUEST_VERIFICATION_VERIFY_BUTTON: "Verify",
  GUEST_VERIFICATION_CHANGE_BUTTON: "Change",
  GUEST_VERIFICATION_ADD_MINOR: "Add Minor",
  GUEST_VERIFICATION_RESEND_LINK: "Resend link",
  GUEST_VERIFICATION_CHECK_STATUS: "Check Status",
  GUEST_VERIFICATION_VIEW_DETAILS: "View Details",
  GUEST_VERIFICATION_CANCEL: "Cancel",
  GUEST_VERIFICATION_CONFIRM_CHECKIN: "Confirm Check-in",
  GUEST_VERIFICATION_PROCESSING: "Processing...",
  GUEST_VERIFICATION_VERIFYING: "Verifying...",
  GUEST_VERIFICATION_VERIFIED: "Verified",
  GUEST_VERIFICATION_SUCCESS_MESSAGE: "Booking check-in Successful!",
  GUEST_VERIFICATION_CANCEL_CONFIRM: "Cancel verification process?",
  GUEST_VERIFICATION_PHONE_PLACEHOLDER: "Enter mobile number",
  GUEST_VERIFICATION_CHILD_NAME_PLACEHOLDER: "Child Name",
  GUEST_VERIFICATION_AGE_PLACEHOLDER: "Age",
  GUEST_VERIFICATION_MINOR_NAME_LABEL: "Name",
  GUEST_VERIFICATION_MINOR_AGE_LABEL: "Age",
  GUEST_VERIFICATION_ACCOMPANYING_MINORS: "Accompanying Minors",
  GUEST_VERIFICATION_YEARS: "years",

  // Modal
  MODAL_SUCCESS_TITLE: "Success!",
  MODAL_GUEST_DETAILS_TITLE: "Guest Details",
  MODAL_PHONE_NUMBER: "Phone Number",
  MODAL_AADHAAR_STATUS: "Aadhaar Status",
  MODAL_FACE_STATUS: "Face Status",

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
  CHECK_INS: "/check-ins",
  // GUEST_VERIFICATION: "/guest-verification",
  // TODAYS_BOOKINGS: "/todays-bookings",
  ALL_BOOKINGS: "/all-bookings",
  GUEST_DETAILS: "/guest-details",
};

// Filter Conditions
export const DATE_CONDITIONS = {
  AFTER: "is after",
  ON_OR_AFTER: "is on or after",
  BEFORE: "is before",
  BEFORE_OR_ON: "is before or on",
  BETWEEN: "is between",
  LAST: "is in the last",
  EQUAL: "is equal to",
};

// Booking OTA
export const OTA_OPTIONS = {
  BOOKING_COM: "Booking.com",
  // AIRBNB: "Airbnb",
  // EXPEDIA: "Expedia",
  // HOTELS_COM: "Hotels.com",
  AGODA: "Agoda",
  // VRBO: "Vrbo",
  // TRIPADVISOR: "Tripadvisor",
  MAKE_MY_TRIP: "MakeMyTrip",
  // GOIBIBO: "Goibibo",
  OYO:"Oyo",
  FABHOTELS:"FabHotels",
  OTHERS: "Others",
  WALK_IN: "Walk-In",
};
