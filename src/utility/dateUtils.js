// ========== DATE UTILS - NOT USED ==========
// This utility is no longer used.
// Keeping as placeholder to prevent import errors if re-enabled.

import dayjs from "dayjs";

export const getCurrentDate = () => {
  return dayjs().format("MMMM D, YYYY");
};
