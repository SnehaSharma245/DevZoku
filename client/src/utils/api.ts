import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

// Track if we're currently refreshing to prevent multiple refresh requests
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If this is a refresh token request that failed, clear the queue with error
    if (
      originalRequest.url?.includes("refresh-token") &&
      error.response?.status === 401
    ) {
      isRefreshing = false;
      processQueue(error);
      // Clear any auth tokens here if needed
      return Promise.reject(error);
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Try to refresh token
          const response = await axios.post(
            `${API_BASE_URL}/users/refresh-token`,
            {},
            {
              withCredentials: true,
            }
          );

          if (response.status === 200) {
            processQueue(null);
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError);
          isRefreshing = false;

          // If refresh token is invalid, redirect to login
          if (
            window.location.pathname !== "/" &&
            window.location.pathname !== "/auth/login"
          ) {
            window.location.href = "/";
          }
          return Promise.reject(refreshError);
        }
      } else {
        // If refresh is already in progress, wait for it
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
    }

    return Promise.reject(error);
  }
);

// Add TypeScript declaration for _retry property
declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

export default api;
