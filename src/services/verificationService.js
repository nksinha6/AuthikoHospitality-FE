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

  /**
   * Ensure verification for a guest by phone number
   * @param {string} phoneCountryCode - The country code of the phone number
   * @param {string} phoneno - The phone number
   * @returns {Promise<Object>} Response containing verification status
   */
  async ensureVerification(phoneCountryCode, phoneno) {
    try {
      // Primary Request: POST (as per requirement)
      // We explicitly try POST first.
      const response = await apiClient.post(
        API_ENDPOINTS.ENSURE_VERIFICATION,
        null, // No body
        {
          params: { phoneCountryCode, phoneno },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      // FALLBACK STRATEGY: 
      // If server returns 405 Method Not Allowed, it means backend only supports GET.
      // We automatically fallback to GET to ensure the app works for the user.
      if (error.response?.status === 405) {
        console.warn("[VerificationService] POST 405. Falling back to GET.");
        const response = await apiClient.get(API_ENDPOINTS.ENSURE_VERIFICATION, {
          params: { phoneCountryCode, phoneno },
          timeout: 10000,
        });
        return response.data;
      }

      // Handle standard errors
      const status = error.response?.status;
      if (status === 404) {
        throw { code: "USER_NOT_FOUND", message: "User not found" };
      }
      if (error.code === "ECONNABORTED") {
        throw { code: "TIMEOUT", message: "Request timed out" };
      }

      throw {
        code: "UNKNOWN",
        message:
          error.response?.data?.message ||
          "Verification check failed. Please try again.",
      };
    }
  },

  /**
   * Get guest details by phone number
   * @param {string} phoneCountryCode - The country code of the phone number
   * @param {string} phoneno - The phone number
   * @returns {Promise<Object>} Response containing guest details
   */
  async getGuestById(phoneCountryCode, phoneno) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_GUEST_BY_ID, {
        params: { phoneCountryCode, phoneno },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        throw { code: "USER_NOT_FOUND", message: "User not found" };
      }

      if (error.code === "ECONNABORTED") {
        throw { code: "TIMEOUT", message: "Request timed out" };
      }

      throw {
        code: "UNKNOWN",
        message:
          error.response?.data?.message ||
          "Failed to get guest details. Please try again.",
      };
    }
  },
};
