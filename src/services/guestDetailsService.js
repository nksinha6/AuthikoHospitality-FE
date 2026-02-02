// services/guestDetailsService.js

import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/config";

/**
 * Guest Details Service - Handles all guest-related API calls
 */
export const guestDetailsService = {
  /**
   * Fetch all guest details with booking information
   * @returns {Promise<Array>} List of guest details
   */
  async fetchBookingGuestDetails() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BOOKING_GUEST_DETAILS, {
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        throw {
          code: "NOT_FOUND",
          message: "No guest details found",
        };
      }

      if (status === 401) {
        throw {
          code: "UNAUTHORIZED",
          message: "Please login again to continue",
        };
      }

      if (status === 403) {
        throw {
          code: "FORBIDDEN",
          message: "You don't have permission to access guest details",
        };
      }

      if (error.code === "ECONNABORTED") {
        throw {
          code: "TIMEOUT",
          message: "Request timed out. Please try again.",
        };
      }

      if (!error.response) {
        throw {
          code: "NETWORK_ERROR",
          message: "Network error. Please check your connection.",
        };
      }

      throw {
        code: "UNKNOWN",
        message:
          error.response?.data?.message ||
          "Failed to fetch guest details. Please try again.",
      };
    }
  },

  /**
   * Fetch guest Aadhaar image
   * @param {string} phoneCountryCode - Country code (e.g., "91")
   * @param {string} phoneNumber - Phone number without country code
   * @returns {Promise<string|null>} Base64 data URL or null
   */
  async fetchGuestImage(phoneCountryCode, phoneNumber) {
    try {
      // Clean phone number - remove country code if present at start
      let cleanPhoneNumber = phoneNumber;
      if (phoneNumber && phoneNumber.length > 10) {
        // Remove leading country code
        cleanPhoneNumber = phoneNumber.slice(-10);
      }

      const response = await apiClient.get(API_ENDPOINTS.GUEST_AADHAAR_IMAGE, {
        params: {
          phoneCountryCode: phoneCountryCode || "91",
          phoneno: cleanPhoneNumber,
        },
        timeout: 10000,
      });

      // API returns JSON with image as base64 string
      // Response format: { image: "base64string", contentType: "image/jpeg", ... }
      if (response.data && response.data.image) {
        const { image, contentType } = response.data;
        // Construct proper data URL
        const dataUrl = `data:${contentType || "image/jpeg"};base64,${image}`;
        return dataUrl;
      }

      return null;
    } catch (error) {
      console.error("Error fetching guest image:", error);
      return null;
    }
  },

  /**
   * Fetch guest image with retry logic
   * @param {string} phoneCountryCode - Country code
   * @param {string} phoneNumber - Phone number
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<string|null>} Base64 data URL or null
   */
  async fetchGuestImageWithRetry(phoneCountryCode, phoneNumber, maxRetries = 2) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const image = await this.fetchGuestImage(phoneCountryCode, phoneNumber);
        if (image) return image;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    console.warn("Failed to fetch guest image after retries:", lastError);
    return null;
  },
};

export default guestDetailsService;