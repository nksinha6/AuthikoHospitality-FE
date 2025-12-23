import apiClient from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/config.js";

/**
 * Service for verification-related API calls
 */
export const verificationService = {
  /**
   * Begin OTA verification process for a booking
   * @param {string} bookingId - The booking ID to verify
   * @returns {Promise<Object>} Response containing verification details
   */
  async beginVerification(bookingId) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.BEGIN_VERIFICATION,
        null,
        {
          params: { bookingId },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        throw { code: "ALREADY_VERIFIED", message: "Already verified" };
      }

      if (error.code === "ECONNABORTED") {
        throw { code: "TIMEOUT", message: "Request timed out" };
      }

      throw {
        code: "UNKNOWN",
        message:
          error.response?.data?.message ||
          "Verification failed. Please try again.",
      };
    }
  },
};
