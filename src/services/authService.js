import apiClient from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/config.js";

/**
 * Service for authentication-related API calls
 */
export const authService = {
  /**
   * Login user with userId and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.userId - User ID (email)
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Response containing accessToken, refreshToken, and expiresAt
   */
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        userId: credentials.userId,
        password: credentials.password,
        loginType: credentials.loginType,
      });

      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      throw new Error(errorMessage);
    }
  },

  /**
   * Persist user password on the backend
   * @param {Object} payload
   * @param {string} payload.userId
   * @param {string|number} payload.tenantId
   * @param {string} payload.password
   */
  async persistPassword(payload) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PERSIST_PASSWORD, {
        userId: payload.userId,
        tenantId: payload.tenantId,
        password: payload.password,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to save password. Please try again.";
      throw new Error(errorMessage);
    }
  },
};
