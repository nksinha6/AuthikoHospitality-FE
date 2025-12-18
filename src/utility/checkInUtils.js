// Country Code
export const countryCodes = [
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

// Get Country Code
export const getCountryByCode = (code) => {
  return countryCodes.find((c) => c.code === code);
};

// Formet Phone Number
export const formatPhoneNumber = (value, countryCode) => {
  if (!value) return "";
  const country = getCountryByCode(countryCode);
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

// Generate Walk-in Booking-Id
export const generateWalkInBookingId = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 999) + 1;
  const paddedNum = String(randomNum).padStart(3, "0");
  return `VVQ${year}${paddedNum}`;
};

// Valid Booking-Id
export const isValidBookingId = (bookingId, ota) => {
  if (ota === "Walk-In") return true;
  return bookingId && bookingId.trim().length > 0;
};
