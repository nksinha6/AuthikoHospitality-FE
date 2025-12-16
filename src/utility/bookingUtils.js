// today's date formatter
export const getTodayDateFormatted = () => {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// full header date formatter
export const getFullHeaderDate = () => {
  const date = new Date();
  const dayName = date.toLocaleDateString("en-IN", { weekday: "long" });
  const shortDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  return `${dayName} / ${shortDate}`;
};

// short date formatter
export const formatShortDate = (d) => {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

// filter bookings based on criteria
export const filterBookings = (bookings, filters) => {
  const guestQuery = filters.guest.toLowerCase();
  const otaQuery = filters.ota.toLowerCase();

  return bookings.filter((b) => {
    const matchesGuest = b.leadGuest.toLowerCase().includes(guestQuery);
    const matchesPhone = b.phone.includes(filters.phone);
    const matchesOta = b.ota.toLowerCase().includes(otaQuery);
    const matchesStatus =
      filters.status === ""
        ? true
        : filters.status === "checked-in"
        ? b.checkedIn === true
        : b.checkedIn === false;

    return matchesGuest && matchesPhone && matchesOta && matchesStatus;
  });
};

// phone number formatter
export const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91-${digits.substring(2, 7)}-${digits.substring(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.substring(0, 5)}-${digits.substring(5)}`;
  }

  return phone;
};

// booking status formatter
export const formatBookingStatus = (checkedIn) => {
  return checkedIn ? "Checked In" : "Not Checked In";
};

// guests Seperator
export const formatGuests = (adults, minors) => {
  return `${adults} ${adults === 1 ? "Adult" : "Adults"}${
    minors > 0 ? `, ${minors} ${minors === 1 ? "Minor" : "Minors"}` : ""
  }`;
};
