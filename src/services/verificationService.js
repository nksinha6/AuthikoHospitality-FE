// ========== VERIFICATION SERVICE - NOT USED ==========
// This service is no longer used as verification-related pages are commented out.
// Keeping as placeholder to prevent import errors if re-enabled.

export const verificationService = {
  async beginVerification(payload) {
    throw new Error("Verification service is disabled");
  },

  async endVerification(bookingId) {
    throw new Error("Verification service is disabled");
  },

  async ensureVerification(bookingId, phoneCountryCode, phoneNumber) {
    throw new Error("Verification service is disabled");
  },

  async getGuestById(phoneCountryCode, phoneno) {
    throw new Error("Verification service is disabled");
  },

  async initiateFaceMatch(bookingId, phoneCountryCode, phoneNumber) {
    throw new Error("Verification service is disabled");
  },

  async getFaceMatchStatus(bookingId, phoneCountryCode, phoneNumber) {
    throw new Error("Verification service is disabled");
  },
};
