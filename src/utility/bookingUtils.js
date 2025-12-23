import dayjs from "dayjs";
import { DATE_CONDITIONS } from "../constants/ui";

// today's date formatter
export const getTodayDateFormatted = () => {
  return dayjs().format("DD MMM YY");
};

export const getFullHeaderDate = () => {
  const today = dayjs();

  const dayName = today.format("dddd"); // Monday
  const shortDate = today.format("DD MMM YY"); // 17 Dec 25

  return `${dayName} / ${shortDate}`;
};

// short date formatter
export const formatShortDate = (d) => {
  if (!d) return "";
  return dayjs(d).format("DD MMM YY");
};

// Filter Bookings Based on criteria for Todays Bookings
export const filterBookings = (bookings, filters) => {
  const guestQuery = (filters.guest || "").toLowerCase();
  const otaQuery = (filters.ota || "").toLowerCase();
  const phoneQuery = filters.phone || "";

  return bookings.filter((b) => {
    const leadGuest = (b.leadGuest || "").toLowerCase();
    const ota = (b.ota || "").toLowerCase();
    const phone = b.phone || "";

    const matchesGuest = leadGuest.includes(guestQuery);
    const matchesPhone = phone.includes(phoneQuery);
    const matchesOta = ota.includes(otaQuery);
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
  if (!phone) return "";

  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91-${digits.substring(2, 7)}-${digits.substring(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.substring(0, 5)}-${digits.substring(5)}`;
  }

  return String(phone);
};

// booking status formatter
export const formatBookingStatus = (checkedIn) => {
  return checkedIn ? "Checked In" : "Not Checked In";
};

// guests Seperator
export const formatGuests = (adults, minors) => {
  const adultCount = adults || 0;
  const minorCount = minors || 0;

  return `${adultCount} ${adultCount === 1 ? "Adult" : "Adults"}${
    minorCount > 0
      ? `, ${minorCount} ${minorCount === 1 ? "Minor" : "Minors"}`
      : ""
  }`;
};

// All Bookings Utilitys

// Used in All Bookings page to normalize booking dates
export const normalizeBookings = (bookings = []) => {
  return bookings.map((b) => ({
    ...b,
    date: dayjs.isDayjs(b.date)
      ? b.date.startOf("day")
      : dayjs(b.date).startOf("day"),
  }));
};

// Used in All Bookings page to filter bookings based on date and text filters
export const applyBookingFilters = ({
  bookings = [],
  dateFilter = null,
  filters = {},
}) => {
  return bookings.filter((b) => {
    let include = true;

    /* ---------- DATE FILTER ---------- */
    if (dateFilter) {
      const bookingDate = dayjs.isDayjs(b.date) ? b.date : dayjs(b.date);

      const selected = dateFilter.selectedDate
        ? dayjs(dateFilter.selectedDate).startOf("day")
        : null;

      const start = dateFilter.startDate
        ? dayjs(dateFilter.startDate).startOf("day")
        : null;

      const end = dateFilter.endDate
        ? dayjs(dateFilter.endDate).endOf("day")
        : null;

      const now = dayjs().startOf("day");

      switch (dateFilter.condition) {
        case DATE_CONDITIONS.BETWEEN:
          include =
            !!start &&
            !!end &&
            (bookingDate.isAfter(start, "day") ||
              bookingDate.isSame(start, "day")) &&
            (bookingDate.isBefore(end, "day") ||
              bookingDate.isSame(end, "day"));
          break;

        case DATE_CONDITIONS.ON_OR_AFTER:
        case DATE_CONDITIONS.AFTER:
          include =
            !!selected &&
            (bookingDate.isAfter(selected, "day") ||
              bookingDate.isSame(selected, "day"));
          break;

        case DATE_CONDITIONS.BEFORE:
        case DATE_CONDITIONS.BEFORE_OR_ON:
          include =
            !!selected &&
            (bookingDate.isBefore(selected, "day") ||
              bookingDate.isSame(selected, "day"));
          break;

        case DATE_CONDITIONS.EQUAL:
          include = !!selected && bookingDate.isSame(selected, "day");
          break;

        case DATE_CONDITIONS.IN_LAST: {
          const value = parseInt(dateFilter.value, 10) || 0;
          const unit = (dateFilter.timeUnit || "days").replace(/s$/i, "");
          const lastStart = now.subtract(value, unit);

          include =
            (bookingDate.isAfter(lastStart, "day") ||
              bookingDate.isSame(lastStart, "day")) &&
            (bookingDate.isBefore(now, "day") ||
              bookingDate.isSame(now, "day"));
          break;
        }

        default:
          break;
      }
    }

    /* ---------- TEXT FILTERS ---------- */
    if (filters?.name) {
      const q = filters.name.toLowerCase();
      include =
        include &&
        ((b.firstName || "").toLowerCase().includes(q) ||
          (b.surname || "").toLowerCase().includes(q));
    }

    if (filters?.phone) {
      include =
        include &&
        (b.phone || "").toLowerCase().includes(filters.phone.toLowerCase());
    }

    if (filters?.ota) {
      include =
        include &&
        (b.ota || "").toLowerCase().includes(filters.ota.toLowerCase());
    }

    return include;
  });
};
