import dayjs from "dayjs";

// ---------- helpers ----------
const today = dayjs();
const startId = 600;

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBool = () => Math.random() > 0.5;

const OTAS = ["MakeMyTrip", "Booking.com", "Agoda", "Goibibo", "Expedia"];
const FIRST_NAMES = [
  "Rahul",
  "Sneha",
  "Amit",
  "Neha",
  "Karan",
  "Pooja",
  "Vikas",
  "Ritika",
];
const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Patel",
  "Singh",
  "Gupta",
  "Mehta",
  "Jain",
];

// ---------- generators ----------
const createBooking = (id, date) => {
  const firstName = randomFrom(FIRST_NAMES);
  const surname = randomFrom(LAST_NAMES);
  const adults = Math.floor(Math.random() * 3) + 1;
  const minors = Math.floor(Math.random() * 2);

  return {
    date,
    bookingId: `BK2025${startId + id}`,
    ota: randomFrom(OTAS),
    leadGuest: `${firstName} ${surname}`,
    firstName,
    surname,
    phone: `+91-9${Math.floor(100000000 + Math.random() * 900000000)}`,
    guests: adults + minors,
    adults,
    minors,
    checkedIn: randomBool(),
  };
};

// ---------- TODAY BOOKINGS ----------
const generateTodaysBookings = () =>
  Array.from({ length: 20 }, (_, i) => createBooking(i, today));

// ---------- FUTURE BOOKINGS (THIS MONTH) ----------
const generateFutureMonthBookings = () => {
  const daysInMonth = today.daysInMonth();
  const startDay = today.date() + 1;

  return Array.from({ length: 20 }, (_, i) => {
    const dayOffset = (i % (daysInMonth - startDay)) + startDay;
    const futureDate = today.date(dayOffset);
    return createBooking(i + 20, futureDate);
  });
};

// ---------- combined ----------
const mockBookingsData = () => [
  ...generateTodaysBookings(),
  ...generateFutureMonthBookings(),
];

// ---------- service ----------
export const bookingService = {
  /** 🔹 All bookings (today + future) */
  fetchBookings: async () => {
    await new Promise((r) => setTimeout(r, 1000));
    return mockBookingsData();
  },

  /** 🔹 ONLY today’s bookings */
  fetchTodaysBookings: async () => {
    await new Promise((r) => setTimeout(r, 800));
    return generateTodaysBookings();
  },
};
