import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const PUBLIC_ROUTE_PREFIXES = [
  "/",
  "/hackathon/view-all-hackathons",
  "/developer/profile/",
  "/organizer/profile/",
];

const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const getCurrentPath = () => {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
};
// Add TypeScript declaration for _retry
interface InternalAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Response interceptor to handle token refresh logic
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    const isRefreshUrl = originalRequest?.url?.includes("refresh-token");

    if (
      error.response?.status === 401 &&
      !isRefreshUrl &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post(
          `/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        if (!isPublicRoute(getCurrentPath()) && typeof window !== "undefined") {
          console.error("🔁 Refresh token failed:", refreshError);

          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
