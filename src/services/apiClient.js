import axios from "axios";
import { STORAGE_KEYS } from "../constants/config.js";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://whale-app-tcfko.ondigitalocean.app",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
    return Promise.reject(err);
  }
);

export default apiClient;

