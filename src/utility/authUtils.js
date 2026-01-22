// utils/authUtils.js

import { STORAGE_KEYS } from "../constants/config.js";

/**
 * Get tenantId and propertyIds from stored token data
 * @returns {Object} Contains tenantId and propertyIds array
 */
export const getIdsFromStorage = () => {
  if (typeof window === "undefined") {
    return { tenantId: null, propertyIds: [] };
  }

  // Try to get from sessionStorage first, then localStorage
  const sessionData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
  const localData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  const storedData = sessionData || localData;

  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      return {
        tenantId: parsedData.tenantId,
        propertyIds: parsedData.propertyIds || []
      };
    } catch (error) {
      console.error("Failed to parse stored user data:", error);
      return { tenantId: null, propertyIds: [] };
    }
  }

  return { tenantId: null, propertyIds: [] };
};