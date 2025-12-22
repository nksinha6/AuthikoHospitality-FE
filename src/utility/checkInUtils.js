import dayjs from "dayjs";

// Generate Walk-in Booking-Id
export const generateWalkInBookingId = () => {
  const year = dayjs().format("YY");
  const randomNum = Math.floor(Math.random() * 999) + 1;
  const paddedNum = String(randomNum).padStart(3, "0");
  return `VVQ${year}${paddedNum}`;
};

// Valid Booking-Id
export const isValidBookingId = (bookingId, ota) => {
  if (ota === "Walk-In") return true;
  return bookingId && bookingId.trim().length > 0;
};
