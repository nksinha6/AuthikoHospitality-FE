import dayjs from "dayjs";
import { DATE_CONDITIONS } from "../constants/ui";

/* ---------- DEFAULT VALUES ---------- */
export const DEFAULT_DATE_FILTER = {
  condition: DATE_CONDITIONS.AFTER,
  selectedDate: dayjs(),
  startDate: dayjs(),
  endDate: dayjs(),
  value: "1",
  timeUnit: "months",
};

/* ---------- HELPERS ---------- */
export const formatDate = (dateObj) => {
  if (!dateObj) return "";
  return dayjs(dateObj).format("DD MMM YY");
};

export const sanitizeNumberInput = (value = "") => value.replace(/[^0-9]/g, "");

export const requiresTimeUnitInput = (condition) =>
  condition === DATE_CONDITIONS.LAST;

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
    case DATE_CONDITIONS.LAST:
      return `${condition} ${value} ${timeUnit}`;

    case DATE_CONDITIONS.BETWEEN:
      return `${condition} ${formatDate(startDate)} and ${formatDate(endDate)}`;

    case DATE_CONDITIONS.AFTER:
    case DATE_CONDITIONS.ON_OR_AFTER:
    case DATE_CONDITIONS.BEFORE:
    case DATE_CONDITIONS.BEFORE_OR_ON:
    case DATE_CONDITIONS.EQUAL:
      return `${condition} ${formatDate(selectedDate)}`;

    default:
      return `${condition} ${formatDate(selectedDate)}`;
  }
};
