import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 10_000,
});

// Add auth token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("onepass_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Handle global errors
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Auto logout or redirect if needed
      localStorage.removeItem("onepass_token");
    }
    return Promise.reject(err);
  }
);

export default apiClient;

