import dayjs from "dayjs";

export const generateWalkInBookingId = (tenantId, propertyId) => {
  const timestamp = dayjs().format("YYMMDDHHmmss");
  const randomNum = Math.floor(Math.random() * 999) + 1;
  const paddedNum = String(randomNum).padStart(3, "0");
  return `VVQ${tenantId}${propertyId}${timestamp}${paddedNum}`;
};

export const shouldRequireBookingId = (bookingId, ota) => {
  if (ota === "Walk-In") return true;
  return bookingId && bookingId.trim().length > 0;
};
