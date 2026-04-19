import axios from "axios";
import { getAccessToken, logout } from "../utils/auth";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      // Token missing/expired (common after `migrate:fresh --seed` or logout on another tab).
      logout()
    }
    return Promise.reject(error)
  },
)

export default axiosClient;
