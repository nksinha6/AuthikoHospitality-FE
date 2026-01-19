import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/config";

/**
 * Fetch all hotel bookings (today + future)
 * @returns {Promise<Array>} List of bookings
 */
export const bookingReadService = {
  async fetchAllBookings() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ALL_BOOKINGS, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        throw {
          code: "NOT_FOUND",
          message: "No bookings found",
        };
      }

      if (error.code === "ECONNABORTED") {
        throw {
          code: "TIMEOUT",
          message: "Request timed out",
        };
      }

      throw {
        code: "UNKNOWN",
        message:
          error.response?.data?.message ||
          "Failed to fetch bookings. Please try again.",
      };
    }
  },
};
