import axios from "axios";
import { refreshToken } from "./authService";

let authContextSetter = null;
export const injectAuthSetter = (setter) => {
  authContextSetter = setter;
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let refreshingTokenInProgress = false;

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !refreshingTokenInProgress) {
      refreshingTokenInProgress = true;
      try {
        const response = await refreshToken();
        refreshingTokenInProgress = false;

        if (response?.data?.accessToken) {
          authContextSetter?.(response.data.accessToken);

          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (err) {
        refreshingTokenInProgress = false;
        authContextSetter?.(null);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
