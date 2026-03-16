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

  /**
   * Ensure guest verification status
   * @param {string} phoneCountryCode 
   * @param {string} phoneNumber 
   */
  // async ensureVerification(phoneCountryCode, phoneNumber) {
  //   try {
  //     // API expects phoneno without country code
  //     let cleanPhoneNumber = phoneNumber;
  //     if (phoneNumber && phoneNumber.length > 10) {
  //       cleanPhoneNumber = phoneNumber.slice(-10);
  //     }

  //     const response = await apiClient.get(API_ENDPOINTS.ENSURE_VERIFICATION, {
  //       params: {
  //         phoneCountryCode: phoneCountryCode || "91",
  //         phoneno: cleanPhoneNumber,
  //       },
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error ensuring verification:", error);
  //     throw error;
  //   }
  // },

  /**
   * Get guest details by ID
   * @param {string} phoneCountryCode 
   * @param {string} phoneNumber 
   */
  async getGuestById(phoneCountryCode, phoneNumber) {
    if (!phoneNumber) return null;
    try {
      const countryCode = phoneCountryCode || "91";
      // Ensure phoneNumber is 10 digits
      let cleanPhoneNumber = phoneNumber;
      if (phoneNumber && phoneNumber.length > 10) {
        cleanPhoneNumber = phoneNumber.slice(-10);
      }

      const response = await apiClient.get(API_ENDPOINTS.GET_GUEST_BY_ID, {
        params: {
          phoneCountryCode: countryCode,
          phoneno: cleanPhoneNumber
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("Guest not found, likely a new user");
        return null;
      }
      console.error("Error getting guest by ID:", error);
      throw error;
    }
  },

  /**
   * Post Digilocker verification IDs
   * @param {string} phoneCountryCode 
   * @param {string} phoneNumber 
   */
  async postDigilockerVerificationIds(phoneCountryCode, phoneNumber) {
    try {
      let cleanPhoneNumber = phoneNumber;
      if (phoneNumber && phoneNumber.length > 10) {
        cleanPhoneNumber = phoneNumber.slice(-10);
      }
      const response = await apiClient.post(API_ENDPOINTS.DIGILOCKER_VERIFICATION_IDS, {
        phoneCountryCode: phoneCountryCode || "91",
        phoneNumber: cleanPhoneNumber,
      });
      return response.data;
    } catch (error) {
      console.error("Error posting Digilocker verification IDs:", error);
      throw error;
    }
  },

  /**
   * End verification session
   * @param {string} bookingId 
   * @param {string} tenantId
   * @param {string} propertyId
   */
  async endVerification(bookingId, tenantId, propertyId) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.END_VERIFICATION, {
        bookingId,
        tenantId: String(tenantId),
        propertyId: String(propertyId),
      });
      return response.data;
    } catch (error) {
      console.error("Error ending verification:", error);
      throw error;
    }
  },
  /**
   * Fetch Aadhaar data
   * @param {string} verificationId 
   * @param {string} referenceId 
   * @param {string} phoneCode 
   * @param {string} phoneNumber 
   */
  async getAadhaarData(verificationId, referenceId, phoneCode, phoneNumber) {
    try {
      if (!verificationId) {
        throw new Error("Verification ID is required");
      }

      // Ensure 10 digits for phoneNumber
      let cleanPhoneNumber = phoneNumber || "";
      if (cleanPhoneNumber.length > 10) {
        cleanPhoneNumber = cleanPhoneNumber.slice(-10);
      }

      // 🔹 Build payload (Using exact keys from user snippet)
      const payload = {
        verificationId: verificationId,
        phoneCountryCode: phoneCode || "91",
        phoneNumber: cleanPhoneNumber,
      };

      // Include referenceId only if valid
      if (referenceId && referenceId !== verificationId) {
        payload.referenceId = referenceId;
      }

      console.log("🔍 Fetching Aadhaar data...");
      console.log("📦 Payload:", payload);
      console.log("📤 Endpoint:", API_ENDPOINTS.GET_AADHAAR_DATA);

      const response = await apiClient.post(API_ENDPOINTS.GET_AADHAAR_DATA, payload);
      console.log("✅ Aadhaar data received:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Aadhaar fetch error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // 🔹 Error handling
      if (error.response?.status === 404) {
        console.warn("⚠️ Aadhaar data not found (404)");
        return null;
      }

      if (error.response?.status === 400) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Invalid parameters";
        throw new Error(`[400] ${msg}`);
      }

      if (error.response?.status === 401) {
        throw new Error("Authentication failed (401)");
      }

      throw new Error(
        error.response?.data?.message || "Failed to fetch Aadhaar data",
      );
    }
  },

  /**
   * Persist guest verification status
   * @param {string} phoneCountryCode 
   * @param {string} phoneNumber 
   * @param {string} verificationStatus - e.g., "face_verified"
   */
  async persistGuestStatus(phoneCountryCode, phoneNumber, verificationStatus) {
    try {
      let cleanPhoneNumber = phoneNumber || "";
      if (cleanPhoneNumber.length > 10) {
        cleanPhoneNumber = cleanPhoneNumber.slice(-10);
      }

      const response = await apiClient.put(API_ENDPOINTS.PERSIST_GUEST_STATUS, {
        phoneCountryCode: phoneCountryCode || "91",
        phoneNumber: cleanPhoneNumber,
        verificationStatus: verificationStatus,
      });
      return response.data;
    } catch (error) {
      console.error("Error persisting guest status:", error);
      throw error;
    }
  },
};

export default guestDetailsService;