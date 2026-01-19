import axios from "axios";
import { STORAGE_KEYS } from "../constants/config.js";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token automatically
apiClient.interceptors.request.use((config) => {
  // Prefer sessionStorage token (non-remembered session) then localStorage (remembered)
  const sessionToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const localToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const token = sessionToken || localToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Auto logout or redirect if needed
      // Clear from both storages
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    }
    return Promise.reject(err);
  },
);

export default apiClient;
