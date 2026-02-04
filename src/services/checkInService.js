// ========== CHECK-IN SERVICE - NOT USED ==========
// This service is no longer used as check-in-related pages are commented out.
// Keeping as placeholder to prevent import errors if re-enabled.

export const checkInService = {
  async submitCheckIn(checkInData) {
    throw new Error("Check-in service is disabled");
  },
};
