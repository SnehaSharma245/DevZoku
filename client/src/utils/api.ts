import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add TypeScript declaration for _retry
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Response interceptor to handle token refresh logic
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isRefreshUrl = originalRequest?.url?.includes("refresh-token");
    const isUnauthorized = error.response?.status === 401;

    // Don’t retry if refresh-token itself failed
    if (isRefreshUrl && isUnauthorized) {
      return Promise.reject(error);
    }

    // Handle 401 error and prevent infinite retry loop
    if (isUnauthorized && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const res = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          {
            withCredentials: true,
          }
        );

        if (res.status === 200) {
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        if (
          window.location.pathname !== "/" &&
          window.location.pathname !== "/auth/login"
        ) {
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
