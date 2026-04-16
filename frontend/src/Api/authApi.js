
import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/auth/login", data),
  googleLogin: (data) => axiosClient.post("/auth/google", data),
  profile: () => axiosClient.get("/auth/profile"),
  forgotPassword: (data) => axiosClient.post("/auth/forgot-password", data),
  verifyOtp: (data) => axiosClient.post("/auth/verify-otp", data),
  resetPassword: (data) => axiosClient.post("/auth/reset-password", data),
  register: (data) => axiosClient.post("/auth/register", data),
  logout: () => axiosClient.post("/auth/logout"),
};

export default authApi;