import axios from "axios";
import { clearAuth, getToken } from "../utils/auth";
import { getApiErrorMessage } from "../utils/apiError";

const baseURL =
  (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(
    /\/$/,
    ""
  );

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      const path = window.location.pathname || "";
      if (!path.includes("/login") && !path.includes("/register")) {
        window.location.replace("/login");
      }
    }

    const enriched = error;
    enriched.userMessage = getApiErrorMessage(error);
    return Promise.reject(enriched);
  }
);

export default api;
