/**
 * Format a Date object to DD/MMM/YY format
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string (e.g., "30/Nov/25")
 */
export function formatDateDDMMMYY(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

/**
 * Parse a DD/MMM/YY format string to Date object
 * @param {string} dateString - Date string in DD/MMM/YY format (e.g., "30/Nov/25")
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDateDDMMMYY(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const parts = dateString.split("/");
  if (parts.length !== 3) {
    return null;
  }

  const day = parseInt(parts[0], 10);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames.indexOf(parts[1]);
  const year = parseInt(parts[2], 10) + 2000; // Convert YY to YYYY

  if (isNaN(day) || month === -1 || isNaN(year)) {
    return null;
  }

  const date = new Date(year, month, day);
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null; // Invalid date
  }

  return date;
}

/**
 * Convert Date object to YYYY-MM-DD format for HTML date input
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD format string to Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDateFromInput(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

