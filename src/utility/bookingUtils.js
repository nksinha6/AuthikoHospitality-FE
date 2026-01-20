import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { DATE_CONDITIONS } from "../constants/ui";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// today's date formatter
export const getTodayDateFormatted = () => {
  return dayjs().format("DD MMM YY");
};

export const getFullHeaderDate = () => {
  const today = dayjs();
  return `${today.format("dddd")} / ${today.format("DD MMM YY")}`;
};

// short date formatter
export const formatShortDate = (d) => {
  if (!d) return "";
  return dayjs(d).format("DD MMM YY");
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

// guests formatter
export const formatGuests = (adults, minors) => {
  const adultCount = adults || 0;
  const minorCount = minors || 0;

  return `${adultCount} ${adultCount === 1 ? "Adult" : "Adults"}${
    minorCount > 0
      ? `, ${minorCount} ${minorCount === 1 ? "Minor" : "Minors"}`
      : ""
  }`;
};

export const filterBookings = (bookings = [], filters = {}) => {
  const guestQuery = (filters.guest || "").toLowerCase();
  const otaQuery = (filters.ota || "").toLowerCase();
  const phoneQuery = filters.phone || "";
  const status = filters.status || "";

  return bookings.filter((b) => {
    const fullName = `${b.firstName || ""} ${b.surname || ""}`.toLowerCase();
    const ota = (b.ota || "").toLowerCase();
    const phone = b.phone || "";

    const matchesGuest = fullName.includes(guestQuery);
    const matchesPhone = phone.includes(phoneQuery);
    const matchesOta = ota.includes(otaQuery);

    // ✅ FIXED STATUS LOGIC
    let matchesStatus = true;

    if (status === "checked-in") {
      matchesStatus = !!b.windowEnd;
    } else if (status === "not-checked-in") {
      matchesStatus = !b.windowEnd;
    }

    return matchesGuest && matchesPhone && matchesOta && matchesStatus;
  });
};

export const normalizeBookings = (bookings = []) => {
  return bookings.map((b) => {
    const [firstName = "", ...rest] = (b.primaryGuestFullName || "").split(" ");
    const surname = rest.join(" ");

    return {
      bookingId: b.bookingId,
      ota: b.ota,

      // 🔹 date comes from windowStart
      date: dayjs(b.windowStart).startOf("day"),

      firstName,
      surname,

      phone: `+${b.phoneCountryCode} ${b.phoneNumber}`,

      adults: b.adultsCount,
      minors: b.minorsCount,
      guests: (b.adultsCount || 0) + (b.minorsCount || 0),

      // 🔑 STATUS DRIVER
      windowEnd: b.windowEnd,
    };
  });
};

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
            bookingDate.isSameOrAfter(start, "day") &&
            bookingDate.isSameOrBefore(end, "day");
          break;

        case DATE_CONDITIONS.AFTER:
          include =
            !!selected && bookingDate.isAfter(selected.endOf("day"), "day"); // ❌ excludes today
          break;

        case DATE_CONDITIONS.ON_OR_AFTER:
          include = !!selected && bookingDate.isSameOrAfter(selected, "day"); // ✅ includes today
          break;

        case DATE_CONDITIONS.BEFORE:
          include =
            !!selected && bookingDate.isBefore(selected.startOf("day"), "day"); // ❌ excludes today
          break;

        case DATE_CONDITIONS.BEFORE_OR_ON:
          include = !!selected && bookingDate.isSameOrBefore(selected, "day"); // ✅ includes today
          break;

        case DATE_CONDITIONS.EQUAL:
          include = !!selected && bookingDate.isSame(selected, "day");
          break;

        case DATE_CONDITIONS.IN_LAST: {
          const value = parseInt(dateFilter.value, 10) || 0;
          const unit = (dateFilter.timeUnit || "days").replace(/s$/i, "");
          const lastStart = now.subtract(value, unit);

          include =
            bookingDate.isSameOrAfter(lastStart, "day") &&
            bookingDate.isSameOrBefore(now, "day");
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
