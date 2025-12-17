import dayjs from "dayjs";

/* ---------- DEFAULT VALUES ---------- */
export const DEFAULT_DATE_FILTER = {
  condition: "is after",
  selectedDate: dayjs(),
  startDate: dayjs(),
  endDate: dayjs(),
  value: "1",
  timeUnit: "months",
};

/* ---------- HELPERS ---------- */
export const formatDate = (dateObj) => {
  if (!dateObj) return "";
  return dayjs(dateObj).format("DD/MMM/YY");
};

export const sanitizeNumberInput = (value) => {
  return value.replace(/[^0-9]/g, "");
};

export const requiresTimeUnitInput = (condition) =>
  condition === "is in the last";

/* ---------- FILTER LABEL BUILDER ---------- */
export const getFormattedFilterText = ({
  condition,
  value,
  timeUnit,
  startDate,
  endDate,
  selectedDate,
}) => {
  switch (condition) {
    case "is in the last":
      return `${condition} ${value} ${timeUnit}`;

    case "is between":
      return `${condition} ${formatDate(startDate)} and ${formatDate(endDate)}`;

    case "is after":
    case "is on or after":
    case "is before":
    case "is before or on":
    case "is equal to":
      return `${condition} ${formatDate(selectedDate)}`;

    default:
      return `${condition} ${formatDate(selectedDate)}`;
  }
};
