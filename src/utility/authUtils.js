import { STORAGE_KEYS } from "../constants/config.js";

export const getIdsFromStorage = () => {
  if (typeof window === "undefined") {
    return { tenantId: null, propertyIds: [] };
  }

  const sessionData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
  const localData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  const storedData = sessionData || localData;

  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      return {
        tenantId: parsedData.tenantId,
        propertyIds: parsedData.propertyIds || [],
      };
    } catch (error) {
      return { tenantId: null, propertyIds: [] };
    }
  }

  return { tenantId: null, propertyIds: [] };
};
