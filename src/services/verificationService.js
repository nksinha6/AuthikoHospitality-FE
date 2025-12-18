import apiClient from "./ApiClient.js";
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
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Verification failed. Please try again.";

      throw new Error(errorMessage);
    }
  },
};
