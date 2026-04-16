
import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/auth/login", data),
  googleLogin: (data) => axiosClient.post("/auth/google", data),
  profile: () => axiosClient.get("/auth/profile"),
  register: (data) => axiosClient.post("/auth/register", data),
  logout: () => axiosClient.post("/auth/logout"),
};

export default authApi;