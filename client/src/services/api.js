import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

const normalizedApiBaseUrl = API_BASE_URL.replace(
  /\/+$/,
  ""
);

export const API_ORIGIN =
  normalizedApiBaseUrl.endsWith("/api")
    ? normalizedApiBaseUrl.slice(0, -4)
    : normalizedApiBaseUrl;

export const resolveMediaUrl = (mediaPath) => {
  if (!mediaPath) {
    return null;
  }

  if (
    /^(https?:)?\/\//i.test(mediaPath) ||
    mediaPath.startsWith("data:") ||
    mediaPath.startsWith("blob:")
  ) {
    return mediaPath;
  }

  const normalizedMediaPath = mediaPath.startsWith("/")
    ? mediaPath
    : `/${mediaPath}`;

  return `${API_ORIGIN}${normalizedMediaPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
